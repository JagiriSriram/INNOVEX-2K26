const BLINKIT_URL = "https://blinkit.com/dc/sweets-chocolates/chocolates/";
const BLINKIT_BTN_HTML = '<button type="button" onclick="openBlinkitChocolate()" class="blinkit-chocolate-btn">\uD83D\uDED2 Get Dark Chocolate on Blinkit</button>';
// Opens Blinkit in a NEW tab. Only ever called from a click on the button.
// (Note: window.open(..., "noopener") always returns null even when it succeeds, so the
// popup-blocked check is done on a plain window.open and opener is cleared afterwards.)
function openBlinkitChocolate(){
  let newTab = null;
  try{ newTab = window.open(BLINKIT_URL, "_blank"); }catch(e){}
  if(newTab){ try{ newTab.opener = null; }catch(e){} }
  else { window.location.href = BLINKIT_URL; }   // fallback only if the browser blocked the popup
}

// "Period tracked" prompt: shown only right after a NEW period is recorded. It never
// navigates anywhere by itself - the user must tap the Blinkit button.
const chocoPrompted = new Set();   // session only: one prompt per newly-marked date
function maybePromptPeriodComfort(marked){
  try{
    const key = (typeof marked==='string') ? marked : dateKey(marked);
    const diff = Math.round((Date.parse(dateKey(todayDate())) - Date.parse(key))/86400000);
    if(!(diff>=0 && diff<=7)) return;          // old/back-dated or future entries: no prompt
    if(chocoPrompted.has(key)) return;
    chocoPrompted.add(key);
    showPeriodComfortPrompt();
  }catch(e){ console.warn('period comfort prompt skipped', e); }
}
let pcTimer = null;
function showPeriodComfortPrompt(){
  let el = document.getElementById('periodComfortPrompt');
  if(!el){
    el = document.createElement('div');
    el.id = 'periodComfortPrompt'; el.setAttribute('role','status'); el.setAttribute('aria-live','polite');
    el.innerHTML = `
      <div class="pc-ok"><span>\u2705</span><span>Period tracked successfully.</span><button type="button" class="pc-x" aria-label="Dismiss" onclick="hidePeriodComfortPrompt()">\u2715</button></div>
      <p class="pc-t">Period Comfort</p>
      <p class="pc-d">Dark chocolate may be enjoyed as an optional dietary comfort choice during your period. Choose a moderate portion and maintain good hydration. This is general wellness information, not medical treatment.</p>
      ${BLINKIT_BTN_HTML}
      <button type="button" class="pc-more" onclick="hidePeriodComfortPrompt();chocolateBlinkOpen()">Dark chocolate info</button>`;
    document.body.appendChild(el);
  }
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(pcTimer); pcTimer = setTimeout(hidePeriodComfortPrompt, 25000);
}
function hidePeriodComfortPrompt(){
  const el = document.getElementById('periodComfortPrompt');
  if(el) el.classList.remove('show');
  clearTimeout(pcTimer);
}

