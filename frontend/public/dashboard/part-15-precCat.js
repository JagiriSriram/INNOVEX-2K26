function precCat(i){ state.precI=i; render(); }
function precTab(){
  const i=state.precI||0, c=PREC[i];
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🛡️ Precautions</p>
    <div class="chip-row">${PREC.map((p,j)=>`<div class="chip ${j===i?'active':''}" onclick="precCat(${j})">${p.ic} ${p.k}</div>`).join('')}</div></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title" style="color:#2E7D5B">✅ Do — ${c.k}</p>
    ${c.d.map(t=>`<p style="font-size:13px;line-height:1.5;margin:0 0 6px">• ${t}</p>`).join('')}</div>
  <div class="slider-card"><p class="section-title" style="color:#C2185B">❌ Avoid — ${c.k}</p>
    ${c.a.map(t=>`<p style="font-size:13px;line-height:1.5;margin:0 0 6px">• ${t}</p>`).join('')}
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">General wellness information, not medical advice. See a doctor for personal advice.</p></div>`;
}

/* ===== Backup / restore, doctor report, install ===== */
function dlFile(name,mime,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:mime})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500); }
function exportBackup(){
  const data=JSON.parse(JSON.stringify(state,(k,v)=>v instanceof Date?v.toISOString():v)); delete data.pinH; delete data.pinS; delete data.confirmDelete;
  dlFile('Smart_Period_Relief_backup_'+new Date().toISOString().slice(0,10)+'.json','application/json',JSON.stringify({app:'Smart Period Relief',version:1,exported:new Date().toISOString(),data},null,1));
}
function importBackup(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{
    const o=JSON.parse(r.result); if(o.app!=='Smart Period Relief'||!o.data||typeof o.data!=='object') throw new Error('bad');
    if(!confirm('Restore this backup? It will REPLACE all data currently in this app (backup from '+String(o.exported||'').slice(0,10)+').')) return;
    const d=Object.assign({},o.data,{pinH:state.pinH,pinS:state.pinS,page:'profile'});
    window.__restoring=true; localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); location.reload();
  }catch(e){ alert('This file is not a valid Smart Period Relief backup.'); } inp.value=''; };
  r.readAsText(f);
}
function repP(){ return state.rep||(state.rep={name:'',age:'',blood:'',allergies:'',conditions:''}); }
function reportSections(){
  const f=d=>fmtDate(new Date(d)), P=repP(), S=[];
  S.push(['1. Patient details',[`Name: ${P.name||'—'}`,`Age: ${P.age||'—'}`,`Blood group: ${P.blood||'—'}`,`Allergies: ${P.allergies||'None reported'}`,`Known conditions: ${P.conditions||'None reported'}`,`Emergency contact: ${state.sos&&state.sos.phone?(state.sos.name||'')+' '+state.sos.phone:'—'}`]]);
  const asc=[...state.periodRecords].sort((a,b)=>new Date(a.start)-new Date(b.start));
  const rows=asc.map((r,i)=>{const s=new Date(r.start),e=r.end?new Date(r.end):null; const len=e?Math.round((e-s)/864e5)+1:null; const gap=i?Math.round((s-new Date(asc[i-1].start))/864e5):null; return `${f(s)} to ${e?f(e):'ongoing'}${len?` (${len} days)`:''}${gap?` · cycle length ${gap} days`:''}`;}).reverse().slice(0,12);
  const np=nextPeriodDate();
  S.push(['2. Cycle history',[`Typical cycle length: ${state.cycleLength} days`,`Average period length: ${avgPeriodDuration()} days`,`Next period expected: ${np?f(np):'—'}`,state.pregnancyMode?'Pregnancy mode is ON in the app':'',...(rows.length?rows:['No periods logged'])].filter(Boolean)]);
  const fl=Object.entries(state.flow||{}).sort((a,b)=>a[0]<b[0]?1:-1), heavy=fl.filter(([k,e])=>e.level>=3).length;
  S.push(['3. Flow and heavy bleeding',[`Days logged: ${fl.length} · Heavy or very heavy days: ${heavy}`,...(fl.length?fl.slice(0,20).map(([k,e])=>`${k}: ${FLOW_LEVELS[e.level]}, ${e.pads} pads/tampons, clots: ${e.clots}${e.soak?', soaking a pad every hour':''}${e.dizzy?', dizzy/weak':''}`):['No flow logged'])]]);
  const lv=state.pain.map(p=>p.level);
  S.push(['4. Pain log',lv.length?[`Average: ${(lv.reduce((a,b)=>a+b,0)/lv.length).toFixed(1)}/10 · Highest: ${Math.max(...lv)}/10 · Entries: ${lv.length}`,...state.pain.slice(0,15).map(p=>`${p.t}: ${p.level}/10`)]:['No pain logged']]);
  const sy=Object.entries(state.symptoms||{}).sort((a,b)=>a[0]<b[0]?1:-1).slice(0,20).map(([d,l])=>`${d}: ${l.join(', ')}`);
  S.push(['5. Symptoms',sy.length?sy:['No symptoms logged']]);
  S.push(['6. Current medicines',state.meds.length?state.meds.map(m=>`${m.name}${m.dose?' '+m.dose:''} · minimum gap ${m.gap} h`):['None added']]);
  S.push(['7. Recent doses taken',state.medLog.length?state.medLog.slice(0,20).map(l=>`${l.name} — ${new Date(l.t).toLocaleString([],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`):['None logged']]);
  S.push(['8. Wearable sensor readings (wellness prototype, not clinical)',state.hrLog&&state.hrLog.length?state.hrLog.slice(0,15).map(h=>`${h.t}: ${h.bpm} BPM${h.temp!=null?', '+Number(h.temp).toFixed(1)+' °C':''}${h.steps!=null?', '+h.steps+' steps':''} — ${h.src||'REAL ESP32'}`):['No readings recorded from the device']]);
  const ps=(state.pcodSel||[]).map(i=>PCOD_SYM[i]);
  S.push(['9. PCOS / PCOD screening (not a diagnosis)',[Object.keys(state.pcos||{}).length===PCOS_Q.length?'Quiz result: '+pcosResult()[0]+` (${pcosScore()}/${PCOS_Q.length} signs)`:'Quiz not completed',...(ps.length?['Symptoms ticked: '+ps.join('; ')]:[])]]);
  const q=[state.visitSummary,state.doctorQuestions].map(x=>(x||'').trim()).filter(Boolean);
  S.push(['10. Notes and questions for the doctor',q.length?q:['None added']]);
  return S;
}
function buildFullReport(print){
  const e=esc2, S=reportSections();
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Health Summary</title><style>body{font:14px/1.5 Arial,sans-serif;margin:24px auto;max-width:760px;padding:0 16px;color:#222}h1{font-size:22px;margin:0;color:#C2185B}h2{font-size:15px;margin:18px 0 6px;padding:5px 8px;background:#FCE4EC;border-left:4px solid #C2185B}ul{margin:4px 0;padding-left:20px}li{margin:2px 0}small{color:#666}@media print{h2{break-after:avoid}li{break-inside:avoid}}</style></head><body><h1>Health Summary Report</h1><small>Generated ${fmtDate(new Date())} · Smart Period Relief (self-reported information)</small>${S.map(([h,l])=>`<h2>${e(h)}</h2><ul>${l.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`).join('')}<p><small>Self-reported and wearable-prototype data. Not a medical diagnosis.</small></p>${print?'<script>onload=()=>setTimeout(()=>print(),300)<\/script>':''}</body></html>`;
}
function reportText(){ return '🩺 Health Summary Report\n'+reportSections().map(([h,l])=>'\n'+h.toUpperCase()+'\n'+l.map(x=>'• '+x).join('\n')).join('\n')+'\n\nSelf-reported data, not a diagnosis.'; }
function printFullReport(){ const w=window.open('','_blank'); if(!w){ alert('Allow pop-ups to open the report.'); return; } w.document.write(buildFullReport(true)); w.document.close(); }
function downloadReport(){ dlFile('Health_Summary_'+new Date().toISOString().slice(0,10)+'.html','text/html',buildFullReport(false)); }
function shareReport(){ const t=reportText(); if(navigator.share){ navigator.share({title:'Health Summary',text:t}).catch(()=>{}); } else waOpen(t.length>3500?t.slice(0,3500)+'\n…(use Download for the full report)':t); }
function installApp(){ if(window.__ip){ window.__ip.prompt(); window.__ip=null; render(); } }
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); window.__ip=e; if(state.page==='profile') render(); });
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(()=>{});
function dataCard(){
  const P=repP(), inst=window.matchMedia&&matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const inp=(k,ph)=>`<input class="field" placeholder="${ph}" value="${esc2(P[k])}" oninput="repP().${k}=this.value" style="margin-top:8px">`;
  return `<div class="slider-card"><p class="section-title">📤 Share my health history with a doctor</p>
    <p style="font-size:12px;color:var(--inksoft);margin:0">Fill these once; they appear at the top of the report.</p>
    ${inp('name','Your name')}${inp('age','Age')}${inp('blood','Blood group (e.g. O+)')}${inp('allergies','Allergies (if any)')}${inp('conditions','Known conditions (if any)')}
    <button class="btn btn-berry" style="width:100%;margin-top:10px" onclick="printFullReport()">🖨️ Open report / Save as PDF</button>
    <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="shareReport()">↗ Share (WhatsApp, email…)</button>
    <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="downloadReport()">⬇️ Download report file</button>
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">Includes cycle history, flow, pain, symptoms, medicines, device readings and PCOS screening, each under its own heading.</p></div>
  <div class="slider-card"><p class="section-title">💾 Backup and restore</p>
    <p style="font-size:12px;color:var(--inksoft);margin:0 0 8px">Save all your data to a file and restore it on another phone or browser. The PIN is not included.</p>
    <button class="btn btn-teal" style="width:100%" onclick="exportBackup()">⬇️ Export backup file</button>
    <label class="btn btn-alt" style="display:block;text-align:center;margin-top:8px;cursor:pointer">⬆️ Restore from backup file<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this)"></label></div>
  <div class="slider-card"><p class="section-title">📲 Install on home screen</p>
    ${inst?'<p style="font-size:13px;color:#2E7D5B;margin:0">✅ Running as an installed app.</p>':window.__ip?'<button class="btn btn-berry" style="width:100%" onclick="installApp()">Install app</button>':'<p style="font-size:12px;color:var(--inksoft);line-height:1.6;margin:0">Open the hosted https link, then:<br>• <b>Android Chrome:</b> ⋮ → Install app / Add to Home screen<br>• <b>iPhone Safari:</b> Share → Add to Home Screen</p>'}
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">Installing needs the hosted version. After the first load it also opens offline. Live ESP32 data needs the local-file or http setup.</p></div>`;
}

