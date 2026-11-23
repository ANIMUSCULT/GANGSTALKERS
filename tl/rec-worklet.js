/* GANGSTALKERS recorder: runs on the audio thread, so a busy page can't make it drop audio.
   Input: 3 channels (left, right, marker). Sends 4096-frame chunks to the page in order. */
class GSRec extends AudioWorkletProcessor {
  constructor() { super(); this.on = true; this.w = 0; this.fresh(); this.port.onmessage = e => { if (e.data === 'stop') this.on = false; }; }
  fresh() { this.L = new Float32Array(4096); this.R = new Float32Array(4096); this.M = new Float32Array(4096); this.w = 0; }
  process(inputs) {
    if (!this.on) return false;
    const i = inputs[0]; if (!i || !i.length) return true;
    const L = i[0], R = i[1] || i[0], M = i[2], n = L.length;
    this.L.set(L, this.w); this.R.set(R, this.w); if (M) this.M.set(M, this.w); this.w += n;
    if (this.w >= 4096) { this.port.postMessage({ L: this.L, R: this.R, M: this.M }, [this.L.buffer, this.R.buffer, this.M.buffer]); this.fresh(); }
    return true;
  }
}
registerProcessor('gs-rec', GSRec);
