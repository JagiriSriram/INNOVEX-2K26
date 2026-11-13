const PCOS_Q=['My periods are irregular, or come less than 8–9 times a year','I often skip periods for 3+ months','I have excess facial/body hair (chin, upper lip, chest)','I have persistent acne or very oily skin','I have thinning hair or hair loss on the scalp','I have gained weight easily, especially around the waist','I have dark, velvety patches of skin (neck, underarms)','I have difficulty getting pregnant, or have been told I have cysts on ovaries','A close relative has PCOS or type 2 diabetes'];
function pcosAns(i,v){ state.pcos[i]=v; render(); }
function pcosScore(){ return Object.values(state.pcos).filter(v=>v===1).length; }
function pcosResult(){
  const n=pcosScore(), irr=state.pcos[0]===1||state.pcos[1]===1;
  if(n>=4||(irr&&n>=3)) return ['See a doctor','Several signs are commonly seen with PCOS/PCOD. A gynecologist can check with simple tests (blood tests, ultrasound). This is not a diagnosis.'];
  if(n>=2||irr) return ['Worth mentioning to a doctor','A few signs could have many causes. Track your cycle and mention these at your next check-up.'];
  return ['No strong signs from this check','Keep tracking your cycle. See a doctor if your periods change or something worries you.'];
}
function pcosTab(){
  const done=Object.keys(state.pcos).length===PCOS_Q.length, r=done?pcosResult():null;
  return `<div class="slider-card"><p class="section-title">PCOS / PCOD self-check</p>
  ${PCOS_Q.map((q,i)=>`<div style="margin-bottom:10px"><p style="font-size:13px;margin:0 0 6px">${i+1}. ${q}</p><div class="chip-row"><div class="chip ${state.pcos[i]===1?'active':''}" onclick="pcosAns(${i},1)">Yes</div><div class="chip ${state.pcos[i]===0?'active':''}" onclick="pcosAns(${i},0)">No</div></div></div>`).join('')}
  ${r?`<div class="alert warning" style="margin-top:8px"><div><b>${r[0]}</b>${r[1]}</div></div><button class="btn btn-teal" style="width:100%;margin-top:8px" onclick="setPage('doctors')">Find a doctor</button>`:'<p style="font-size:12px;color:var(--inksoft)">Answer all questions to see a suggestion.</p>'}
  <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="state.pcos={};render()">Start again</button>
  <p style="font-size:11px;color:var(--inksoft);margin-top:8px">A screening aid only — it cannot diagnose PCOS/PCOD. Only a doctor can.</p></div>`;
}
/* Hygiene */
function hygTab(){
  const G=[['🔄 How often to change',['Pads: every 4–6 hours, even if flow is light (never beyond 8 h)','Tampons: every 4–8 hours; never overnight beyond 8 h','Menstrual cup: empty every 8–12 hours','Change sooner if heavy flow or it feels full or wet']],
  ['🧼 Staying clean',['Wash hands before and after changing','Wash the outer genital area with plain water; avoid douching and perfumed products','Wear clean, dry cotton underwear','Cloth pads: wash with soap, dry fully in sunlight']],
  ['🗑️ Safe disposal',['Wrap the used pad in its wrapper, paper or a bag','Put it in a dustbin — never flush pads or tampons','Keep sanitary waste separate from wet kitchen waste; use red/designated bins if available','Wash hands afterwards']],
  ['⚠️ See a doctor if',['You soak a pad every hour for several hours','Unusual smell, itching, burning or discharge','Fever, rash or dizziness while using a tampon (seek urgent care)']]];
  return G.map(g=>`<div class="slider-card" style="margin-bottom:10px"><p class="section-title">${g[0]}</p>${g[1].map(x=>`<p style="font-size:13px;margin:0 0 6px">• ${x}</p>`).join('')}</div>`).join('');
}
/* Doctor report */
function buildReport(){
  const recs=[...state.periodRecords].sort((a,b)=>b.start-a.start).slice(0,6);
  const lv=state.pain.map(p=>p.level), avg=lv.length?(lv.reduce((a,b)=>a+b,0)/lv.length).toFixed(1):'not logged';
  const sy=Object.entries(state.symptoms).slice(0,5).map(([d,l])=>`${d}: ${l.join(', ')}`);
  const med=state.meds.map(m=>`${esc2(m.name)} ${esc2(m.dose)}`);
  const recent=state.medLog.slice(0,8).map(l=>`${esc2(l.name)} — ${new Date(l.t).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`);
  const li=a=>a.length?'<ul>'+a.map(x=>`<li>${esc2(x)}</li>`).join('')+'</ul>':'<p>None logged</p>';
  const pr=Object.keys(state.pcos).length===PCOS_Q.length?pcosResult()[0]+` (${pcosScore()}/${PCOS_Q.length} signs)`:'Not done';
  return `<html><head><title>Doctor Report</title><style>body{font:13px Arial;margin:24px;color:#222}h1{font-size:20px;margin:0}h2{font-size:14px;border-bottom:1px solid #999;margin:14px 0 4px}ul{margin:4px 0;padding-left:18px}small{color:#666}</style></head><body><h1>Cycle &amp; Health Summary</h1><small>Generated ${fmtDate(new Date())} from Smart Period Relief (self-reported)</small>
  <h2>Cycle</h2><p>Typical cycle length: ${state.cycleLength} days · Avg period length: ${avgPeriodDuration()} days</p>${li(recs.map(r=>fmtDate(r.start)+(r.end?' to '+fmtDate(r.end):' (ongoing)')))}
  <h2>Pain</h2><p>Average logged pain: ${avg}/10${lv.length?` · Latest: ${lv[0]}/10`:''}</p>
  <h2>Symptoms</h2>${li(sy)}<h2>Medicines</h2>${li(med)}<p><b>Recent doses</b></p>${li(recent.map(x=>x.replace(/&amp;/g,'&')))}
  <h2>PCOS/PCOD self-check</h2><p>${esc2(pr)}</p>${state.doctorQuestions.trim()?`<h2>Questions for the doctor</h2><p>${esc2(state.doctorQuestions)}</p>`:''}
  <p><small>Self-reported information, not a diagnosis.</small></p><script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`;
}
function printReport(){ printFullReport(); }
function reportTab(){
  return `<div class="slider-card"><p class="section-title">One-page doctor report</p>
  <p style="font-size:13px;line-height:1.5;margin:0 0 10px">Puts your recent period dates, cycle length, pain, symptoms, medicines and PCOS self-check on one printable page to show at a clinic.</p>
  <button class="btn btn-berry" style="width:100%" onclick="printReport()">🖨️ Open report / Save as PDF</button>
  <p style="font-size:11px;color:var(--inksoft);margin-top:8px">Built only from what you've logged. Add your questions on the Doctors page first.</p></div>`;
}
/* ===== Blood banks ===== */
const BB_GROUPS={'O-':['O-'],'O+':['O+','O-'],'A-':['A-','O-'],'A+':['A+','A-','O+','O-'],'B-':['B-','O-'],'B+':['B+','B-','O+','O-'],'AB-':['AB-','A-','B-','O-'],'AB+':['AB+','AB-','A+','A-','B+','B-','O+','O-']};
function bbCity(){ return state.bbCity===undefined ? 'Karimnagar' : state.bbCity; }
function openBB(){ const c=(bbCity()||'').trim(); window.open('https://www.google.com/maps/search/'+encodeURIComponent('blood bank '+(c?'in '+c:'near me')),'_blank','noopener'); }
/* ===== Blood donor registry (stored on this device only) ===== */
function dF(){ return state.dForm||(state.dForm={name:'',phone:'',group:'',city:'Karimnagar',consent:false}); }
function dSet(k,v,r){ dF()[k]=v; if(r) render(); }
function saveDonor(){
  const f=dF(), name=f.name.trim(), ph=f.phone.replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
  if(!name) return alert('Please enter your name.');
  if(!/^[6-9]\d{9}$/.test(ph)) return alert('Enter a valid 10-digit mobile number.');
  if(!BB_GROUPS[f.group]) return alert('Please choose your blood group.');
  if(!f.consent) return alert('Please tick the consent box.');
  state.donors=state.donors||[];
  state.donors.unshift({id:Date.now(),name,phone:ph,group:f.group,city:f.city.trim(),t:new Date().toLocaleDateString()});
  state.dForm=null; render();
}
function delDonor(id){ state.donors=(state.donors||[]).filter(d=>d.id!==id); render(); }
function waOpen(text,phone){ window.open('https://wa.me/'+(phone?'91'+phone:'')+'?text='+encodeURIComponent(text),'_blank','noopener'); }
function waShareDonor(id){ const d=(state.donors||[]).find(x=>x.id===id); if(d) waOpen(`🩸 Blood donor available\nName: ${d.name}\nBlood group: ${d.group}\nCity: ${d.city}\nMobile: ${d.phone}`); }
function waRequest(){ const g=state.dFind||'(group)'; waOpen(`🩸 URGENT: ${g} blood needed in ${bbCity()||'my city'}. Please contact me if you can donate or know a donor.`); }
function donorCards(){
  const f=dF(), all=state.donors||[], find=state.dFind||'';
  const list = find ? all.filter(d=>BB_GROUPS[find].includes(d.group)) : all;
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🙋 Register as a blood donor</p>
    <input class="field" placeholder="Your name" value="${esc2(f.name)}" oninput="dSet('name',this.value)">
    <input class="field" type="tel" inputmode="numeric" maxlength="13" placeholder="Mobile number" value="${esc2(f.phone)}" oninput="dSet('phone',this.value)" style="margin-top:8px">
    <input class="field" placeholder="City" value="${esc2(f.city)}" oninput="dSet('city',this.value)" style="margin-top:8px">
    <div class="chip-row" style="margin-top:8px">${Object.keys(BB_GROUPS).map(x=>`<div class="chip ${f.group===x?'active':''}" onclick="dSet('group','${x}',1)">${x}</div>`).join('')}</div>
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;margin-top:10px;color:var(--inksoft)"><input type="checkbox" ${f.consent?'checked':''} onchange="dSet('consent',this.checked)"> I agree that my name, blood group, city and mobile number can be shown to people who need blood.</label>
    <button class="btn btn-berry" style="width:100%;margin-top:10px" onclick="saveDonor()">Register</button></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Find a donor</p>
    <div class="chip-row"><div class="chip ${find?'':'active'}" onclick="state.dFind='';render()">All</div>${Object.keys(BB_GROUPS).map(x=>`<div class="chip ${find===x?'active':''}" onclick="state.dFind='${x}';render()">I need ${x}</div>`).join('')}</div>
    ${list.length?list.map(d=>`<div class="settings-row" style="display:block;padding:10px 0"><div style="display:flex;justify-content:space-between"><b>${esc2(d.name)}</b><b style="color:var(--berry-600)">${d.group}</b></div><small style="color:var(--inksoft)">${esc2(d.city)} · registered ${d.t}</small><br><span style="font-size:13px">📱 ${d.phone}</span>
      <div class="chip-row" style="margin-top:6px"><a class="chip" href="tel:+91${d.phone}" style="text-decoration:none">📞 Call</a><div class="chip" onclick="waOpen('Hello, I found you in the blood donor list. I need ${find||d.group} blood in ${esc2(bbCity())}. Can you help?','${d.phone}')">💬 WhatsApp</div><div class="chip" onclick="waShareDonor(${d.id})">↗ Share</div><div class="chip" onclick="delDonor(${d.id})">Delete</div></div></div>`).join(''):`<p style="font-size:13px;color:var(--inksoft);margin:10px 0 0">${all.length?'No donor for this group on this device yet.':'No donors registered on this device yet.'}</p>`}
    <button class="btn btn-alt" style="width:100%;margin-top:8px" onclick="waRequest()">📢 Ask for blood on WhatsApp</button>
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0;line-height:1.5">Registrations are saved only on this phone. To reach other people, use Share / Ask on WhatsApp. Donors should be 18–65 and healthy; the blood bank checks eligibility.</p></div>`;
}