function toolsPage(){
  const T=[['meds','💊 Medicines'],['jan','🏪 Jan Aushadhi'],['sos','🆘 SOS'],['report','📄 Doctor report'],['pcos','🩺 PCOS check'],['hyg','🧼 Hygiene'],['blood','🩸 Blood banks'],['pcod','🌸 PCOD / PCOS'],['prec','🛡️ Precautions']];
  const B={meds:medsTab,jan:janTab,sos:sosTab,report:reportTab,pcos:pcosTab,hyg:hygTab,blood:bloodTab,pcod:pcodTab,prec:precTab}[state.toolTab]||medsTab;
  return `<div class="page active"><header class="top"><div><h1>Health Tools</h1><p>Medicines, SOS, reports &amp; guides</p></div></header>
  <div class="chip-row" style="margin-bottom:12px">${T.map(([id,l])=>`<div class="chip ${state.toolTab===id?'active':''}" onclick="setToolTab('${id}')">${l}</div>`).join('')}</div>${B()}
  <button class="btn btn-alt" style="width:100%;margin-top:10px" onclick="setPage('home')">← Back to Home</button></div>`;
}

/* ===== Live ESP32 hardware (MAX30102 + other sensors). In Live mode ONLY values received from the ESP32 are shown. ===== */
const ESP32_API = {base:'http://192.168.4.1', timeoutMs:1800};   // single place for ESP32 API access
const EMPTY_LIVE = () => ({hr:null, spo2:null, temp:null, steps:null, battery:null, bpConn:false, bp:null, bad:false, sensor:'', tempOk:false, mpu:false, tempSrc:''});
const hrLive = {conn:'connecting', v:EMPTY_LIVE(), lastSave:0, sig:''};
const hrDemoBuf = [];            // in-memory only; simulated values are never saved to history
let hrTimer = null, hrBusy = false;
const liveOn = () => state.hrMode==='live';
const curTemp = () => liveOn() ? hrLive.v.temp : state.temp;       // null when live temperature is unknown
const devConn = () => liveOn() ? hrLive.conn : state.wifiStatus;

