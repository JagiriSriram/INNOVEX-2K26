
const TONE_ICON = {heart:'♥',spo2:'◐',temp:'◒',steps:'⛶',pain:'▲',batt:'▮',drop:'◔'};
const NAV = [
  {id:'diet',label:'Diet',ic:'❀',_after:'exercise'},
  {id:'home',label:'Home',ic:'⌂'},
  {id:'therapy',label:'Therapy',ic:'✳'},
  {id:'track',label:'Track',ic:'◔'},
  {id:'meds',label:'Medicines',ic:'💊'},
  {id:'exercise',label:'Exercise',ic:'✦'},
  {id:'profile',label:'Profile',ic:'◎'},
];

let state = {
  page:'home', pinH:'', pinS:'', pinLeave:true, theme:'auto', lang:'en', mood:{}, routine:{d:'',done:[]}, notifyOn:false, careTab:'myths', dietTab:'plan', diet:{cond:'PCOS',weight:'',height:'',age:'',act:1.375,pref:'veg',day:0,generated:false,err:''},
  demoWater:1250, waterTarget:2000, steps:2540, heater:false, vibration:false,
  emergency:false, sessionActive:false, sessionSecs:0, sessionMinutes:10, sessionTotalSecs:600,
  pain:[], hydrationLog:[], quickAdding:false, threshold:39.5,
  hr:78, spo2:98, temp:36.8, battery: 80, painLevel:5, painDecayActive:false,
  // cycle tracking
  subTrack:'period', cycleLength:25, lastPeriodStart:null, padOrdered:false,
  demoOffsetDays:0, exerciseDay:1,
  periodRecords:[], formStart:null, formEnd:null, editingId:null,
  symptoms:{}, symptomDate:null, symptomSelected:[], symptomOther:'',
  manualPeriodDays:[],
  // pregnancy
  pregnancyMode:false, lmpDate:null,
  // device
  wifiStatus:'disconnected',
  // AI assistant
  chatMessages:[], chatInput:'', aiUseData:false,
  // doctor search
  doctorTab:'near', doctorCity:'', doctorState:'', doctorFilters:{openNow:false, femaleDoctor:false, clinic:false},
  visitSummary:'', doctorQuestions:'', confirmDelete:false,
  hrMode:'live', hrLog:[], bpDemo:'118/76', toolTab:'meds', meds:[], medLog:[], medForm:null, medQuery:'', flow:{}, flowForm:null, sos:{name:'',phone:''}, pcos:{},
};
let sessionGeo = null; // never persisted — location is used only for this session's search
let geoStatus = 'idle'; // idle | loading | granted | denied

const STORAGE_KEY = 'spr_state_v1';
function saveState(){
  if(window.__restoring) return;
  try{
    const s = JSON.parse(JSON.stringify(state, (k,v)=> v instanceof Date ? v.toISOString() : v));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }catch(e){ console.warn('save failed', e); }
}
function reviveDates(obj){
  if(obj.lastPeriodStart) obj.lastPeriodStart = new Date(obj.lastPeriodStart);
  if(obj.lmpDate) obj.lmpDate = new Date(obj.lmpDate);
  if(obj.formStart) obj.formStart = new Date(obj.formStart);
  if(obj.formEnd) obj.formEnd = new Date(obj.formEnd);
  if(Array.isArray(obj.periodRecords)) obj.periodRecords.forEach(r=>{
    r.start = new Date(r.start); r.end = r.end ? new Date(r.end) : null;
  });
  return obj;
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ Object.assign(state, reviveDates(JSON.parse(raw))); }
  }catch(e){ console.warn('load failed', e); }
}
function deleteAllData(){
  if(!state.confirmDelete){ state.confirmDelete = true; render(); return; }
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  location.reload();
}

function todayDate(){
  const d = new Date();
  d.setDate(d.getDate() + state.demoOffsetDays);
  d.setHours(0,0,0,0);
  return d;
}
function fmtDate(d){ return d.toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'}); }
function daysBetween(a,b){ return Math.round((b-a)/86400000); }

function logPeriodStart(){
  state.lastPeriodStart = todayDate();
  state.padOrdered = false;
  state.subTrack='period';
  render();
  maybePromptPeriodComfort(todayDate());
}
function nextPeriodDate(){
  if(!state.lastPeriodStart) return null;
  const d = new Date(state.lastPeriodStart);
  d.setDate(d.getDate() + state.cycleLength);
  return d;
}
function cycleDayToday(){
  if(!state.lastPeriodStart) return null;
  return daysBetween(state.lastPeriodStart, todayDate()) + 1;
}
function daysUntilNextPeriod(){
  const np = nextPeriodDate();
  if(!np) return null;
  return daysBetween(todayDate(), np);
}
function advanceDemoDay(){ state.demoOffsetDays += 1; render(); }
function confirmPadOrder(){ state.padOrdered = true; render(); }

function dateKey(d){ return d.toISOString().slice(0,10); }

function avgPeriodDuration(){
  const withEnd = state.periodRecords.filter(r=>r.end);
  if(withEnd.length===0) return 5;
  const total = withEnd.reduce((s,r)=>s+daysBetween(r.start,r.end)+1,0);
  return Math.round(total/withEnd.length);
}

function currentPeriodDay(){
  if(state.periodRecords.length===0) return null;
  const latest = [...state.periodRecords].sort((a,b)=>b.start-a.start)[0];
  const end = latest.end || (()=>{ const e=new Date(latest.start); e.setDate(e.getDate()+avgPeriodDuration()-1); return e; })();
  const t = todayDate();
  if(t>=latest.start && t<=end) return daysBetween(latest.start,t)+1;
  return null;
}

function saveFormDates(field, val){
  state[field] = val ? new Date(val) : null;
  render();
}
function savePeriodRecord(){
  if(!state.formStart) return;
  const _newPeriod = state.editingId ? null : state.formStart; // editing an old record never prompts
  if(state.editingId){
    const rec = state.periodRecords.find(r=>r.id===state.editingId);
    if(rec){ rec.start = state.formStart; rec.end = state.formEnd; }
  } else {
    state.periodRecords.push({id:Date.now(), start:state.formStart, end:state.formEnd});
  }
  const latest = [...state.periodRecords].sort((a,b)=>b.start-a.start)[0];
  state.lastPeriodStart = latest.start;
  state.padOrdered = false;
  state.formStart = null; state.formEnd = null; state.editingId = null;
  render();
  if(_newPeriod) maybePromptPeriodComfort(_newPeriod);
}