function bloodTab(){
  const g=state.bbGroup||'';
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">🩸 Find a blood bank</p>
    <input class="field" placeholder="City or area" value="${esc2(bbCity())}" oninput="state.bbCity=this.value">
    <button class="btn btn-berry" style="width:100%;margin-top:8px" onclick="openBB()">📍 Search blood banks on Google Maps</button>
    <div class="chip-row" style="margin-top:8px"><a class="chip" href="https://www.eraktkosh.in" target="_blank" rel="noopener" style="text-decoration:none">e-RaktKosh (official stock directory)</a><a class="chip" href="https://www.indianredcross.org" target="_blank" rel="noopener" style="text-decoration:none">Indian Red Cross</a></div>
    <p style="font-size:12px;color:var(--inksoft);margin:8px 0 0;line-height:1.5">Call the bank first to confirm your blood group is in stock. Emergency: <b>108</b> (ambulance) or <b>112</b>.</p></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Which blood can I receive?</p>
    <div class="chip-row">${Object.keys(BB_GROUPS).map(x=>`<div class="chip ${g===x?'active':''}" onclick="state.bbGroup='${x}';render()">${x}</div>`).join('')}</div>
    ${g?`<p style="font-size:13px;margin:10px 0 0">A person with <b>${g}</b> can receive: <b>${BB_GROUPS[g].join(', ')}</b></p><p style="font-size:11px;color:var(--inksoft);margin:4px 0 0">Hospitals do the final cross-matching. This is only a guide.</p>`:'<p style="font-size:12px;color:var(--inksoft);margin:8px 0 0">Tap your blood group.</p>'}</div>
  ${donorCards()}<div class="slider-card"><p class="section-title">Before you go</p>
    <p style="font-size:12px;color:var(--inksoft);line-height:1.6;margin:0">• Blood is given on a doctor's request (requisition form). Many banks also ask for a replacement donor or a fee.<br>• Bring ID, the doctor's note, the patient's blood group and the hospital name.<br>• Heavy periods rarely need a transfusion. A doctor decides this from your haemoglobin level.<br>• Soaking a pad every hour, feeling faint, or breathless: go to a hospital now.</p></div>`;
}