let chocoScrollY = 0;
let chocoBusy = false;
function chocolateBlinkOpen(){
  if(chocoBusy) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ showChocolateScreen(); return; }
  chocoBusy = true;
  const card = document.querySelector('.choco-entry');
  if(card){ card.classList.remove('blinking'); void card.offsetWidth; card.classList.add('blinking'); }
  let f = document.getElementById('chocoFlash');
  if(!f){ f = document.createElement('div'); f.id = 'chocoFlash'; document.body.appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  setTimeout(showChocolateScreen, 170);          // flash is near its peak: screen swaps underneath it
  setTimeout(()=>{ f.classList.remove('go'); if(card) card.classList.remove('blinking'); chocoBusy = false; }, 650);
}
function buildChocolateOverlay(){
  const el = document.createElement('div');
  el.id = 'chocoOverlay';
  el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','chocoTitle');
  el.innerHTML = `
    <div class="choco-bg"><i></i><i></i><i></i></div>
    <div class="choco-card">
      <div class="choco-visual">
        <span class="choco-bit"></span><span class="choco-bit"></span><span class="choco-bit"></span><span class="choco-bit"></span>
        <svg class="choco-svg" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="chocoG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6B3E2A"/><stop offset="1" stop-color="#2E170F"/></linearGradient>
            <linearGradient id="chocoTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5A41"/><stop offset="1" stop-color="#4A2818"/></linearGradient>
          </defs>
          <g transform="rotate(-8 120 100)">
            <rect x="30" y="30" width="180" height="130" rx="12" fill="url(#chocoG)"/>
            <g fill="url(#chocoTop)" stroke="#24110A" stroke-width="1.5">
              <rect x="38" y="38" width="39" height="28" rx="5"/><rect x="82" y="38" width="39" height="28" rx="5"/><rect x="126" y="38" width="39" height="28" rx="5"/><rect x="170" y="38" width="32" height="28" rx="5"/>
              <rect x="38" y="72" width="39" height="28" rx="5"/><rect x="82" y="72" width="39" height="28" rx="5"/><rect x="126" y="72" width="39" height="28" rx="5"/><rect x="170" y="72" width="32" height="28" rx="5"/>
              <rect x="38" y="106" width="39" height="28" rx="5"/><rect x="82" y="106" width="39" height="28" rx="5"/><rect x="126" y="106" width="39" height="28" rx="5"/>
            </g>
            <g fill="#fff" opacity=".16"><rect x="42" y="41" width="20" height="4" rx="2"/><rect x="86" y="41" width="20" height="4" rx="2"/><rect x="130" y="41" width="20" height="4" rx="2"/><rect x="42" y="75" width="20" height="4" rx="2"/></g>
            <path d="M170 106 h32 v22 l-10 8 h-22 z" fill="url(#chocoTop)" stroke="#24110A" stroke-width="1.5" transform="translate(6 12) rotate(9 186 120)"/>
            <path d="M30 142 h180 v6 a12 12 0 0 1 -12 12 h-156 a12 12 0 0 1 -12 -12 z" fill="#B8955A" opacity=".9"/>
            <text x="120" y="153" text-anchor="middle" font-family="Manrope,sans-serif" font-size="9" font-weight="800" letter-spacing="2" fill="#3B1F14">DARK  70%+</text>
          </g>
        </svg>
      </div>
      <div class="choco-body">
        <span class="phase-tag tone-garnet choco-crumb">TRACK \u00B7 PERIOD COMFORT</span>
        <h2 id="chocoTitle">\uD83C\uDF6B Dark Chocolate</h2>
        <p>During your period, you may enjoy a small portion of dark chocolate as part of a balanced diet. Stay hydrated and listen to your body.</p>
        <div class="choco-tips">
          <div class="choco-tip"><span class="ic">🍫</span><div><b>WHY IT'S A NICE OPTION</b>Dark chocolate contains minerals such as magnesium and can fit into a balanced diet.</div></div>
          <div class="choco-tip"><span class="ic">🥄</span><div><b>SUGGESTED PORTION</b>A small, moderate portion — about 20–30 g (2–3 squares) of dark chocolate, ideally 70% cocoa or higher.</div></div>
          <div class="choco-tip"><span class="ic">💧</span><div><b>HYDRATION REMINDER</b>Sip water through the day<span id="chocoWater"></span>.</div></div>
        </div>
        <p class="choco-note">This is an optional dietary suggestion only. It does not treat or cure period pain and does not replace medical treatment. It contains some sugar and caffeine — skip it if it doesn't suit you. If your pain is severe or unusual, please see a doctor.</p>
        <div class="blinkit-wrap" style="margin-bottom:10px;">${BLINKIT_BTN_HTML}</div>
        <div class="choco-actions">
          <button type="button" class="btn btn-alt" id="chocoContinue">\u2190 Back to Period Tracker</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('#chocoContinue').addEventListener('click', ()=>closeChocolateScreen());
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && el.classList.contains('open')) closeChocolateScreen(); });
  // phone/browser Back button also just closes the screen
  window.addEventListener('popstate', ()=>{ if(el.classList.contains('open')) closeChocolateScreen(true); });
  return el;
}
function showChocolateScreen(){
  const el = document.getElementById('chocoOverlay') || buildChocolateOverlay();
  if(el.classList.contains('open')) return;
  chocoScrollY = window.scrollY || 0;
  hidePeriodComfortPrompt();
  const w = el.querySelector('#chocoWater');
  if(w) w.textContent = state.waterTarget ? ' \u2014 aim for about '+(state.waterTarget/1000).toFixed(1)+' L today' : '';
  el.classList.remove('open'); void el.offsetWidth; // restart animations
  el.scrollTop = 0;
  requestAnimationFrame(()=>{ el.classList.add('open'); });
  document.body.style.overflow = 'hidden';
  try{ history.pushState({choco:1}, '', location.href.split('#')[0] + '#dark-chocolate'); }catch(e){}
  setTimeout(()=>{ const b = el.querySelector('#chocoContinue'); if(b) b.focus({preventScroll:true}); }, 700);
}
function closeChocolateScreen(fromPop){
  const el = document.getElementById('chocoOverlay');
  if(!el || !el.classList.contains('open')) return;
  if(!fromPop && history.state && history.state.choco){ try{ history.back(); return; }catch(e){} }
  el.classList.remove('open');
  document.body.style.overflow = '';
  window.scrollTo(0, chocoScrollY);   // exact place in the tracker; no re-render
  const opener = document.querySelector('.choco-entry'); if(opener) opener.focus({preventScroll:true});
}


// ===== Diet & Food (PCOD / PCOS) =====
(function(){ const i=NAV.findIndex(n=>n.id==='diet'); const d=NAV.splice(i,1)[0]; delete d._after; NAV.splice(NAV.findIndex(n=>n.id==='exercise')+1,0,d); })();
