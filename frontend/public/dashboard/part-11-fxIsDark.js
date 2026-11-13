function fxIsDark(id){ const t=FX_THEMES.find(x=>x.id===id); return !!(t&&t.dark); }
const _applyThemeBase = applyTheme;
applyTheme = function(){ _applyThemeBase(); const r=document.documentElement; if(fxIsDark(state.theme)) r.setAttribute('data-fxdark',''); else r.removeAttribute('data-fxdark');
  /* html element also carries the gradient so overscroll/side areas match */
  const t=FX_THEMES.find(x=>x.id===state.theme); document.documentElement.style.backgroundImage = t? t.grad : ''; document.documentElement.style.backgroundColor = t? t.c[0] : ''; };
function fxTheme(id,ev){
  const t=FX_THEMES.find(x=>x.id===id); if(!t){ setTheme(id); return; }
  const x=(ev&&ev.clientX!=null)?ev.clientX:innerWidth/2, y=(ev&&ev.clientY!=null)?ev.clientY:innerHeight/2;
  const o=document.createElement('div');
  o.style.cssText=`position:fixed;inset:0;z-index:99999;pointer-events:none;background:${t.grad};clip-path:circle(0px at ${x}px ${y}px);transition:clip-path .75s cubic-bezier(.2,.8,.2,1),opacity .5s ease .75s`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ o.style.clipPath=`circle(${Math.hypot(innerWidth,innerHeight)}px at ${x}px ${y}px)`; }));
  setTimeout(()=>{ setTheme(id); o.style.opacity='0'; },700);
  setTimeout(()=>o.remove(),1500);
}
function fxThemeGrid(){
  return FX_THEMES.map(t=>`<div class="chip ${state.theme===t.id?'active':''}" onclick="fxTheme('${t.id}',event)" style="display:inline-flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:50%;background:${t.grad};border:1px solid rgba(128,128,128,.5);display:inline-block"></span>${t.ic} ${t.name}</div>`).join('');
}

