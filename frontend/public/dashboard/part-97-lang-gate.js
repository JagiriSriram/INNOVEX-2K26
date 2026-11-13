// Language gate + whole-dashboard translator.
//  1. After the intro (and the PIN, if one is set) a "Choose your language" screen opens. A 🌐 button keeps it reachable.
//  2. Every visible text of the dashboard (and the chat box) is translated into the chosen language through the
//     backend (/api/translate-ui). Results are cached in localStorage, so each sentence is only translated once.
//  3. A MutationObserver translates anything the app re-renders later, so all pages stay in the chosen language.
(function () {
  const API = window.RAG_API || 'http://localhost:8000';
  const CHOSEN = 'spr_lang_chosen';
  const RTL = ['ar', 'ur', 'fa'];
  const ROOTS = ['introOverlay', 'app', 'bottomNav', 'pinLock', 'chatWidget', 'voiceToast'];
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CANVAS: 1, SVG: 1, CODE: 1 };
  const SKIP_SEL = '.bubble, .cb-msgs, .lang-select, [data-no-translate], textarea, input[type=date]';
  const hasLetters = (s) => /\p{L}/u.test(s);

  let lang = 'en';
  let cache = {};                       // template(en) -> translated, for the current language
  const nodeRec = new WeakMap();        // text node -> {en, out, lang}
  const attrRec = new WeakMap();        // element -> {attr: {en, out, lang}}
  const dead = new Set();               // strings that could not be translated (not saved, not retried)
  let pending = new Set(), timer = null, busy = false, warned = false, scanQueued = false;

  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const loadCache = (l) => { try { return JSON.parse(ls.get('spr_ui_tr_' + l) || '{}'); } catch (e) { return {}; } };
  const saveCache = () => { try { ls.set('spr_ui_tr_' + lang, JSON.stringify(cache)); } catch (e) {} };

  // "78 bpm" -> template "# bpm" + the numbers, so live-changing values reuse one translation
  function split(text) {
    const core = text.trim();
    if (core.includes('#')) return { key: core, nums: null };
    const nums = core.match(/\d+(?:[.,:]\d+)*/g) || [];
    return { key: nums.length ? core.replace(/\d+(?:[.,:]\d+)*/g, '#') : core, nums: nums.length ? nums : null };
  }
  function fill(tpl, nums) {
    if (!nums) return tpl;
    let i = 0, count = (tpl.match(/#/g) || []).length;
    if (count !== nums.length) return null;
    return tpl.replace(/#/g, () => nums[i++]);
  }
  // returns translated text for `en`, or null if unknown yet (and queues it)
  function lookup(en) {
    const lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
    const { key, nums } = split(en);
    if (!key || !hasLetters(key)) return null;
    if (dead.has(key)) return null;
    const t = cache[key];
    if (t === undefined) { pending.add(key); return null; }
    const out = fill(t, nums);
    return out === null ? null : lead + out + trail;
  }

  function toast(msg) { if (window.__sprToast) window.__sprToast(msg); }

  // Fallback when the backend is off: translate straight from the browser (public Google endpoint).
  function direct(texts, l) {
    const one = (t) => fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + encodeURIComponent(l) + '&dt=t&q=' + encodeURIComponent(t))
      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then((j) => (j[0] || []).map((x) => x[0]).join('') || null).catch(() => null);
    const out = new Array(texts.length); let i = 0;
    const worker = () => { const k = i++; if (k >= texts.length) return Promise.resolve(); return one(texts[k]).then((v) => { out[k] = v; return worker(); }); };
    return Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(() => out);
  }
  function backend(batch, l) {
    return fetch(API + '/api/translate-ui', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: l, texts: batch }) })
      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); }).then((res) => res.texts || []);
  }
  function flush() {
    timer = null;
    if (lang === 'en' || busy || !pending.size) return;
    const batch = Array.from(pending).slice(0, 60);
    batch.forEach((k) => pending.delete(k));
    busy = true; setBar(true);
    const forLang = lang;
    backend(batch, forLang)
      .catch(() => direct(batch, forLang))
      .then((texts) => {
        if (forLang !== lang) return;
        let got = 0;
        batch.forEach((k, i) => { const t = texts && texts[i]; if (t) { cache[k] = t; got++; } else dead.add(k); });
        if (got) saveCache();
        if (!got && !warned) { warned = true; toast('Could not translate. Check your internet connection or start the backend.'); }
      })
      .finally(() => { busy = false; setBar(pending.size > 0); queueScan(); if (pending.size) timer = setTimeout(flush, 30); });
  }
  const schedule = () => { if (!timer && pending.size) timer = setTimeout(flush, 80); };

  function setBar(on) {
    let b = document.getElementById('trBar');
    if (!b) { b = document.createElement('div'); b.id = 'trBar'; b.setAttribute('data-no-translate', ''); document.body.appendChild(b); }
    b.style.display = on && lang !== 'en' ? 'block' : 'none';
    b.textContent = '🌐 …';
  }

  function textNode(n) {
    const p = n.parentElement;
    if (!p || SKIP_TAGS[p.tagName.toUpperCase()] || p.closest(SKIP_SEL)) return;
    const rec = nodeRec.get(n);
    let en;
    if (rec && n.data === rec.out && rec.lang === lang) return;                 // already translated by us
    if (rec && (n.data === rec.out || n.data === rec.en)) en = rec.en;          // language changed / re-shown
    else en = n.data;                                                           // new text from a re-render
    if (!hasLetters(en)) return;
    if (lang === 'en') { if (rec && n.data !== rec.en) n.data = rec.en; nodeRec.delete(n); return; }
    const out = lookup(en);
    if (out === null) { if (rec && n.data !== en) n.data = en; nodeRec.set(n, { en, out: en, lang: '' }); return; }
    nodeRec.set(n, { en, out, lang });
    if (n.data !== out) n.data = out;
  }
  function attrs(el) {
    if (SKIP_TAGS[el.tagName.toUpperCase()]) return;
    if (el.closest(SKIP_SEL)) return;
    const recs = attrRec.get(el) || {};
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      const cur = el.getAttribute(a), r = recs[a];
      if (r && cur === r.out && r.lang === lang) return;
      const en = r && (cur === r.out || cur === r.en) ? r.en : cur;
      if (!hasLetters(en)) return;
      if (lang === 'en') { if (r && cur !== r.en) el.setAttribute(a, r.en); delete recs[a]; return; }
      const out = lookup(en);
      if (out === null) { recs[a] = { en, out: en, lang: '' }; return; }
      recs[a] = { en, out, lang };
      if (cur !== out) el.setAttribute(a, out);
    });
    attrRec.set(el, recs);
  }
  function scan() {
    scanQueued = false;
    ROOTS.forEach((id) => {
      const root = document.getElementById(id); if (!root) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let n = w.currentNode;
      while (n) { if (n.nodeType === 3) textNode(n); else if (n.nodeType === 1) attrs(n); n = w.nextNode(); }
    });
    schedule();
  }
  function queueScan() { if (!scanQueued) { scanQueued = true; queueMicrotask(scan); } }

  const obs = new MutationObserver(queueScan);
  function observe() {
    ROOTS.forEach((id) => { const r = document.getElementById(id); if (r && !r.__tr) { r.__tr = 1; obs.observe(r, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); } });
  }
  setInterval(observe, 500);   // chat box / pin lock are created lazily

  function applyLang(l) {
    lang = l || 'en';
    cache = lang === 'en' ? {} : loadCache(lang);
    pending = new Set(); dead.clear(); warned = false;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
    observe(); queueScan();
  }

  // ---- hook into the app's own language switch (profile selector, chat box selector, gate) ----
  const origSetLang = window.setLang;
  window.setLang = function (l) {
    origSetLang(l);                 // the app re-renders with state.lang = l (part-98 wraps this too)
    try { saveState(); } catch (e) {}
    applyLang(l);
  };
  // part-98 wraps window.setLang after us; make sure it still ends up calling applyLang
  window.__sprApplyLang = applyLang;

  // ---- the language screen ----
  function gate() {
    let g = document.getElementById('langGate');
    if (g) { g.style.display = 'flex'; const f = g.querySelector('input'); f && f.focus(); return; }
    g = document.createElement('div'); g.id = 'langGate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-label', 'Choose your language');
    g.innerHTML = `<div class="lg-card">
      <div class="lg-ic">🌐</div>
      <h2>Choose your language</h2>
      <p>भाषा चुनें · భాషను ఎంచుకోండి · மொழியைத் தேர்ந்தெடுக்கவும் · Elige tu idioma · اختر لغتك</p>
      <input id="lgFilter" type="search" placeholder="Search… / खोजें…" autocomplete="off" aria-label="Search language">
      <div class="lg-grid" id="lgGrid"></div>
      <p class="lg-note">You can change it any time with the 🌐 button.</p></div>`;
    document.body.appendChild(g);
    const grid = g.querySelector('#lgGrid'), filter = g.querySelector('#lgFilter');
    function draw() {
      const q = filter.value.trim().toLowerCase();
      grid.innerHTML = (window.LANGS || [['en', 'English']]).filter((l) => !q || l[1].toLowerCase().includes(q) || l[0].toLowerCase().includes(q))
        .map((l) => `<button type="button" data-code="${l[0]}" class="${state.lang === l[0] ? 'sel' : ''}">${l[1]}</button>`).join('');
    }
    filter.addEventListener('input', draw);
    filter.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = grid.querySelector('button'); b && b.click(); } });
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      ls.set(CHOSEN, '1');
      window.setLang(b.dataset.code);
      g.style.display = 'none';
    });
    g.__draw = draw; draw(); filter.focus();
  }
  window.openLangGate = function () { gate(); const g = document.getElementById('langGate'); g.__draw && g.__draw(); g.querySelector('#lgFilter').value = ''; g.__draw(); };

  // 🌐 button, always visible on the dashboard
  const btn = document.createElement('button');
  btn.id = 'langFab'; btn.type = 'button'; btn.title = 'Language'; btn.setAttribute('aria-label', 'Change language'); btn.setAttribute('data-no-translate', '');
  btn.textContent = '🌐'; btn.onclick = () => window.openLangGate();
  document.body.appendChild(btn);

  // ---- open the gate once the intro is over and the PIN (if any) has been entered ----
  let asked = false;
  const waiter = setInterval(() => {
    const intro = document.getElementById('introOverlay');
    const pin = document.getElementById('pinLock');
    const introDone = !intro || intro.classList.contains('intro-hidden') || intro.classList.contains('intro-removed');
    const pinOpen = pin && pin.style.display === 'flex';
    if (!introDone || pinOpen) return;
    clearInterval(waiter);
    if (!asked && ls.get(CHOSEN) !== '1') { asked = true; gate(); }
  }, 250);

  // alert()/confirm() pop-ups and the page title use the translated text too (when already known)
  const tx = (m) => { const o = lang === 'en' ? null : lookup(String(m)); schedule(); return o === null ? m : o; };
  const _alert = window.alert.bind(window), _confirm = window.confirm.bind(window);
  window.alert = (m) => _alert(tx(m));
  window.confirm = (m) => _confirm(tx(m));
  const _title = document.title;
  setInterval(() => { if (lang === 'en') { document.title = _title; return; } const o = lookup(_title); if (o) document.title = o; }, 1000);

  applyLang(state.lang);
})();
