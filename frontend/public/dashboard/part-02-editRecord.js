function editRecord(id){
  const r = state.periodRecords.find(x=>x.id===id);
  if(!r) return;
  state.formStart = r.start; state.formEnd = r.end; state.editingId = id;
  render();
}
function cancelEdit(){ state.formStart=null; state.formEnd=null; state.editingId=null; render(); }
function deleteRecord(id){
  state.periodRecords = state.periodRecords.filter(r=>r.id!==id);
  const latest = [...state.periodRecords].sort((a,b)=>b.start-a.start)[0];
  state.lastPeriodStart = latest ? latest.start : null;
  render();
}

const SYMPTOM_LIST = ['Cramps','Back pain','Headache','Fatigue','Bloating','Nausea','Mood changes'];
function toggleSymptom(s){
  const i = state.symptomSelected.indexOf(s);
  if(i>=0) state.symptomSelected.splice(i,1); else state.symptomSelected.push(s);
  render();
}
function saveSymptoms(){
  const d = state.symptomDate ? new Date(state.symptomDate) : todayDate();
  const key = dateKey(d);
  const list = [...state.symptomSelected];
  if(state.symptomOther.trim()) list.push(state.symptomOther.trim());
  state.symptoms[key] = list;
  state.symptomSelected = []; state.symptomOther = ''; state.symptomDate = null;
  render();
}
function deleteSymptomDay(key){ delete state.symptoms[key]; render(); }

function toggleManualDay(key){
  const i = state.manualPeriodDays.indexOf(key);
  if(i>=0) state.manualPeriodDays.splice(i,1); else state.manualPeriodDays.push(key);
  render();
  if(i<0) maybePromptPeriodComfort(key);   // only when a day is newly marked
}
function isPeriodDay(d){
  const key = dateKey(d);
  if(state.manualPeriodDays.includes(key)) return true;
  return state.periodRecords.some(r=>{
    const end = r.end || (()=>{ const e=new Date(r.start); e.setDate(e.getDate()+avgPeriodDuration()-1); return e; })();
    return d>=r.start && d<=end;
  });
}
function isPredictedDay(d){
  const np = nextPeriodDate();
  if(!np) return false;
  const end = new Date(np); end.setDate(end.getDate()+avgPeriodDuration()-1);
  return d>=np && d<=end;
}

function connectWifi(){ connectEsp(); }   // never simulates a connection; probes the real ESP32

function startPainDecay(){
  state.painLevel = 10; state.painDecayActive = true;
  const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  if(state.pain[0]) state.pain[0] = {level:10, t}; else state.pain.unshift({level:10, t});
  render();
}
setInterval(()=>{
  if(state.painDecayActive && !state.sessionActive && state.painLevel>0){
    state.painLevel = Math.max(0, state.painLevel-1);
    const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    if(state.pain[0]) state.pain[0] = {level:state.painLevel, t}; else state.pain.unshift({level:state.painLevel, t});
    if(state.painLevel===0) state.painDecayActive=false;
    autoRender();
  }
}, 600000);

// ---- Exercise phases by cycle day ----
function getPhase(day, cycleLength){
  const d = Math.max(1, Math.min(day, cycleLength));
  if(d<=2) return {name:'Menstrual — heavy flow', tone:'garnet', exercises:[['Restorative child\u2019s pose','5 min'],['Gentle walking','10 min'],['Deep belly breathing','5 min']]};
  if(d<=5) return {name:'Menstrual — tapering', tone:'garnet', exercises:[['Easy yoga flow','15 min'],['Brisk walk','15 min'],['Cat-cow stretches','5 min']]};
  if(d<=13) return {name:'Follicular — rising energy', tone:'teal', exercises:[['Cycling or jog','20 min'],['Bodyweight strength circuit','20 min'],['Dance workout','15 min']]};
  if(d===14) return {name:'Ovulation — peak energy', tone:'amber', exercises:[['HIIT intervals','20 min'],['Heavy strength training','25 min'],['Sprint intervals','15 min']]};
  if(d<=cycleLength-3) return {name:'Luteal — steady', tone:'teal', exercises:[['Moderate strength training','20 min'],['Pilates core work','15 min'],['Steady-state cardio','20 min']]};
  return {name:'Luteal — PMS window', tone:'berry', exercises:[['Gentle yoga','15 min'],['Stretching & foam rolling','10 min'],['Short easy walk','10 min']]};
}

function jitter(base,range){ return base + (Math.random()-0.5)*range; }

function tick(){
  if(state.hrMode!=='live'){ state.hr = Math.round(jitter(78,6)); hrDemoBuf.push(state.hr); if(hrDemoBuf.length>60) hrDemoBuf.shift(); }  // live mode: never simulate
  if(state.hrMode!=='live'){ state.spo2 = Math.round(jitter(98,1.4)); state.temp = Number(jitter(36.8,0.3).toFixed(1)); state.bpDemo = Math.round(jitter(118,4))+'/'+Math.round(jitter(76,3)); }
  if(state.sessionActive && state.sessionSecs>0){
    state.sessionSecs -= 1;
    const progress = 1 - (state.sessionSecs / (state.sessionTotalSecs || state.sessionMinutes*60));
    const relieved = Math.max(1, Math.round(10 - progress*8));
    if(relieved !== state.painLevel){
      state.painLevel = relieved;
      const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      if(state.pain[0]) state.pain[0] = {level:relieved, t}; else state.pain.unshift({level:relieved, t});
    }
    if(state.sessionSecs<=0){ state.sessionActive=false; state.heater=false; state.vibration=false; state.painDecayActive=true; }
  }
  autoRender();
}
setInterval(tick, 3000);

// steps auto-count +5 every 1 minute, like a wearable pedometer
setInterval(()=>{ if(state.hrMode==='live') return; state.steps += 5; autoRender(); }, 60000);

function incSteps(){ state.steps += 10; render(); }
function resetSteps(){ state.steps = 0; render(); }

function adjustPain(delta){
  const cur = state.pain[0] ? state.pain[0].level : state.painLevel;
  const next = Math.max(0, Math.min(10, cur + delta));
  state.painLevel = next;
  state.painDecayActive = true;
  const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  if(state.pain[0]) { state.pain[0] = {level:next, t}; }
  else { state.pain.unshift({level:next, t}); }
  render();
}

function refreshAll(){
  state.demoWater = 0;
  state.hydrationLog = [];
  state.steps = 0;
  _sim.steps = 0; _sim.st = Date.now();   // demo steps restart from 0, then +1 to +4 every 10 s
  render();
}

function fmtTime(s){
  const m = Math.floor(s/60), sec = s%60;
  return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}

