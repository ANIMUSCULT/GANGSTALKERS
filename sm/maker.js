/* GANGSTALKERS sound maker: one part at a time, type what you want, Enter makes it and plays it,
   then Keep it / Try again / Save for later / Trash. Talks to the machine through window.GSM. */
(function () {
  'use strict';
  const M = window.GSM, S = window.GSSM;
  if (!M || !S) return;
  const PARTS = S.PARTS;

  /* ---------- styles (bright Y2K: pearl, candy gel, chrome) ---------- */
  const css = `
.smwrap{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;
  background:radial-gradient(ellipse at 50% 40%,rgba(120,40,160,.45),rgba(10,0,25,.78));backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
.smwrap[hidden]{display:none}
.smwin{position:relative;width:min(860px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:28px;color:#2b1650;
  font-family:'Fredoka',ui-rounded,'Arial Rounded MT Bold',system-ui,sans-serif;font-size:17px;line-height:1.35;
  background:linear-gradient(165deg,#ffffff 0%,#f6ecff 38%,#e6f7ff 72%,#fff0f8 100%);
  border:3px solid transparent;background-clip:padding-box;
  box-shadow:0 0 0 3px #fff,0 0 0 6px #d9c6ff,0 0 40px rgba(255,60,200,.45),0 30px 80px rgba(0,0,0,.5)}
.smwin::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(circle at 12% 18%,rgba(255,120,220,.22),transparent 30%),radial-gradient(circle at 88% 82%,rgba(90,220,255,.25),transparent 32%)}
.smbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 14px 10px 20px;border-radius:25px 25px 0 0;
  background:linear-gradient(180deg,#ffffff 0%,#e4e7f0 45%,#c3c8d6 52%,#eef0f6 100%);border-bottom:2px solid #b9bfd0;
  box-shadow:inset 0 1px 0 #fff}
.smttl{font-weight:700;font-size:20px;letter-spacing:.06em;color:#3a2370;text-shadow:0 1px 0 #fff}
.smttl i{font-style:normal;color:#ff2ea0}
.smcount{margin-left:auto;font-size:15px;color:#5b4a86}
.smx{width:38px;height:38px;border-radius:50%;border:1px solid rgba(0,0,0,.18);cursor:pointer;font:700 18px/1 'Fredoka',sans-serif;color:#fff;
  background:linear-gradient(180deg,#ff9aa8,#ff3b5c);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 3px 0 #c21c3d}
.smx:active{transform:translateY(2px);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 1px 0 #c21c3d}
.smrail{display:flex;gap:8px;flex-wrap:wrap;padding:14px 20px 4px;position:relative;z-index:1}
.smpill{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 6px;border-radius:999px;cursor:pointer;font:500 15px 'Fredoka',sans-serif;color:#4a3878;
  background:linear-gradient(180deg,#fff,#eee8fb);border:1px solid #d5c8f2;box-shadow:0 2px 0 #d5c8f2}
.smpill b{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;font-size:13px;background:#ece4ff;color:#6a4fb0}
.smpill.cur{color:#fff;background:linear-gradient(180deg,#ff7ad1,#ff2ea0);border-color:#e0168a;box-shadow:0 2px 0 #b80f70,0 0 14px rgba(255,46,160,.55)}
.smpill.cur b{background:rgba(255,255,255,.3);color:#fff}
.smpill.done b{background:linear-gradient(180deg,#c6ff7a,#43d12f);color:#fff}
.smpill .opt{font-size:12px;opacity:.7}
.smbody{position:relative;z-index:1;padding:8px 26px 22px}
.smstep{font-size:14px;font-weight:600;letter-spacing:.12em;color:#8a74c0;text-transform:uppercase;margin-top:6px}
.smh{margin:2px 0 4px;font-size:40px;font-weight:700;line-height:1.08;letter-spacing:-.01em}
.smh em{font-style:normal;background:linear-gradient(90deg,#ff2ea0,#ff7a1a);-webkit-background-clip:text;background-clip:text;color:transparent}
.smwhat{margin:0 0 12px;color:#4d3d78}
.smrow{display:flex;gap:10px}
.smin{flex:1;min-width:0;height:60px;padding:0 20px;border-radius:20px;border:3px solid #cdb8ff;background:#fff;color:#2b1650;
  font:500 22px 'Fredoka',sans-serif;box-shadow:inset 0 3px 6px rgba(90,50,160,.15);outline:none}
.smin:focus{border-color:#ff2ea0;box-shadow:inset 0 3px 6px rgba(90,50,160,.15),0 0 0 4px rgba(255,46,160,.2)}
.smin::placeholder{color:#b3a4d6}
.gel{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;cursor:pointer;white-space:nowrap;
  font:700 18px 'Fredoka',sans-serif;letter-spacing:.02em;color:#fff;border:1px solid rgba(0,0,0,.16);padding:0 22px;height:52px;
  text-shadow:0 1px 1px rgba(0,0,0,.25);transition:transform .08s,filter .15s}
.gel::before{content:"";position:absolute;left:10%;right:10%;top:3px;height:44%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,.08));pointer-events:none}
.gel:hover{filter:brightness(1.06) saturate(1.1)}
.gel:active{transform:translateY(3px)}
.gel:disabled{filter:grayscale(.8) opacity(.55);cursor:default;transform:none}
.gel.go{height:60px;padding:0 26px;font-size:20px;background:linear-gradient(180deg,#ff7ad1,#ff2ea0 55%,#ff6a1a);box-shadow:0 4px 0 #b80f70,0 0 18px rgba(255,46,160,.4)}
.gel.keep{background:linear-gradient(180deg,#d4ff8a,#46d330);color:#174d0b;text-shadow:0 1px 0 rgba(255,255,255,.5);box-shadow:0 4px 0 #2c9a1c,0 0 18px rgba(90,230,60,.45);height:60px;font-size:21px;padding:0 30px}
.gel.again{background:linear-gradient(180deg,#9ff6ff,#18b4e6);box-shadow:0 4px 0 #0c7fa6}
.gel.save{background:linear-gradient(180deg,#ecd6ff,#a46cff);box-shadow:0 4px 0 #6f3dc4}
.gel.trash{background:linear-gradient(180deg,#ffb0bb,#ff3b5c);box-shadow:0 4px 0 #c21c3d;height:44px;font-size:16px;padding:0 16px}
.gel.soft{background:linear-gradient(180deg,#ffffff,#e9e2fb);color:#4a3878;text-shadow:none;box-shadow:0 3px 0 #cbbdf0;height:44px;font-size:16px}
.gel kbd{font:600 13px 'Fredoka',sans-serif;padding:2px 7px;border-radius:7px;background:rgba(255,255,255,.3)}
.smideas{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0 0;font-size:15px;color:#6b5a98}
.smidea{height:32px;padding:0 14px;border-radius:999px;border:1px dashed #c3adf5;background:rgba(255,255,255,.7);color:#5a3fa8;font:500 15px 'Fredoka',sans-serif;cursor:pointer}
.smidea:hover{background:#fff;border-style:solid;border-color:#ff2ea0;color:#e0168a}
.smcard{position:relative;margin-top:16px;border-radius:22px;padding:16px 18px;min-height:150px;
  background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(246,240,255,.95));border:2px solid #e0d3ff;box-shadow:0 6px 20px rgba(120,80,200,.15)}
.smempty{display:flex;align-items:center;gap:16px;color:#8c7bb8;min-height:118px}
.smempty .ring{flex:none;width:86px;height:86px;border-radius:50%;border:3px dashed #d4c3ff;display:grid;place-items:center;font-size:30px;color:#cdb8ff}
.smmaking{display:flex;flex-direction:column;justify-content:center;gap:12px;min-height:118px}
.smmaking p{margin:0;font-size:22px;font-weight:600}
.smprog{height:22px;border-radius:999px;overflow:hidden;background:#efe8ff;border:2px solid #d9c9ff}
.smprog i{display:block;height:100%;width:0;border-radius:999px;transition:width .6s cubic-bezier(.3,.7,.3,1);
  background:repeating-linear-gradient(-45deg,#ff2ea0 0 14px,#ff7ad1 14px 28px);background-size:40px 40px;animation:smstripe .6s linear infinite}
@keyframes smstripe{to{background-position:40px 0}}
.smres{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center}
.smplay{width:86px;height:86px;border-radius:50%;cursor:pointer;border:1px solid rgba(0,0,0,.15);color:#fff;font-size:30px;position:relative;
  background:radial-gradient(circle at 50% 30%,#9ff6ff,#18b4e6 60%,#0a85b3);box-shadow:inset 0 3px 0 rgba(255,255,255,.6),0 5px 0 #0c6f94,0 0 20px rgba(24,180,230,.45)}
.smplay::before{content:"";position:absolute;left:18%;right:18%;top:6%;height:38%;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,0))}
.smplay:active{transform:translateY(3px)}
.smplay.hit{animation:smthump .35s ease-out}
@keyframes smthump{30%{transform:scale(1.12)}}
.smname{font-size:28px;font-weight:700;line-height:1.1}
.smfrom{font-size:15px;color:#7a68a8;margin:2px 0 6px}
.smwave{display:block;width:100%;height:56px}
.smbeat{height:44px}
.smbeat.on{background:linear-gradient(180deg,#fff,#ffe3f3);color:#e0168a;border-color:#ff9ad5;box-shadow:0 3px 0 #ff9ad5}
.smacts{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:16px}
.smacts .sp{flex:1}
.smtip{font-size:14px;color:#7a68a8;margin-top:8px;min-height:19px}
.smshelf{margin-top:16px;padding-top:12px;border-top:2px dotted #dccdfd}
.smshelf h4{margin:0 0 8px;font-size:16px;font-weight:600;color:#5b4a86}
.smshelf .list{display:flex;flex-wrap:wrap;gap:8px}
.smchip{display:inline-flex;align-items:center;height:34px;border-radius:999px;background:linear-gradient(180deg,#fff,#f0e6ff);border:1px solid #d5c3fb;box-shadow:0 2px 0 #d5c3fb;overflow:hidden}
.smchip button{border:0;background:none;cursor:pointer;font:500 15px 'Fredoka',sans-serif;color:#4a3878;height:100%;padding:0 10px 0 14px}
.smchip button.del{padding:0 12px 0 4px;color:#c3a9f0;font-size:17px}
.smchip button.del:hover{color:#ff3b5c}
.smshelf .none{font-size:15px;color:#a596c8}
.smnav{display:flex;justify-content:space-between;gap:10px;margin-top:18px}
.smtoast{position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;text-align:center;
  padding:22px 34px;border-radius:26px;font-size:30px;font-weight:700;color:#174d0b;background:linear-gradient(180deg,#eaffc4,#8cf06c);
  border:3px solid #fff;box-shadow:0 0 0 4px #46d330,0 0 40px rgba(90,230,60,.6);transition:transform .25s cubic-bezier(.2,1.6,.4,1),opacity .2s}
.smtoast.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.smtoast small{display:block;font-size:17px;font-weight:500;margin-top:4px}
.smstar{position:absolute;z-index:4;pointer-events:none;font-size:22px;animation:smfly 1.1s ease-out forwards}
@keyframes smfly{0%{transform:translate(0,0) scale(.4) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(200deg);opacity:0}}
.smdone{text-align:center;padding:10px 0 6px}
.smdone .kit{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:14px 0 18px}
.smdone .kit span{padding:6px 14px;border-radius:999px;background:#fff;border:1px solid #d5c3fb;font-size:15px}
.smdone .kit span b{color:#2c9a1c}
.top #btnSounds.key{color:#fff;font-weight:700;border-color:rgba(0,0,0,.2);text-shadow:0 1px 1px rgba(0,0,0,.3);
  background:linear-gradient(180deg,#ff8ad6 0%,#ff2ea0 55%,#ff6a1a 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 3px 0 #a80d66,0 0 16px rgba(255,46,160,.55)}
.top #btnSounds.key:hover{filter:brightness(1.08)}
html.calm .smprog i,html.calm .smplay.hit,html.calm .smstar{animation:none}
html.calm .smtoast{transition:none}
@media (max-width:760px){
  .smwrap{padding:0;align-items:stretch}
  .smwin{border-radius:0;max-height:none;height:100%;box-shadow:none}
  .smbar{border-radius:0}
  .smrail{flex-wrap:nowrap;overflow-x:auto;padding:12px 14px 4px}
  .smpill{flex:none}
  .smbody{padding:6px 14px calc(18px + env(safe-area-inset-bottom,0px))}
  .smh{font-size:30px}
  .smrow{flex-direction:column}
  .smres{grid-template-columns:auto 1fr}
  .smres .smbeat{grid-column:1/-1}
  .smacts .gel{flex:1 1 calc(50% - 12px)}
  .smacts .sp{display:none}
}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------- markup ---------- */
  const wrap = document.createElement('div');
  wrap.className = 'smwrap'; wrap.hidden = true;
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'smH');
  wrap.innerHTML =
    '<div class="smwin" id="smWin">' +
      '<div class="smbar"><span class="smttl"><i>✦</i> SOUND MAKER</span><span class="smcount" id="smCount"></span>' +
        '<button class="smx" id="smX" aria-label="Close the sound maker">✕</button></div>' +
      '<div class="smrail" id="smRail" role="tablist" aria-label="Parts of the beat"></div>' +
      '<div class="smbody" id="smBody"></div>' +
      '<div class="smtoast" id="smToast" aria-live="polite"></div>' +
    '</div>';
  document.body.appendChild(wrap);
  const $ = id => document.getElementById(id);
  const win = $('smWin'), rail = $('smRail'), body = $('smBody'), toast = $('smToast'), countEl = $('smCount');

  /* ---------- state ---------- */
  const SM = window.SM = {
    i: 0,                                   // which part
    words: PARTS.map(() => ''),
    cur: null,                              // the sound on trial: { recipe, name, n }
    before: null,                           // the track as it was before the trial
    recent: PARTS.map(() => []),            // takes heard lately, per part
    trashed: PARTS.map(() => new Set()),
    kept: PARTS.map(() => null),            // name of the kept sound
    n: PARTS.map(() => 0),                  // how many sounds made for this part
    busy: false, finished: false, debug: { made: [] },
  };
  const BANK_KEY = 'gs-mysounds', TRASH_KEY = 'gs-trashed';
  let bank = [];
  try { bank = JSON.parse(M.lsGet(BANK_KEY) || '[]') || []; } catch (e) { bank = []; }
  try { const t = JSON.parse(M.lsGet(TRASH_KEY) || '{}') || {}; PARTS.forEach((p, j) => (t[p.id] || []).forEach(k => SM.trashed[j].add(k))); } catch (e) { }
  const saveTrash = () => M.lsSet(TRASH_KEY, JSON.stringify(Object.fromEntries(PARTS.map((p, j) => [p.id, [...SM.trashed[j]]]))));

  // the artifact's shared database, when the page runs on claude.ai: My sounds follow the user there
  let dbBank = null;
  function hookDb() {
    const T = M.taste; if (dbBank || !T || !T.db) return;
    try {
      dbBank = T.db.collection('sounds');
      dbBank.orderBy('at', 'desc').limit(120).onSnapshot(s => {
        const mine = []; s.docs.forEach(d => { const v = d.data(); if (v && v.by === T.uid && v.recipe) mine.push({ ...v, id: d.id }); });
        bank = mine; if (!wrap.hidden) renderShelf();
      }, () => { });
    } catch (e) { dbBank = null; }
  }

  const part = () => PARTS[SM.i];
  const tr = () => part().track;
  const where = k => k === 0 ? 'Made by the built-in synth' : k <= 4 ? 'From the studio kit' : k <= 8 ? 'From your own tracks' : 'From your Suno sounds';
  const takeOk = (i, k) => k === 0 || !!(M.studio.ready && M.studio.buf[i][k - 1]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- the trial: try a sound on the real track, put it back if not kept ---------- */
  function snap(i) { const p = M.params[i]; return { src: M.src[i], knobs: Object.fromEntries(S.KNOBS.map(k => [k, p[k]])) }; }
  function put(i, src, knobs) {
    M.src[i] = src; Object.assign(M.params[i], knobs);
    M.applyTrack(i); M.select(i);
  }
  function revert() {
    if (SM.before && SM.cur) { const i = SM.cur.track; put(i, SM.before.src, SM.before.knobs); }
    SM.before = null; SM.cur = null;
  }
  function tryOn(recipe, name) {
    const i = tr();
    if (!SM.before) SM.before = snap(i);
    const { src, ...knobs } = recipe;
    put(i, src, knobs);
    SM.n[SM.i]++;
    SM.cur = { track: i, recipe, name, n: SM.n[SM.i] };
    const r = SM.recent[SM.i]; r.push(src); if (r.length > 4) r.shift();
    SM.debug.made.push({ part: part().id, recipe });
  }

  /* ---------- making a sound ---------- */
  function metasFor(i) {
    if (!M.studio.ready) return [];
    return M.studio.buf[i].map((b, j) => b ? { tags: (M.studio.meta[i][j] || {}).tags || [], bank: j >= 8 ? 'suno' : j >= 4 ? 'yours' : 'studio' } : null);
  }
  function votesFor(i) { const v = {}; M.studio.buf[i].forEach((b, j) => { const x = M.vote(M.takeId(i, j + 1)); if (x) v[j + 1] = x; }); return v; }
  function baseFor(i) { const id = M.TRACKS[i].id; return { ...M.DEF, ...(M.BASE[id] || {}) }; }

  function readerRecipe(i, words) {
    const src = S.pickSource({ metas: metasFor(i), words, votes: votesFor(i), recent: SM.recent[SM.i], trashed: SM.trashed[SM.i] });
    return { src, ...S.shape(baseFor(i), words) };
  }
  async function claudeRecipe(i, words) {
    const A = M.ai; if (!A || !A.on || !A.sample || !words) return null;
    const metas = metasFor(i), avoid = [...SM.recent[SM.i], ...SM.trashed[SM.i]];
    const list = ['0: the built-in synth voice'].concat(metas.map((m, j) => m && !avoid.includes(j + 1) ? (j + 1) + ': ' + m.tags.join(' ') + ' · ' + m.bank : null).filter(Boolean));
    const prompt = 'You pick and shape one drum sound for a beginner making a beat in GANGSTALKERS, a dark phonk / trap drum machine.\n' +
      'Part: ' + part().word + '. They asked for: ' + JSON.stringify(words) + '\n' +
      'Samples you can start from (number: tags · where from). Do not use any other number:\n' + list.join('\n') + '\n' +
      'Knobs, each 0 to 1: tune (pitch, .5 is normal), decay (how long it rings), tone (brightness), drive (grit and distortion), space (reverb).\n' +
      'Make it different from these recent picks: ' + JSON.stringify(SM.recent[SM.i]) + '\n' +
      'Reply with only JSON: {"take":n,"tune":x,"decay":x,"tone":x,"drive":x,"space":x}';
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await A.sample.json(prompt, { modelTier: 'quick', cache: false, signal: ctl.signal });
      const r = S.fromClaude(res, k => takeOk(i, k) && !avoid.includes(k));
      return r;
    } catch (e) { return null; } finally { clearTimeout(t); }
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function generate() {
    if (SM.busy) return;
    const inp = $('smIn'), words = (inp ? inp.value : SM.words[SM.i]).trim();
    SM.words[SM.i] = words;
    SM.busy = true; M.initAudio(); try { M.ctx && M.ctx.resume(); } catch (e) { }
    renderMaking();
    const i = tr(), t0 = performance.now();
    let recipe = await claudeRecipe(i, words), by = recipe ? 'claude' : 'reader';
    if (!recipe) recipe = readerRecipe(i, words);
    const left = M.reduce ? 0 : Math.max(0, 650 - (performance.now() - t0));
    setProg(100); await wait(left);
    tryOn(recipe, S.nameFor(words, part()));
    SM.cur.by = by;
    SM.busy = false;
    renderResult();
    hear();
  }

  function hear() {
    const c = SM.cur; if (!c) return;
    M.audition(c.track, .95);
    const b = $('smPlay'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
  }

  function chime(notes) {           // a small happy blip, straight to the speakers (never recorded)
    const c = M.ctx; if (!c) return;
    try {
      notes.forEach((f, j) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + .01 + j * .07;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .3);
      });
    } catch (e) { }
  }
  function stars(fromEl, n = 16) {
    if (M.reduce) return;
    const wr = win.getBoundingClientRect(), r = fromEl.getBoundingClientRect();
    const x = r.left - wr.left + r.width / 2, y = r.top - wr.top + win.scrollTop + r.height / 2;
    const glyphs = ['✦', '★', '✧', '✶'], cols = ['#ff2ea0', '#18b4e6', '#46d330', '#a46cff', '#ff7a1a'];
    for (let k = 0; k < n; k++) {
      const s = document.createElement('span'); s.className = 'smstar'; s.textContent = glyphs[k % 4];
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 130;
      s.style.cssText = `left:${x}px;top:${y}px;color:${cols[k % 5]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px`;
      win.appendChild(s); setTimeout(() => s.remove(), 1200);
    }
  }
  let toastT = 0;
  function showToast(html, ms = 1100) {
    toast.innerHTML = html; toast.classList.add('on'); clearTimeout(toastT);
    return new Promise(r => { toastT = setTimeout(() => { toast.classList.remove('on'); r(); }, ms); });
  }

  /* ---------- the four choices ---------- */
  async function keep() {
    const c = SM.cur; if (!c || SM.busy) return;
    const i = c.track, k = c.recipe.src;
    if (k && M.vote(M.takeId(i, k)) !== 1) M.rateItem(M.takeId(i, k), 1, { meta: M.studio.meta[i][k - 1] || null });
    SM.kept[SM.i] = c.name; SM.before = null; SM.cur = null;
    M.flashTrack && M.flashTrack(i);
    chime([660, 880, 1320]); stars($('smKeep') || win, 22);
    renderRail();
    SM.busy = true;
    const nx = nextOpen(SM.i);
    await showToast('✓ ' + esc(c.name) + ' is in your beat!<small>' + (nx < 0 ? 'Every part is done.' : 'Next up: the ' + esc(PARTS[nx].word)) + '</small>', M.reduce ? 900 : 1200);
    SM.busy = false;
    if (nx < 0) finish(); else go(nx);
  }
  function again() { if (!SM.cur || SM.busy) return; generate(); }
  function trash() {
    const c = SM.cur; if (!c || SM.busy) return;
    const i = c.track, k = c.recipe.src;
    SM.trashed[SM.i].add(k); saveTrash();
    if (k && M.vote(M.takeId(i, k)) !== -1) M.rateItem(M.takeId(i, k), -1, { meta: M.studio.meta[i][k - 1] || null });
    chime([300, 200]);
    tip('Trashed. That one won\'t come back. Here\'s a new one.');
    generate();
  }
  function saveForLater() {
    const c = SM.cur; if (!c) return;
    if (bank.some(b => b.part === part().id && S.sameRecipe(b.recipe, c.recipe))) { tip('That one is already in My sounds.'); return; }
    const item = { part: part().id, name: c.name + ' ' + c.n, recipe: c.recipe, at: Date.now() };
    hookDb();
    if (dbBank && M.taste.uid) {
      dbBank.add({ ...item, by: M.taste.uid }).catch(() => tip('Could not save that one. Try again in a moment.'));
      bank.unshift({ ...item, id: 'pending' + item.at });
    } else { bank.unshift({ ...item, id: 'l' + item.at }); M.lsSet(BANK_KEY, JSON.stringify(bank.slice(0, 120))); }
    chime([880, 1175]); stars($('smSave') || win, 10);
    renderShelf(); tip('Saved to My sounds. Tap it below any time to bring it back.');
  }
  function fromShelf(item) {
    const i = tr(); if (SM.busy || !takeOk(i, item.recipe.src)) { tip('That sound is still loading. Try again in a moment.'); return; }
    tryOn({ ...item.recipe }, item.name.replace(/\s\d+$/, ''));
    SM.cur.by = 'shelf'; renderResult(); hear();
  }
  function unshelve(item) {
    bank = bank.filter(b => b !== item);
    if (dbBank && item.id && !String(item.id).startsWith('pending')) { try { dbBank.doc(item.id).delete().catch(() => { }); } catch (e) { } }
    else M.lsSet(BANK_KEY, JSON.stringify(bank.slice(0, 120)));
    renderShelf();
  }

  /* ---------- moving around ---------- */
  function nextOpen(from) { for (let j = from + 1; j < PARTS.length; j++) if (!SM.kept[j]) return j; for (let j = 0; j < from; j++) if (!SM.kept[j]) return j; return -1; }
  function go(j) {
    if (SM.busy) return;
    revert(); SM.finished = false; SM.i = Math.max(0, Math.min(PARTS.length - 1, j));
    renderRail(); renderPart();
  }
  function finish() { revert(); SM.finished = true; renderRail(); renderDone(); }

  /* ---------- drawing ---------- */
  function renderRail() {
    rail.innerHTML = '';
    PARTS.forEach((p, j) => {
      const b = document.createElement('button');
      b.className = 'smpill' + (j === SM.i && !SM.finished ? ' cur' : '') + (SM.kept[j] ? ' done' : '');
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', j === SM.i && !SM.finished ? 'true' : 'false');
      b.innerHTML = '<b>' + (SM.kept[j] ? '✓' : j + 1) + '</b>' + esc(p.title) + (p.optional ? ' <span class="opt">optional</span>' : '');
      b.title = SM.kept[j] ? 'Done: ' + SM.kept[j] : p.what;
      b.addEventListener('click', () => go(j));
      rail.appendChild(b);
    });
    const n = SM.kept.filter(Boolean).length;
    countEl.textContent = n + ' of ' + PARTS.length + ' done';
  }

  function renderPart() {
    const p = part();
    body.innerHTML =
      '<div class="smstep">Step ' + (SM.i + 1) + ' of ' + PARTS.length + (p.optional ? ' · optional' : '') + '</div>' +
      '<h2 class="smh" id="smH">Generate a <em>' + esc(p.word) + '</em> here</h2>' +
      '<p class="smwhat">' + esc(p.what) + ' Type what you want it to sound like, then press Enter.</p>' +
      '<div class="smrow"><input class="smin" id="smIn" type="text" autocomplete="off" spellcheck="false" maxlength="120" ' +
        'placeholder="e.g. ' + esc(p.ideas[0]) + '" aria-label="Describe the ' + esc(p.word) + ' you want">' +
        '<button class="gel go" id="smGo">Generate <kbd>Enter ⏎</kbd></button></div>' +
      '<div class="smideas"><span>Need an idea? Tap one:</span>' + p.ideas.map(x => '<button class="smidea">' + esc(x) + '</button>').join('') + '</div>' +
      '<div class="smcard" id="smCard"></div>' +
      '<div class="smshelf" id="smShelf"></div>' +
      '<div class="smnav"><button class="gel soft" id="smBack"' + (SM.i ? '' : ' disabled') + '>◀ Back</button>' +
        '<button class="gel soft" id="smSkip">' + (SM.kept[SM.i] ? 'Next part ▶' : 'Skip this one ▶') + '</button></div>';
    const inp = $('smIn'); inp.value = SM.words[SM.i];
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); generate(); } });
    inp.addEventListener('input', () => { SM.words[SM.i] = inp.value; });
    $('smGo').addEventListener('click', generate);
    body.querySelectorAll('.smidea').forEach(b => b.addEventListener('click', () => { inp.value = b.textContent; SM.words[SM.i] = inp.value; generate(); }));
    $('smBack').addEventListener('click', () => go(SM.i - 1));
    $('smSkip').addEventListener('click', () => { const nx = SM.i + 1 < PARTS.length ? SM.i + 1 : -1; if (nx < 0) finish(); else go(nx); });
    renderEmpty(); renderShelf();
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
  }

  function renderEmpty() {
    const card = $('smCard'); if (!card) return;
    const p = part();
    card.innerHTML = '<div class="smempty"><div class="ring">♪</div><div><b style="font-size:20px;color:#5b4a86">Your ' + esc(p.word) + ' will play here.</b><br>' +
      (SM.kept[SM.i] ? 'You kept <b>' + esc(SM.kept[SM.i]) + '</b>. Make another one if you want to change it.' : 'Nothing changes in your beat until you press <b>Keep it</b>.') + '</div></div>';
  }
  function setProg(v) { const b = document.querySelector('#smCard .smprog i'); if (b) b.style.width = v + '%'; }
  function renderMaking() {
    const card = $('smCard'); if (!card) return;
    card.innerHTML = '<div class="smmaking"><p>Making your ' + esc(part().word) + '…</p><div class="smprog"><i></i></div></div>';
    requestAnimationFrame(() => setProg(70));
    disable(true);
  }
  function disable(on) { ['smGo', 'smIn'].forEach(id => { const e = $(id); if (e) e.disabled = on; }); }

  function renderResult() {
    const card = $('smCard'), c = SM.cur; if (!card || !c) return;
    disable(false);
    const playing = M.state.playing;
    card.innerHTML =
      '<div class="smres">' +
        '<button class="smplay" id="smPlay" aria-label="Play it again">▶</button>' +
        '<div><div class="smname">' + esc(c.name) + ' <span style="font-weight:500;color:#a596c8">#' + c.n + '</span></div>' +
          '<div class="smfrom">' + where(c.recipe.src) + (c.by === 'claude' ? ' · shaped by Claude' : '') + '</div>' +
          '<canvas class="smwave" id="smWave" width="600" height="56" aria-hidden="true"></canvas></div>' +
        '<button class="gel soft smbeat' + (playing ? ' on' : '') + '" id="smBeat">' + (playing ? '■ Stop the beat' : '▶ Hear it in the beat') + '</button>' +
      '</div>' +
      '<div class="smacts">' +
        '<button class="gel keep" id="smKeep">✓ Keep it</button>' +
        '<button class="gel again" id="smAgain">↻ Try again</button>' +
        '<button class="gel save" id="smSave">★ Save for later</button>' +
        '<span class="sp"></span>' +
        '<button class="gel trash" id="smTrash">🗑 Trash</button>' +
      '</div>' +
      '<div class="smtip" id="smTip">Like it? Press <b>Keep it</b>. Want something else? Press <b>Try again</b>.</div>';
    $('smPlay').addEventListener('click', hear);
    $('smBeat').addEventListener('click', () => { if (M.state.playing) M.stop(); else M.play(); renderBeatBtn(); });
    $('smKeep').addEventListener('click', keep);
    $('smAgain').addEventListener('click', again);
    $('smSave').addEventListener('click', saveForLater);
    $('smTrash').addEventListener('click', trash);
    $('smKeep').title = 'Use this sound in your beat and go to the next part';
    $('smAgain').title = 'Make a different one from the same words';
    $('smSave').title = 'Put it in My sounds so you can use it later';
    $('smTrash').title = 'Never show this sound again';
    drawWave();
  }
  function renderBeatBtn() { const b = $('smBeat'); if (!b) return; const on = M.state.playing; b.classList.toggle('on', on); b.textContent = on ? '■ Stop the beat' : '▶ Hear it in the beat'; }
  function tip(t) { const e = $('smTip'); if (e) e.textContent = t; }

  function drawWave() {
    const cv = $('smWave'), c = SM.cur; if (!cv || !c) return;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, mid = H / 2;
    g.clearRect(0, 0, W, H);
    const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#ff2ea0'); grad.addColorStop(.5, '#a46cff'); grad.addColorStop(1, '#18b4e6');
    g.fillStyle = grad;
    const i = c.track, k = c.recipe.src, b = k ? M.studio.buf[i][k - 1] : null;
    const bars = 120, bw = W / bars;
    let peaks;
    if (b) {
      const d = b.getChannelData(0), len = Math.min(d.length, Math.floor(d.length * Math.min(1, .2 + c.recipe.decay * 1.6))), step = Math.max(1, Math.floor(len / bars));
      peaks = Array.from({ length: bars }, (_, j) => { let m = 0; for (let s = j * step; s < Math.min(len, (j + 1) * step); s++) m = Math.max(m, Math.abs(d[s])); return m; });
      const top = Math.max(...peaks) || 1; peaks = peaks.map(v => v / top);
    } else {
      const ring = .15 + c.recipe.decay * .8; let seed = c.n * 97 + 13;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      peaks = Array.from({ length: bars }, (_, j) => Math.exp(-j / (bars * ring * .35)) * (.75 + .25 * rnd()));
    }
    peaks.forEach((v, j) => { const h = Math.max(2, v * (H - 6)); g.beginPath(); g.roundRect ? g.roundRect(j * bw + 1, mid - h / 2, Math.max(1, bw - 2), h, 2) : g.rect(j * bw + 1, mid - h / 2, Math.max(1, bw - 2), h); g.fill(); });
  }

  function renderShelf() {
    const el = $('smShelf'); if (!el) return;
    const mine = bank.filter(b => b.part === part().id);
    el.innerHTML = '<h4>★ My sounds for the ' + esc(part().word) + '</h4><div class="list"></div>';
    const list = el.querySelector('.list');
    if (!mine.length) { list.innerHTML = '<span class="none">Sounds you save show up here.</span>'; return; }
    mine.forEach(item => {
      const chip = document.createElement('span'); chip.className = 'smchip';
      const use = document.createElement('button'); use.textContent = '▶ ' + item.name; use.title = 'Try this sound again';
      use.addEventListener('click', () => fromShelf(item));
      const del = document.createElement('button'); del.className = 'del'; del.textContent = '×'; del.setAttribute('aria-label', 'Remove ' + item.name + ' from My sounds');
      del.addEventListener('click', () => unshelve(item));
      chip.append(use, del); list.appendChild(chip);
    });
  }

  function renderDone() {
    body.innerHTML = '<div class="smdone"><div class="smstep">All done</div><h2 class="smh" id="smH">Your <em>sounds</em> are ready ✦</h2>' +
      '<p class="smwhat">Here is what you kept. Press play to hear them all together.</p>' +
      '<div class="kit">' + PARTS.map((p, j) => '<span>' + esc(p.title) + ': ' + (SM.kept[j] ? '<b>' + esc(SM.kept[j]) + '</b>' : 'no change') + '</span>').join('') + '</div>' +
      '<div class="smnav" style="justify-content:center"><button class="gel go" id="smPlayAll">▶ Play my beat</button><button class="gel soft" id="smClose2">Close</button></div></div>';
    $('smPlayAll').addEventListener('click', () => { M.ensurePlaying(); close(); });
    $('smClose2').addEventListener('click', close);
  }

  /* ---------- open / close ---------- */
  function open(trackOrPart) {
    hookDb();
    if (typeof trackOrPart === 'number') { const j = PARTS.findIndex(p => p.track === trackOrPart); SM.i = j < 0 ? 0 : j; }
    else if (typeof trackOrPart === 'string') { const j = PARTS.findIndex(p => p.id === trackOrPart); SM.i = j < 0 ? 0 : j; }
    else { const j = SM.kept.findIndex(x => !x); SM.i = j < 0 ? SM.i : j; }
    SM.finished = false; wrap.hidden = false; renderRail(); renderPart();
  }
  function close() { if (SM.busy) return; revert(); wrap.hidden = true; const b = document.getElementById('btnSounds'); b && b.focus({ preventScroll: true }); }
  SM.open = open; SM.close = close; SM.generate = generate; SM.keep = keep; SM.again = again; SM.trash = trash; SM.save = saveForLater; SM.go = go;
  Object.defineProperty(SM, 'bank', { get: () => bank });

  $('smX').addEventListener('click', close);
  wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  document.addEventListener('keydown', e => {
    if (wrap.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  // keep the "Hear it in the beat" button honest if the beat is started or stopped elsewhere
  setInterval(() => { if (!wrap.hidden) renderBeatBtn(); }, 400);

  const btn = document.getElementById('btnSounds');
  if (btn) btn.addEventListener('click', () => open());
})();
