function pregCheck(id){ const c=PG().checks, t=todayKey(); if(c.d!==t){ for(const x in c) delete c[x]; c.d=t; } c[id]=!c[id]; render(); }

const PREG_EX=[
 {n:'Walking',ic:'🚶‍♀️',t:'20 to 30 min, easy pace',h:'Keeps the heart and legs fit, helps the baby settle low in the pelvis, and builds stamina for labour. Walk where you can talk comfortably.'},
 {n:'Pelvic tilts (cat-cow)',ic:'🐈',t:'10 slow rounds, 1 to 2 times a day',h:'On hands and knees, round your back and tuck the tailbone, then lift the chest and relax. Eases back ache and loosens the pelvis.'},
 {n:'Butterfly pose (baddha konasana)',ic:'🦋',t:'1 to 2 min, sitting tall against a wall or cushion',h:'Sit with the soles of the feet together and knees falling open. Opens the hips and inner thighs. Do not push the knees down.'},
 {n:'Supported squat',ic:'🧎‍♀️',t:'8 to 10 reps, hold a sturdy chair or wall',h:'Feet shoulder-width apart, lower slowly as far as is comfortable, keep heels down, rise slowly. Strengthens thighs and opens the pelvis. Skip if your doctor has advised against it.'},
 {n:'Kegel (pelvic floor) squeezes',ic:'💪',t:'10 squeezes, hold 5 sec each, 3 times a day',h:'Tighten the muscles you would use to stop passing urine, hold, then fully relax. Builds pelvic floor control; learning to relax it matters for delivery too.'},
 {n:'Child\'s pose with knees wide',ic:'🧘‍♀️',t:'1 min, a few breaths at a time',h:'Kneel with knees apart, sit back toward the heels and rest the arms forward, leaving room for the belly. Relaxes the back and hips.'},
 {n:'Birthing ball circles',ic:'⚽',t:'5 min, sit on the ball with someone nearby',h:'Sit on an exercise ball and make slow hip circles or gentle bounces. Relieves pelvic pressure and back pain.'},
 {n:'Deep belly breathing',ic:'🌬️',t:'5 min, 2 times a day',h:'Breathe in slowly through the nose so the belly rises, then breathe out longer through the mouth. Practise for labour and for calming the mind.'},
 {n:'Side-lying rest pose',ic:'🛏️',t:'10 min',h:'Lie on your left side with a pillow between the knees and under the belly, and breathe slowly. Good for rest and for the baby\'s blood flow.'}
];
function pregExercises(){
  const rows=PREG_EX.map(e=>`<details style="border-top:1px solid var(--line);padding:8px 0"><summary style="cursor:pointer;font-size:14px;font-weight:700;list-style:none">${e.ic} ${e.n}<span style="display:block;font-size:11px;font-weight:500;color:var(--inksoft);margin-top:2px">${e.t}</span></summary><p style="font-size:12.5px;line-height:1.6;margin:8px 0 0">${e.h}</p></details>`).join('');
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🧘‍♀️ Exercises for a healthy pregnancy and normal delivery</p>
    <p style="font-size:12px;color:var(--inksoft);line-height:1.5;margin:0 0 8px">Gentle exercises and prenatal yoga that gynecologists commonly suggest. Tap an exercise to see how to do it. They help fitness and comfort, but no exercise can guarantee a normal delivery.</p>
    ${rows}
    <div style="background:var(--surfacealt);border-radius:10px;padding:10px;margin-top:10px;font-size:12px;line-height:1.6"><b>Before you start:</b> ask your gynecologist if exercise is safe for you, especially if you had bleeding, a low-lying placenta, high blood pressure, twins or earlier preterm labour.<br><b>Stop and call your doctor if you have:</b> bleeding, fluid leaking, dizziness, chest pain, breathlessness, headache, severe belly pain, or contractions.<br><b>Avoid:</b> lying flat on your back for long after the first trimester, hot yoga, deep twists, lying on the belly, heavy lifting, and any pose that hurts.<br><b>Tip:</b> warm up for 5 minutes, drink water, wear loose clothes and keep a steady, comfortable pace.</div></div>`;
}
function pregnancyPage(){
  const P=PG(), i=pregInfo(), t=todayKey();
  const tipTri={1:'Weeks 1-13: rest when tired, small frequent meals for nausea, start or continue folic acid as your doctor advised, and book your first antenatal visit and scans.',2:'Weeks 14-27: energy often returns. Keep gentle exercise, eat iron- and calcium-rich food, and attend your scans and blood tests.',3:'Weeks 28 onward: notice the baby\'s movements every day, rest on your left side, pack your hospital bag, and know the hospital route and contact numbers.'};
  const due=!i?`<p style="font-size:12px;color:var(--inksoft);margin:8px 0 0">Enter the first day of your last period to see your week and due date.</p>`
    : i.bad?`<p style="font-size:12px;color:#C62828;margin:8px 0 0">That date does not look right. Pick the first day of your last period (within the last 10 months).</p>`
    : `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>Week ${i.wk}, day ${i.dd}</b><span>Trimester ${i.tri}</span></div>
      <div style="height:10px;border-radius:6px;background:var(--surfacealt);margin:8px 0;overflow:hidden"><div style="height:100%;width:${i.pct.toFixed(1)}%;background:var(--berry-500);border-radius:6px"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--inksoft)"><span>Due date (about): <b style="color:var(--ink)">${i.edd.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</b></span><span>${i.left} days to go</span></div>
      <p style="font-size:12px;line-height:1.5;margin:10px 0 0">${tipTri[i.tri]}</p>
      <p style="font-size:11px;color:var(--inksoft);margin:6px 0 0">This estimate counts 40 weeks from your last period. Your doctor's scan date is the one to follow.</p></div>`;
  const items=[['vit','Prenatal vitamin / folic acid as your doctor advised'],['water','Drink 8 to 10 glasses of water'],['walk','Gentle walk or stretching (if your doctor allows)'],['food','Iron- and calcium-rich food (greens, dal, milk or curd, nuts)'],['rest','Rest for 30 minutes, lying on your left side']];
  const ck=P.checks.d===t?P.checks:{};
  const chk=items.map(x=>`<div class="settings-row" style="cursor:pointer" onclick="pregCheck('${x[0]}')"><span>${x[1]}</span><span style="font-size:18px">${ck[x[0]]?'✅':'⬜'}</span></div>`).join('');
  const warn=['Any vaginal bleeding','Fluid leaking from the vagina','Severe or constant belly pain','Severe headache, blurred vision, or sudden swelling of face or hands','Baby moving much less than usual','Fever, or burning when passing urine','Regular tightening or contractions before 37 weeks','Vomiting so much you cannot keep fluids down'];
  return `<div class="page active">
  <header class="top"><div><h1>🤰 Pregnancy care</h1><p>Simple daily support for expecting mothers</p></div><div class="header-btns"><button class="refresh-btn" onclick="setPage('home')" title="Back">←</button></div></header>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Due date calculator</p>
    <label style="font-size:12px;color:var(--inksoft)">First day of your last period</label>
    <input type="date" value="${P.lmp||''}" max="${t}" onchange="PG().lmp=this.value;render()" style="display:block;width:100%;margin-top:6px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-size:14px;box-sizing:border-box">${due}</div>
  ${pregExercises()}
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Today's checklist</p>${chk}</div>
  <div class="slider-card" style="margin-bottom:12px;border-left:4px solid #C62828"><p class="section-title" style="color:#C62828">Go to a hospital or call 112 if you have</p>
    <ul style="margin:6px 0 0;padding-left:18px;font-size:13px;line-height:1.7">${warn.map(w=>`<li>${w}</li>`).join('')}</ul></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Eating well</p>
    <p style="font-size:13px;line-height:1.6;margin:0"><b>Good choices:</b> green leafy vegetables, dal and beans, fruit, milk or curd, nuts, well-cooked eggs and meat.<br><b>Avoid:</b> alcohol, smoking, raw or undercooked meat and eggs, unpasteurised milk, high-mercury fish, and any medicine or herbal product your doctor has not approved. Keep coffee and tea to 1 or 2 cups a day.</p></div>
  <div class="alert" style="background:#FFF3E0;color:#8A4B00;margin-bottom:12px"><div><b>Using the belt while pregnant</b>Do not use the belt's heat or vibration over your belly unless your doctor says it is safe for you.</div></div>
  <p style="font-size:11px;color:var(--inksoft);line-height:1.5;margin:0 0 16px">General information, not medical advice. Attend all antenatal check-ups and follow your doctor's guidance.</p></div>`;
}