/* ===== PCOD / PCOS ===== */
const PCOD_SYM=['Periods irregular or fewer than 8 a year','Missed periods for 3 months or more','Extra hair on face, chest or belly','Acne or very oily skin','Hair thinning on the scalp','Weight gain, mostly around the belly','Dark, velvety patches on neck or underarms','Trouble getting pregnant','Frequent tiredness or mood swings'];
const PCOD_TIPS=[['🥗 Eat to balance sugar','Choose whole grains, millets (ragi, jowar), pulses, vegetables, fruit, nuts and eggs/paneer or lean protein. Cut sugary drinks, sweets, maida, fried and packaged food.'],
['🏃 Move regularly','Aim for about 150 minutes a week of brisk walking, cycling, dancing or yoga, plus strength exercises on 2 days.'],
['⚖️ Keep a healthy weight','If you are overweight, losing even 5–10% often helps cycles and hormones. Avoid crash diets and skipping meals.'],
['😴 Sleep and stress','Sleep 7–9 hours at fixed times. Try walking, yoga, breathing exercises or hobbies to lower stress.'],
['🚭 Avoid harmful habits','Avoid smoking and alcohol, and avoid late-night junk food.'],
['📅 Track your cycle','Log every period and flow in the Track tab. A record helps the doctor.'],
['🩺 Get checked','Ask a gynecologist about an ultrasound and blood tests (hormones, thyroid, sugar, cholesterol) if you have symptoms.'],
['🚫 No self-medication','Do not start hormone pills, metformin or other prescription medicines without a doctor.']];
function pcodTog(i){ const a=state.pcodSel||(state.pcodSel=[]); const k=a.indexOf(i); k<0?a.push(i):a.splice(k,1); render(); }
function pcodTab(){
  const sel=state.pcodSel||[], n=sel.length;
  const res = !n ? '' : n>=3 || sel.includes(1) ? ['#FDE3EC','#8E0F3F','Several signs match. Please see a gynecologist for proper tests. Only a doctor can diagnose PCOD/PCOS.'] : ['var(--surfacealt)','var(--ink)','A few signs. Keep tracking your cycle and follow the lifestyle tips. See a doctor if it continues or worsens.'];
  return `<div class="slider-card" style="margin-bottom:12px"><p class="section-title">What is PCOD / PCOS?</p>
    <p style="font-size:13px;line-height:1.6;margin:0">A hormone-related condition where periods become irregular and the body may make more male hormones (androgens). It is common in young women. It cannot always be prevented, but healthy habits lower the risk and help control it.</p></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">Symptom check</p>
    ${PCOD_SYM.map((t,i)=>`<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;padding:5px 0"><input type="checkbox" ${sel.includes(i)?'checked':''} onchange="pcodTog(${i})"> ${t}</label>`).join('')}
    ${res?`<div style="margin-top:10px;padding:10px;border-radius:10px;background:${res[0]};color:${res[1]};font-size:12px;font-weight:600">${res[2]}</div>`:''}
    <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0">This is not a diagnosis.</p></div>
  <div class="slider-card" style="margin-bottom:12px"><p class="section-title">How to lower the risk and manage it</p>
    ${PCOD_TIPS.map(([h,t])=>`<div style="padding:7px 0"><b style="font-size:13px">${h}</b><p style="font-size:12px;color:var(--inksoft);line-height:1.5;margin:2px 0 0">${t}</p></div>`).join('')}</div>
  <div class="slider-card"><p class="section-title">See a doctor if</p>
    <p style="font-size:12px;color:var(--inksoft);line-height:1.6;margin:0">• You miss periods for 3 months, or cycles are shorter than 21 or longer than 35 days<br>• Bleeding lasts over 7 days or is very heavy<br>• Hair growth, acne or hair loss increases quickly<br>• You have been trying to conceive for 6–12 months</p>
    <button class="btn btn-alt" style="width:100%;margin-top:10px" onclick="state.medQuery='pcos';openTools('meds')">💊 See PCOS-related medicines</button></div>`;
}

/* ===== Precautions ===== */
const PREC=[
{k:'Hygiene',ic:'🧼',d:['Change a pad every 4–6 hours, even on light days','Change a tampon every 4–8 hours; a cup every 8–12 hours','Wash hands before and after changing','Wash the outer area with plain water or a mild wash','Wear clean, dry cotton underwear','Wrap used pads and bin them'],a:['Reusing disposable pads','Douching or washing inside the vagina','Scented sprays, powders or harsh soaps','Leaving a tampon in overnight beyond 8 hours (toxic shock risk)','Flushing pads or tampons']},
{k:'Cramps',ic:'🔥',d:['Use gentle heat on the lower belly','Walk or do light stretches and yoga','Drink warm water and stay hydrated','Take a painkiller after food and follow the label gap','Rest and sleep well'],a:['Taking two painkillers with the same ingredient','Exceeding the label dose','Aspirin for period pain (it may increase bleeding)','Too much caffeine, very salty or fried food','Ignoring pain that stops you from daily life: see a doctor']},
{k:'Heavy bleeding',ic:'🩸',d:['Log flow daily in the Track → Flow tab','Eat iron-rich foods and rest','Drink fluids and eat regular meals','Keep spare pads with you','Get a haemoglobin test if you feel very tired'],a:['Aspirin','Heavy lifting or hard workouts if dizzy','Ignoring clots bigger than a coin','Soaking a pad every hour: go to a hospital now','Skipping meals']},
{k:'Diet',ic:'🥗',d:['Eat iron foods: greens, dates, jaggery, pulses, beetroot, eggs','Pair iron foods with vitamin C (lemon, amla, guava)','Eat whole grains, millets, fruits, nuts','Drink 2–3 litres of water a day','Eat small, regular meals'],a:['Tea or coffee with meals (blocks iron)','Sugary drinks, sweets, maida and deep-fried food','Very salty packaged snacks','Crash diets or skipping meals','Too much junk food during PMS']},
{k:'Exercise',ic:'🏃',d:['Walk 30 minutes most days','Do gentle yoga, cat-cow, child pose, butterfly','Do strength exercise 2 days a week','Warm up and cool down'],a:['Very intense workouts when weak or dizzy','Exercising through sharp pain','Long sitting without breaks','Skipping sleep for workouts']},
{k:'Heating belt',ic:'🔌',d:['Start on low heat and test on your skin','Use short sessions with breaks','Check your skin every 10–15 minutes','Keep the belt and wires dry','Switch it off and unplug when done','Ask a doctor first if pregnant or you have a medical implant'],a:['Sleeping with the belt on','Using it on broken, burnt or numb skin','Covering it with a blanket while heating','Using a damaged belt, wire or battery','Relying on the app alone: this is an academic prototype, not a certified medical device']},
{k:'Medicines',ic:'💊',d:['Read the label and the expiry date','Keep to the minimum gap between doses','Tell the doctor about allergies and other medicines','Store away from children','Take NSAIDs (ibuprofen, mefenamic acid) after food'],a:['Starting antibiotics, hormone pills or metformin without a prescription','Mixing several painkillers','Sharing prescription medicines','Long-term painkiller use without a doctor','Ignoring rash, swelling or breathing trouble: get help at once']},
{k:'Infections',ic:'🦠',d:['Wipe front to back','Pass urine after sex and drink enough water','Change out of wet clothes quickly','Use only pH-balanced external wash if needed','See a doctor for itching, burning or foul discharge'],a:['Scented products or tight synthetic underwear','Holding urine for long','Treating discharge with leftover antibiotics','Sharing towels or underwear']},
{k:'PCOD',ic:'🌸',d:['Keep a healthy weight','Exercise about 150 minutes a week','Eat low-sugar, high-fibre, protein-rich meals','Sleep 7–9 hours','Track your cycle and get tests if irregular'],a:['Crash diets','Smoking and alcohol','Late-night junk food','Hormone pills without a doctor']},
{k:'PMS & mood',ic:'💗',d:['Keep a regular sleep time','Walk, stretch or breathe slowly','Eat regular meals and drink water','Talk to someone you trust','Log your mood in the app'],a:['Too much caffeine and sugar','Isolating yourself','Ignoring low mood that lasts weeks: talk to a doctor','Bottling up thoughts of self-harm: tell someone now or call 112']},
{k:'Emergency',ic:'🚨',d:['Soaking a pad every hour for 2+ hours: go to hospital','Fainting, breathlessness or chest pain: call 108 / 112','Severe pain with fever or vomiting: see a doctor now','Severe pain or bleeding when pregnancy is possible: go to a hospital now','Use the 🆘 SOS button to message your contact with your location'],a:['Waiting at home hoping it passes','Driving yourself if you feel faint','Taking more painkillers than the label allows']}];
