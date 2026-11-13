const MED_CHIPS=['Painkiller','Period cramps','Heavy bleeding','Nausea','Iron / anemia','PCOS','Infection','Hygiene','Vitamins','Contraception'];
function medMatches(q){
  q=(q||'').toLowerCase().trim(); if(!q) return [];
  const toks=q.split(/\s+/), joined=q.replace(/[^a-z0-9]/g,'');
  return MED_DB.filter(m=>{
    const h=(m.n+' '+m.b+' '+m.tags+' '+m.uses).toLowerCase(), c=h.replace(/[^a-z0-9]/g,'');
    return toks.every(t=>h.includes(t)) || c.includes(joined);
  });
}
function medResultsHTML(){
  const q=state.medQuery||''; if(!q.trim()) return '<p style="font-size:12px;color:var(--inksoft);margin:8px 0 0">Type a medicine or a need (e.g. “pain killer”, “cramps”, “heavy bleeding”) or tap a chip.</p>';
  const r=medMatches(q); if(!r.length) return '<p style="font-size:13px;color:var(--inksoft);margin:8px 0 0">No match. Try “painkiller”, “cramps” or a medicine name.</p>';
  return r.slice(0,30).map(m=>{const bad=m.t==='AVOID';return `<div class="settings-row" style="display:block;padding:10px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${esc2(m.n)}</b><small style="font-weight:700;color:${bad?'#C2185B':m.t.includes('Rx')?'#B26A00':'#2E7D5B'}">${esc2(m.t)}</small></div>${m.b?`<small style="color:var(--inksoft)">Brands: ${esc2(m.b)}</small><br>`:''}<span style="font-size:13px"><b>Used for:</b> ${esc2(m.uses)}</span>${m.label?`<br><span style="font-size:12px;color:var(--inksoft)"><b>Typical label dose:</b> ${esc2(m.label)}</span>`:''}<br><span style="font-size:12px;color:var(--inksoft)"><b>Caution:</b> ${esc2(m.care)}</span>${(bad||m.t==='Product'||!m.gap)?'':`<br><button class="btn btn-teal" style="padding:7px 12px;margin-top:6px" onclick="addMedFromDb('${esc2(m.n).replace(/'/g,'')}')">+ Add dose reminder</button>`}${blinkLink(m)}</div>`}).join('')+(r.length>30?`<p style="font-size:12px;color:var(--inksoft)">Showing 30 of ${r.length}. Type more to narrow down.</p>`:'');
}
function medSearch(v){ state.medQuery=v; const el=document.getElementById('medResults'); if(el) el.innerHTML=medResultsHTML(); }
function medChip(t){ state.medQuery=t.replace(' / ',' '); render(); }
function addMedFromDb(name){ const m=MED_DB.find(x=>x.n===name); if(!m) return; if(state.meds.some(x=>x.name===m.n)){ alert(m.n+' is already in My medicines.'); return; } addMed(m.n,m.dose,m.gap); }
function medSearchCard(){
  const notif=('Notification' in window)?Notification.permission:'unsupported';
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">Medicine search</p>
  <input class="field" id="medQ" placeholder="Search e.g. pain killer, cramps, heavy bleeding" value="${esc2(state.medQuery||'')}" oninput="medSearch(this.value)">
  <div class="chip-row" style="margin-top:8px">${MED_CHIPS.map(c=>`<div class="chip" onclick="medChip('${c}')">${c}</div>`).join('')}</div>
  <div id="medResults">${medResultsHTML()}</div>
  <p style="font-size:11px;color:var(--inksoft);margin:10px 0 0">General information only, not a prescription. Check with a doctor or pharmacist, especially with heavy bleeding, pregnancy or other conditions.</p>
  ${notif==='default'?`<button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="Notification.requestPermission().then(()=>render())">🔔 Enable dose-due alerts</button>`:notif==='granted'?'<p style="font-size:11px;color:#2E7D5B;margin:8px 0 0">🔔 Dose-due alerts are on while this page is open.</p>':''}</div>`;
}
function checkMedDue(){
  let changed=false;
  state.meds.forEach(m=>{const l=lastDose(m.id); if(!l||m.notified===l.t) return;
    if(Date.now()-l.t>=m.gap*3600000){ m.notified=l.t; changed=true;
      try{ if('Notification' in window&&Notification.permission==='granted') new Notification('💊 Next dose allowed',{body:m.name+' — your minimum gap has passed. Only take it if you still need it.'}); }catch(e){} } });
  if(changed&&(state.page==='meds'||(state.page==='tools'&&state.toolTab==='meds'))&&document.activeElement&&document.activeElement.id!=='medQ') render();
}
setInterval(checkMedDue,60000);

/* ===== Heavy bleeding / flow tracker ===== */
const FLOW_LEVELS=['Spotting','Light','Medium','Heavy','Very heavy'];
function flowForm(){ return state.flowForm||(state.flowForm={date:'',level:2,pads:0,clots:'none',soak:false,dizzy:false}); }
function setFlow(k,v){ flowForm()[k]=v; render(); }
function saveFlow(){
  const f=flowForm(); state.flow=state.flow||{};
  state.flow[f.date||dateKey(todayDate())]={level:f.level,pads:+f.pads||0,clots:f.clots,soak:!!f.soak,dizzy:!!f.dizzy};
  state.flowForm=null; render();
}
function deleteFlow(k){ delete state.flow[k]; render(); }
function flowAlert(e){
  if(!e) return null;
  if(e.dizzy||e.soak) return {urgent:true,msg:'Soaking a pad/tampon every hour for 2+ hours, or feeling dizzy/faint with heavy bleeding, needs medical care today. If you feel faint, breathless, or have chest pain, go to emergency now.'};
  if(e.level>=3&&e.clots==='large') return {urgent:false,msg:'Heavy flow with large clots (bigger than a coin) should be checked by a gynecologist soon.'};
  if(e.level>=3) return {urgent:false,msg:'Heavy flow today. Rest, drink fluids, and keep tracking. Heavy periods can cause low iron — consider the Iron reminder below.'};
  return null;
}
function flowSubpage(){
  const f=flowForm(), entries=Object.entries(state.flow||{}).sort((a,b)=>a[0]<b[0]?1:-1);
  const week=entries.filter(([k,e])=>(Date.now()-new Date(k))/86400000<=7&&e.level>=3).length;
  const al=flowAlert(f.level>=3||f.soak||f.dizzy?{level:f.level,clots:f.clots,soak:f.soak,dizzy:f.dizzy}:null);
  return `<div class="slider-card"><p class="section-title">Log flow / heavy bleeding</p>
    <label style="font-size:11px;color:var(--inksoft)">Date</label>
    <input class="field" type="date" value="${f.date||dateKey(todayDate())}" onchange="flowForm().date=this.value">
    <div class="chip-row" style="margin-top:10px">${FLOW_LEVELS.map((l,i)=>`<div class="chip ${f.level===i?'active':''}" onclick="setFlow('level',${i})">${l}</div>`).join('')}</div>
    <label style="font-size:11px;color:var(--inksoft);display:block;margin-top:10px">Pads / tampons used today</label>
    <input class="field" type="number" min="0" max="30" value="${f.pads}" oninput="flowForm().pads=this.value">
    <label style="font-size:11px;color:var(--inksoft);display:block;margin-top:10px">Blood clots</label>
    <div class="chip-row">${[['none','None'],['small','Small'],['large','Large (coin size+)']].map(([v,l])=>`<div class="chip ${f.clots===v?'active':''}" onclick="setFlow('clots','${v}')">${l}</div>`).join('')}</div>
    <div class="chip-row" style="margin-top:10px"><div class="chip ${f.soak?'active':''}" onclick="setFlow('soak',${!f.soak})">Soaking a pad every hour</div><div class="chip ${f.dizzy?'active':''}" onclick="setFlow('dizzy',${!f.dizzy})">Dizzy / weak</div></div>
    ${al?`<div style="margin-top:10px;padding:10px;border-radius:10px;background:${al.urgent?'#FDE3EC':'var(--surfacealt)'};color:${al.urgent?'#8E0F3F':'var(--ink)'};font-size:12px;font-weight:600">${al.urgent?'⚠️ ':'ℹ️ '}${al.msg}</div>`:''}
    <button class="btn btn-berry" style="width:100%;margin-top:10px" onclick="saveFlow()">Save flow</button>
    <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="state.medQuery='heavy bleeding';openTools('meds')">💊 Medicines for heavy bleeding</button></div>
  <div class="slider-card"><p class="section-title">Flow history</p>
    ${week>=3?`<p style="font-size:12px;font-weight:700;color:#C2185B;margin:0 0 8px">⚠️ ${week} heavy days in the last 7. Please see a gynecologist.</p>`:''}
    ${entries.length?entries.map(([k,e])=>`<div class="log-entry"><span>${k} — ${FLOW_LEVELS[e.level]}, ${e.pads} pads${e.clots!=='none'?', '+e.clots+' clots':''}${e.soak?', soaking':''}${e.dizzy?', dizzy':''}</span><a style="cursor:pointer;color:var(--garnet-500);font-weight:700" onclick="deleteFlow('${k}')">Delete</a></div>`).join(''):'<p style="font-size:13px;color:var(--inksoft)">Nothing recorded yet.</p>'}
    <p style="font-size:11px;color:var(--inksoft);margin-top:8px">See a doctor if periods last over 7 days, you pass large clots, or bleed enough to soak a pad every 1–2 hours.</p></div>`;
}

function medsTab(){
  const f=state.medForm||(state.medForm={n:'',d:'',g:6});
  return medSearchCard()+`<div class="slider-card" style="margin-bottom:12px"><p class="section-title">My medicines</p>
  ${state.meds.length?state.meds.map(m=>{const l=lastDose(m.id),soon=l&&Date.now()-l.t<m.gap*3600000;return `<div class="settings-row" style="flex-wrap:wrap;gap:6px"><span><b>${esc2(m.name)}</b> ${esc2(m.dose)}<br><small style="color:var(--inksoft)">Min gap ${m.gap} h · ${l?'last '+ago(l.t):'not taken yet'}</small>${soon?'<br><small style="color:#C2185B;font-weight:700">⚠️ Next dose in ${((m.gap*3600000-(Date.now()-l.t))/3600000).toFixed(1)} h</small>':(l?'<br><small style="color:#2E7D5B;font-weight:700">✅ Next dose allowed</small>':'')}</span><span><button class="btn btn-teal" style="padding:8px 12px" onclick="logDose(${m.id})">✔ Took it</button> <button class="btn btn-alt" style="padding:8px 10px" onclick="removeMed(${m.id})">✕</button></span></div>`}).join(''):'<p style="font-size:13px;color:var(--inksoft);margin:0 0 8px">No medicines added yet. Tap a quick-add below or enter your own.</p>'}
  <div class="chip-row" style="margin:10px 0">${MED_PRESETS.map(p=>`<div class="chip" onclick="addMed('${p[0]}','${p[1]}',${p[2]})">+ ${p[0]}</div>`).join('')}</div>
  <input class="field" placeholder="Medicine name" value="${esc2(f.n)}" oninput="state.medForm.n=this.value">
  <div style="display:flex;gap:8px;margin-top:8px"><input class="field" placeholder="Dose e.g. 500 mg" value="${esc2(f.d)}" oninput="state.medForm.d=this.value"><input class="field" type="number" step="0.5" min="0.5" style="max-width:110px" value="${f.g}" oninput="state.medForm.g=this.value" title="Hours between doses"></div>
  <p style="font-size:11px;color:var(--inksoft);margin:4px 0 8px">Right box = minimum hours between doses. Check your medicine's label or ask a pharmacist/doctor.</p>
  <button class="btn btn-berry" style="width:100%" onclick="addMed(state.medForm.n,state.medForm.d,state.medForm.g)">Add medicine</button></div>
  <div class="slider-card"><p class="section-title">Dose log</p>
  ${state.medLog.length?state.medLog.slice(0,15).map((l,i)=>`<div class="settings-row"><span>${esc2(l.name)}<br><small style="color:var(--inksoft)">${new Date(l.t).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></span><button class="btn btn-alt" style="padding:6px 10px" onclick="delLog(${i})">✕</button></div>`).join(''):'<p style="font-size:13px;color:var(--inksoft);margin:0">Nothing logged yet.</p>'}
  <p style="font-size:11px;color:var(--inksoft);margin-top:8px">Reminder log only — not medical advice. Never exceed the dose on the label or prescribed by your doctor.</p></div>`;
}
/* Jan Aushadhi */
function findJanAushadhi(){
  const go=(u)=>window.open(u,'_blank','noopener');
  const q='Jan Aushadhi Kendra';
  if(!navigator.geolocation) return go('https://www.google.com/maps/search/'+encodeURIComponent(q+' near me'));
  navigator.geolocation.getCurrentPosition(p=>go(`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${p.coords.latitude},${p.coords.longitude},14z`),()=>go('https://www.google.com/maps/search/'+encodeURIComponent(q+' near me')),{timeout:8000});
}
function janTab(){
  return `<div class="slider-card"><p class="section-title">Low-cost medicines near you</p>
  <p style="font-size:13px;line-height:1.5;margin:0 0 10px">Jan Aushadhi Kendras (PMBJP) sell quality generic medicines, often much cheaper than branded ones. Ask your doctor or pharmacist whether a generic with the same salt is suitable for you.</p>
  <button class="btn btn-teal" style="width:100%" onclick="findJanAushadhi()">📍 Find nearby Jan Aushadhi / pharmacy</button>
  <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="window.open('https://janaushadhi.gov.in','_blank','noopener')">Official Jan Aushadhi site</button>
  <p style="font-size:11px;color:var(--inksoft);margin-top:8px">Opens Google Maps using your location only for this search — nothing is stored. Stock and timings vary; call ahead.</p></div>`;
}
/* SOS */
function sosAction(kind){
  const s=state.sos; if(!s.phone.trim()){ alert('Save a trusted contact first.'); return; }
  const ph=s.phone.replace(/[^\d+]/g,'');
  if(kind==='call'){ location.href='tel:'+ph; return; }
  if(kind==='wa'){
    let d=s.phone.replace(/\D/g,''); if(d.length===10) d='91'+d; else if(d.length===11&&d[0]==='0') d='91'+d.slice(1);
    const go=loc=>{ location.href='https://wa.me/'+d+'?text='+encodeURIComponent('🆘 I need help. Please contact me now.'+(loc?'\nMy location: '+loc:'\n(My location could not be read.)')); };
    if(!navigator.geolocation) return go('');
    const b=document.getElementById('waSosBtn'); if(b) b.textContent='Getting your location…';
    navigator.geolocation.getCurrentPosition(p=>go(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`),()=>go(''),{timeout:10000,enableHighAccuracy:true});
    return;
  }
  const send=(loc)=>{ location.href=`sms:${ph}?&body=${encodeURIComponent('I need help. Please contact me now.'+(loc?' My location: '+loc:''))}`; };
  if(!navigator.geolocation) return send('');
  navigator.geolocation.getCurrentPosition(p=>send(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`),()=>send(''),{timeout:8000});
}
function sosTab(){
  const s=state.sos, ok=s.phone.trim();
  return `<div class="slider-card"><p class="section-title">Trusted contact (SOS)</p>
  <input class="field" placeholder="Name" value="${esc2(s.name)}" oninput="state.sos.name=this.value">
  <input class="field" type="tel" style="margin-top:8px" placeholder="Phone number" value="${esc2(s.phone)}" oninput="state.sos.phone=this.value">
  <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="render()">Save contact</button>
  ${ok?`<button id="waSosBtn" class="btn btn-teal" style="width:100%;margin-top:12px;padding:18px;font-size:16px" onclick="sosAction('wa')">🟢 WhatsApp SOS with my location</button>
  <button class="btn btn-berry" style="width:100%;margin-top:8px;padding:16px" onclick="sosAction('call')">📞 Call ${esc2(s.name||'contact')}</button>
  <button class="btn btn-teal" style="width:100%;margin-top:8px;padding:16px" onclick="sosAction('sms')">💬 Message with my location</button>`:''}
  <p style="font-size:11px;color:var(--inksoft);margin-top:8px">The WhatsApp or SMS message opens ready to send and you tap Send; your location is read only when you tap; location is read only when you tap. In an emergency also call 112 / 108.</p></div>`;
}
/* PCOS self-check */