const PAGES = {pregnancy:pregnancyPage, meds:medsPage, tools:toolsPage, care:carePage, diet:dietPage, home:homePage, therapy:therapyPage, track:trackerPage, exercise:exercisePage, profile:profilePage, ai:aiPage, doctors:doctorsPage};

/* Timers repaint through autoRender(): it skips the repaint while the person is typing, so text is never wiped and focus is never lost. */
function userTyping(){ const a=document.activeElement; return !!a && (a.tagName==='TEXTAREA' || (a.tagName==='INPUT' && !['checkbox','radio','button','range','submit','color'].includes(a.type)) || a.isContentEditable); }
function autoRender(){ if(userTyping()) return; render(); }
function render(){
  document.getElementById('app').innerHTML = PAGES[state.page]();
  document.getElementById('bottomNav').innerHTML = NAV.map(n =>
    `<button class="${state.page===n.id?'active':''}" onclick="setPage('${n.id}')"><span class="ic">${n.ic}</span>${tr(n.label)}</button>`
  ).join('');
  applyTheme();
  saveState();
}
loadState();
if(!state.pinH&&!state.pinInit){ state.pinS='spr'; state.pinH=pinHash('1826','spr'); }
state.pinInit=true;
if(!state.liveDefaultV2){ state.hrMode='live'; state.liveDefaultV2=true; }
render();
if(state.hrMode==='live') startHrPolling();
checkNotify();

