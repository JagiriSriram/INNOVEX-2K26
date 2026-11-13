function painSubpage(){
  const levels = Object.values(state.pain).length ? state.pain.map(p=>p.level) : [];
  const avg = levels.length ? (levels.reduce((a,b)=>a+b,0)/levels.length).toFixed(1) : '--';
  const trend = levels.length>=2 ? (levels[0]<levels[1]?'↓ improving':levels[0]>levels[1]?'↑ worsening':'→ steady') : '--';
  return `
    <div class="slider-card">
      <p class="section-title">Quick flare-up</p>
      <p style="font-size:11px;color:var(--inksoft);margin:0 0 8px;">Sets pain to 10, then eases down by 1 point every 10 minutes on its own.</p>
      <button class="btn btn-garnet" style="width:100%;" onclick="startPainDecay()">Set pain to 10 ${state.painDecayActive?'(decaying…)':''}</button>
    </div>
    <div class="grid2">
      <div class="card"><div class="label">Average</div><div class="val">${avg}<span>/10</span></div></div>
      <div class="card"><div class="label">Trend</div><div class="val" style="font-size:15px;">${trend}</div></div>
    </div>
    <div class="slider-card">
      <p class="section-title">Log pain level</p>
      <div style="display:flex;justify-content:space-between;font-size:24px;font-weight:700;font-family:'Fraunces',serif;">${state.painLevel}<span style="font-size:12px;color:var(--inksoft);align-self:flex-end;">/ 10</span></div>
      <input type="range" min="0" max="10" value="${state.painLevel}" oninput="state.painLevel=Number(this.value);render()">
      <button class="btn btn-berry" style="width:100%;" onclick="logPain()">Log entry</button>
    </div>
    <div class="slider-card">
      <p class="section-title">Add water</p>
      <div class="chip-row">
        ${[100,250,350,500].map(ml=>`<div class="chip" onclick="addWater(${ml})">+${ml} ml</div>`).join('')}
        <div class="chip" onclick="resetWater()">Reset</div>
      </div>
    </div>
    <div class="slider-card">
      <p class="section-title">Daily pain &amp; hydration history</p>
      ${state.pain.length===0 && state.hydrationLog.length===0 ? `<p style="font-size:13px;color:var(--inksoft);">Nothing logged yet.</p>` : ''}
      ${state.pain.slice(0,8).map(p=>`<div class="log-entry"><span>Pain level ${p.level}/10</span><span>${p.t}</span></div>`).join('')}
      ${state.hydrationLog.slice(0,5).map(h=>`<div class="log-entry"><span>+${h.ml} ml water</span><span>${h.t}</span></div>`).join('')}
      ${hrHistoryHTML()}
    </div>`;
}

function togglePregnancy(){ state.pregnancyMode = !state.pregnancyMode; render(); }
function setLmp(v){ state.lmpDate = v ? new Date(v) : null; render(); }

function pregnancySubpage(){
  let weekInfo = '';
  if(state.lmpDate){
    const days = daysBetween(state.lmpDate, todayDate());
    const week = Math.max(1, Math.floor(days/7)+1);
    const due = new Date(state.lmpDate); due.setDate(due.getDate()+280);
    const trimester = week<=13?'First trimester':week<=27?'Second trimester':'Third trimester';
    weekInfo = `
      <div class="big-date">Week ${week}</div>
      <div class="row"><span>Stage</span><span>${trimester}</span></div>
      <div class="row"><span>Estimated due date</span><span><b>${fmtDate(due)}</b></span></div>`;
  }
  return `
    <div class="slider-card">
      <p class="section-title">Pregnancy tracking</p>
      <div class="therapy-toggle" style="padding:0 0 12px;">
        <div><div class="t">Pregnancy mode</div><div class="d">Switches this tab to pregnancy tracking</div></div>
        <div class="switch ${state.pregnancyMode?'on':''}" onclick="togglePregnancy()"><div class="knob"></div></div>
      </div>
      ${state.pregnancyMode ? `
        <p class="section-title">Last menstrual period (LMP)</p>
        <input class="field" type="date" onchange="setLmp(this.value)">
        ${weekInfo || `<p style="font-size:13px;color:var(--inksoft);margin-top:8px;">Enter your LMP date to estimate your week and due date.</p>`}
      ` : `<p style="font-size:13px;color:var(--inksoft);">Turn on pregnancy mode if you think you may be pregnant — this pauses period predictions and pad reordering.</p>`}
    </div>
    <p style="font-size:11px;color:var(--inksoft);line-height:1.5;">Estimates only, based on a standard 280-day gestation from LMP — not a diagnosis. Confirm with a clinician.</p>`;
}

