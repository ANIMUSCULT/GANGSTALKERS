/* GANGSTALKERS sound maker: pure logic, no DOM or audio. Turns words into a sound recipe.
   Browser global GSSM; Node module export.
   A recipe is { src, tune, decay, tone, drive, space }: src 0 = the synth voice, 1.. = a recorded take. */
(function (root) {
  'use strict';

  // The parts, in the order the walkthrough visits them. `track` is the machine's track index.
  const PARTS = [
    { id: 'kick',    track: 0, title: 'Kick',         word: 'kick',         what: 'The deep thump that drives the beat.',
      ideas: ['deep and boomy', 'short and punchy', 'dusty and old', 'hard and distorted'] },
    { id: 'snare',   track: 1, title: 'Snare',        word: 'snare',        what: 'The crack you hear on the backbeat.',
      ideas: ['big with lots of room', 'tight and snappy', 'dirty and crunchy', 'soft and dusty'] },
    { id: 'clap',    track: 2, title: 'Clap',         word: 'clap',         what: 'The hand clap that sits with the snare.',
      ideas: ['wide and roomy', 'short and dry', 'gritty', 'bright and loud'] },
    { id: 'hat',     track: 3, title: 'Hi-hat',       word: 'hi-hat',       what: 'The fast ticking that keeps time.',
      ideas: ['crisp and bright', 'soft and dusty', 'short and tight', 'dirty'] },
    { id: 'ohat',    track: 4, title: 'Open hi-hat',  word: 'open hi-hat',  what: 'The longer sizzle that lets the bar breathe.',
      ideas: ['long and shiny', 'short and dark', 'washy with room'] },
    { id: 'bass',    track: 6, title: '808 bass',     word: '808',          what: 'The low bass note under everything.',
      ideas: ['deep and long', 'distorted and loud', 'short and bouncy', 'clean and smooth'] },
    { id: 'bell',    track: 5, title: 'Cowbell',      word: 'cowbell',      what: 'The bell melody you hear in phonk.', optional: true,
      ideas: ['gritty and old', 'bright and clean', 'dark with echo'] },
    { id: 'shutter', track: 7, title: 'Camera click', word: 'camera click', what: 'A small click for extra detail.', optional: true,
      ideas: ['quiet and far away', 'sharp and close', 'lots of echo'] },
  ];

  // word rules: pattern, knob moves, sample tags it wants, the label it adds to the sound's name
  const RULES = [
    { re: /\b(deep|low|sub|boom\w*|fat|thick|heavy)\b/,                                   d: { tune: -.12 },               tags: ['dark'],   label: 'Deep' },
    { re: /\b(high|bright|crisp\w*|shiny|sharp|airy|sizzl\w*|sparkl\w*)\b/,               d: { tune: .1, tone: .15 },     tags: ['bright'], label: 'Bright' },
    { re: /\b(short|tight|snappy|quick|dry|click\w*|bouncy|bounce)\b/,                    d: { decay: -.2, space: -.06 },  tags: ['short'],  label: 'Short' },
    { re: /\b(long|ring\w*|huge|big|massive|sustain\w*|tails?|washy)\b/,                  d: { decay: .22 },               tags: ['long'],   label: 'Long' },
    { re: /\b(punch\w*|hard|slam\w*|knock\w*|loud|aggress\w*|smack\w*)\b/,               d: { drive: .12 },               tags: ['punchy'], label: 'Punchy' },
    { re: /\b(dirt\w*|distort\w*|gritt?y|grit|crunch\w*|fuzz\w*|saturat\w*|nasty|blown)\b/, d: { drive: .3 },               tags: ['punchy'], label: 'Dirty' },
    { re: /\b(clean|smooth|pure|soft|gentle|subtle|quiet|chill)\b/,                       d: { drive: -.12 },              tags: ['soft'],   label: 'Smooth' },
    { re: /\b(dust\w*|old|vintage|lo-?fi|tape|warm|muffl\w*|dark|murky|vinyl|retro)\b/,   d: { tone: -.22 },               tags: ['dark'],   label: 'Dusty' },
    { re: /\b(room\w*|reverb\w*|echo\w*|space\w*|wet|wide|far|hall|cave)\b/,              d: { space: .25 },               tags: [],         label: 'Roomy' },
    { re: /\b(close|upfront|in your face)\b/,                                             d: { space: -.08 },              tags: [],         label: 'Close' },
  ];
  const KNOBS = ['tune', 'decay', 'tone', 'drive', 'space'];
  const RANGE = { tune: [.2, .8], decay: [.08, .95], tone: [.25, 1], drive: [0, .85], space: [0, .7] };
  const JITTER = { tune: .05, decay: .09, tone: .08, drive: .07, space: .06 };
  const clamp = (k, v) => Math.min(RANGE[k][1], Math.max(RANGE[k][0], v));
  const r3 = v => Math.round(v * 1000) / 1000;

  function readWords(words) {
    const t = String(words || '').toLowerCase();
    const hit = RULES.filter(r => r.re.test(t));
    const d = {}; hit.forEach(r => Object.entries(r.d).forEach(([k, v]) => { d[k] = (d[k] || 0) + v; }));
    const tags = [...new Set(hit.flatMap(r => r.tags))];
    const labels = [...new Set(hit.map(r => r.label))];
    return { d, tags, labels };
  }

  // shape: the knob values for a recipe, from the part's base knobs, the words and a little randomness
  function shape(base, words, rand = Math.random) {
    const { d } = readWords(words), out = {};
    KNOBS.forEach(k => { out[k] = r3(clamp(k, (base[k] ?? .5) + (d[k] || 0) + (rand() * 2 - 1) * JITTER[k])); });
    return out;
  }

  /* pickSource: which sample to start from.
     metas: per take (index k-1) { tags, bank } or null if that take doesn't exist
     votes: take number -> +1 kept / -1 trashed; recent: take numbers shown lately; trashed: Set of take numbers */
  function pickSource({ metas = [], words = '', votes = {}, recent = [], trashed = new Set(), rand = Math.random, synth = true } = {}) {
    const want = readWords(words).tags;
    const all = [];
    if (synth && !trashed.has(0)) all.push({ k: 0, s: .6 });
    metas.forEach((m, j) => {
      const k = j + 1; if (!m || trashed.has(k) || (votes[k] || 0) < 0) return;
      const s = (m.tags || []).filter(x => want.includes(x)).length + 1.2 * (votes[k] || 0) + (m.bank === 'yours' || m.bank === 'suno' ? .5 : 0);
      all.push({ k, s });
    });
    if (!all.length) return 0;
    let pool = all.filter(c => !recent.includes(c.k));
    if (!pool.length) pool = all.filter(c => c.k !== recent[recent.length - 1]);
    if (!pool.length) pool = all;
    pool.sort((a, b) => b.s - a.s || a.k - b.k);
    const top = pool.slice(0, 4), w = top.map(c => Math.max(.15, c.s - top[top.length - 1].s + .5)), sum = w.reduce((a, b) => a + b, 0);
    let x = rand() * sum;
    for (let j = 0; j < top.length; j++) { x -= w[j]; if (x <= 0) return top[j].k; }
    return top[top.length - 1].k;
  }

  // name: "Deep Dusty Kick" (at most two describing words)
  function nameFor(words, part) {
    const L = readWords(words).labels.slice(0, 2);
    return (L.length ? L.join(' ') + ' ' : 'Fresh ') + part.title.toLowerCase().replace(/^./, c => c.toUpperCase());
  }

  // fromClaude: make Claude's JSON reply safe. Returns null if it's unusable.
  function fromClaude(res, takeOk) {
    if (!res || typeof res !== 'object') return null;
    const k = Math.round(+res.take);
    if (!Number.isFinite(k) || k < 0 || !takeOk(k)) return null;
    const out = { src: k };
    for (const key of KNOBS) { const v = +res[key]; if (!Number.isFinite(v)) return null; out[key] = r3(clamp(key, v)); }
    return out;
  }

  const sameRecipe = (a, b) => !!a && !!b && a.src === b.src && KNOBS.every(k => Math.abs(a[k] - b[k]) < .001);

  const GSSM = { PARTS, RULES, KNOBS, RANGE, readWords, shape, pickSource, nameFor, fromClaude, sameRecipe };
  if (typeof module === 'object' && module.exports) module.exports = GSSM;
  else root.GSSM = GSSM;
})(typeof window !== 'undefined' ? window : globalThis);
