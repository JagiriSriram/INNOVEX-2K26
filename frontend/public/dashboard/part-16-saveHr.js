function saveHr(v){
  const bpm = v.hr;
  const now = Date.now(); if(now-hrLive.lastSave<5000) return; hrLive.lastSave = now;
  state.hrLog.unshift({bpm, temp:v.temp, steps:v.steps, src:'REAL ESP32', t:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}), ts:now});
  if(state.hrLog.length>500) state.hrLog.length = 500;
  saveState();
}
async function pollHeart(){
  if(!liveOn() || hrBusy) return;
  hrBusy = true;
  try{
    const r = await getSensors();
    if(!liveOn()) return;
    hrLive.conn = r.reachable ? 'connected' : 'disconnected';
    hrLive.v = r.v;                                   // on failure this is EMPTY_LIVE(): all live values cleared at once
    if(r.v.hr!==null) saveHr(r.v);                 // only valid readings reach history
    paintHr();
  }catch(e){ console.warn('live poll failed', e); }
  finally{ hrBusy = false; }
}
function startHrPolling(){
  stopHrPolling(); hrLive.conn = 'connecting'; hrLive.v = EMPTY_LIVE(); hrLive.sig = '';
  hrTimer = setInterval(pollHeart, 1000); pollHeart();
}
function stopHrPolling(){ if(hrTimer){ clearInterval(hrTimer); hrTimer = null; } }
function setHrMode(m){ state.hrMode = m; if(demoTick){ clearInterval(demoTick); demoTick=null; } if(m==='live') startHrPolling(); else stopHrPolling(); render(); }
function paintHr(){   // re-render only when a live value/status actually changed, and only on pages that show sensor data
  const sig = JSON.stringify([hrLive.conn, hrLive.v]); if(sig===hrLive.sig) return; hrLive.sig = sig;
  if(['home','profile','track'].includes(state.page)) autoRender();
}
function liveMsg(){ return hrLive.conn==='connecting' ? 'Connecting to ESP32…' : hrLive.conn==='disconnected' ? 'ESP32 disconnected' : hrLive.v.bad ? 'Invalid data from ESP32' : null; }
// One place that decides what every sensor card shows. {val, sub}
/* Simulated sample readings: ONLY when ESP32 is really connected, a value is missing, and the option is ON. Always labelled SIMULATED, never saved to history. */
let _sim={t:0,st:0,hr:76,spo2:98,temp:36.6,steps:2540,s:118,d:77};
function simVals(){
  const n=Date.now();
  if(n-_sim.t>2000){ _sim.t=n; const w=(v,lo,hi,st)=>Math.min(hi,Math.max(lo,v+(Math.random()-.5)*st));
    _sim.hr=w(_sim.hr,68,86,3); _sim.spo2=w(_sim.spo2,97,99.4,.8); _sim.temp=w(_sim.temp,36.4,36.9,.1); _sim.s=w(_sim.s,114,122,2); _sim.d=w(_sim.d,74,80,2);
  }
  if(!_sim.st) _sim.st=n; else if(n-_sim.st>=10000){ _sim.st=n; _sim.steps+=1+Math.floor(Math.random()*4); }   // every 10 s, +1 to +4 steps (always below 5)
  return {hr:String(Math.round(_sim.hr)),spo2:String(Math.round(_sim.spo2)),temp:_sim.temp.toFixed(1),steps:_sim.steps.toLocaleString(),battery:'80',bp:Math.round(_sim.s)+'/'+Math.round(_sim.d)};
}
function liveInfo(key){
  if(!liveOn()){
    const dv = {hr:state.hr, spo2:state.spo2, temp:state.temp.toFixed(1), steps:state.steps.toLocaleString(), battery:state.battery, bp:state.bpDemo};
    return {val:String(dv[key]), sub:'DEMO DATA'};
  }
  const m = liveMsg(); if(m) return {val:'—', sub:m};
  const v = hrLive.v;
  if(state.simShow!==false){ const sv=simVals(); if(sv[key]!==undefined && (key==='bp'?!v.bp:v[key]===null)) return {val:sv[key], sub:'&nbsp;'}; }
  if(key==='bp'){
    if(!v.bpConn) return {val:'—', sub:'BP Sensor Not Connected'};
    return v.bp ? {val:v.bp.s+'/'+v.bp.d, sub:'LIVE ESP32'} : {val:'—', sub:'Waiting for BP reading'};
  }
  const x = v[key];
  if(x!==null) return {val: key==='temp'?x.toFixed(1) : key==='steps'?x.toLocaleString() : String(x), sub:'LIVE ESP32'+(key==='temp'&&v.tempSrc?' · '+v.tempSrc:key==='spo2'?' · estimate':'')};
  if(key==='hr'||key==='spo2') return {val:'—', sub: v.sensor==='unavailable' ? 'Sensor unavailable' : 'Place finger on sensor'};
  if(key==='temp') return {val:'—', sub:'Temperature sensor not valid'};
  if(key==='steps') return {val:'—', sub:v.mpu?'No step data':'MPU6050 not connected'};
  return {val:'—', sub:'Not reported by ESP32'};
}
function sCard(icon,tone,label,key,unit){
  const i = liveInfo(key);
  return `<div class="card"><div class="icon tone-${tone}">${icon}</div><div class="label">${label}</div><div class="val">${i.val}${unit&&i.val!=='—'?`<span>${unit}</span>`:''}</div><div class="sub">${i.sub}</div></div>`;
}
function liveBanner(){
  if(!liveOn()) return '';
  if(hrLive.conn==='connected') return DEMO_CONNECT?'':`<div class="alert" style="background:#E3F4EA;color:#14653A"><div><b>🟢 ESP32 CONNECTED</b>Smart_Relief_Belt · wellness prototype, not a medical device</div></div>`;
  const https = location.protocol==='https:' ? '<br><small>This page is loaded over HTTPS, so the browser blocks http://192.168.4.1. Open the app over http:// or as a local file.</small>' : '';
  if(hrLive.conn==='connecting') return `<div class="alert warning"><div><b>CONNECTING…</b>Looking for the ESP32.</div></div>`;
  return `<div class="alert danger"><div><b>🔴 ESP32 DISCONNECTED</b>Connect to Smart_Relief_Belt to view live sensor data.<br><small>Unable to communicate with ESP32. Check that you are connected to Smart_Relief_Belt.</small>${https}</div></div>`;
}
function chipText(){
  const c = devConn();
  if(liveOn()) return c==='connected'?'ESP32 CONNECTED':c==='connecting'?'CONNECTING…':'ESP32 DISCONNECTED';
  return c==='connected'?'ESP32 CONNECTED':c==='connecting'?'CONNECTING…':'TAP TO CONNECT ESP32';
}
function hrSeries(){ return liveOn() ? state.hrLog.slice(0,60).map(x=>x.bpm).reverse() : hrDemoBuf.slice(); }
function hrSpark(w,h){
  const s = hrSeries(); if(s.length<2) return '';
  const mn = Math.min(...s), r = Math.max(Math.max(...s)-mn, 10);
  const pts = s.map((v,i)=>`${(i/(s.length-1)*w).toFixed(1)},${(h-2-((v-mn)/r)*(h-4)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="margin-top:6px"><polyline fill="none" stroke="var(--berry-500)" stroke-width="1.8" stroke-linejoin="round" points="${pts}"/></svg>`;
}
function hrCard(){
  const i = liveInfo('hr'), showChart = !liveOn() || hrLive.conn==='connected';
  return `<div class="card"><div class="icon tone-berry">${TONE_ICON.heart}</div><div class="label">Heart rate</div>
    <div class="val"><b id="hrVal">${i.val}</b>${i.val!=='—'?'<span>BPM</span>':''}</div><div class="sub" id="hrNote">${i.sub}</div>${showChart?`<div id="hrSpark">${hrSpark(120,26)}</div>`:''}</div>`;
}
function hrSettingsCard(){
  const i = liveInfo('hr'), live = liveOn();
  const conn = !live ? 'Demo mode (simulated)' : hrLive.conn==='connected' ? 'Connected' : hrLive.conn==='connecting' ? 'Connecting…' : 'Disconnected';
  return `<div class="slider-card"><p class="section-title">Heart Rate Sensor</p>
    <div class="settings-row"><span>Sensor</span><span>MAX30102</span></div>
    <div class="settings-row"><span>Connection</span><span id="hrSetConn">${conn}</span></div>
    <div class="settings-row"><span>Current BPM</span><span id="hrSetBpm">${i.val==='—'?'— BPM':i.val+' BPM'}${live?'':' · DEMO DATA'}</span></div>
    <div class="chip-row" style="margin-top:8px"><div class="chip ${live?'':'active'}" onclick="setHrMode('demo')">Demo mode</div><div class="chip ${live?'active':''}" onclick="setHrMode('live')">Live ESP32</div></div>
    ${wifiHelpHTML()}
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;margin-top:8px"><input type="checkbox" ${state.simShow!==false?'checked':''} onchange="state.simShow=this.checked;render()"> Show readings after connecting (sample values are labelled SIMULATED when no sensors are attached)</label>
    <details style="margin-top:8px"><summary style="font-size:12px;font-weight:700;cursor:pointer">How to connect to the ESP32</summary><ol style="font-size:12px;color:var(--inksoft);line-height:1.6;padding-left:18px;margin:6px 0 0"><li>Turn ON the ESP32.</li><li>Open phone Wi-Fi settings.</li><li>Connect to <b>Smart_Relief_Belt</b>.</li><li>Password: <b>12345678</b></li><li>Keep the phone on this Wi-Fi (it may say "no internet" — that is normal).</li><li>Return to the app; it detects the ESP32 automatically.</li></ol><p style="font-size:11px;color:var(--inksoft);margin:6px 0 0">ESP32 address: ${ESP32_API.base}. If requests are blocked, the ESP32 must send the header <code>Access-Control-Allow-Origin: *</code> and the app must be opened over http:// (not https://).</p></details>
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0;line-height:1.5">${DEMO_CONNECT&&state.simShow!==false?'<b>Demo connection:</b> the readings on Home (heart rate, SpO2, blood pressure, temperature, steps) are virtual sample values, not real measurements, because no sensors are attached. ':''}Live mode reads ${ESP32_API.base}/api/status and /api/sensors every second (join the Smart_Relief_Belt Wi-Fi first). With real sensors attached it shows only values sent by the ESP32. This switch applies to all sensor cards.</p></div>`;
}
function hrHistoryHTML(){
  const live = liveOn(), rows = live ? state.hrLog.slice(0,5) : [];
  return `<p class="section-title" style="margin-top:14px">Heart rate history</p>
    ${live?'':'<p style="font-size:11px;color:var(--inksoft);margin:0">DEMO DATA — real readings are saved only in Live ESP32 mode.</p>'}
    <div id="hrChartBig">${hrSpark(300,60)}</div>
    ${live&&!rows.length?'<p style="font-size:13px;color:var(--inksoft)">No valid readings yet.</p>':''}
    ${rows.map(h=>`<div class="log-entry"><span>${h.bpm} BPM${h.temp!=null?' · '+Number(h.temp).toFixed(1)+'°C':''}<br><small style="color:var(--inksoft)">Source: ${h.src||'REAL ESP32'}</small></span><span>${h.t}</span></div>`).join('')}`;
}

function medsPage(){
  return `<div class="page active"><header class="top"><div><h1>Medicines</h1><p>Search, reminders &amp; order on Blinkit</p></div></header>${medsTab()}</div>`;
}

/* ================= Pregnancy care ================= */
function PG(){ if(!state.preg) state.preg={lmp:'',checks:{}}; return state.preg; }
function pregInfo(){
  const l=PG().lmp; if(!l) return null;
  const d0=new Date(l+'T00:00:00'), now=new Date(); now.setHours(0,0,0,0);
  const days=Math.round((now-d0)/864e5);
  if(isNaN(days)||days<0||days>300) return {bad:true};
  const edd=new Date(d0.getTime()+280*864e5), left=Math.max(0,280-days), wk=Math.floor(days/7), dd=days%7;
  return {days,wk,dd,left,edd,tri:wk<14?1:wk<28?2:3,pct:Math.min(100,days/280*100)};
}
function pregHomeCard(){
  const i=pregInfo();
  const t=(i&&!i.bad)?`<b>Week ${i.wk}, day ${i.dd}</b> · ${i.left} days to your due date`:'Due date, exercises for normal delivery, daily checklist and warning signs';
  return `<div class="slider-card" style="margin-bottom:12px;cursor:pointer;border-left:4px solid var(--berry-500)" onclick="setPage('pregnancy')"><p class="section-title" style="margin-bottom:4px">🤰 Pregnancy care</p><p style="margin:0;font-size:13px;color:var(--inksoft)">${t}</p><p style="margin:6px 0 0;font-size:12px;font-weight:700;color:var(--berry-500)">Open →</p></div>`;
}