function symptomsSubpage(){
  const entries = Object.entries(state.symptoms).sort((a,b)=>a[0]<b[0]?1:-1);
  return `
    <div class="slider-card">
      <p class="section-title">Record symptoms</p>
      <label style="font-size:11px;color:var(--inksoft);">Date</label>
      <input class="field" type="date" value="${state.symptomDate?state.symptomDate:dateKey(todayDate())}" onchange="state.symptomDate=this.value;render()">
      <div class="chip-row" style="margin-top:10px;">
        ${SYMPTOM_LIST.map(s=>`<div class="chip ${state.symptomSelected.includes(s)?'active':''}" onclick="toggleSymptom('${s}')">${s}</div>`).join('')}
      </div>
      <label style="font-size:11px;color:var(--inksoft);display:block;margin-top:10px;">Other</label>
      <input class="field" type="text" placeholder="Describe anything else" value="${state.symptomOther}" oninput="state.symptomOther=this.value">
      <button class="btn btn-berry" style="width:100%;margin-top:10px;" onclick="saveSymptoms()">Save symptoms</button>
    </div>
    <div class="slider-card">
      <p class="section-title">Symptom history</p>
      ${entries.length===0?`<p style="font-size:13px;color:var(--inksoft);">Nothing recorded yet.</p>`:entries.map(([k,list])=>`
        <div class="log-entry"><span>${k} — ${list.join(', ')||'—'}</span><a style="cursor:pointer;color:var(--garnet-500);font-weight:700;" onclick="deleteSymptomDay('${k}')">Delete</a></div>`).join('')}
    </div>`;
}

function calendarSubpage(){
  const t = todayDate();
  const y = t.getFullYear(), m = t.getMonth();
  const first = new Date(y,m,1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const cells = [];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(new Date(y,m,d));
  const dow = ['S','M','T','W','T','F','S'];
  return `
    <div class="slider-card">
      <p class="section-title">${t.toLocaleDateString([], {month:'long', year:'numeric'})}</p>
      <div class="cal-grid">
        ${dow.map(d=>`<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map(d=>{
          if(!d) return `<div class="cal-day empty"></div>`;
          const key = dateKey(d);
          const isToday = key===dateKey(t);
          const cls = isPeriodDay(d) ? 'period' : (isPredictedDay(d) ? 'predicted' : '');
          return `<div class="cal-day ${cls} ${isToday?'today':''}" onclick="toggleManualDay('${key}')">${d.getDate()}</div>`;
        }).join('')}
      </div>
      <div class="cal-legend">
        <span><i style="background:var(--berry-500);"></i>Period</span>
        <span><i style="background:var(--berry-100);border:1px dashed var(--berry-300);"></i>Predicted</span>
        <span><i style="background:var(--surface);outline:2px solid var(--teal-500);"></i>Today</span>
      </div>
      <p style="font-size:11px;color:var(--inksoft);margin-top:10px;">Tap any date to manually mark or unmark it as a period day.</p>
    </div>`;
}

function trackerPage(){
  const tabs = [['period','Period'],['pain','Pain'],['flow','Flow'],['symptoms','Symptoms'],['calendar','Calendar'],['pregnancy','Pregnancy']];
  const bodies = {period:periodSubpage, pain:painSubpage, flow:flowSubpage, symptoms:symptomsSubpage, calendar:calendarSubpage, pregnancy:pregnancySubpage};
  const body = (bodies[state.subTrack]||periodSubpage)();
  return `
  <div class="page active">
    <header class="top"><div><h1>Track</h1><p>Cycle, symptoms &amp; pregnancy</p></div></header>
    <div class="subtabs">${tabs.map(([id,label])=>`<button class="${state.subTrack===id?'active':''}" onclick="setSubTrack('${id}')">${label}</button>`).join('')}</div>
    ${body}
  </div>`;
}

