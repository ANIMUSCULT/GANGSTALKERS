/* GANGSTALKERS timeline view. A classic script loaded after the machine's main script, so it can use the machine's
   top-level functions and constants (ctx, initAudio, state, captureBars, loopSnapshot, applySnapshot, deliver, FMT, …). */
(function () {
  'use strict';
  const G = window.GSTL, M = window.GSM, CH = G.CH, BARS = G.BARS;
  const view = document.getElementById('tlView');
  if (!view || !G || !M) return;

  const TL = window.TL = {
    state: { bpm: null, channels: Array.from({ length: CH }, () => ({ name: '', level: .8, mute: false, solo: false })), clips: [], loop: false, startBar: 0, zoom: 16 },
    audio: new Map(),      // audioId -> AudioBuffer
    playing: false,
  };

  /* ---------- markup ---------- */
  const pad2 = n => String(n).padStart(2, '0');
  view.innerHTML =
    '<div class="tlhead">' +
      '<span class="tlttl">TIMELINE</span>' +
      '<button class="key" id="tlBack" title="Back to the machine (Esc)">◀ MACHINE</button>' +
      '<button class="key" id="tlPlay" title="Play the song (Space)">▶ PLAY</button>' +
      '<button class="key" id="tlStop" title="Stop">■ STOP</button>' +
      '<button class="key" id="tlLoop" aria-pressed="false" title="Loop the whole song">⟲ LOOP</button>' +
      '<span class="lcd" id="tlBpmBox"><span class="lbl">SONG BPM</span><span id="tlBpm">---</span></span>' +
      '<span class="lcd"><span class="lbl">BAR</span><span id="tlPos">001.1</span></span>' +
      '<button class="key" id="tlZoom" title="Zoom: 16 or 8 bars on screen">ZOOM 16</button>' +
      '<span class="grow"></span>' +
      '<button class="key" id="tlSong" title="Download the song + one stem per channel">⤓ SONG</button>' +
      '<button class="key" id="tlSave" title="Save everything to a file on your computer">⤓ SESSION</button>' +
      '<button class="key" id="tlLoad" title="Load a session file">⤒ LOAD</button>' +
      '<input type="file" id="tlFile" accept=".zip" hidden>' +
    '</div>' +
    '<div class="tlmsg" id="tlMsg" aria-live="polite"></div>' +
    '<div class="tlbody">' +
      '<div class="tlstrips" id="tlStrips"></div>' +
      '<div class="tlgrid" id="tlGrid"><div class="tlinner" id="tlInner">' +
        '<div class="tlruler" id="tlRuler"></div><div class="tllanes" id="tlLanes"></div><i class="tlhead-ph" id="tlPh"></i>' +
        '<p class="tlempty" id="tlEmpty">No clips yet. Make a loop in the machine and press <b>→ SEND</b>: it records one full 4-bar cycle at the song tempo and lands here at bar 1.</p>' +
      '</div></div>' +
    '</div>';
  const $ = id => document.getElementById(id);
  const strips = $('tlStrips'), lanes = $('tlLanes'), ruler = $('tlRuler'), grid = $('tlGrid'), inner = $('tlInner');
  TL.say = t => { $('tlMsg').textContent = t ? '> ' + t : ''; };

  for (let b = 1; b <= BARS; b++) { const d = document.createElement('div'); d.className = 'tlbar'; d.textContent = b; ruler.appendChild(d); }
  for (let i = 0; i < CH; i++) {
    const r = document.createElement('div'); r.className = 'tlrow'; r.dataset.ch = i;
    r.innerHTML = '<span class="tlch">CH' + pad2(i + 1) + '</span><span class="tlname">—</span>' +
      '<button class="ms tlm" aria-pressed="false" title="Mute">M</button><button class="ms solo tls" aria-pressed="false" title="Solo">S</button>' +
      '<div class="fad" tabindex="0" role="slider" aria-label="CH' + pad2(i + 1) + ' volume" aria-valuemin="0" aria-valuemax="1"><i class="ffill"></i><i class="funity"></i><i class="fthumb"></i></div>' +
      '<output class="fv">0.0 DB</output>';
    strips.appendChild(r);
    const l = document.createElement('div'); l.className = 'tllane'; l.dataset.ch = i; lanes.appendChild(l);
  }

  /* ---------- channel gains ---------- */
  TL.chNodes = null;                         // per-channel GainNodes, made on first playback (Task 6)
  TL.chGain = i => { const a = G.audible(TL.state.channels); return a[i] ? G.levelToGain(TL.state.channels[i].level) : 0; };
  TL.applyGains = () => { if (!TL.chNodes) return; for (let i = 0; i < CH; i++) TL.chNodes[i].gain.setTargetAtTime(TL.chGain(i), M.ctx.currentTime, .015); };
  TL.changed = () => {};                     // autosave hook (Task 9)

  function paintStrip(i) {
    const c = TL.state.channels[i], r = strips.children[i], f = r.querySelector('.fad');
    f.style.setProperty('--v', c.level); f.setAttribute('aria-valuenow', c.level.toFixed(2));
    r.querySelector('.fv').textContent = M.FMT.level(c.level);
    r.querySelector('.tlm').classList.toggle('on', c.mute); r.querySelector('.tlm').setAttribute('aria-pressed', c.mute);
    r.querySelector('.tls').classList.toggle('on', c.solo); r.querySelector('.tls').setAttribute('aria-pressed', c.solo);
    r.querySelector('.tlname').textContent = c.name || '—';
  }
  function paintAudible() { const a = G.audible(TL.state.channels); [...strips.children].forEach((r, i) => r.classList.toggle('off', !a[i])); }
  TL.paintStrips = () => { for (let i = 0; i < CH; i++) paintStrip(i); paintAudible(); };

  strips.addEventListener('click', e => {
    const b = e.target.closest('.tlm,.tls'); if (!b) return;
    const i = +b.closest('.tlrow').dataset.ch, c = TL.state.channels[i];
    if (b.classList.contains('tlm')) c.mute = !c.mute; else c.solo = !c.solo;
    paintStrip(i); paintAudible(); TL.applyGains(); TL.changed();
  });
  // faders: drag (shift = fine), double-click = 0 dB, wheel and arrow keys; soft detent at 0 dB
  const setLevel = (i, v) => { v = Math.max(0, Math.min(1, v)); if (Math.abs(v - .8) < .012) v = .8; TL.state.channels[i].level = v; paintStrip(i); TL.applyGains(); TL.changed(); };
  strips.addEventListener('pointerdown', e => {
    const f = e.target.closest('.fad'); if (!f) return; e.preventDefault();
    const i = +f.closest('.tlrow').dataset.ch, rect = f.getBoundingClientRect(), x0 = e.clientX, v0 = TL.state.channels[i].level;
    f.setPointerCapture(e.pointerId); f.classList.add('drag');
    const mv = ev => setLevel(i, ev.shiftKey ? v0 + (ev.clientX - x0) / rect.width * .25 : (ev.clientX - rect.left - 3) / (rect.width - 6));
    const up = () => { f.classList.remove('drag'); f.removeEventListener('pointermove', mv); f.removeEventListener('pointerup', up); f.removeEventListener('pointercancel', up); };
    f.addEventListener('pointermove', mv); f.addEventListener('pointerup', up); f.addEventListener('pointercancel', up);
    if (!e.shiftKey) mv(e);
  });
  strips.addEventListener('dblclick', e => { const f = e.target.closest('.fad'); if (f) setLevel(+f.closest('.tlrow').dataset.ch, .8); });
  strips.addEventListener('wheel', e => { const f = e.target.closest('.fad'); if (!f) return; e.preventDefault(); const i = +f.closest('.tlrow').dataset.ch; setLevel(i, TL.state.channels[i].level - Math.sign(e.deltaY) * .02); }, { passive: false });
  strips.addEventListener('keydown', e => { const f = e.target.closest('.fad'); if (!f) return; const i = +f.closest('.tlrow').dataset.ch, d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (!d) return; e.preventDefault(); setLevel(i, TL.state.channels[i].level + d * (e.shiftKey ? .005 : .02)); });

  /* ---------- grid geometry & zoom ---------- */
  TL.barPx = () => Math.max(24, (grid.clientWidth || 1300) / TL.state.zoom);
  TL.layout = () => { view.style.setProperty('--bar', TL.barPx() + 'px'); };
  $('tlZoom').addEventListener('click', () => { TL.state.zoom = TL.state.zoom === 16 ? 8 : 16; $('tlZoom').textContent = 'ZOOM ' + TL.state.zoom; TL.render(); });

  /* ---------- render ---------- */
  TL.render = () => {
    TL.layout(); TL.paintStrips();
    $('tlBpm').textContent = TL.state.bpm || '---';
    $('tlEmpty').hidden = TL.state.clips.length > 0;
    if (TL.renderClips) TL.renderClips();
  };

  /* ---------- recording clips: SEND records one full cycle (4 bars, 8 with EVOLVE) from chord 1 at the song tempo ---------- */
  let busy = false, uid = 0;
  const newId = () => 'c' + Date.now().toString(36) + (uid++).toString(36);
  TL.machineHold = () => ({ snap: M.loopSnapshot(), undo: M.state.undo, playing: M.state.playing, evolve: M.state.evolve });
  TL.machineRestore = h => {
    if (M.state.playing) M.stop();
    M.applySnapshot(h.snap); M.state.undo = h.undo; M.state.evolve = h.evolve;
    if (h.playing) M.play();
  };
  // records `recipe` (or the machine as it is) at bpm*speed; speakers muted when silent. Always restores the machine.
  TL.recordLoop = async (recipe, o) => {
    M.initAudio(); const ctx = M.ctx, h = TL.machineHold(), speed = o.speed || 1, recBars = o.recBars || (M.state.evolve ? 8 : 4);
    let gated = false;
    try {
      if (M.state.playing) M.stop();
      if (recipe) M.applySnapshot(recipe);
      M.state.bpm = o.bpm * speed; M.renderBpm();
      let latency = 0; try { latency = await M.measureLatency(); TL.lastLatencyErr = null; } catch (e) { TL.lastLatencyErr = e; }      // the chain's own delay, measured with this recipe's settings
      TL.lastLatency = latency;
      if (o.silent) { M.analyser.disconnect(); gated = true; }
      const prog = M.curProg();
      let cap = null;
      for (let tries = 0; !cap; tries++) {                 // a glitched take (dropped audio, late notes, lost marker) is thrown away and re-recorded
        try { cap = await M.captureBars(recBars, { ready: b => b % prog.length === 0, onStart: o.onStart, latency }); }
        catch (e) { const c = e && e.code; if (!['dropout', 'late_notes', 'misaligned'].includes(c) || tries >= 2) throw (c === 'timeout' ? e : { code: c === 'timeout' ? 'timeout' : 'glitched' }); TL.say('THAT TAKE GLITCHED · RECORDING AGAIN…'); }
      }
      const buf = ctx.createBuffer(2, cap.L.length, cap.sr); buf.copyToChannel(cap.L, 0); buf.copyToChannel(cap.R, 1);
      return { buf, recBars };
    } finally {
      if (gated) { try { M.analyser.connect(ctx.destination); } catch (e) {} }
      TL.machineRestore(h);
    }
  };
  const refuseBusy = () => { if (!busy) return false; TL.lastMsg = 'STILL RECORDING'; TL.say('STILL RECORDING · WAIT FOR THE CURRENT CLIP'); return true; };
  const exclusive = async fn => { busy = true; try { return await fn(); } finally { busy = false; } };
  const laneCode = n => ((M.LANES.find(l => l.name === n) || {}).code || n || 'LOOP');
  TL.send = recipe => {
    if (busy) { TL.lastMsg = 'STILL RECORDING'; TL.say('STILL RECORDING · WAIT FOR THE CURRENT CLIP'); M.typeInto(M.gReply, '> STILL RECORDING'); return Promise.reject({ code: 'busy' }); }
    busy = true; if (TL.playing && TL.stop) TL.stop();
    const btn = document.getElementById('btnSend'), label = btn.textContent, snap = recipe || M.loopSnapshot(), bpm = TL.state.bpm || M.state.bpm, recBars = M.state.evolve ? 8 : 4;
    btn.classList.add('on'); btn.textContent = '● WAITING FOR BAR 1'; TL.lastMsg = 'RECORDING';
    let tick = null;
    const p = (async () => {
      try {
        const { buf } = await TL.recordLoop(recipe || null, { bpm, speed: 1, recBars, onStart: (s, e) => {
          tick = setInterval(() => { const t = M.ctx.currentTime; if (t >= s) btn.textContent = '● RECORDING ' + Math.min(recBars, 1 + Math.floor((t - s) / ((e - s) / recBars))) + '/' + recBars; }, 120); } });
        if (!TL.state.bpm) TL.state.bpm = bpm;
        const len = G.clipBars(recBars, 1), slot = G.firstSlot(TL.state.clips, len);
        if (!slot) throw { code: 'full' };
        const id = newId(), name = String(snap.name || (laneCode(snap.lane) + ' ' + Math.round(snap.bpm || bpm))).toUpperCase().slice(0, 40);
        TL.audio.set(id, buf);
        const clip = { id, ch: slot.ch, start: slot.start, len, speed: 1, recBars, bpm, name, recipe: snap, audioId: id };
        TL.state.clips.push(clip);
        if (!TL.state.channels[slot.ch].name) TL.state.channels[slot.ch].name = name;
        TL.lastMsg = 'RECORDED'; TL.say('RECORDED ' + name + ' → CH' + pad2(slot.ch + 1) + ' · BAR ' + (slot.start + 1));
        M.typeInto(M.gReply, '> ON THE TIMELINE: ' + name + ' · CH' + pad2(slot.ch + 1));
        TL.render(); TL.changed();
        return clip;
      } catch (e) {
        const c = e && e.code; TL.lastMsg = c === 'timeout' ? 'RECORDING STALLED' : c === 'glitched' ? 'RECORDING GLITCHED' : c === 'full' ? 'TIMELINE FULL' : 'RECORDING FAILED';
        TL.say(TL.lastMsg + (c === 'timeout' || c === 'glitched' ? ' · KEEP THIS TAB IN FRONT WHILE IT RECORDS, THEN TRY AGAIN' : '')); M.typeInto(M.gReply, '> ' + TL.lastMsg);
        throw e;
      } finally { clearInterval(tick); busy = false; btn.classList.remove('on'); btn.textContent = label; }
    })();
    TL.lastSend = p; p.catch(() => {});
    return p;
  };
  document.getElementById('btnSend').addEventListener('click', () => { TL.send().catch(() => {}); });

  /* ---------- clip blocks: draw, drag (bar snap, Shift = beat), resize, menu, duplicate, delete, one-step undo ---------- */
  const peaksCache = new Map();
  function peaks(id) {
    if (peaksCache.has(id)) return peaksCache.get(id);
    const b = TL.audio.get(id); if (!b) return null;
    const N = 240, a = b.getChannelData(0), out = new Float32Array(N), step = Math.max(1, Math.floor(a.length / N));
    for (let i = 0; i < N; i++) { let m = 0; for (let k = i * step, e = Math.min(a.length, k + step); k < e; k++) { const v = Math.abs(a[k]); if (v > m) m = v; } out[i] = m; }
    peaksCache.set(id, out); return out;
  }
  TL.forgetPeaks = id => peaksCache.delete(id);
  const minLen = beat => beat ? .25 : 1;
  let undoSnap = null, sel = null;
  const keepUndo = () => { undoSnap = JSON.stringify(TL.state.clips.map(c => ({ ...c, recipe: c.recipe }))); };
  TL.undo = () => { if (!undoSnap) return false; TL.state.clips = JSON.parse(undoSnap); undoSnap = null; TL.render(); TL.changed(); TL.say('UNDONE'); return true; };
  const byId = id => TL.state.clips.find(c => c.id === id);
  TL.move = (id, ch, start) => {
    const c = byId(id); if (!c) return false;
    ch = Math.max(0, Math.min(CH - 1, Math.round(ch)));
    const p = G.clamp(start, c.len, Math.min(1, c.len));
    if (G.overlaps(TL.state.clips, ch, p.start, c.len, id)) { TL.render(); return false; }
    keepUndo(); c.ch = ch; c.start = p.start;
    if (!TL.state.channels[ch].name) TL.state.channels[ch].name = c.name;
    TL.render(); TL.changed(); return true;
  };
  TL.resize = (id, len, beat) => {
    const c = byId(id); if (!c) return false;
    const p = G.clamp(c.start, len, minLen(beat)), l = Math.min(p.len, G.BARS - c.start);
    if (G.overlaps(TL.state.clips, c.ch, c.start, l, id)) { TL.render(); return false; }
    keepUndo(); c.len = l; TL.render(); TL.changed(); return true;
  };
  TL.duplicate = id => {
    const c = byId(id); if (!c) return null;
    let slot = { ch: c.ch, start: c.start + c.len };
    if (slot.start + c.len > G.BARS || G.overlaps(TL.state.clips, slot.ch, slot.start, c.len)) slot = G.firstSlot(TL.state.clips, c.len);
    if (!slot) { TL.say('TIMELINE FULL'); return null; }
    keepUndo(); const d = { ...c, id: newId(), ch: slot.ch, start: slot.start };
    TL.state.clips.push(d); TL.render(); TL.changed(); return d;
  };
  TL.remove = id => { const i = TL.state.clips.findIndex(c => c.id === id); if (i < 0) return false; keepUndo(); TL.state.clips.splice(i, 1); if (sel === id) sel = null; TL.render(); TL.changed(); TL.say('DELETED · CTRL+Z TO UNDO'); return true; };
  // speed: re-record the recipe at ½×, 1× or 2× of the song tempo; new length = recBars/speed, capped by the next clip
  TL.setSpeed = async (id, speed) => {
    const c = byId(id); if (!c || c.speed === speed) return false;
    if (refuseBusy()) return false;
    if (TL.state.bpm * speed > 200) { TL.say('2× WOULD BE OVER 200 BPM'); return false; }
    TL.say('RE-RECORDING ' + c.name + ' AT ' + (speed === .5 ? '½×' : speed + '×') + '…');
    const { buf } = await exclusive(() => TL.recordLoop(c.recipe, { bpm: TL.state.bpm, speed, recBars: c.recBars, silent: true }));
    const id2 = newId(); TL.audio.set(id2, buf);
    keepUndo(); c.audioId = id2; c.speed = speed;
    const want = G.clipBars(c.recBars, speed), next = TL.state.clips.filter(o => o.ch === c.ch && o.id !== c.id && o.start >= c.start).reduce((m, o) => Math.min(m, o.start), G.BARS);
    c.len = Math.max(1, Math.min(want, next - c.start));
    TL.render(); TL.changed(); TL.say(c.name + ' AT ' + (speed === .5 ? '½×' : speed + '×')); return true;
  };

  TL.renderClips = () => {
    const bp = TL.barPx();
    [...lanes.children].forEach(l => { l.textContent = ''; });
    for (const c of TL.state.clips) {
      const el = document.createElement('div'); el.className = 'tlclip' + (sel === c.id ? ' sel' : ''); el.dataset.id = c.id;
      el.style.left = (c.start * bp) + 'px'; el.style.width = Math.max(6, c.len * bp - 2) + 'px';
      el.innerHTML = '<canvas class="tlwave" aria-hidden="true"></canvas><span class="tlcname"></span><span class="tlcspd"></span><button class="tlmore" title="Clip options" aria-label="Options for this clip">⋯</button><i class="tlgrip" title="Drag to change length"></i>';
      el.querySelector('.tlcname').textContent = c.name;
      el.querySelector('.tlcspd').textContent = c.speed === 1 ? '' : (c.speed === .5 ? '½×' : '2×');
      lanes.children[c.ch].appendChild(el);
      const cv = el.querySelector('canvas'), w = Math.max(6, Math.round(c.len * bp - 2)), h = 38, dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px';
      const pk = peaks(c.audioId), g = cv.getContext('2d'); if (!pk) continue;
      const cyc = G.clipBars(c.recBars, c.speed) * bp * dpr, col = getComputedStyle(view).getPropertyValue('--flame').trim() || '#ff2a1f';
      g.fillStyle = col; g.globalAlpha = .55;
      for (let x0 = 0; x0 < w * dpr; x0 += cyc) {
        for (let i = 0; i < pk.length; i++) { const x = x0 + i / pk.length * cyc; if (x > w * dpr) break; const a = pk[i] * (h * dpr - 8); g.fillRect(x, (h * dpr - a) / 2, Math.max(1, cyc / pk.length), a); }
        if (x0 > 0) { g.globalAlpha = .9; g.fillRect(x0, 0, dpr, h * dpr); g.globalAlpha = .55; }   // repeat mark
      }
    }
  };

  const menu = document.createElement('div'); menu.className = 'tlmenu'; menu.id = 'tlMenu'; menu.hidden = true; menu.setAttribute('role', 'menu');
  menu.innerHTML = '<div class="tlspd"><button data-spd=".5">½×</button><button data-spd="1">1×</button><button data-spd="2">2×</button></div>' +
    '<button data-act="dup">DUPLICATE</button><button data-act="loop">⤓ LOOP</button><button data-act="hits">⤓ HITS</button><button data-act="del">DELETE</button>';
  view.appendChild(menu);
  let menuFor = null;
  TL.closeMenu = () => { menu.hidden = true; menuFor = null; };
  function openMenu(id, x, y) {
    const c = byId(id); if (!c) return; menuFor = id; sel = id; TL.renderClips();
    menu.querySelectorAll('[data-spd]').forEach(b => b.classList.toggle('on', +b.dataset.spd === c.speed));
    const vr = view.getBoundingClientRect(), sc = vr.width / view.offsetWidth || 1;
    menu.hidden = false; menu.style.left = Math.min(view.offsetWidth - 190, (x - vr.left) / sc) + 'px'; menu.style.top = Math.min(view.offsetHeight - 220, (y - vr.top) / sc) + 'px';
  }
  menu.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || !menuFor) return; const id = menuFor; TL.closeMenu();
    try {
      if (b.dataset.spd) await TL.setSpeed(id, +b.dataset.spd);
      else if (b.dataset.act === 'dup') TL.duplicate(id);
      else if (b.dataset.act === 'del') TL.remove(id);
      else if (b.dataset.act === 'loop') { if (TL.downloadLoop) await TL.downloadLoop(id); }
      else if (b.dataset.act === 'hits') { if (TL.downloadHits) await TL.downloadHits(id); }
    } catch (err) { TL.say('THAT DID NOT FINISH' + (err && err.code ? ' · ' + String(err.code).toUpperCase() : '')); }
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('.tlmore')) TL.closeMenu(); }, true);

  lanes.addEventListener('contextmenu', e => { const el = e.target.closest('.tlclip'); if (!el) return; e.preventDefault(); openMenu(el.dataset.id, e.clientX, e.clientY); });
  lanes.addEventListener('click', e => { const m = e.target.closest('.tlmore'); if (m) { e.stopPropagation(); const r = m.getBoundingClientRect(); openMenu(m.closest('.tlclip').dataset.id, r.left, r.bottom); } });
  lanes.addEventListener('pointerdown', e => {
    const el = e.target.closest('.tlclip'); if (!el || e.button > 0 || e.target.closest('.tlmore')) return;
    const c = byId(el.dataset.id); if (!c) return; e.preventDefault();
    sel = c.id; el.classList.add('sel');
    const grip = !!e.target.closest('.tlgrip'), x0 = e.clientX, y0 = e.clientY, sc = (view.getBoundingClientRect().width / view.offsetWidth) || 1, bp = TL.barPx() * sc, rowH = 44 * sc;
    const s0 = c.start, l0 = c.len, ch0 = c.ch; let moved = false, last = e;
    const lp = setTimeout(() => { if (!moved) openMenu(c.id, x0, y0); }, 550);       // long-press = menu on touch
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    const mv = ev => { last = ev; const dx = ev.clientX - x0, dy = ev.clientY - y0; if (Math.abs(dx) + Math.abs(dy) > 3) { moved = true; clearTimeout(lp); }
      if (grip) el.style.width = Math.max(6, (l0 * bp + dx) / sc - 2) + 'px';
      else { el.style.transform = 'translate(' + dx / sc + 'px,' + dy / sc + 'px)'; el.classList.add('drag'); } };
    const up = ev => { clearTimeout(lp); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      ev = ev || last; const dx = ev.clientX - x0, dy = ev.clientY - y0, beat = !!ev.shiftKey;
      if (!moved) { TL.renderClips(); return; }
      if (grip) TL.resize(c.id, G.snapBar(l0 + dx / bp, beat), beat);
      else TL.move(c.id, ch0 + Math.round(dy / rowH), G.snapBar(s0 + dx / bp, beat)); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  document.addEventListener('keydown', e => {
    if (!TL.isOpen()) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); TL.undo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) { e.preventDefault(); TL.remove(sel); }
  });

  /* ---------- playback: every clip is a looping buffer source through its channel gain into the timeline bus ---------- */
  TL.debug = { scheduled: [] };
  const barSec = () => 240 / (TL.state.bpm || M.state.bpm);
  function ensureNodes() {
    if (TL.chNodes) return; const ctx = M.ctx;
    TL.bus = ctx.createGain(); const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -2; comp.knee.value = 4; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .15;
    TL.bus.connect(comp); comp.connect(ctx.destination);
    TL.chNodes = Array.from({ length: CH }, (_, i) => { const g = ctx.createGain(); g.gain.value = TL.chGain(i); g.connect(TL.bus); return g; });
  }
  let srcs = [], t0 = 0, b0 = 0, cycleEnd = 0, timer = null, starts = [];   // starts: when each pass begins {t, b}
  function scheduleFrom(fromBar, when) {          // schedules [fromBar, songEnd) starting at `when`; returns the end time
    const bs = barSec(), end = G.songEnd(TL.state.clips);
    for (const c of TL.state.clips) {
      const buf = TL.audio.get(c.audioId), cEnd = c.start + c.len; if (!buf || cEnd <= fromBar) continue;
      const per = Math.min(buf.duration, G.clipBars(c.recBars, c.speed) * bs);     // loop on the exact musical length, not the sample-rounded buffer length
      const from = Math.max(fromBar, c.start), at = when + (from - fromBar) * bs, off = ((from - c.start) * bs) % per;
      const s = M.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = 0; s.loopEnd = per;
      s.connect(TL.chNodes[c.ch]); s.start(at, off); s.stop(when + (cEnd - fromBar) * bs);
      srcs.push(s); TL.debug.scheduled.push({ id: c.id, when: at, offset: off, dur: (cEnd - from) * bs, loopLen: per });
    }
    return when + Math.max(0, end - fromBar) * bs;
  }
  function stopSources() { for (const s of srcs) { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} } srcs = []; }
  TL.pos = () => { if (!TL.playing) return TL.state.startBar; const now = M.ctx.currentTime; let p = starts[0]; for (const s of starts) if (s.t <= now) p = s; return p.b + (now - p.t) / barSec(); };
  TL.play = (fromBar) => {
    if (!TL.state.clips.length) { TL.say('NOTHING TO PLAY YET · SEND A LOOP FIRST'); return; }
    M.initAudio(); M.ctx.resume(); if (M.state.playing) M.stop();
    if (TL.playing) { stopSources(); clearInterval(timer); }
    ensureNodes(); TL.applyGains(); TL.debug.scheduled = [];
    b0 = fromBar === undefined ? TL.state.startBar : Math.max(0, fromBar); if (b0 >= G.songEnd(TL.state.clips)) b0 = 0;
    t0 = M.ctx.currentTime + .06; starts = [{ t: t0, b: b0 }]; cycleEnd = scheduleFrom(b0, t0); TL.playing = true;
    $('tlPlay').classList.add('on');
    timer = setInterval(tick, 40);
  };
  TL.stop = () => {
    stopSources(); clearInterval(timer); timer = null; TL.playing = false;
    $('tlPlay').classList.remove('on'); paintHead();
  };
  function tick() {
    const now = M.ctx.currentTime;
    if (now > cycleEnd - 2) {        // queue the next pass 2 s early: background tabs slow this timer to about once a second
      if (TL.state.loop && G.songEnd(TL.state.clips) > 0) { const st = cycleEnd; starts.push({ t: st, b: 0 }); if (starts.length > 8) starts.shift(); cycleEnd = scheduleFrom(0, st); }
      else if (now >= cycleEnd) { TL.stop(); TL.state.startBar = 0; paintHead(); return; }
    }
    paintHead();
  }
  function paintHead() {
    const p = Math.max(0, TL.pos()); view.style.setProperty('--ph', p);
    const bar = Math.floor(p), beat = Math.floor((p - bar) * 4);
    $('tlPos').textContent = String(bar + 1).padStart(3, '0') + '.' + (beat + 1);
    if (TL.playing) { const x = p * TL.barPx(); if (x < grid.scrollLeft + 40 || x > grid.scrollLeft + grid.clientWidth - 60) grid.scrollLeft = Math.max(0, x - 80); }
  }
  $('tlPlay').addEventListener('click', () => TL.play());
  $('tlStop').addEventListener('click', () => { if (!TL.playing) { TL.state.startBar = 0; paintHead(); } TL.stop(); });
  $('tlLoop').addEventListener('click', () => { TL.state.loop = !TL.state.loop; $('tlLoop').classList.toggle('on', TL.state.loop); $('tlLoop').setAttribute('aria-pressed', TL.state.loop); TL.changed(); });
  ruler.addEventListener('click', e => { const r = ruler.getBoundingClientRect(), sc = r.width / ruler.offsetWidth || 1; TL.state.startBar = Math.max(0, Math.min(G.BARS - 1, Math.floor((e.clientX - r.left) / sc / TL.barPx()))); if (TL.playing) TL.play(TL.state.startBar); else paintHead(); });
  document.addEventListener('keydown', e => {
    if (!TL.isOpen() || e.code !== 'Space' || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    e.preventDefault(); e.stopPropagation(); if (TL.playing) TL.stop(); else TL.play();
  }, true);

  /* ---------- in-page confirm (alert/confirm never work inside the artifact) ---------- */
  const askEl = document.createElement('div'); askEl.className = 'tlask'; askEl.id = 'tlAsk'; askEl.hidden = true; askEl.setAttribute('role', 'dialog');
  askEl.innerHTML = '<p id="tlAskText"></p><input id="tlAskIn" type="number" min="60" max="200" step="1" hidden><div class="tlprog" id="tlProg" hidden><i></i></div>' +
    '<div class="tlaskrow"><button class="key" id="tlAskYes">YES</button><button class="key" id="tlAskNo">CANCEL</button></div>';
  view.appendChild(askEl);
  let askDone = null;
  TL.ask = (text, o = {}) => new Promise(res => {
    if (askDone) askDone(false);
    $('tlAskText').textContent = text; $('tlAskYes').textContent = o.yes || 'YES'; $('tlAskNo').textContent = o.no || 'CANCEL';
    const inp = $('tlAskIn'); inp.hidden = o.value === undefined; if (!inp.hidden) inp.value = o.value;
    $('tlProg').hidden = true; $('tlAskYes').hidden = false; askEl.hidden = false; (inp.hidden ? $('tlAskYes') : inp).focus();
    askDone = v => { askDone = null; askEl.hidden = true; res(v); };
  });
  $('tlAskYes').addEventListener('click', () => { if (askDone) askDone($('tlAskIn').hidden ? true : $('tlAskIn').value); });
  $('tlAskNo').addEventListener('click', () => { if (askDone) askDone(false); else if (TL.cancelWork) TL.cancelWork(); });
  $('tlAskIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('tlAskYes').click(); });
  function progress(text, frac) { askEl.hidden = false; $('tlAskText').textContent = text; $('tlAskIn').hidden = true; $('tlAskYes').hidden = true; $('tlAskNo').textContent = 'CANCEL'; $('tlProg').hidden = false; $('tlProg').firstChild.style.width = Math.round(frac * 100) + '%'; }
  const endProgress = () => { askEl.hidden = true; $('tlAskYes').hidden = false; TL.cancelWork = null; };

  /* ---------- song tempo: re-record every recording from its recipe at the new tempo (silently), swap only if all succeed ---------- */
  TL.setBpm = async (n, o = {}) => {
    n = Math.round(+n);
    if (!(n >= 60 && n <= 200)) { TL.say('SONG TEMPO MUST BE 60–200 BPM'); return false; }
    if (TL.playing) TL.stop();
    if (n === TL.state.bpm || refuseBusy()) return false;
    if (!TL.state.clips.length) { TL.state.bpm = n; TL.render(); TL.changed(); return true; }
    const groups = new Map(); for (const c of TL.state.clips) { const k = c.audioId; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
    const secs = Math.round([...groups.values()].reduce((t, g) => t + (g[0].recBars / g[0].speed + 4) * 240 / n, 0));
    if (!o.confirmed && !(await TL.ask('Re-record ' + TL.state.clips.length + ' clips at ' + n + ' BPM? Takes about ' + secs + ' s. Nothing plays while it works.', { yes: 'RE-RECORD' }))) return false;
    let cancel = false; TL.cancelWork = () => { cancel = true; };
    const fresh = new Map(); let k = 0, dropped = 0;
    try {
      for (const [aid, g] of groups) {
        if (cancel) throw { code: 'cancelled' };
        const c = g[0], spd = n * c.speed > 200 ? 1 : c.speed; if (spd !== c.speed) dropped++;
        progress('RE-RECORDING ' + (++k) + '/' + groups.size + ' · ' + c.name + ' @ ' + n + ' BPM', (k - 1) / groups.size);
        const { buf } = await exclusive(() => TL.recordLoop(c.recipe, { bpm: n, speed: spd, recBars: c.recBars, silent: true }));
        fresh.set(aid, { buf, spd });
      }
      if (cancel) throw { code: 'cancelled' };
    } catch (e) { endProgress(); TL.say(e && e.code === 'cancelled' ? 'TEMPO CHANGE CANCELLED · NOTHING CHANGED' : 'RE-RECORD FAILED · NOTHING CHANGED'); return false; }
    for (const [aid, f] of fresh) {
      const id = newId(); TL.audio.set(id, f.buf);
      for (const c of groups.get(aid)) { c.audioId = id; c.bpm = n; if (f.spd !== c.speed) { c.speed = f.spd; c.len = Math.min(c.len, G.clipBars(c.recBars, 1)); } }
    }
    TL.state.bpm = n; endProgress(); TL.render(); TL.changed();
    TL.say('SONG TEMPO ' + n + ' BPM · ' + groups.size + ' RECORDINGS REDONE' + (dropped ? ' · ' + dropped + ' DOUBLE-SPEED CLIPS SET BACK TO 1× (OVER 200 BPM)' : ''));
    return true;
  };
  $('tlBpmBox').addEventListener('click', async () => {
    const v = await TL.ask('New song tempo (60–200 BPM). Clips are re-recorded to match.', { value: TL.state.bpm || M.state.bpm, yes: 'SET TEMPO' });
    if (v !== false) TL.setBpm(v, { confirmed: true });
  });

  /* ---------- downloads: everything is a .zip (the artifact's download allowlist refuses .wav and .mid) ---------- */
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const safe = t => String(t || 'CLIP').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || 'CLIP';
  const wavOf = b => wavBytes(b.getChannelData(0), b.numberOfChannels > 1 ? b.getChannelData(1) : b.getChannelData(0), b.sampleRate);
  const txt = t => new TextEncoder().encode(t);
  async function renderSong(chans) {
    const bs = barSec(), end = G.songEnd(TL.state.clips), sr = M.ctx.sampleRate, len = Math.round((end + 1) * bs * sr);
    const oc = new OfflineAudioContext(2, Math.max(1, len), sr);
    for (const c of TL.state.clips) {
      if (!chans.includes(c.ch)) continue; const buf = TL.audio.get(c.audioId); if (!buf) continue;
      const g = oc.createGain(); g.gain.value = TL.chGain(c.ch); g.connect(oc.destination);
      const s = oc.createBufferSource(); s.buffer = buf; s.loop = true; s.loopEnd = Math.min(buf.duration, G.clipBars(c.recBars, c.speed) * bs); s.connect(g); s.start(c.start * bs); s.stop((c.start + c.len) * bs);
    }
    return oc.startRendering();
  }
  TL.mixdown = async (o = {}) => {
    const aud = G.audible(TL.state.channels), used = [...new Set(TL.state.clips.map(c => c.ch))].filter(ch => aud[ch]).sort((a, b) => a - b);
    const mix = await renderSong(used), stems = new Map();
    if (o.stems) for (const ch of used) stems.set(ch, await renderSong([ch]));
    return { mix, stems };
  };
  TL.downloadSong = async () => {
    if (!TL.state.clips.length) { TL.say('NOTHING TO DOWNLOAD YET'); return; }
    TL.say('MIXING THE SONG…');
    const { mix, stems } = await TL.mixdown({ stems: true }), bpm = TL.state.bpm, base = 'GANGSTALKERS_SONG_' + bpm + 'bpm_' + today();
    const files = [{ name: base + '.wav', data: wavOf(mix) }];
    for (const [ch, b] of stems) files.push({ name: 'stems/CH' + pad2(ch + 1) + '_' + safe(TL.state.channels[ch].name) + '.wav', data: wavOf(b) });
    files.push({ name: 'README.txt', data: txt('GANGSTALKERS song\n\nTempo: ' + bpm + ' BPM, 4/4\nLength: ' + (G.songEnd(TL.state.clips)) + ' bars + 1 bar of tail (' + mix.duration.toFixed(1) + ' s)\n\n' + base + '.wav: the full mix (channel volumes, mutes and solos applied).\nstems/: one WAV per playing channel, same length, line them up at 0:00.\n\nChannels:\n' +
      [...stems.keys()].map(ch => 'CH' + pad2(ch + 1) + ' ' + (TL.state.channels[ch].name || '') + ' · ' + M.FMT.level(TL.state.channels[ch].level)).join('\n') + '\n') });
    await M.deliver(makeZip(files), base + '.zip'); TL.say('DOWNLOADED ' + base + '.zip');
  };
  TL.downloadLoop = async id => {
    const c = byId(id); if (!c) return; const buf = TL.audio.get(c.audioId), base = safe(c.name) + '_' + TL.state.bpm + 'bpm';
    const h = TL.machineHold(); let mid;
    try { M.applySnapshot(c.recipe); mid = M.midiBytes(c.recBars); } finally { TL.machineRestore(h); }
    await M.deliver(makeZip([{ name: base + '.wav', data: wavOf(buf) }, { name: base + '.mid', data: mid },
      { name: 'README.txt', data: txt('GANGSTALKERS loop: ' + c.name + '\n\nTempo: ' + TL.state.bpm + ' BPM · speed ' + c.speed + '×\n' + base + '.wav: ' + c.recBars / c.speed + ' bars, loops seamlessly.\n' + base + '.mid: the pattern (drums ch10 GM, 808 ch1, chords ch2).\n') }]), base + '.zip');
    TL.say('DOWNLOADED ' + base + '.zip');
  };
  const srcName = k => k <= 0 ? 'SYNTH' : k <= 4 ? 'STUDIO_T' + k : k <= 8 ? 'YOURS_Y' + (k - 4) : 'SUNO_S' + (k - 8);
  function trimTail(b) { const sr = b.sampleRate, d = b.getChannelData(0); let n = d.length; while (n > sr * .05 && Math.abs(d[n - 1]) < .0005) n--; const o = M.ctx.createBuffer(b.numberOfChannels, n, sr); for (let c = 0; c < b.numberOfChannels; c++) o.copyToChannel(b.getChannelData(c).subarray(0, n), c); return o; }
  TL.downloadHits = async id => {
    const c = byId(id); if (!c || refuseBusy()) return; const tr = (c.recipe && c.recipe.tracks) || {}, files = [];
    TL.say('COLLECTING THE HITS…');
    for (let i = 0; i < M.TRACKS.length; i++) {
      const t = M.TRACKS[i], r = tr[t.id]; if (!r || !/[^.]/.test(r.row || '')) continue;
      const k = Math.round(r.source || 0), take = k > 0 && M.studio.buf[i][k - 1];
      let buf;
      if (take) buf = take;
      else {                                          // synth voice: record one hit on its own, silently
        const one = JSON.parse(JSON.stringify(c.recipe)); Object.keys(one.tracks).forEach(id2 => { one.tracks[id2].row = '................'; }); one.tracks[t.id].row = 'x...............';
        const h = TL.machineHold(); let gated = false;
        busy = true; try { if (M.state.playing) M.stop(); M.applySnapshot(one); M.analyser.disconnect(); gated = true; const cap = await M.captureBars(1); buf = M.ctx.createBuffer(2, cap.L.length, cap.sr); buf.copyToChannel(cap.L, 0); buf.copyToChannel(cap.R, 1); buf = trimTail(buf); }
        finally { busy = false; if (gated) { try { M.analyser.connect(M.ctx.destination); } catch (e) {} } TL.machineRestore(h); }
      }
      files.push({ name: t.id.toUpperCase() + '_' + srcName(take ? k : 0) + '.wav', data: wavOf(buf) });
    }
    if (!files.length) { TL.say('THIS LOOP HAS NO HITS'); return; }
    const base = safe(c.name) + '_HITS';
    await M.deliver(makeZip(files.concat([{ name: 'README.txt', data: txt('GANGSTALKERS hits from ' + c.name + '\n\nOne WAV per sound the loop uses. TRACK_SOURCE: SYNTH = the machine\'s synth voice, STUDIO = ElevenLabs takes, YOURS = harvested from your tracks, SUNO = your Suno model.\n') }])), base + '.zip');
    TL.say('DOWNLOADED ' + base + '.zip');
  };
  $('tlSong').addEventListener('click', () => TL.downloadSong().catch(e => TL.say('DOWNLOAD DID NOT FINISH' + (e && e.code ? ' · ' + String(e.code).toUpperCase() : ''))));

  /* ---------- session file (download / load, no login) + browser autosave ---------- */
  let dirty = false, saveT = null;
  TL.changed = () => { dirty = true; clearTimeout(saveT); saveT = setTimeout(autosave, 1500); };
  const LSK = ['gs-theme', 'gs-feed', 'gs-motion', 'gs-midimap'];
  TL.machineState = () => ({
    snap: M.loopSnapshot(), patterns: JSON.parse(JSON.stringify(M.patterns)),
    params: JSON.parse(JSON.stringify(M.params)), src: M.src.slice(),
    prefs: Object.fromEntries(LSK.map(k => [k, M.lsGet(k)])),
    saved: JSON.parse(JSON.stringify(M.SAVED.filter(v => !v._id)))
  });
  TL.applyMachineState = o => {
    if (!o) return;
    if (Array.isArray(o.patterns)) o.patterns.forEach((pt, i) => { if (M.patterns[i] && pt) { if (Array.isArray(pt.steps)) M.patterns[i].steps = pt.steps; if (Array.isArray(pt.notes)) M.patterns[i].notes = pt.notes; } });
    if (o.snap) M.applySnapshot(o.snap);
    if (o.prefs) { if (o.prefs['gs-theme']) M.setTheme(o.prefs['gs-theme']); if (o.prefs['gs-feed']) M.setCam(o.prefs['gs-feed']);
      ['gs-motion', 'gs-midimap'].forEach(k => { if (o.prefs[k] != null) M.lsSet(k, o.prefs[k]); }); }
    if (Array.isArray(o.saved) && o.saved.length) { const ids = new Set(M.SAVED.map(v => v.name + '|' + v.at)); o.saved.forEach(v => { if (!ids.has(v.name + '|' + v.at)) M.SAVED.push(v); }); M.lsSet('gs-saved', JSON.stringify(M.SAVED.filter(v => !v._id).slice(0, 60))); M.renderSaved(); }
  };
  const timelineOnly = () => ({ bpm: TL.state.bpm, channels: TL.state.channels, clips: TL.state.clips, loop: TL.state.loop, zoom: TL.state.zoom });
  const usedAudio = () => { const m = new Map(); for (const c of TL.state.clips) { const b = TL.audio.get(c.audioId); if (b && !m.has(c.audioId)) m.set(c.audioId, { L: b.getChannelData(0), R: b.numberOfChannels > 1 ? b.getChannelData(1) : b.getChannelData(0), sr: b.sampleRate }); } return m; };
  TL._packBlob = name => makeZip(G.packSession({ format: G.FORMAT, version: G.VERSION, name, savedAt: new Date().toISOString(), machine: TL.machineState(), timeline: timelineOnly() }, usedAudio()));
  TL.saveSession = async () => {
    const name = 'GANGSTALKERS_SESSION_' + today() + '_' + String(new Date().getHours()).padStart(2, '0') + String(new Date().getMinutes()).padStart(2, '0');
    TL.say('PACKING THE SESSION…'); await M.deliver(TL._packBlob(name), name + '.gangstalkers.zip'); dirty = false; TL.say('SAVED ' + name + '.gangstalkers.zip · LOAD IT ANY TIME WITH ⤒ LOAD');
  };
  const toBuffers = audio => { const m = new Map(); for (const [id, a] of audio) { const b = M.ctx.createBuffer(2, Math.max(1, a.L.length), a.sr); b.copyToChannel(a.L, 0); b.copyToChannel(a.R, 1); m.set(id, b); } return m; };
  function adoptTimeline(t, bufs) {
    if (TL.playing) TL.stop();
    TL.state.bpm = t.bpm || null; TL.state.loop = !!t.loop; TL.state.zoom = t.zoom === 8 ? 8 : 16;
    TL.state.channels = Array.from({ length: CH }, (_, i) => ({ name: '', level: .8, mute: false, solo: false, ...((t.channels || [])[i] || {}) }));
    TL.state.clips = (t.clips || []).filter(c => bufs.has(c.audioId));
    TL.audio = bufs; peaksCache.clear(); $('tlZoom').textContent = 'ZOOM ' + TL.state.zoom; $('tlLoop').classList.toggle('on', TL.state.loop);
    TL.render();
  }
  TL.loadSession = async file => {
    let out;
    try { out = G.unpackSession(G.readStoredZip(new Uint8Array(await file.arrayBuffer()))); }
    catch (e) { const c = e && e.code; TL.say(c === 'newer_version' ? 'MADE BY A NEWER VERSION OF GANGSTALKERS · UPDATE FIRST' : 'NOT A GANGSTALKERS SESSION'); return false; }
    if (dirty && TL.state.clips.length && !(await TL.ask('Load this session? It replaces the timeline and machine settings you have now.', { yes: 'LOAD' }))) return false;
    M.initAudio();
    try { TL.applyMachineState(out.session.machine); } catch (e) {}
    adoptTimeline(out.session.timeline || {}, toBuffers(out.audio)); dirty = false; autosave();
    TL.say('LOADED ' + (out.session.name || file.name) + ' · ' + TL.state.clips.length + ' CLIPS');
    return true;
  };
  $('tlSave').addEventListener('click', () => TL.saveSession().catch(e => TL.say('SAVE DID NOT FINISH' + (e && e.code ? ' · ' + String(e.code).toUpperCase() : ''))));
  $('tlLoad').addEventListener('click', () => $('tlFile').click());
  $('tlFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) TL.loadSession(f); });

  // autosave: a working copy in this browser's IndexedDB (the session file is the real, portable save)
  const idb = () => new Promise((res, rej) => { try { const r = indexedDB.open('gs-timeline', 1); r.onupgradeneeded = () => r.result.createObjectStore('work'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  const idbDo = (mode, fn) => idb().then(db => new Promise((res, rej) => { const tx = db.transaction('work', mode), st = tx.objectStore('work'), q = fn(st); tx.oncomplete = () => { db.close(); res(q && q.result); }; tx.onerror = () => { db.close(); rej(tx.error); }; }));
  function autosave() { clearTimeout(saveT); try { const audio = [...usedAudio()].map(([id, a]) => ({ id, sr: a.sr, L: a.L, R: a.R })); idbDo('readwrite', st => st.put({ t: JSON.parse(JSON.stringify(timelineOnly())), audio }, 'current')).catch(() => {}); } catch (e) {} }
  TL.restoreAutosave = async () => {
    try { const rec = await idbDo('readonly', st => st.get('current')); if (!rec || !rec.t || !(rec.t.clips || []).length) return false;
      M.initAudio(); adoptTimeline(rec.t, toBuffers(new Map(rec.audio.map(a => [a.id, a])))); dirty = false; return true; } catch (e) { return false; }
  };
  TL.clearAutosave = () => idbDo('readwrite', st => st.delete('current')).catch(() => {});
  setTimeout(() => { if (!TL.state.clips.length) TL.restoreAutosave().then(ok => { if (ok) TL.say('YOUR LAST TIMELINE IS BACK (AUTOSAVED IN THIS BROWSER)'); }); }, 1200);

  /* ---------- open / close ---------- */
  TL.isOpen = () => !view.hidden;
  TL.open = () => { view.hidden = false; document.documentElement.classList.add('tl-open'); TL.render(); };
  TL.close = () => { view.hidden = true; document.documentElement.classList.remove('tl-open'); };
  $('tlBack').addEventListener('click', TL.close);
  document.getElementById('btnTimeline').addEventListener('click', TL.open);
  document.addEventListener('keydown', e => {
    if (!TL.isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (askDone) askDone(false); else if (TL.closeMenu && !document.getElementById('tlMenu').hidden) TL.closeMenu(); else if (!TL.cancelWork) TL.close(); }
  }, true);
  addEventListener('resize', () => { if (TL.isOpen()) TL.render(); });
})();
