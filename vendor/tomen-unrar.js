// Adapter glue between the Tomen comic archive abstraction and the
// vendored unrar decoder. Loaded as a regular <script> from index.html;
// exposes `window.tomenUnrar` which the CBR code path looks for.
//
// ----- Setup ---------------------------------------------------------
// CBR support requires the node-unrar-js library + its WASM binary.
// To enable it:
//
//   1. Grab node-unrar-js from npm: https://www.npmjs.com/package/node-unrar-js
//      Either `npm pack node-unrar-js` and extract, or download via the
//      unpkg / jsDelivr mirrors.
//
//   2. Copy the ESM build into vendor/node-unrar-js/. You need the entire
//      dist/esm/ contents (multi-file), preserving the relative paths.
//      The default entry must be reachable at:
//          vendor/node-unrar-js/index.js
//
//   3. Copy the WASM binary to vendor/unrar.wasm. It lives at
//      dist/js/unrar.wasm in the package.
//
//   4. Reload Tomen. The adapter dynamic-imports the library on first
//      CBR open; opening a CBZ doesn't trigger any of this. If the load
//      fails for any reason, importing a CBR surfaces a friendly alert
//      and the rest of the app stays functional.
//
// If you'd rather use a different RAR decoder, replace this file with
// your own adapter — only the small surface below has to match.

(function () {
  if (typeof window === 'undefined') return;

  // Cached module + wasm bytes so repeated comic opens don't re-fetch.
  let _modPromise = null;
  let _wasmPromise = null;

  function _loadModule() {
    if (_modPromise) return _modPromise;
    // Dynamic import works from regular scripts too. Path is resolved
    // relative to the document URL (index.html), not this file.
    _modPromise = import('./vendor/node-unrar-js/index.js').catch(err => {
      _modPromise = null;
      const wrapped = new Error(
        'Could not load node-unrar-js from vendor/node-unrar-js/. ' +
        (err && err.message ? err.message : err)
      );
      wrapped.cause = err;
      throw wrapped;
    });
    return _modPromise;
  }

  function _loadWasm() {
    if (_wasmPromise) return _wasmPromise;
    _wasmPromise = fetch('vendor/unrar.wasm').then(r => {
      if (!r.ok) {
        _wasmPromise = null;
        throw new Error('vendor/unrar.wasm fetch returned ' + r.status);
      }
      return r.arrayBuffer();
    }).catch(err => {
      _wasmPromise = null;
      throw new Error('Could not load vendor/unrar.wasm: ' + (err.message || err));
    });
    return _wasmPromise;
  }

  // Adapter surface — must match what _openCbrArchive in index.html expects.
  //   open(blob) → { list(): string[], read(name): Promise<Blob> }
  window.tomenUnrar = {
    open: async function (blob) {
      const [mod, wasmBinary] = await Promise.all([_loadModule(), _loadWasm()]);
      const data = await blob.arrayBuffer();
      const extractor = await mod.createExtractorFromData({
        data,
        wasmBinary
      });

      // Snapshot the file list once at open time so list() is cheap.
      // node-unrar-js returns iterators for both getFileList and extract.
      const fileNames = [];
      const headerInfo = extractor.getFileList();
      // headerInfo.fileHeaders is an iterable. Cast through Array.from
      // defensively in case the iterator can only be consumed once.
      for (const h of headerInfo.fileHeaders) {
        if (h && !(h.flags && h.flags.directory)) {
          if (h.name) fileNames.push(h.name);
        }
      }

      return {
        list: function () { return fileNames.slice(); },
        read: async function (name) {
          // extract({files}) returns an iterable of extracted entries;
          // we asked for one so we expect one back. extraction is a
          // Uint8Array — wrap it in a Blob for the rest of the pipeline.
          const result = extractor.extract({ files: [name] });
          for (const f of result.files) {
            if (f && f.fileHeader && f.fileHeader.name === name && f.extraction) {
              return new Blob([f.extraction]);
            }
          }
          throw new Error('Archive entry not found: ' + name);
        }
      };
    }
  };
})();
