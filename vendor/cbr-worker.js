// CBR decode worker. Owns a single node-unrar-js extractor and handles
// open / read / close requests from the main thread. Decoding RAR is a
// CPU-bound synchronous WASM call — running it in a worker keeps the
// reader UI (pinch, swipe, page turn animations) responsive during the
// 100-500 ms it takes per page.
//
// Module worker — must be spawned with { type: 'module' } from the main
// thread. The bundled-as-ESM node-unrar-js is imported relative to this
// file's URL, and the WASM binary is fetched the same way.

import { createExtractorFromData } from './node-unrar-js/index.js';

// Fetched once on first open and reused across every archive we
// subsequently open. node-unrar-js's getUnrar singleton caches its own
// compiled module too, but we pass the wasmBinary explicitly so the
// loader doesn't try to resolve the file path itself.
let _wasmBinary = null;
async function _getWasm() {
  if (_wasmBinary) return _wasmBinary;
  const wasmURL = new URL('./unrar.wasm', self.location.href).href;
  const resp = await fetch(wasmURL);
  if (!resp.ok) throw new Error('unrar.wasm fetch failed: ' + resp.status);
  _wasmBinary = await resp.arrayBuffer();
  return _wasmBinary;
}

let _extractor = null;
let _fileList = [];

// node-unrar-js streams bytes through a JS-side DataFile whose position
// pointer advances as the WASM side reads. Reset it back to 0 before
// every openArc cycle so the RAR signature check at byte 0 succeeds.
const _ARCHIVE_PATH = '_defaultUnrarJS_.rar';
function _rewindArchive() {
  if (!_extractor) return;
  const df = _extractor.dataFiles && _extractor.dataFiles[_ARCHIVE_PATH];
  if (df && df.file && typeof df.file.seek === 'function') {
    df.file.seek(0, 'SET');
  }
}

async function _open(data) {
  const wasmBinary = await _getWasm();
  _extractor = await createExtractorFromData({ data, wasmBinary });
  _rewindArchive();
  _fileList = [];
  const headerInfo = _extractor.getFileList();
  for (const h of headerInfo.fileHeaders) {
    if (h && !(h.flags && h.flags.directory) && h.name) {
      _fileList.push(h.name);
    }
  }
  return { fileList: _fileList.slice() };
}

function _read(name) {
  if (!_extractor) throw new Error('no archive open');
  _rewindArchive();
  const result = _extractor.extract({ files: [name] });
  for (const f of result.files) {
    if (f && f.fileHeader && f.fileHeader.name === name && f.extraction) {
      const u8 = f.extraction;
      // Slice into a fresh ArrayBuffer that owns only this page's bytes
      // so we can transfer it back to the main thread without taking
      // the entire archive's backing buffer with it.
      const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
      return { buffer: buf };
    }
  }
  throw new Error('Archive entry not found: ' + name);
}

function _close() {
  _extractor = null;
  _fileList = [];
  // _wasmBinary stays cached — the next open will reuse the compiled
  // WASM module, saving the ~50 ms recompile cost.
}

self.onmessage = async function (e) {
  const { type, id } = e.data || {};
  try {
    let payload = {};
    let transfer = [];
    if (type === 'open') {
      payload = await _open(e.data.data);
    } else if (type === 'read') {
      payload = _read(e.data.name);
      // Transfer the page buffer back rather than copy.
      transfer = [payload.buffer];
    } else if (type === 'close') {
      _close();
    } else {
      throw new Error('unknown message type: ' + type);
    }
    self.postMessage({ id, success: true, payload }, transfer);
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: (err && err.message) ? err.message : String(err)
    });
  }
};