function setLang(l){ state.lang=l; render(); }
const todayKey=()=>new Date().toISOString().slice(0,10);
function setMood(i){ state.mood[todayKey()]=i; render(); }
function setCareTab(t){ state.careTab=t; render(); }
function openCare(t){ state.careTab=t||'myths'; state.page='care'; render(); }
function enableAlerts(){ if(!('Notification' in window)){ alert('Notifications are not supported in this browser.'); return; } Notification.requestPermission().then(r=>{ state.notifyOn=(r==='granted'); render(); checkNotify(); }); }
function checkNotify(){ try{ if(!state.notifyOn||!('Notification' in window)||Notification.permission!=='granted') return; const n=daysUntilNextPeriod(); if(n===null||n>2||n<0) return; if(localStorage.getItem('spr_notified')===todayKey()) return; localStorage.setItem('spr_notified',todayKey()); new Notification('Smart Period Relief',{body:reminderText(n)}); }catch(e){} }
function reminderText(n){ if(n>1) return L3(`Period expected in ${n} days`,`${n} రోజుల్లో పీరియడ్ వస్తుంది`,`पीरियड ${n} दिन में आने वाला है`); if(n===1) return L3('Period expected tomorrow','రేపు పీరియడ్ వస్తుంది','कल पीरियड आने वाला है'); if(n===0) return L3('Period expected today','ఈరోజు పీరియడ్ వస్తుంది','आज पीरियड आने वाला है'); return L3(`Period is ${-n} day(s) late`,`పీరియడ్ ${-n} రోజులు ఆలస్యం`,`पीरियड ${-n} दिन देर से है`); }
function homeExtras(){
  const n=daysUntilNextPeriod(), q=QUOTES[Math.floor(Date.now()/864e5)%7], moods=['😄','🙂','😐','😣','😢'], cur=state.mood[todayKey()];
  const rem=n===null?`<p style="margin:0;font-size:13px">${L3('Log your last period in Track to get reminders.','రిమైండర్ల కోసం Track లో చివరి పీరియడ్ నమోదు చేయండి.','रिमाइंडर के लिए Track में पिछला पीरियड दर्ज करें।')}</p>`:`<p style="margin:0;font-size:15px;font-weight:700">🩸 ${reminderText(n)}</p>`;
  const last7=Array.from({length:7},(_,i)=>{const d=new Date(Date.now()-(6-i)*864e5).toISOString().slice(0,10); return `<span style="font-size:18px">${state.mood[d]!==undefined?moods[state.mood[d]]:'·'}</span>`;}).join('');
  return `<div class="qcard"><div style="font-size:11px;letter-spacing:.14em;font-weight:800;opacity:.9">${L3('TODAY\'S MOTIVATION','ఈరోజు ప్రేరణ','आज की प्रेरणा')}</div><p style="font-family:Georgia,serif;font-size:18px;line-height:1.35;margin:8px 0 0">“${L3(...q)}”</p></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">${L3('Period reminder','పీరియడ్ రిమైండర్','पीरियड रिमाइंडर')}</p>${rem}
    ${'Notification' in window&&!state.notifyOn?`<button class="btn btn-alt" style="margin-top:10px" onclick="enableAlerts()">🔔 ${L3('Turn on phone alerts','ఫోన్ అలర్ట్‌లు ఆన్ చేయండి','फ़ोन अलर्ट चालू करें')}</button>`:state.notifyOn?`<p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">🔔 ${L3('Alerts on — you will be told 2 days before.','అలర్ట్‌లు ఆన్ — 2 రోజుల ముందు తెలియజేస్తాము.','अलर्ट चालू — 2 दिन पहले बताया जाएगा।')}</p>`:''}</div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">${L3('How are you feeling today?','ఈరోజు మీకు ఎలా అనిపిస్తోంది?','आज आप कैसा महसूस कर रही हैं?')}</p>
    <div class="mood-row">${moods.map((m,i)=>`<button class="${cur===i?'on':''}" onclick="setMood(${i})">${m}</button>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--inksoft)"><span>${L3('Last 7 days','గత 7 రోజులు','पिछले 7 दिन')}</span><span style="display:flex;gap:8px">${last7}</span></div></div>
  <div class="chip-row" style="margin-bottom:12px"><div class="chip" onclick="openCare('myths')">📚 ${L3('Myths vs Facts','అపోహలు vs నిజాలు','मिथक बनाम तथ्य')}</div><div class="chip" onclick="openCare('help')">🚑 ${L3('Emergency & Doctor','అత్యవసరం & డాక్టర్','आपातकाल और डॉक्टर')}</div></div>`;
}
function routineCard(){
  const r=state.routine, tk=todayKey(); if(r.d!==tk){ r.d=tk; r.done=[]; }
  const steps=[['🥛','Sip 1 glass of warm water','1 min'],['🔥','Heat therapy — low heat on lower abdomen','10 min'],['〰','Gentle vibration — low intensity','5 min'],['🧘','Child\'s pose & knee-to-chest stretch','3 min'],['🌬️','Slow breathing: in 4, hold 4, out 6','2 min'],['💧','Rest, then drink water','5 min']];
  const pct=Math.round(r.done.length/steps.length*100);
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🌸 Daily pain-relief routine · ${pct}%</p>
   <div style="height:6px;background:var(--surfacealt);border-radius:4px;margin-bottom:10px"><div style="height:6px;width:${pct}%;background:var(--berry-500);border-radius:4px;transition:width .3s"></div></div>
   ${steps.map((x,i)=>`<div class="settings-row" style="cursor:pointer" onclick="toggleRoutine(${i})"><span>${r.done.includes(i)?'✅':'⬜'} ${x[0]} ${x[1]}</span><span style="font-size:11px">${x[2]}</span></div>`).join('')}
   <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">Keep heat below 40°C and stop if skin turns red or feels painful.</p></div>`;
}
function toggleRoutine(i){ const d=state.routine.done, k=d.indexOf(i); k>=0?d.splice(k,1):d.push(i); render(); }
const MYTHS=[['You should not exercise or bathe on periods.','Light exercise, yoga and warm baths can actually ease cramps.'],['Painful periods are always normal.','Mild cramps are common, but pain that stops daily life needs a doctor.'],['PCOD/PCOS means you can never get pregnant.','Many women with PCOS conceive, sometimes with medical support.'],['Skipping meals helps lose weight with PCOS.','Regular balanced meals control insulin better and protect hormones.'],['Only overweight girls get PCOS.','Lean women can have PCOS too.'],['Period blood is dirty.','It is normal tissue and blood — nothing impure.'],['Periods must come exactly every 28 days.','21–35 days is a normal cycle range for adults.'],['Pads and tampons cause infections by themselves.','Changing every 4–6 hours and good hygiene keeps you safe.']];
const HELP_SIGNS=['Soaking a pad every 1–2 hours','Period lasting more than 7 days','Severe pain not relieved by rest or heat','Fainting, dizziness or very pale skin','Fever with pelvic pain or foul discharge','No period for 3+ months (and not pregnant)','Bleeding between periods or after intercourse','Sudden, sharp one-sided lower belly pain'];
function carePage(){
  const tabs=[['myths','Myths vs Facts'],['help','Emergency & Doctor']];
  const body=state.careTab==='help'?`<div class="alert danger"><div><b>Emergency? Call now</b>If you have severe bleeding, fainting or sudden severe pain, call 112 or 108 right away.</div></div>
   <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Helplines (India)</p>
    ${[['Emergency','112'],['Ambulance','108'],['Women Helpline','181'],['Tele-MANAS (mental health)','14416']].map(h=>`<div class="settings-row"><span>${h[0]}</span><a href="tel:${h[1]}" style="font-weight:800;color:var(--berry-500);text-decoration:none">📞 ${h[1]}</a></div>`).join('')}</div>
   <div class="slider-card"><p class="section-title">See a doctor if you have…</p>${HELP_SIGNS.map(x=>`<p style="font-size:13px;margin:0 0 8px">⚠️ ${x}</p>`).join('')}<button class="btn btn-alt" style="width:100%" onclick="setPage('doctors')">Find a doctor near me</button></div>`
   :MYTHS.map(m=>`<div class="slider-card" style="margin-bottom:10px"><p style="font-size:13px;margin:0 0 6px;color:#C2185B"><b>❌ Myth:</b> ${m[0]}</p><p style="font-size:13px;margin:0"><b>✅ Fact:</b> ${m[1]}</p></div>`).join('');
  return `<div class="page active"><header class="top"><div><h1>Learn &amp; Safety</h1><p>Facts, help and when to see a doctor</p></div></header>
  <div class="subtabs">${tabs.map(([id,l])=>`<button class="${state.careTab===id?'active':''}" onclick="setCareTab('${id}')">${l}</button>`).join('')}</div>${body}
  <button class="btn btn-alt" style="width:100%;margin-top:10px" onclick="setPage('home')">← Back to Home</button></div>`;
}
const DIET_PERIOD=[
 {ic:'🩸',t:'Iron-rich (replace lost blood)',items:['Spinach','Methi','Beetroot','Pomegranate','Ragi','Sesame (til)','Pumpkin seeds','Rajma','Chana','Eggs','Dates (2 small)'],why:'Periods cause iron loss; low iron means tiredness and dizziness.'},
 {ic:'🍋',t:'Vitamin C (helps iron absorb)',items:['Lemon','Amla','Orange','Guava','Tomato','Capsicum'],why:'Add lemon to dal and greens — it boosts iron absorption.'},
 {ic:'🥜',t:'Magnesium & B6 (ease cramps)',items:['Banana','Almonds','Walnuts','Pumpkin seeds','Oats','Sweet potato'],why:'Magnesium relaxes muscles and B6 supports mood.'},
 {ic:'🐟',t:'Omega-3 & calcium',items:['Flax seeds','Chia seeds','Walnuts','Fish','Curd','Ragi','Paneer'],why:'Omega-3 reduces inflammation; calcium supports bones and muscles.'},
 {ic:'🍵',t:'Comforting drinks',items:['Ginger tea','Warm water','Jeera water','Ajwain water','Buttermilk','Coconut water'],why:'Warm drinks soothe cramps and bloating.'},
 {ic:'🚫',t:'Go easy on',items:['Very salty snacks','Too much tea/coffee','Sugary drinks','Fried food','Tea right after meals'],why:'Salt and caffeine can worsen bloating and cramps; tea after meals blocks iron absorption.'}];
function dietPeriodSub(){ return dietFoodSub(DIET_PERIOD); }
function settingsCard(){
  const c=(k,v,l,fn)=>`<div class="chip ${state[k]===v?'active':''}" onclick="${fn}('${v}')">${l}</div>`;
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">Theme</p><div class="chip-row" style="margin-bottom:12px">${c('theme','auto','Auto','setTheme')}${c('theme','light','Light','setTheme')}${c('theme','dark','Dark','setTheme')}${c('theme','pink','💗 Pink','setTheme')}${c('theme','doctor','🩺 Doctor','setTheme')}${c('theme','girls','🎀 Girls','setTheme')}${c('theme','lavender','💜 Lavender','setTheme')}${c('theme','mint','🌿 Mint','setTheme')}${c('theme','sunset','🌅 Sunset','setTheme')}${c('theme','rosegold','🌸 Rose gold','setTheme')}</div>
  <p class="section-title">✨ Animated themes</p><p style="font-size:11px;color:var(--inksoft);margin:0 0 8px">Tap one: the whole app changes colour, including the sides, with a moving background.</p><div class="chip-row" style="margin-bottom:12px">${fxThemeGrid()}</div>
  <p class="section-title">Language</p><p style="font-size:11px;color:var(--inksoft);margin:0 0 8px">The AI chat understands and answers in your language, by typing or by voice.</p>${window.langSelectHtml?window.langSelectHtml():''}</div>`;
}


// ===== Private PIN lock =====
function pinHash(pin,salt){ let a=0xdeadbeef,b=0x41c6ce57; const t=salt+':'+pin; for(let i=0;i<t.length;i++){const c=t.charCodeAt(i); a=Math.imul(a^c,2654435761); b=Math.imul(b^c,1597334677);} a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909); b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909); return (4294967296*(2097151&b)+(a>>>0)).toString(36); }
let pinMode=null, pinBuf='', pinTmp='', pinCb=null, pinFails=+(localStorage.getItem('spr_pin_fails')||0), pinUntil=+(localStorage.getItem('spr_pin_until')||0), pinMsg='', pinIntroDone=false;
function pinSave(){ try{ localStorage.setItem('spr_pin_fails',pinFails); localStorage.setItem('spr_pin_until',pinUntil); }catch(e){} }
function pinAfterIntro(){ if(pinIntroDone) return; pinIntroDone=true; if(state.pinH&&!pinMode){ pinShow('unlock'); if(Date.now()<pinUntil) pinTick(); } }
function pinTick(){ const left=Math.ceil((pinUntil-Date.now())/1000); if(left>0){ pinMsg='Too many wrong tries. Try again in '+left+' s'; pinDraw(); setTimeout(pinTick,1000); } else { pinMsg=''; pinDraw(); } }
function pinShow(mode,cb){ pinMode=mode; pinBuf=''; pinTmp=''; pinCb=cb||null; pinMsg=''; pinDraw(); }
function pinDraw(){
  let el=document.getElementById('pinLock');
  if(!el){
    el=document.createElement('div'); el.id='pinLock';
    el.innerHTML='<div id="pinBody"></div><input id="pinInput" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type your 4-digit PIN with the keyboard">';
    document.body.appendChild(el);
    const inp=el.querySelector('#pinInput');
    // keyboard entry: whatever is typed becomes the PIN buffer (digits only, max 4)
    inp.addEventListener('input',()=>{
      if(!pinMode) return;
      if(Date.now()<pinUntil){ inp.value=''; pinBuf=''; pinDraw(); return; }
      const before=pinBuf.length;
      pinBuf=inp.value.replace(/\D/g,'').slice(0,4); inp.value=pinBuf; pinDraw();
      if(pinBuf.length===4 && before<4) setTimeout(pinDone,120);
    });
    inp.addEventListener('keydown',e=>{
      if(e.key==='Escape' && pinMode && pinMode!=='unlock') pinCancel();
      if(e.key==='Enter' && pinBuf.length===4){ e.preventDefault(); }
    });
    // clicking anywhere on the lock screen just brings the keyboard back (no mouse keypad)
    el.addEventListener('click',e=>{ if(!e.target.closest('button')) inp.focus(); });
  }
  if(!pinMode){ el.style.display='none'; el.querySelector('#pinBody').innerHTML=''; return; }
  const T={unlock:['🔒','Enter your PIN','Your data is private'],verify:['🔑','Enter current PIN','Confirm it is you'],set1:['🌸','Create a 4-digit PIN','Only you should know it'],set2:['🌸','Confirm your PIN','Type the same PIN again']}[pinMode];
  el.style.display='flex';
  el.querySelector('#pinBody').innerHTML=`<div style="font-size:40px">${T[0]}</div><h2>${T[1]}</h2><div style="font-size:13px;color:#8A2C63">${T[2]}</div>
  <div class="pin-dots" id="pinDots">${[0,1,2,3].map(i=>`<i class="${i<pinBuf.length?'f':''}"></i>`).join('')}</div><div class="pmsg">${pinMsg}</div>
  <div class="pin-hint">⌨️ Type your 4 digits on the keyboard${pinMode==='unlock'?'':' · Esc to cancel'}</div>
  ${pinMode==='unlock'?`<button class="plink" onclick="pinForgot()">Forgot PIN?</button>`:`<button class="plink" onclick="pinCancel()">Cancel</button>`}`;
  const inp=document.getElementById('pinInput');
  if(inp){ if(inp.value!==pinBuf) inp.value=pinBuf; inp.disabled=Date.now()<pinUntil; if(document.activeElement!==inp && !inp.disabled) inp.focus(); }
}
function pinBack(){ pinBuf=pinBuf.slice(0,-1); pinDraw(); }  // (Backspace is handled by the keyboard input itself)
function pinCancel(){ pinMode=null; pinDraw(); }
function pinForgot(){ if(confirm('Forgot PIN? To protect your privacy the only way in is to ERASE all data stored in this app and start fresh. Erase everything?')){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} location.reload(); } }
function pinKey(d){
  if(Date.now()<pinUntil) return;
  if(pinBuf.length>=4) return; pinBuf+=d; pinDraw(); if(pinBuf.length<4) return;
  setTimeout(pinDone,120);
}
function pinWrong(msg){ pinBuf=''; pinMsg=msg; pinDraw(); const d=document.getElementById('pinDots'); if(d) d.classList.add('shake'); }
function pinDone(){
  if(pinMode==='unlock'||pinMode==='verify'){
    if(pinHash(pinBuf,state.pinS)===state.pinH){ const cb=pinCb; pinMode=null; pinFails=0; pinUntil=0; pinSave(); pinDraw(); if(cb) cb(); }
    else { pinFails++; if(pinFails>=5){ pinUntil=Date.now()+30000; pinFails=0; pinSave(); pinBuf=''; pinTick(); } else { pinSave(); pinWrong('Wrong PIN. '+(5-pinFails)+' tr'+(5-pinFails===1?'y':'ies')+' left.'); } }
  } else if(pinMode==='set1'){ pinTmp=pinBuf; pinBuf=''; pinMode='set2'; pinDraw(); }
  else if(pinMode==='set2'){
    if(pinBuf===pinTmp){ state.pinS=Math.random().toString(36).slice(2); state.pinH=pinHash(pinBuf,state.pinS); pinMode=null; pinDraw(); render(); }
    else { pinMode='set1'; pinTmp=''; pinWrong('PINs did not match. Start again.'); }
  }
}
function pinCard(){
  const on=!!state.pinH;
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🔒 Private lock</p>
  ${on?`<div class="settings-row"><span>PIN lock</span><span class="badge">ON</span></div>
  <div class="settings-row" style="cursor:pointer" onclick="state.pinLeave=!state.pinLeave;render()"><span>Lock when I leave the app</span><span>${state.pinLeave?'✅ On':'⬜ Off'}</span></div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-alt" onclick="pinShow('unlock')">Lock now</button><button class="btn btn-alt" onclick="pinShow('verify',()=>pinShow('set1'))">Change PIN</button><button class="btn btn-alt" onclick="pinShow('verify',()=>{state.pinH='';state.pinS='';render();})">Turn off</button></div>`
  :`<p style="font-size:12px;color:var(--inksoft);line-height:1.5;margin:0 0 10px">Share your phone with family? Set a 4-digit PIN so nobody else can open your period, pain and mood records.</p><button class="btn btn-alt" style="width:100%" onclick="pinShow('set1')">Set a PIN</button>`}
  <p style="font-size:11px;color:var(--inksoft);line-height:1.5;margin:10px 0 0">The lock keeps others out of the app. If you forget your PIN, the only way back in is to erase the app's data.</p></div>`;
}
// Disabled by request: do NOT re-lock the PIN (or show anything) when the window/tab regains focus.
// document.addEventListener('visibilitychange',()=>{ if(document.hidden&&state.pinH&&state.pinLeave&&!pinMode) pinShow('unlock'); });

/* ===== Health Tools: medicines, Jan Aushadhi, SOS, doctor report, PCOS check, hygiene ===== */
function esc2(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function openTools(t){ state.toolTab=t||'meds'; state.page=(state.toolTab==='meds')?'meds':'tools'; render(); }
function setToolTab(t){ state.toolTab=t; render(); }
function ago(ms){ const m=Math.round((Date.now()-ms)/60000); return m<1?'just now':m<60?m+' min ago':(m/60).toFixed(m<600?1:0).replace('.0','')+' h ago'; }
