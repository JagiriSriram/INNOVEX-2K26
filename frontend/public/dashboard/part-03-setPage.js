function setPage(p){ state.page=p; if(p!=='profile') state.confirmDelete=false; render(); }

function addWater(ml){
  state.demoWater = Math.min(state.demoWater+ml, 20000);
  state.hydrationLog.unshift({ml, t:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  render();
}
function resetWater(){ state.demoWater=0; state.hydrationLog=[]; render(); }

const heaterDisabled = () => state.emergency || (curTemp()!==null && curTemp() >= state.threshold);

function toggleHeater(){
  if(!state.heater && heaterDisabled()) return;
  state.heater = !state.heater; render();
}
function toggleVibration(){
  if(!state.vibration && state.emergency) return;
  state.vibration = !state.vibration; render();
}
function startSession(min){
  if(state.emergency) return;
  state.sessionMinutes = min; state.sessionActive = true; state.sessionSecs = min*60; state.sessionTotalSecs = min*60;
  const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  state.painLevel = 10;
  if(state.pain[0]) state.pain[0] = {level:10, t}; else state.pain.unshift({level:10, t});
  render();
}
function stopSession(){
  state.sessionActive=false; state.sessionSecs=0; state.heater=false; state.vibration=false; state.painDecayActive=true; render();
}
function emergencyStop(){
  state.emergency=true; state.heater=false; state.vibration=false;
  state.sessionActive=false; state.sessionSecs=0; render();
}
function clearEmergency(){ state.emergency=false; render(); }

function logPain(){
  state.pain.unshift({level:state.painLevel, t:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  state.painDecayActive = true;
  render();
}

function padBannerHTML(){
  const dun = daysUntilNextPeriod();
  if(dun===null || dun>1 || dun<0) return '';
  if(!state.padOrdered){
    return `<div class="banner-order">
      <b>Pads running low</b>
      <p>Your next period is predicted for ${fmtDate(nextPeriodDate())}. Reorder pads now so they arrive in time.</p>
      <a class="btn btn-berry link-btn" href="https://blinkit.com/s/?q=sanitary%20pads" target="_blank" rel="noopener" onclick="confirmPadOrder()">Confirm order on Blinkit</a>
    </div>`;
  }
  return `<div class="banner-order"><b>Pads ordered ✓</b><p>Confirmed on Blinkit — arriving before your predicted period on ${fmtDate(nextPeriodDate())}.</p></div>`;
}

function card(icon,tone,label,val,unit,sub,onclick){
  return `<div class="card" onclick="${onclick||''}">
    <div class="icon tone-${tone}">${icon}</div>
    <div class="label">${label}</div>
    <div class="val">${val}${unit?`<span>${unit}</span>`:''}</div>
    ${sub?`<div class="sub">${sub}</div>`:''}
  </div>`;
}

function stepsCard(){
  return `<div class="card">
    <div class="icon tone-teal">${TONE_ICON.steps}</div>
    <div class="label">Steps</div>
    <div class="val">${liveInfo('steps').val}</div>
    <div class="sub">${liveInfo('steps').sub}</div>
    ${liveOn()?'':`<div class="mini-row">
      <button class="mini-btn" onclick="event.stopPropagation();resetSteps()">Reset to 0</button>
    </div>`}
  </div>`;
}

function painCard(painToday){
  return `<div class="card">
    <div class="icon tone-berry">${TONE_ICON.pain}</div>
    <div class="label">Pain level</div>
    <div class="val">${painToday?painToday.level:'--'}<span>/ 10</span></div>
    <div class="mini-row">
      <button class="mini-btn" onclick="event.stopPropagation();adjustPain(-1)">-1</button>
      <button class="mini-btn" onclick="event.stopPropagation();adjustPain(1)">+1</button>
    </div>
  </div>`;
}

/* ===== Connect ESP button: 5-second connect, then live readings ===== */
let espFlow={phase:'idle',t0:0,tm:null};
/* DEMO CONNECT: no real ESP32 needed. Tap Connect, wait ESP_WAIT seconds, then labelled SIMULATED sample values appear. */
const DEMO_CONNECT=true, ESP_WAIT=15;
let demoTick=null;
function connectEsp(){
  if(espFlow.tm) clearInterval(espFlow.tm);
  if(demoTick){ clearInterval(demoTick); demoTick=null; }
  state.hrMode='live';
  if(DEMO_CONNECT){ stopHrPolling(); hrLive.conn='connecting'; hrLive.v=EMPTY_LIVE(); hrLive.sig=''; }
  else startHrPolling();
  espFlow={phase:'wait',t0:Date.now(),tm:null}; state.page='home'; render();
  espFlow.tm=setInterval(()=>{
    if(Date.now()-espFlow.t0>=ESP_WAIT*1000){
      clearInterval(espFlow.tm); espFlow.tm=null; espFlow.phase='done';
      if(DEMO_CONNECT){ hrLive.conn='connected'; demoTick=setInterval(()=>{ if(!liveOn()||!DEMO_CONNECT){ clearInterval(demoTick); demoTick=null; return; } if(['home','profile','track'].includes(state.page)) autoRender(); },2000); }
    }
    if(state.page==='home') autoRender();
  },500);
}
function espHide(){ espFlow.phase='idle'; render(); }
function espTopBtn(){
  const wait=espFlow.phase==='wait', left=Math.max(1,ESP_WAIT-Math.floor((Date.now()-espFlow.t0)/1000));
  const on=liveOn()&&hrLive.conn==='connected';
  return `<button class="btn ${on?'btn-teal':'btn-berry'}" style="width:100%;margin-bottom:12px;padding:14px;font-size:15px" ${wait?'disabled':''} onclick="connectEsp()">${wait?`⏳ Connecting… ${left}s`:on?'🟢 ESP connected — tap to refresh readings':'📡 Connect ESP'}</button>`;
}
const ESP_SSID='Smart_Relief_Belt', ESP_PASS='12345678';
function copyTxt(t,btn){ const done=()=>{ if(btn){ const o=btn.textContent; btn.textContent='✓ Copied'; setTimeout(()=>btn.textContent=o,1200); } };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done,()=>alert(t)); else { const i=document.createElement('textarea'); i.value=t; document.body.appendChild(i); i.select(); try{document.execCommand('copy');done();}catch(e){alert(t);} i.remove(); } }
function wifiHelpHTML(){
  return `<div style="margin-top:8px;padding:10px;border-radius:12px;background:var(--surfacealt)">
    <p style="font-size:12px;font-weight:700;margin:0 0 6px">Join the ESP32 Wi-Fi</p>
    <div class="settings-row"><span>Network</span><span><b>${ESP_SSID}</b> <button class="chip" style="border:0" onclick="copyTxt('${ESP_SSID}',this)">📋 Copy</button></span></div>
    <div class="settings-row"><span>Password</span><span><b>${ESP_PASS}</b> <button class="chip" style="border:0" onclick="copyTxt('${ESP_PASS}',this)">📋 Copy</button></span></div>
    <div class="chip-row" style="margin-top:8px"><a class="chip" href="intent:#Intent;action=android.settings.WIFI_SETTINGS;end" style="text-decoration:none">📶 Open Wi-Fi settings (Android)</a><div class="chip" onclick="connectEsp()">🔄 I've joined — connect now</div></div>
    <p style="font-size:11px;color:var(--inksoft);margin:6px 0 0;line-height:1.5">A web page cannot list nearby Wi-Fi networks or join one by itself — your phone must do that. On iPhone: Settings → Wi-Fi.</p></div>`;
}
function espPanel(){
  if(espFlow.phase==='idle') return '';
  if(DEMO_CONNECT&&espFlow.phase==='done'&&hrLive.conn==='connected') return '';
  if(espFlow.phase==='wait'){ const p=Math.min(100,(Date.now()-espFlow.t0)/100); return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">Connecting to Smart_Relief_Belt…</p><div style="height:8px;border-radius:8px;background:var(--surfacealt);overflow:hidden"><div style="height:100%;width:${p}%;background:var(--berry-500)"></div></div><p style="font-size:13px;font-weight:700;margin:8px 0 0;color:${hrLive.conn==='connected'?'#14653A':'var(--inksoft)'}">${hrLive.conn==='connected'?'✅ ESP32 found — reading sensors…':'🔎 Looking for the ESP32…'}</p><p style="font-size:12px;color:var(--inksoft);margin:4px 0 0">Keep your finger on the heart sensor. Readings appear after 10 seconds.</p></div>`; }
  if(hrLive.conn!=='connected') return `<div class="alert danger"><div><b>🔴 Could not reach the ESP32</b>Unable to communicate with ESP32. Join the Wi-Fi <b>Smart_Relief_Belt</b>, then tap Connect ESP again.<br><small><b>Reason:</b> ${espLastErr||'No reply yet.'}<br>Test: <a href="http://192.168.4.1/api/status" target="_blank" rel="noopener">open 192.168.4.1/api/status</a> (it should show JSON).</small>${wifiHelpHTML()}<button class="btn btn-alt" style="margin-top:8px;padding:6px 12px" onclick="espHide()">Close</button></div></div>`;
  const row=(ic,l,k,u)=>{const i=liveInfo(k); return `<div class="settings-row"><span>${ic} ${l}</span><span style="text-align:right"><b>${i.val}${u&&i.val!=='—'?' '+u:''}</b><br><small style="color:var(--inksoft)">${i.sub}</small></span></div>`;};
  const v=hrLive.v, showRows=state.simShow!==false||v.hr!==null||v.spo2!==null||v.temp!==null||v.steps!==null||!!v.bp;
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🟢 ESP32 CONNECTED${showRows?' — live readings':''}</p>
    ${showRows?row('❤️','Heart rate','hr','BPM')+row('🫁','SpO2','spo2','%')+row('🩺','Blood pressure','bp','mmHg')+row('🌡️','Temperature','temp','°C')+row('👣','Steps','steps',''):'<p style="font-size:13px;color:var(--inksoft);margin:0">Smart_Relief_Belt is connected.</p>'}
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">${state.simShow!==false?'Values marked SIMULATED are sample numbers because no sensors are attached; they are not measurements.':'Real values from the ESP32 only.'} Wellness prototype, not a medical device.</p>
    <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="espHide()">Hide</button></div>`;
}