let espLastErr='';
async function esp32Get(path){
  const ctl = new AbortController(), to = setTimeout(()=>ctl.abort(), ESP32_API.timeoutMs);
  try{
    const res = await fetch(ESP32_API.base+path, {signal:ctl.signal, cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    let data; try{ data = await res.json(); }catch(e){ data = null; }
    if(!data || typeof data!=='object'){ const x=new Error('Invalid JSON'); x.bad=true; throw x; }
    espLastErr=''; return data;
  } catch(e){
    espLastErr = e.name==='AbortError' ? 'Timed out — no reply from 192.168.4.1 within 2 seconds.' : e.bad ? 'The ESP32 replied, but not with valid JSON.' : /^HTTP/.test(e.message||'') ? 'The ESP32 replied with '+e.message+'. Check the firmware has /api/status and /api/sensors.' : 'Request blocked or unreachable: wrong Wi-Fi, browser blocked local-network access (tap Allow if asked), page opened over https, or the ESP32 is missing the CORS header.';
    throw e;
  } finally { clearTimeout(to); }
}
const fin = (x,lo,hi) => { if(x===null||x===undefined||x==='') return null; const n=Number(x); return Number.isFinite(n)&&n>=lo&&n<=hi ? n : null; };
// Turns the raw ESP32 JSON into display values. Anything missing/invalid stays null — nothing is ever invented.
function parseSensors(d,s){
  const v = EMPTY_LIVE();
  const hr = d.heartRateValid===true ? fin(d.heartRate,30,220) : null;
  v.hr = hr===null ? null : Math.round(hr);
  const sp = d.spo2Valid===false ? null : fin(d.spo2!==undefined?d.spo2:d.SpO2,50,100);
  v.spo2 = (sp===null||v.hr===null) ? null : Math.round(sp);          // SpO2 needs a finger on the sensor too
  v.tempSrc = String(d.temperatureSource||'').slice(0,20); v.tempOk = d.temperatureValid===true; v.mpu = d.mpu6050Connected===true;
  v.temp = v.tempOk ? fin(d.temperature,-10,125) : null;
  v.steps = v.mpu ? fin(d.steps,0,10000000) : null;
  v.battery = fin(d.battery,0,100);
  v.bpConn = d.bpSensorConnected===true || d.bpConnected===true || /^(connected|reading|ready|ok)$/i.test(String(d.bpSensor||s.bpSensor||''));
  if(v.bpConn && d.bpValid===true){ const sy=fin(d.systolic,50,260), di=fin(d.diastolic,30,160); if(sy!==null&&di!==null&&sy>di) v.bp={s:Math.round(sy),d:Math.round(di)}; }
  v.sensor = /unavail|error|missing|fail|offline|not.?found|not.?detected/i.test(String(s.heartRateSensor||'')) ? 'unavailable' : 'ok';
  return v;
}
// /api/status decides connected/disconnected. /api/sensors is read only after status succeeds. Never throws, never invents values.
async function getSensors(){
  let st;
  try{ st = await esp32Get('/api/status'); }
  catch(e){ return e&&e.bad ? {reachable:true, v:Object.assign(EMPTY_LIVE(),{bad:true})} : {reachable:false, v:EMPTY_LIVE()}; }
  try{ const d = await esp32Get('/api/sensors'); return {reachable:true, v:parseSensors(d,st)}; }
  catch(e){ return e&&e.bad ? {reachable:true, v:Object.assign(EMPTY_LIVE(),{bad:true})} : {reachable:false, v:EMPTY_LIVE()}; }
}
async function getHeartRate(){ const r = await getSensors(); return {reachable:r.reachable, valid:r.v.hr!==null, bpm:r.v.hr, bad:r.v.bad}; }
