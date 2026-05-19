// Adapter glue between the Tomen comic archive abstraction and the
// CBR decoder. Loaded as a regular <script> from index.html; exposes
// `window.tomenUnrar` which the CBR code path looks for. The actual
// decode runs in a module Web Worker (vendor/cbr-worker.js) so the
// main thread stays responsive during the 100-500 ms it takes per
// page — see that file for the decoder internals.
//
// ----- Setup ---------------------------------------------------------
// CBR support requires node-unrar-js + its WASM binary. To enable:
//
//   1. Grab node-unrar-js from npm (`npm pack node-unrar-js` and extract,
//      or download via unpkg / jsDelivr).
//
//   2. Copy the ESM build into vendor/node-unrar-js/ so the entry sits
//      at vendor/node-unrar-js/index.js (the dist/esm/ contents,
//      preserving relative paths and with `.js` extensions added to
//      every import — browsers and module workers don't do Node-style
//      extension resolution).
//
//   3. Copy the WASM binary to vendor/unrar.wasm. It lives at
//      dist/js/unrar.wasm in the package.
//
// If the worker fails to spawn at runtime (security / CSP / module
// support), CBR opens surface a friendly alert and the rest of the
// app stays functional. CBZ and text reads are unaffected — they
// don't touch this file.

(function () {
  if (typeof window === 'undefined') return;

  // Resolve sibling resources against THIS script's URL so the worker
  // path is correct regardless of where the page is served from.
  // document.currentScript is only valid during initial execution of
  // the script, so capture it now.
  const _scriptSrc = document.currentScript ? document.currentScript.src : '';
  const _vendorBase = _scriptSrc
    ? _scriptSrc.substring(0, _scriptSrc.lastIndexOf('/') + 1)
    : '';

  let _worker = null;
  let _nextReqId = 1;
  const _pending = new Map();

  // Lazy worker spawn — first CBR open creates it, subsequent opens
  // reuse it. The worker holds one archive at a time; reopening
  // simply replaces the in-worker extractor.
  function _ensureWorker() {
    if (_worker) return _worker;
    _worker = new Worker(_vendorBase + 'cbr-worker.js', { type: 'module' });
    _worker.onmessage = function (e) {
      const { id, success, payload, error } = e.data || {};
      const handler = _pending.get(id);
      if (!handler) return;
      _pending.delete(id);
      if (success) handler.resolve(payload);
      else handler.reject(new Error(error || 'worker error'));
    };
    _worker.onerror = function (e) {
      // The worker crashed (or its module load failed). Surface this
      // to every pending caller — they'll bubble up to loadComic's
      // catch and the user sees a friendly alert.
      console.error('[tomen] CBR worker error:', e && e.message ? e.message : e);
      const err = new Error('CBR worker failed: ' + ((e && e.message) || 'unknown'));
      for (const [, handler] of _pending) handler.reject(err);
      _pending.clear();
      try { _worker.terminate(); } catch (_) { /* ignore */ }
      _worker = null;
    };
    return _worker;
  }

  function _rpc(type, message, transfer) {
    const w = _ensureWorker();
    const id = _nextReqId++;
    return new Promise(function (resolve, reject) {
      _pending.set(id, { resolve, reject });
      w.postMessage(Object.assign({ type, id }, message), transfer || []);
    });
  }

  // Adapter surface — must match what _openCbrArchive in index.html expects.
  //   open(blob) → { list(): string[], read(name): Promise<Blob> }
  window.tomenUnrar = {
    open: async function (blob) {
      // Pull bytes into a fresh ArrayBuffer and transfer it to the worker
      // so we don't pay a copy on the way over. After transfer, the main
      // thread no longer owns this buffer — it lives only in the worker
      // until the next open replaces it.
      const buffer = await blob.arrayBuffer();
      const result = await _rpc('open', { data: buffer }, [buffer]);
      const fileList = Array.isArray(result.fileList) ? result.fileList : [];

      return {
        list: function () { return fileList.slice(); },
        read: async function (name) {
          // The worker transfers the page bytes back as an ArrayBuffer
          // (zero-copy). Wrap in a Blob for the rest of the pipeline.
          const out = await _rpc('read', { name });
          return new Blob([out.buffer]);
        }
      };
    }
  };
})();
