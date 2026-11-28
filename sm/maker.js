/* GANGSTALKERS sound maker: one part at a time.
   1. The sound: type what you want, Enter makes it and plays it, then Keep it / Try again / Save for later / Trash.
   2. How it hits: tap a groove (or the squares) and hear it in the beat, then Keep it.
   Styled with the machine's own palette tokens, so it follows the chosen colour. Talks to the machine through window.GSM. */
(function () {
  'use strict';
  const M = window.GSM, S = window.GSSM;
  if (!M || !S) return;
  const PARTS = S.PARTS;

  /* ---------- styles: smoked glass, ruby gel keys, chrome, LCD (all from the palette tokens) ---------- */
  const css = `
.smwrap{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;
  background:radial-gradient(ellipse at 50% 40%,rgba(var(--acc),.18),rgba(0,0,0,.82) 70%);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.smwrap[hidden]{display:none}
.smwin{--smb:#ebe5d9;--smd:rgba(235,229,217,.62);--smf:rgba(235,229,217,.2);
  position:relative;width:min(880px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:18px;color:var(--smb);
  font-family:var(--f-osd);font-size:22px;line-height:1.2;
  background:url("art/tex-brushed.webp") 0 0/640px auto,linear-gradient(180deg,#26211f,#110f0e 34%,#0a0908);background-blend-mode:soft-light,normal;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 0 0 1px #000,0 0 0 3px #1d1a18,0 0 0 4px rgba(var(--acc),.35),0 30px 80px rgba(0,0,0,.9),0 0 80px rgba(var(--acc),.32)}
.smwin::before{content:"";position:absolute;left:30px;right:30px;top:0;height:2px;z-index:4;background:linear-gradient(90deg,transparent,var(--flame),transparent);box-shadow:0 0 14px var(--flame)}
.smbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:10px 12px 10px 18px;
  background:linear-gradient(180deg,rgba(28,24,22,.97),rgba(14,12,11,.97));border-bottom:1px solid var(--smf)}
.smttl{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 16px;border-radius:999px;font-size:20px;letter-spacing:.16em;color:#141110;
  background:linear-gradient(180deg,#fbfbfc 0%,#c9ccd4 46%,#9da2ae 54%,#e9eaee 100%);box-shadow:inset 0 1px 0 #fff,0 2px 0 #000,0 0 14px rgba(var(--acc),.35)}
.smttl i{font-style:normal;color:var(--acc-mid)}
.smcount{margin-left:auto;font-family:var(--f-led);font-weight:900;font-size:20px;color:var(--flame);background:var(--sur-4);border-radius:6px;padding:3px 10px;
  box-shadow:inset 0 2px 6px #000,inset 0 0 0 1px rgba(var(--acc),.2);text-shadow:0 0 6px rgba(var(--acc),.9)}
.smx{width:36px;height:36px;border-radius:50%;font-size:20px;color:var(--smd);
  background:radial-gradient(circle at 50% 30%,#4a4542,#1c1918 70%);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 0 #000}
.smx:hover{color:var(--flame)}
.smrail{display:flex;gap:7px;flex-wrap:wrap;padding:12px 18px 2px}
.smpill{position:relative;display:flex;align-items:center;gap:7px;height:34px;padding:0 12px 0 9px;border-radius:7px;font-size:19px;letter-spacing:.06em;color:var(--smd);
  background:linear-gradient(180deg,#3a3633 0%,#211e1c 48%,#161413 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.6),0 3px 0 #050404}
.smpill b{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--led-off);box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}
.smpill.half b{background:linear-gradient(90deg,var(--flame) 50%,var(--led-off) 50%)}
.smpill.done b{background:var(--flame);box-shadow:0 0 6px var(--flame),0 0 2px #fff inset}
.smpill.cur{color:var(--on-ink);background:linear-gradient(180deg,var(--flame) 0%,var(--acc-mid) 55%,var(--acc-lo) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.4),0 3px 0 var(--acc-deep),0 0 16px rgba(var(--acc),.55)}
.smpill.cur b{background:var(--on-ink);box-shadow:0 0 6px var(--on-ink)}
.smpill .opt{font-size:15px;opacity:.65}
.smbody{position:relative;padding:6px 26px 20px}
.smwelcome{margin:8px 0 2px;padding:8px 14px;border-radius:10px;font-size:21px;color:var(--smb);background:rgba(var(--acc),.12);box-shadow:inset 0 0 0 1px rgba(var(--acc),.35)}
.smstep{font-size:18px;letter-spacing:.18em;color:var(--smd);text-transform:uppercase;margin-top:10px}
.smh{margin:0 0 4px;font-family:var(--f-serif);font-weight:700;font-size:46px;line-height:1.02;letter-spacing:.01em;color:var(--smb)}
.smh em{font-style:italic;color:var(--flame);text-shadow:0 0 18px rgba(var(--acc),.6),1px 0 rgba(var(--acc),.5),-1px 0 rgba(80,200,255,.3)}
.smwhat{margin:0 0 12px;color:var(--smd);font-size:22px}
.smrow{display:flex;gap:10px}
.smin{flex:1;min-width:0;height:58px;padding:0 18px;border-radius:10px;border:0;outline:none;background:var(--sur-4);color:var(--flame);
  font:400 30px var(--f-osd);letter-spacing:.04em;text-shadow:0 0 8px rgba(var(--acc),.8);
  box-shadow:inset 0 3px 10px #000,inset 0 0 0 1px rgba(var(--acc),.25),0 1px 0 rgba(255,255,255,.06)}
.smin:focus{box-shadow:inset 0 3px 10px #000,inset 0 0 0 2px var(--flame),0 0 18px rgba(var(--acc),.35)}
.smin::placeholder{color:rgba(var(--acc),.35);text-shadow:none}
.smk{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 20px;border-radius:9px;white-space:nowrap;
  font:400 24px var(--f-osd);letter-spacing:.08em;text-transform:uppercase;color:var(--smb);
  background:linear-gradient(180deg,#3a3633 0%,#211e1c 48%,#161413 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -2px 0 rgba(0,0,0,.6),0 4px 0 #050404,0 6px 10px rgba(0,0,0,.7);transition:transform .05s,filter .15s}
.smk:hover{filter:brightness(1.15)}
.smk:active{transform:translateY(3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 1px 0 #050404}
.smk:disabled{opacity:.4;cursor:default;transform:none;filter:none}
.smk::before{content:"";position:absolute;left:8%;right:8%;top:3px;height:40%;border-radius:7px;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,0));pointer-events:none}
.smk.lit{color:var(--on-ink);background:linear-gradient(180deg,var(--flame) 0%,var(--acc-mid) 55%,var(--acc-lo) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.4),0 4px 0 var(--acc-deep),0 0 22px rgba(var(--acc),.55)}
.smk.lit::before{background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.05))}
.smk.chrome{color:#141110;background:linear-gradient(180deg,#fdfdfe 0%,#d2d5dc 46%,#a6abb7 54%,#eceef2 100%);box-shadow:inset 0 1px 0 #fff,0 4px 0 #2a2725,0 0 14px rgba(255,255,255,.25)}
.smk.chrome::before{display:none}
.smk.big{height:60px;font-size:28px;padding:0 30px}
.smk.go{height:58px;font-size:26px}
.smk.small{height:42px;font-size:20px;padding:0 14px}
.smk.ghost{color:var(--flame)}
.smk kbd{font:inherit;font-size:17px;padding:1px 7px;border-radius:5px;background:rgba(0,0,0,.25);letter-spacing:.04em}
.smideas{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0 0;font-size:20px;color:var(--smd)}
.smidea{height:34px;padding:0 13px;border-radius:999px;font-size:20px;letter-spacing:.03em;color:var(--smb);background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--smf)}
.smidea:hover{color:var(--on-ink);background:rgba(var(--acc),.55);box-shadow:inset 0 0 0 1px var(--flame),0 0 12px rgba(var(--acc),.45)}
.smcard{position:relative;margin-top:16px;border-radius:12px;padding:16px 18px;min-height:150px;
  background:linear-gradient(180deg,#0e0b0a,#060505);box-shadow:inset 0 0 0 1px rgba(235,229,217,.08),inset 0 10px 24px #000}
.smcard::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--acc),.7),transparent);box-shadow:0 0 8px rgba(var(--acc),.6)}
.smempty{display:flex;align-items:center;gap:16px;color:var(--smd);min-height:118px}
.smempty .ring{flex:none;width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font-size:34px;color:rgba(var(--acc),.5);box-shadow:inset 0 0 0 2px rgba(var(--acc),.3),0 0 18px rgba(var(--acc),.15)}
.smempty b{color:var(--smb);font-weight:400;font-size:24px}
.smmaking{display:flex;flex-direction:column;justify-content:center;gap:12px;min-height:118px}
.smmaking p{margin:0;font-size:28px;color:var(--flame);text-shadow:0 0 10px rgba(var(--acc),.7)}
.smprog{height:20px;border-radius:5px;overflow:hidden;background:var(--sur-4);box-shadow:inset 0 2px 5px #000,inset 0 0 0 1px rgba(var(--acc),.25)}
.smprog i{display:block;height:100%;width:0;transition:width .6s cubic-bezier(.3,.7,.3,1);box-shadow:0 0 12px var(--flame);
  background:repeating-linear-gradient(-45deg,var(--flame) 0 12px,var(--acc-mid) 12px 24px);background-size:34px 34px;animation:smstripe .5s linear infinite}
@keyframes smstripe{to{background-position:34px 0}}
.smres{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center}
.smplay{position:relative;width:84px;height:84px;border-radius:50%;font-size:30px;color:var(--flame);text-shadow:0 0 10px rgba(var(--acc),.9);
  background:radial-gradient(circle at 50% 28%,#ffffff 0%,#d7dae1 22%,#8e939f 52%,#2c2a2a 80%);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.7),inset 0 -6px 12px rgba(0,0,0,.6),0 5px 0 #050404,0 0 0 3px rgba(var(--acc),.35),0 0 24px rgba(var(--acc),.4)}
.smplay:active{transform:translateY(3px)}
.smplay.hit{animation:smthump .35s ease-out}
@keyframes smthump{30%{transform:scale(1.1);box-shadow:inset 0 2px 0 rgba(255,255,255,.7),0 5px 0 #050404,0 0 0 4px var(--flame),0 0 40px var(--flame)}}
.smname{font-family:var(--f-serif);font-weight:700;font-size:32px;line-height:1.05;color:var(--smb)}
.smname span{font-family:var(--f-osd);font-weight:400;font-size:22px;color:var(--flame)}
.smfrom{font-size:19px;color:var(--smd);margin:2px 0 6px}
.smwave{display:block;width:100%;height:56px}
.smacts{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:16px}
.smacts .sp{flex:1}
.smtip{font-size:20px;color:var(--smd);margin-top:10px;min-height:24px}
.smtip b{color:var(--smb);font-weight:400}
.smshelf{margin-top:16px;padding-top:12px;border-top:1px solid var(--smf)}
.smshelf h4{margin:0 0 8px;font-weight:400;font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:var(--smd)}
.smshelf h4 i{font-style:normal;color:var(--flame)}
.smshelf .list{display:flex;flex-wrap:wrap;gap:8px}
.smchip{display:inline-flex;align-items:center;height:36px;border-radius:8px;overflow:hidden;background:linear-gradient(180deg,#34302d,#1a1716);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 0 #050404}
.smchip button{height:100%;padding:0 10px 0 14px;font-size:20px;color:var(--smb)}
.smchip button:hover{color:var(--flame)}
.smchip button.del{padding:0 12px 0 4px;color:var(--smd);font-size:22px}
.smshelf .none{font-size:19px;color:var(--smf)}
.smnav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px}
.smauto{display:flex;align-items:center;gap:8px;font-size:18px;color:var(--smd);cursor:pointer}
.smauto input{accent-color:var(--flame);width:16px;height:16px}
.smgrid{display:grid;grid-template-columns:repeat(16,1fr);gap:6px;margin-top:6px}
.smgrid .bt{grid-column:span 4;font-size:17px;letter-spacing:.14em;color:var(--smd);padding-left:2px}
.smsq{position:relative;height:50px;border-radius:7px;background:linear-gradient(180deg,#3a3633 0%,#211e1c 48%,#161413 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.6),0 3px 0 #050404}
.smsq:nth-child(4n+2){margin-left:0}
.smsq.beat{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.6),0 3px 0 #050404,inset 0 0 0 1px rgba(var(--acc),.25)}
.smsq.on{background:linear-gradient(180deg,var(--flame) 0%,var(--acc-mid) 55%,var(--acc-lo) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.4),0 3px 0 var(--acc-deep),0 0 14px rgba(var(--acc),.55)}
.smsq.gh{filter:brightness(.6) saturate(.8)}
.smsq.roll::after{content:"×";position:absolute;inset:0;display:grid;place-items:center;font-size:20px;color:var(--on-ink)}
.smsq.ph{outline:2px solid rgba(var(--glow),.9);outline-offset:1px}
.smnow{margin-top:10px;font-size:22px;color:var(--smd)}
.smnow b{color:var(--flame);font-weight:400;text-shadow:0 0 8px rgba(var(--acc),.6)}
.smgrooves{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:10px}
.smgv{display:flex;flex-direction:column;align-items:flex-start;gap:7px;padding:10px 12px;border-radius:10px;text-align:left;font-size:21px;color:var(--smb);
  background:linear-gradient(180deg,#2c2826,#161312);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 0 #050404}
.smgv:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 0 #050404,0 0 0 1px rgba(var(--acc),.6),0 0 14px rgba(var(--acc),.3)}
.smgv.on{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 0 #050404,0 0 0 2px var(--flame),0 0 18px rgba(var(--acc),.45)}
.smgv small{font-size:17px;color:var(--smd)}
.smgv .dots{display:grid;grid-template-columns:repeat(16,1fr);gap:2px;width:100%}
.smgv .dots i{height:7px;border-radius:2px;background:var(--led-off)}
.smgv .dots i.on{background:var(--flame);box-shadow:0 0 4px var(--flame)}
.smgv .dots i:nth-child(4n+1){outline:1px solid rgba(255,255,255,.08)}
.smtoast{position:absolute;left:50%;top:50%;z-index:6;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;text-align:center;
  padding:20px 34px;border-radius:14px;font-family:var(--f-serif);font-weight:700;font-size:34px;color:var(--on-ink);
  background:linear-gradient(180deg,var(--flame) 0%,var(--acc-mid) 60%,var(--acc-lo) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 2px #000,0 0 0 4px rgba(var(--acc),.6),0 0 60px rgba(var(--acc),.7);transition:transform .25s cubic-bezier(.2,1.6,.4,1),opacity .2s}
.smtoast.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.smtoast small{display:block;font-family:var(--f-osd);font-weight:400;font-size:22px;letter-spacing:.06em;margin-top:6px}
.smstar{position:absolute;z-index:5;pointer-events:none;font-size:22px;text-shadow:0 0 8px currentColor;animation:smfly 1.1s ease-out forwards}
@keyframes smfly{0%{transform:translate(0,0) scale(.4) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(200deg);opacity:0}}
.smdone{text-align:center;padding:12px 0 6px}
.smdone .kit{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:14px 0 18px}
.smdone .kit span{padding:6px 12px;border-radius:8px;font-size:19px;color:var(--smd);background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--smf)}
.smdone .kit span b{color:var(--flame);font-weight:400}
.top #btnSounds.key{color:var(--on-ink);background:linear-gradient(180deg,var(--flame) 0%,var(--acc-mid) 55%,var(--acc-lo) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.4),0 3px 0 var(--acc-deep),0 0 18px rgba(var(--acc),.6)}
.top #btnSounds.key:hover{filter:brightness(1.12)}
html.calm .smprog i,html.calm .smplay.hit,html.calm .smstar{animation:none}
html.calm .smtoast{transition:none}
@media (max-width:760px){
  .smwrap{padding:0;align-items:stretch}
  .smwin{border-radius:0;max-height:none;height:100%}
  .smrail{flex-wrap:nowrap;overflow-x:auto;padding:12px 14px 4px}
  .smpill{flex:none}
  .smbody{padding:6px 14px calc(18px + env(safe-area-inset-bottom,0px))}
  .smh{font-size:34px}
  .smrow{flex-direction:column}
  .smres{grid-template-columns:auto 1fr}
  .smres .smbeat{grid-column:1/-1}
  .smacts .smk{flex:1 1 calc(50% - 12px)}
  .smacts .sp{display:none}
  .smgrid{gap:3px}.smsq{height:38px;border-radius:5px}
  .smnav{flex-wrap:wrap}
}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------- markup ---------- */
  const wrap = document.createElement('div');
  wrap.className = 'smwrap'; wrap.hidden = true;
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'smH');
  wrap.innerHTML =
    '<div class="smwin" id="smWin">' +
      '<div class="smbar"><span class="smttl"><i>✦</i>SOUND MAKER</span><span class="smcount" id="smCount"></span>' +
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
    phase: 'sound',                         // 'sound' or 'rhythm'
    words: PARTS.map(() => ''),
    cur: null,                              // the sound on trial: { track, recipe, name, n }
    before: null,                           // the track's sound before the trial
    rcur: null,                             // the rhythm on trial: { row, notes }
    rbefore: null,                          // the track's rhythm before the trial
    recent: PARTS.map(() => []),            // takes heard lately, per part
    trashed: PARTS.map(() => new Set()),
    kept: PARTS.map(() => null),            // name of the kept sound
    keptRhythm: PARTS.map(() => null),      // name of the kept groove
    done: PARTS.map(() => false),           // both steps finished (kept or skipped)
    n: PARTS.map(() => 0),                  // how many sounds made for this part
    gseen: PARTS.map(() => new Set()),      // grooves already offered
    welcome: false, busy: false, finished: false, debug: { made: [] },
  };
  const BANK_KEY = 'gs-mysounds', TRASH_KEY = 'gs-trashed', AUTO_KEY = 'gs-sm-auto';
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
  const pat = () => M.patterns[M.state.ptn];
  const where = k => k === 0 ? 'Made by the built-in synth' : k <= 4 ? 'From the studio kit' : k <= 8 ? 'From your own tracks' : 'From your Suno sounds';
  const takeOk = (i, k) => k === 0 || !!(M.studio.ready && M.studio.buf[i][k - 1]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tok = (n, fb) => { const v = getComputedStyle(win).getPropertyValue(n).trim(); return v || fb; };

  /* ---------- sound trial: try a sound on the real track, put it back if not kept ---------- */
  function snap(i) { const p = M.params[i]; return { src: M.src[i], knobs: Object.fromEntries(S.KNOBS.map(k => [k, p[k]])) }; }
  function put(i, src, knobs) { M.src[i] = src; Object.assign(M.params[i], knobs); M.applyTrack(i); M.select(i); }
  function revertSound() {
    if (SM.before && SM.cur) put(SM.cur.track, SM.before.src, SM.before.knobs);
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

  /* ---------- rhythm trial ---------- */
  function rowNow(i) { return pat().steps[i].slice(); }
  function setRow(i, row, notes) {
    const pt = pat(); pt.steps[i].splice(0, 16, ...row);
    if (notes) pt.notes[i].splice(0, 16, ...notes);
    M.renderSteps(); M.renderLog();
  }
  function tryRow(row, notes) {
    const i = tr();
    if (!SM.rbefore) SM.rbefore = { track: i, row: rowNow(i), notes: pat().notes[i].slice() };
    setRow(i, row, notes);
    SM.rcur = { row: row.slice(), notes: notes ? notes.slice() : null };
  }
  function revertRhythm() {
    if (SM.rbefore) setRow(SM.rbefore.track, SM.rbefore.row, SM.rbefore.notes);
    SM.rbefore = null; SM.rcur = null;
  }
  function revert() { revertSound(); revertRhythm(); }

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
      return S.fromClaude(res, k => takeOk(i, k) && !avoid.includes(k));
    } catch (e) { return null; } finally { clearTimeout(t); }
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function generate() {
    if (SM.busy || SM.phase !== 'sound') return;
    const inp = $('smIn'), words = (inp ? inp.value : SM.words[SM.i]).trim();
    SM.words[SM.i] = words;
    SM.busy = true; M.initAudio(); try { M.ctx && M.ctx.resume(); } catch (e) { }
    renderMaking();
    const i = tr(), t0 = performance.now();
    let recipe = await claudeRecipe(i, words), by = recipe ? 'claude' : 'reader';
    if (!recipe) recipe = readerRecipe(i, words);
    const left = M.reduce ? 0 : Math.max(0, 650 - (performance.now() - t0));
    setProg(100); await wait(left);
    SM.busy = false;
    if (wrap.hidden || SM.phase !== 'sound' || tr() !== i) return;      // closed or moved on while it was making
    tryOn(recipe, S.nameFor(words, part()));
    SM.cur.by = by;
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
    if (M.reduce || !fromEl) return;
    const wr = win.getBoundingClientRect(), r = fromEl.getBoundingClientRect();
    const x = r.left - wr.left + r.width / 2, y = r.top - wr.top + win.scrollTop + r.height / 2;
    const glyphs = ['✦', '★', '✧', '✶'], cols = [tok('--flame', '#ff2a1f'), tok('--hot', '#ff6b55'), tok('--acc-pale', '#ffb5a0'), '#ffffff'];
    for (let k = 0; k < n; k++) {
      const s = document.createElement('span'); s.className = 'smstar'; s.textContent = glyphs[k % 4];
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 130;
      s.style.cssText = `left:${x}px;top:${y}px;color:${cols[k % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px`;
      win.appendChild(s); setTimeout(() => s.remove(), 1200);
    }
  }
  let toastT = 0;
  function showToast(html, ms = 1100) {
    toast.innerHTML = html; toast.classList.add('on'); clearTimeout(toastT);
    return new Promise(r => { toastT = setTimeout(() => { toast.classList.remove('on'); r(); }, ms); });
  }

  /* ---------- sound choices ---------- */
  async function keep() {
    const c = SM.cur; if (!c || SM.busy) return;
    const i = c.track, k = c.recipe.src;
    if (k && M.vote(M.takeId(i, k)) !== 1) M.rateItem(M.takeId(i, k), 1, { meta: M.studio.meta[i][k - 1] || null });
    SM.kept[SM.i] = c.name; SM.before = null; SM.cur = null;
    M.flashTrack && M.flashTrack(i);
    chime([660, 880, 1320]); stars($('smKeep') || win, 22);
    renderRail();
    SM.busy = true;
    await showToast('✓ ' + esc(c.name) + ' is in!<small>Now pick how it hits</small>', M.reduce ? 800 : 1100);
    SM.busy = false;
    if (!wrap.hidden) toRhythm();
  }
  function again() { if (!SM.cur || SM.busy) return; generate(); }
  function trash() {
    const c = SM.cur; if (!c || SM.busy) return;
    const i = c.track, k = c.recipe.src;
    SM.trashed[SM.i].add(k); saveTrash();
    if (k && M.vote(M.takeId(i, k)) !== -1) M.rateItem(M.takeId(i, k), -1, { meta: M.studio.meta[i][k - 1] || null });
    chime([300, 200]);
    generate().then(() => tip('Trashed. That one won\'t come back. Here\'s a new one.'));
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
    chime([880, 1175]); stars($('smSave'), 10);
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

  /* ---------- rhythm choices ---------- */
  function lanePool(i) {
    return M.LANES.map(L => { const p = M.buildPattern(L); return { row: p.steps[i], notes: p.notes[i] }; });
  }
  function offer() {            // up to 4 grooves not offered yet; then variations of what's there
    const i = tr(), seen = SM.gseen[SM.i], pool = lanePool(i).filter(p => !seen.has(p.row.join('')));
    const cur = rowNow(i);
    let rows = S.grooves(pool.map(p => p.row), cur, part().id, 4);
    const out = rows.map(r => { const p = pool.find(x => x.row.join('') === r.join('')); return { row: r, notes: p ? p.notes.slice() : null }; });
    let guard = 0;
    while (out.length < 4 && guard++ < 30) { const v = S.vary(out.length ? out[out.length - 1].row : cur); if (!out.some(o => o.row.join('') === v.join('')) && v.join('') !== cur.join('')) out.push({ row: v, notes: null }); }
    out.forEach(o => seen.add(o.row.join('')));
    if (part().optional && !out.some(o => !S.hits(o.row)) && S.hits(cur)) out.push({ row: Array(16).fill(0), notes: null, out: true });
    SM.offered = out;
    return out;
  }
  async function keepRhythm() {
    if (SM.busy) return;
    const i = tr(), row = rowNow(i), name = S.grooveName(row, part().id);
    SM.keptRhythm[SM.i] = name; SM.done[SM.i] = true; SM.rbefore = null; SM.rcur = null;
    M.flashTrack && M.flashTrack(i);
    chime([660, 990, 1320, 1760]); stars($('smKeepR') || win, 26);
    renderRail();
    SM.busy = true;
    const nx = nextOpen(SM.i);
    await showToast('✓ Your ' + esc(part().word) + ' is done!<small>' + (nx < 0 ? 'Every part is done.' : 'Next up: the ' + esc(PARTS[nx].word)) + '</small>', M.reduce ? 900 : 1200);
    SM.busy = false;
    if (wrap.hidden) return;
    if (nx < 0) finish(); else go(nx);
  }

  /* ---------- moving around ---------- */
  function nextOpen(from) { for (let j = from + 1; j < PARTS.length; j++) if (!SM.done[j]) return j; for (let j = 0; j < from; j++) if (!SM.done[j]) return j; return -1; }
  function go(j, phase) {
    if (SM.busy) return;
    revert(); SM.finished = false; SM.i = Math.max(0, Math.min(PARTS.length - 1, j)); SM.phase = phase || 'sound';
    renderRail(); if (SM.phase === 'rhythm') renderRhythm(); else renderPart();
  }
  function toRhythm() { if (SM.busy) return; revertSound(); SM.phase = 'rhythm'; renderRail(); renderRhythm(); }
  function skipPart() { if (SM.busy) return; revert(); SM.done[SM.i] = true; const nx = nextOpen(SM.i); if (nx < 0) finish(); else go(nx); }
  function finish() { revert(); SM.finished = true; renderRail(); renderDone(); }

  /* ---------- drawing ---------- */
  function renderRail() {
    rail.innerHTML = '';
    PARTS.forEach((p, j) => {
      const b = document.createElement('button'), cur = j === SM.i && !SM.finished;
      b.className = 'smpill' + (cur ? ' cur' : '') + (SM.done[j] ? ' done' : SM.kept[j] ? ' half' : '');
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', cur ? 'true' : 'false');
      b.innerHTML = '<b></b>' + esc(p.title) + (p.optional ? ' <span class="opt">optional</span>' : '');
      b.title = SM.done[j] ? 'Done' + (SM.kept[j] ? ': ' + SM.kept[j] : '') : p.what;
      b.addEventListener('click', () => go(j));
      rail.appendChild(b);
    });
    countEl.textContent = SM.done.filter(Boolean).length + '/' + PARTS.length;
    countEl.title = SM.done.filter(Boolean).length + ' of ' + PARTS.length + ' parts done';
  }
  function welcomeHtml() { return SM.welcome ? '<div class="smwelcome">Welcome! Let\'s make your beat, one part at a time. First the sound, then how it hits.</div>' : ''; }
  function autoHtml() { return '<label class="smauto"><input type="checkbox" id="smAuto"' + (M.lsGet(AUTO_KEY) === '0' ? '' : ' checked') + '> Open this when the machine starts</label>'; }
  function wireAuto() { const a = $('smAuto'); if (a) a.addEventListener('change', () => M.lsSet(AUTO_KEY, a.checked ? '1' : '0')); }

  function renderPart() {
    const p = part();
    body.innerHTML = welcomeHtml() +
      '<div class="smstep">Part ' + (SM.i + 1) + ' of ' + PARTS.length + ' · step 1 of 2: the sound' + (p.optional ? ' · optional' : '') + '</div>' +
      '<h2 class="smh" id="smH">Generate a <em>' + esc(p.word) + '</em> here</h2>' +
      '<p class="smwhat">' + esc(p.what) + ' Type what you want it to sound like, then press Enter.</p>' +
      '<div class="smrow"><input class="smin" id="smIn" type="text" autocomplete="off" spellcheck="false" maxlength="120" ' +
        'placeholder="e.g. ' + esc(p.ideas[0]) + '" aria-label="Describe the ' + esc(p.word) + ' you want">' +
        '<button class="smk lit go" id="smGo">Generate <kbd>Enter ⏎</kbd></button></div>' +
      '<div class="smideas"><span>Need an idea? Tap one:</span>' + p.ideas.map(x => '<button class="smidea">' + esc(x) + '</button>').join('') + '</div>' +
      '<div class="smcard" id="smCard"></div>' +
      '<div class="smshelf" id="smShelf"></div>' +
      '<div class="smnav"><button class="smk small" id="smBack"' + (SM.i ? '' : ' disabled') + '>◀ Previous part</button>' + autoHtml() +
        '<button class="smk small" id="smSkip">' + (SM.kept[SM.i] ? 'Keep my sound · go to how it hits ▶' : 'Skip to how it hits ▶') + '</button></div>';
    const inp = $('smIn'); inp.value = SM.words[SM.i];
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); generate(); } });
    inp.addEventListener('input', () => { SM.words[SM.i] = inp.value; });
    $('smGo').addEventListener('click', generate);
    body.querySelectorAll('.smidea').forEach(b => b.addEventListener('click', () => { inp.value = b.textContent; SM.words[SM.i] = inp.value; generate(); }));
    $('smBack').addEventListener('click', () => go(SM.i - 1));
    $('smSkip').addEventListener('click', toRhythm);
    wireAuto();
    renderEmpty(); renderShelf();
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
  }

  function renderEmpty() {
    const card = $('smCard'); if (!card) return;
    const p = part();
    card.innerHTML = '<div class="smempty"><div class="ring">♪</div><div><b>Your ' + esc(p.word) + ' will play here.</b><br>' +
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

  function beatBtn(id) { const on = M.state.playing; return '<button class="smk small smbeat' + (on ? ' ghost' : '') + '" id="' + id + '">' + (on ? '■ Stop the beat' : '▶ Hear it in the beat') + '</button>'; }
  function renderBeatBtn() { document.querySelectorAll('.smbeat').forEach(b => { const on = M.state.playing; b.classList.toggle('ghost', on); b.textContent = on ? '■ Stop the beat' : '▶ Hear it in the beat'; }); }
  function wireBeat(id) { const b = $(id); if (b) b.addEventListener('click', () => { if (M.state.playing) M.stop(); else M.play(); renderBeatBtn(); }); }

  function renderResult() {
    const card = $('smCard'), c = SM.cur; if (!card || !c) return;
    disable(false);
    card.innerHTML =
      '<div class="smres">' +
        '<button class="smplay" id="smPlay" aria-label="Play it again">▶</button>' +
        '<div><div class="smname">' + esc(c.name) + ' <span>#' + c.n + '</span></div>' +
          '<div class="smfrom">' + where(c.recipe.src) + (c.by === 'claude' ? ' · shaped by Claude' : '') + '</div>' +
          '<canvas class="smwave" id="smWave" width="600" height="56" aria-hidden="true"></canvas></div>' +
        beatBtn('smBeat') +
      '</div>' +
      '<div class="smacts">' +
        '<button class="smk lit big" id="smKeep" title="Use this sound in your beat">✓ Keep it</button>' +
        '<button class="smk chrome" id="smAgain" title="Make a different one from the same words">↻ Try again</button>' +
        '<button class="smk ghost" id="smSave" title="Put it in My sounds so you can use it later">★ Save for later</button>' +
        '<span class="sp"></span>' +
        '<button class="smk small" id="smTrash" title="Never show this sound again">✕ Trash</button>' +
      '</div>' +
      '<div class="smtip" id="smTip">Like it? Press <b>Keep it</b>. Want something else? Press <b>Try again</b>.</div>';
    $('smPlay').addEventListener('click', hear);
    wireBeat('smBeat');
    $('smKeep').addEventListener('click', keep);
    $('smAgain').addEventListener('click', again);
    $('smSave').addEventListener('click', saveForLater);
    $('smTrash').addEventListener('click', trash);
    drawWave();
  }
  function tip(t) { const e = $('smTip'); if (e) e.textContent = t; }

  function drawWave() {
    const cv = $('smWave'), c = SM.cur; if (!cv || !c) return;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, mid = H / 2;
    g.clearRect(0, 0, W, H);
    const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, tok('--acc-pale', '#ffb5a0')); grad.addColorStop(.35, tok('--flame', '#ff2a1f')); grad.addColorStop(1, tok('--acc-lo', '#8f0c06'));
    g.fillStyle = grad; g.shadowColor = tok('--flame', '#ff2a1f'); g.shadowBlur = 6;
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
    peaks.forEach((v, j) => { const h = Math.max(2, v * (H - 8)); g.fillRect(j * bw + 1, mid - h / 2, Math.max(1, bw - 2), h); });
  }

  function renderShelf() {
    const el = $('smShelf'); if (!el) return;
    const mine = bank.filter(b => b.part === part().id);
    el.innerHTML = '<h4><i>★</i> My sounds for the ' + esc(part().word) + '</h4><div class="list"></div>';
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

  /* ---------- step 2: how it hits ---------- */
  function renderRhythm() {
    const p = part(), i = tr();
    M.select(i); M.ensurePlaying();
    body.innerHTML = welcomeHtml() +
      '<div class="smstep">Part ' + (SM.i + 1) + ' of ' + PARTS.length + ' · step 2 of 2: how it hits' + (p.optional ? ' · optional' : '') + '</div>' +
      '<h2 class="smh" id="smH">Pick how your <em>' + esc(p.word) + '</em> hits</h2>' +
      '<p class="smwhat">The beat is playing. Tap a groove to hear it, or tap the squares to add or take away hits.</p>' +
      '<div class="smcard" id="smCard">' +
        '<div class="smgrid" id="smGrid"></div>' +
        '<div class="smnow" id="smNow"></div>' +
        '<div class="smgrooves" id="smGrooves"></div>' +
        '<div class="smacts">' +
          '<button class="smk lit big" id="smKeepR" title="Use this rhythm and go to the next part">✓ Keep it</button>' +
          '<button class="smk chrome" id="smMore" title="Show other grooves">↻ Show me more</button>' +
          '<button class="smk small" id="smUndoR" title="Go back to how it was"' + (SM.rbefore ? '' : ' disabled') + '>↺ Put it back</button>' +
          '<span class="sp"></span>' + beatBtn('smBeatR') +
        '</div>' +
        '<div class="smtip" id="smTip">Happy with it? Press <b>Keep it</b>.</div>' +
      '</div>' +
      '<div class="smnav"><button class="smk small" id="smBackS">◀ Back to the sound</button>' + autoHtml() +
        '<button class="smk small" id="smSkipP">' + (nextOpen(SM.i) < 0 ? 'Finish ▶' : 'Next part ▶') + '</button></div>';
    $('smKeepR').addEventListener('click', keepRhythm);
    $('smMore').addEventListener('click', () => { renderGrooves(offer()); });
    $('smUndoR').addEventListener('click', () => { revertRhythm(); drawGrid(); renderGrooves(SM.offered || []); $('smUndoR').disabled = true; });
    $('smBackS').addEventListener('click', () => go(SM.i, 'sound'));
    $('smSkipP').addEventListener('click', skipPart);
    wireBeat('smBeatR'); wireAuto();
    drawGrid(); renderGrooves(offer());
  }
  function drawGrid() {
    const g = $('smGrid'); if (!g) return;
    const i = tr(), row = rowNow(i);
    g.innerHTML = ['1', '2', '3', '4'].map(n => '<span class="bt">BEAT ' + n + '</span>').join('');
    row.forEach((v, s) => {
      const b = document.createElement('button');
      b.className = 'smsq' + (s % 4 === 0 ? ' beat' : '') + (v ? ' on' : '') + (v === 5 ? ' gh' : '') + (v === 3 || v === 4 ? ' roll' : '');
      b.setAttribute('aria-label', 'Step ' + (s + 1) + (v ? ', on' : ', off')); b.setAttribute('aria-pressed', v ? 'true' : 'false');
      b.addEventListener('click', () => { const r = rowNow(i); r[s] = r[s] ? 0 : (s % 4 === 0 ? 2 : 1); tryRow(r, null); drawGrid(); markGroove(); const u = $('smUndoR'); if (u) u.disabled = false; });
      g.appendChild(b);
    });
    const now = $('smNow'); if (now) now.innerHTML = 'Right now: <b>' + esc(S.grooveName(row, part().id)) + '</b>';
  }
  function renderGrooves(list) {
    const el = $('smGrooves'); if (!el) return;
    el.innerHTML = '';
    list.forEach(o => {
      const b = document.createElement('button'); b.className = 'smgv';
      b.dataset.row = o.row.join('');
      const n = S.hits(o.row);
      b.innerHTML = '<span>' + esc(o.out ? 'Leave it out' : S.grooveName(o.row, part().id)) + ' <small>' + (o.out ? 'no hits' : n + (n === 1 ? ' hit' : ' hits')) + '</small></span><span class="dots">' + o.row.map(v => '<i' + (v ? ' class="on"' : '') + '></i>').join('') + '</span>';
      b.addEventListener('click', () => { tryRow(o.row, o.notes); drawGrid(); markGroove(); const u = $('smUndoR'); if (u) u.disabled = false; tip('Listen in the beat. Press Keep it if you like it.'); });
      el.appendChild(b);
    });
    markGroove();
  }
  function markGroove() { const now = rowNow(tr()).join(''); document.querySelectorAll('.smgv').forEach(b => b.classList.toggle('on', b.dataset.row === now)); }
  // light the square under the playhead
  setInterval(() => {
    if (wrap.hidden || SM.phase !== 'rhythm') return;
    const st = M.state.playing ? M.state.step : -1;
    document.querySelectorAll('#smGrid .smsq').forEach((b, s) => b.classList.toggle('ph', s === st));
  }, 60);

  function renderDone() {
    body.innerHTML = '<div class="smdone"><div class="smstep">All done</div><h2 class="smh" id="smH">Your <em>beat</em> is ready ✦</h2>' +
      '<p class="smwhat">Here is what you made. Press play to hear it all together.</p>' +
      '<div class="kit">' + PARTS.map((p, j) => '<span>' + esc(p.title) + ': ' + (SM.kept[j] || SM.keptRhythm[j] ? '<b>' + esc([SM.kept[j], SM.keptRhythm[j]].filter(Boolean).join(' · ')) + '</b>' : 'no change') + '</span>').join('') + '</div>' +
      '<div class="smnav" style="justify-content:center"><button class="smk lit big" id="smPlayAll">▶ Play my beat</button><button class="smk" id="smClose2">Close</button></div></div>';
    $('smPlayAll').addEventListener('click', () => { M.ensurePlaying(); close(); });
    $('smClose2').addEventListener('click', close);
  }

  /* ---------- open / close ---------- */
  function open(trackOrPart, opts) {
    hookDb(); revert();
    SM.welcome = !!(opts && opts.welcome);
    if (typeof trackOrPart === 'number') { const j = PARTS.findIndex(p => p.track === trackOrPart); SM.i = j < 0 ? 0 : j; }
    else if (typeof trackOrPart === 'string') { const j = PARTS.findIndex(p => p.id === trackOrPart); SM.i = j < 0 ? 0 : j; }
    else { const j = SM.done.findIndex(x => !x); SM.i = j < 0 ? SM.i : j; }
    SM.phase = 'sound'; SM.finished = false; wrap.hidden = false; renderRail(); renderPart();
  }
  function close() { if (SM.busy) return; revert(); SM.welcome = false; wrap.hidden = true; const b = document.getElementById('btnSounds'); b && b.focus({ preventScroll: true }); }
  const autoOpen = () => M.lsGet(AUTO_KEY) !== '0';
  Object.assign(SM, { open, close, generate, keep, again, trash, save: saveForLater, go, toRhythm, keepRhythm, skipPart, autoOpen, offer });
  Object.defineProperty(SM, 'bank', { get: () => bank });

  $('smX').addEventListener('click', close);
  wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  document.addEventListener('keydown', e => {
    if (wrap.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  new MutationObserver(() => { if (!wrap.hidden) drawWave(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });   // repaint in the new palette
  setInterval(() => { if (!wrap.hidden) renderBeatBtn(); }, 400);   // keep the beat buttons honest if it's started or stopped elsewhere

  const btn = document.getElementById('btnSounds');
  if (btn) btn.addEventListener('click', () => open());
})();
