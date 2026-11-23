/* GANGSTALKERS timeline core: pure logic, no DOM or audio. Browser global GSTL; Node module export. */
(function (root) {
  'use strict';
  const CH = 16, BARS = 64, BEATS = 4;

  /* ---------- grid & placement (all positions in bars; bar 1 on the ruler = start 0) ---------- */
  const clipBars = (recBars, speed) => recBars / speed;            // ½× doubles the length, 2× halves it
  const snapBar = (x, beat) => beat ? Math.round(x * BEATS) / BEATS : Math.round(x);
  function clamp(start, len, minLen = 1) {
    len = Math.min(BARS, Math.max(minLen, len || 0));
    start = Math.max(0, Math.min(BARS - len, start || 0));
    return { start, len };
  }
  const overlaps = (clips, ch, start, len, ignoreId) =>
    clips.some(c => c.ch === ch && c.id !== ignoreId && start < c.start + c.len && c.start < start + len);
  function firstSlot(clips, len) {
    for (let ch = 0; ch < CH; ch++) if (!overlaps(clips, ch, 0, len)) return { ch, start: 0 };
    let best = null;
    for (let ch = 0; ch < CH; ch++) {
      const end = clips.filter(c => c.ch === ch).reduce((m, c) => Math.max(m, c.start + c.len), 0);
      if (end + len <= BARS && (!best || end < best.start)) best = { ch, start: end };
    }
    return best;
  }
  const songEnd = clips => clips.reduce((m, c) => Math.max(m, c.start + c.len), 0);
  function audible(channels) {
    const anySolo = channels.some(c => c.solo);
    return channels.map(c => !c.mute && (!anySolo || !!c.solo));
  }
  const levelToGain = level => level * level / 0.64;               // same curve as the machine's FMT.level: 0 dB at 0.8

  /* ---------- zip (stored, no compression) & 16-bit WAV: moved here from index.html's EXPORT ---------- */
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(files) {
    const enc = new TextEncoder(), u16 = v => [v & 255, (v >> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255], parts = [], cent = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const lh = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0)]);
      parts.push(lh, nm, f.data);
      cent.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
      off += lh.length + nm.length + sz;
    }
    const cd = cent.reduce((a, b) => a + b.length, 0);
    return new Blob([...parts, ...cent, new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cd), ...u32(off), ...u16(0)])], { type: 'application/zip' });
  }
  function readStoredZip(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), dec = new TextDecoder();
    let e = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65535); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw { code: 'not_zip' };
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const out = [];
    for (let k = 0; k < n; k++) {
      if (p + 46 > u8.length || v.getUint32(p, true) !== 0x02014b50) throw { code: 'not_zip' };
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      if (method !== 0) throw { code: 'compressed', name };
      if (lo + 30 > u8.length || v.getUint32(lo, true) !== 0x04034b50) throw { code: 'not_zip' };
      const start = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
      out.push({ name, data: u8.slice(start, start + size) });
      p += 46 + nl + xl + cl;
    }
    return out;
  }
  function wavBytes(L, R, sr) {
    const n = L.length, b = new ArrayBuffer(44 + n * 4), v = new DataView(b), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true);
    v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) { v.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    return new Uint8Array(b);
  }
  function wavDecode(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), tag = o => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
    if (u8.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw { code: 'not_wav' };
    let p = 12, ch = 0, sr = 0, bits = 0, data = null;
    while (p + 8 <= u8.length) {
      const id = tag(p), sz = v.getUint32(p + 4, true);
      if (id === 'fmt ') { ch = v.getUint16(p + 10, true); sr = v.getUint32(p + 12, true); bits = v.getUint16(p + 22, true); }
      else if (id === 'data') { data = { o: p + 8, n: Math.min(sz, u8.length - p - 8) }; break; }
      p += 8 + sz + (sz & 1);
    }
    if (!data || bits !== 16 || (ch !== 1 && ch !== 2)) throw { code: 'not_wav' };
    const frames = Math.floor(data.n / (2 * ch)), L = new Float32Array(frames), R = new Float32Array(frames);
    for (let i = 0, o = data.o; i < frames; i++, o += 2 * ch) { L[i] = v.getInt16(o, true) / 32767; R[i] = ch === 2 ? v.getInt16(o + 2, true) / 32767 : L[i]; }
    return { L, R, sr };
  }

  /* ---------- session file: session.json + clips/<id>.wav ---------- */
  const FORMAT = 'gangstalkers-session', VERSION = 1;
  function packSession(session, audio) {
    const files = [{ name: 'session.json', data: new TextEncoder().encode(JSON.stringify(session)) }];
    for (const [id, a] of audio) files.push({ name: 'clips/' + id + '.wav', data: wavBytes(a.L, a.R, a.sr) });
    return files;
  }
  function unpackSession(files) {
    const f = files.find(x => x.name === 'session.json');
    if (!f) throw { code: 'not_session' };
    let session; try { session = JSON.parse(new TextDecoder().decode(f.data)); } catch (e) { throw { code: 'not_session' }; }
    if (!session || session.format !== FORMAT) throw { code: 'not_session' };
    if (!(session.version <= VERSION)) throw { code: 'newer_version' };
    const audio = new Map();
    for (const x of files) { const m = x.name.match(/^clips\/(.+)\.wav$/); if (m) audio.set(m[1], wavDecode(x.data)); }
    return { session, audio };
  }

  const GSTL = { CH, BARS, BEATS, clipBars, snapBar, clamp, overlaps, firstSlot, songEnd, audible, levelToGain,
    crc32, makeZip, readStoredZip, wavBytes, wavDecode, packSession, unpackSession, FORMAT, VERSION };
  if (typeof module === 'object' && module.exports) module.exports = GSTL;
  else { root.GSTL = GSTL; root.crc32 = crc32; root.makeZip = makeZip; root.wavBytes = wavBytes; }   // the machine's EXPORT calls these by name
})(typeof window !== 'undefined' ? window : globalThis);
