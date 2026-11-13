function H(short, why, todo, doctor){
  let s = `**Short answer:** ${short}`;
  if(why) s += `\n\n**Why it may happen:** ${why}`;
  if(todo && todo.length) s += `\n\n**What you can do:**\n${todo.map(x=>'• '+x).join('\n')}`;
  if(doctor) s += `\n\n**When to see a doctor:** ${doctor}`;
  return s;
}
const HEALTH_TOPICS = [
  {re:/\bback ?pain\b|\bbackache\b|\blower back\b|\bback\b.*\bpain\b/, a:()=>H("Lower-back pain before or during a period is common.","The same prostaglandins that cause cramps can also make the lower back ache. Endometriosis or fibroids can sometimes add to it.",["Gentle heat on the lower back","Light stretching or a short walk","Rest and stay hydrated"],"If the pain is severe, keeps getting worse, or continues even when you are not on your period.")},
  {re:/\bheadache\b|\bmigraine\b|\bhead ache\b|\bhead\b.*\b(pain|hurts)\b/, a:()=>H("Headaches around periods are common and are often linked to hormone changes.","Estrogen levels drop just before a period, which can trigger headaches or migraines. Dehydration, poor sleep and skipped meals can add to it.",["Drink water and eat regular meals","Rest in a quiet, dim room","Keep a steady sleep routine and note when headaches happen"],"If headaches are very severe, come with vision changes, vomiting or fainting, or are new and worsening.")},
  {re:/\bbloat|\bbloating\b|\bbloated\b|\bswollen belly\b/, a:()=>H("Bloating before and during periods is very common.","Hormone shifts make your body hold more water and slow digestion.",["Drink plenty of water","Eat smaller meals; reduce salty and fried foods","Try light exercise or a short walk"],"If bloating is persistent, painful, or comes with weight loss or changes in bowel habits.")},
  {re:/\bnausea\b|\bnauseous\b|\bvomit|\bfeel sick\b/, a:()=>H("Feeling nauseous around your period can happen for some people.","Prostaglandins can upset the stomach and cause nausea or loose stools. Pregnancy can also cause nausea, so consider that if your period is late.",["Eat small, light meals","Sip water or ginger tea","Rest and avoid strong smells"],"If you keep vomiting, cannot keep fluids down, or feel very weak.")},
  {re:/\bheavy\b.*\b(bleed|flow|period)|\b(bleed|bleeding|flow)\b.*\bheavy\b|\btoo much (bleed|blood)\b|\bexcess.*bleed|\bsoaking\b/, a:()=>H("Heavy bleeding means soaking a pad or tampon every 1–2 hours, passing large clots, or bleeding for more than 7 days.","Hormonal imbalance, fibroids, polyps, PCOS, thyroid problems, bleeding disorders or some birth-control methods can cause it.",["Track how many pads or tampons you use each day","Drink fluids, rest and eat iron-rich foods","Log it in the Track section to show your doctor"],"Soon, if heavy periods are regular for you. Get urgent care if you soak a pad every hour for several hours, feel dizzy or faint, or are short of breath.")},
  {re:/\b(period|periods|mens|menses)\b.*\b(late|delay|delayed|missed|miss)\b|\b(late|delayed|missed)\b.*\b(period|periods)\b|\bnot (come|coming|came)\b|\braaledu\b|\bravatledu\b|\bmissed\b/, a:()=>H("A late period is common and often not serious — but if you could be pregnant, a pregnancy test is a good first step.","Stress, big changes in weight or exercise, illness, travel, thyroid problems, PCOS, or a naturally variable cycle can all delay a period.",["Take a home pregnancy test if pregnancy is possible","Note your last period date and log it in Track → Period","Keep sleep, meals and stress levels steady"],"If you miss 3 or more periods in a row, have a positive pregnancy test, have severe pain, or delays keep happening.")},
  {re:/\b(pcos|polycystic)\b/, a:()=>H("PCOS (polycystic ovary syndrome) is a common hormonal condition that affects ovulation.","It can involve irregular or missed periods, acne, extra facial or body hair, hair thinning and weight changes.",["Follow a balanced diet and stay active","Keep regular sleep and manage stress","Track your cycles to share with your doctor"],"If your periods are irregular for several months or you have these symptoms. PCOS needs a professional evaluation (history, blood tests, sometimes ultrasound) — an app cannot confirm it.")},
  {re:/\bendometriosis\b/, a:()=>H("Endometriosis is a condition where tissue similar to the womb lining grows outside the womb.","The exact cause isn't fully understood. It can cause painful periods, pelvic pain, pain during sex, heavy bleeding and sometimes fertility difficulties.",["Track your pain and symptoms","Gentle heat may help you feel more comfortable","Bring your notes to a gynecologist"],"If period pain is severe or getting worse, or comes with pain during sex, bowel movements or urination. Diagnosis needs a specialist.")},
  {re:/\bwhen\b.*\b(see|visit|consult|meet|go)\b.*\b(doctor|gyn\w*|gyno|gynecologist)\b|\bshould i (see|visit|consult)\b|\b(see|visit) (a |the )?(doctor|gyn\w*)\b/, a:()=>H("See a gynecologist when something is new, severe, worsening or simply worrying you — you don't have to wait until it feels 'serious enough'.",null,["Very painful periods that disrupt daily life","Very heavy bleeding, or periods irregular for several cycles","Unusual discharge, odor or itching","Pelvic pain outside your period, or pain during sex","A missed period with a positive pregnancy test"],"Urgently, for severe pain, fainting, or soaking a pad every hour. Use the Doctors page to find help nearby.")},
  {re:/\bhydration\b|\bhydrate\b|\bdrink water\b|\bwater\b/, a:()=>H("Staying hydrated can help ease bloating, headaches and fatigue during your period.",null,["Sip water through the day — you can log it on the Home page","Warm water or herbal tea can feel soothing","Limit very salty foods and too much caffeine"],"If you feel extremely thirsty, dizzy or are passing very little urine.")},
  {re:/\bhygiene\b|\bsanitary\b|\bpads?\b|\btampons?\b|\bmenstrual cup\b/, a:()=>H("Good period hygiene helps prevent irritation and infection.",null,["Change pads every 4–6 hours and tampons every 4–8 hours","Wash the outer genital area with plain water; avoid scented products","Wash hands before and after changing","Wear breathable cotton underwear"],"If you notice itching, strong odor, unusual discharge or burning.")},
  {re:/\b(period|menstrual|stomach|abdomen|abdominal|belly|tummy|noppi|dard)\b.*\b(pain|painful|hurt|hurts|hurting|ache|aching|cramp|cramps|noppi)\b|\b(pain|painful|hurt|hurts|ache|cramp|cramps)\b.*\b(period|menstrual|stomach|abdomen|belly|tummy)\b|\bcramps?\b|\bperiod noppi\b/, a:()=>H("Period pain (cramps) is very common and happens because the uterus contracts to shed its lining.","Hormone-like chemicals called prostaglandins make the uterine muscle tighten. Pain can be stronger with heavy flow, stress, or conditions like endometriosis or fibroids.",["Apply gentle heat to your lower abdomen (heating pad, or the belt's heat within its safe limits)","Drink water, rest, and try light walking or stretching","Over-the-counter pain relief may help if it's safe for you — follow the label and ask a pharmacist or doctor if unsure"],"If the pain stops you from doing daily activities, keeps getting worse, doesn't improve with self-care, or comes with very heavy bleeding, fever or fainting.")}
];

function aiHealth_ask(c, lower){
  for(const t of HEALTH_TOPICS){
    if(t.re.test(c) || t.re.test(lower)) return t.a();
  }
  for(const topic of AI_TOPICS){
    if(topic.kw.some(k=>c.includes(k) || lower.includes(k))) return topic.a;
  }
  return null;
}

const AI_SCOPE_RE=/\b(?:periods?|menstru|cramp|pain|ache|bleed|spotting|flow|clot|pcos|pcod|ovar|ovulat|endometr|fibroid|cycle|late period|missed|irregular|pregnan|hormon|pms|mood|pads?|tampon|cups?|hygien|discharge|itch|infect|uti|urine|acne|hair|weight|breast|nausea|vomit|headache|dizz|fatigue|tired|weak|fever|anemi|anaemi|iron|haemoglobin|hemoglobin|vitamin|diet|food|water|exercise|yoga|sleep|stress|medic|tablet|pills?|painkill|drug|dose|doctor|gyn|hospital|clinic|blood|donor|sos|emergency|symptom|health|women|girls?|belt|heat|heater|vibrat|sensor|esp32|heart|spo2|oxygen|temperature|steps|apps?|project|team|member|college|guide|hod|device|wifi|backup|report|install|track|calendar|reminder|precaution|aushadhi|jits|knr)/i;
const AI_OFFTOPIC="Sorry, I can only answer questions about periods, women's health, and this Smart Period Relief app and project. Please ask something related — for example cramps, heavy bleeding, PCOS, medicines, hygiene, or how the belt works.";
function aiService_ask(rawText){
  const lower = rawText.toLowerCase();
  const c = normalizeQuery(rawText);
  if(detectEmergency(lower) || detectEmergency(c)){
    return {urgent:true, text:"Seek urgent medical care now. These symptoms should be evaluated in person right away — please don't wait on a chat response.\n\nEmergency Number (India): 112"};
  }
  if(/^(hi+|hello+|hey+|hai|hii+|namaste|namaskaram|good (morning|evening|afternoon)|thanks|thank you|thankyou|ok|okay)$/.test(c)){
    return {urgent:false, text:"Hello! I'm the Smart Period Relief Belt assistant. I only answer questions about periods, women's health, and this app or project. Ask me about cramps, heavy bleeding, PCOS, medicines, hygiene, or how the belt works."};
  }
  if(!AI_SCOPE_RE.test(lower) && !AI_SCOPE_RE.test(c)) return {urgent:false, text:AI_OFFTOPIC};
  const proj = aiProject_ask(c, rawText);
  if(proj !== null) return {urgent:false, text:proj};

  let health = aiHealth_ask(c, lower);
  if(health !== null){
    if(state.aiUseData && /this month|more pain|worse|my cycle|my data/.test(lower)){
      const levels = state.pain.map(p=>p.level);
      if(levels.length){
        const avg = (levels.reduce((a,b)=>a+b,0)/levels.length).toFixed(1);
        health += `\n\n**From your tracked data:** your logged average pain is ${avg}/10, with your latest entry at ${levels[0]}/10${state.lastPeriodStart?`, and you're on cycle day ${cycleDayToday()}`:''}. This is just what you've recorded, not a diagnosis.`;
      }
    }
    return {urgent:false, text: health + "\n\n_General educational information, not a diagnosis — a healthcare professional can evaluate your specific situation._"};
  }
  if(/\b(project|belt|guide|hod|team|college)\b/.test(c)) return {urgent:false, text:NO_INFO};
  return {urgent:false, text:"I couldn't quite catch that. I can help with period and women's health questions (cramps, late or heavy periods, PCOS, endometriosis, when to see a gynecologist) and with questions about this project (college, guide, HOD, team, how the belt works). Try rephrasing, or tap a quick question above."};
}

const QUICK_QUESTIONS = [
  ['Painful period','Why is my period painful?'],
  ['Late period','My period is late'],
  ['Heavy bleeding','Why is my bleeding heavy?'],
  ['Irregular cycle','Is irregular menstruation common?'],
  ['Discharge','Why do I have white discharge?'],
  ['PCOS','What is PCOS?'],
  ['Endometriosis','What is endometriosis?'],
  ['See a doctor?','When should I see a gynecologist?'],
  ['Who made this?','Who made this project?'],
  ['Team','Who are the team members?'],
];

// ---------- chat state & rendering ----------
let aiTyping = false; // deliberately NOT in `state`, so it can never get saved/stuck

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function fmtChat(s){
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
    .replace(/(^|\s)_(.+?)_(?=\s|$|[.,])/g,'$1<i>$2</i>')
    .replace(/\n/g,'<br>');
}
function chatRender(refocus){
  const a = document.activeElement;
  const wasFocused = refocus || (a && a.id==='chatInput');
  render();
  if(state.page!=='ai') return;
  const end = document.getElementById('chatEnd');
  if(end) end.scrollIntoView({behavior:'smooth', block:'end'});
  if(wasFocused){
    const i = document.getElementById('chatInput');
    if(i){ i.focus(); const n=i.value.length; try{ i.setSelectionRange(n,n); }catch(e){} }
  }
}
function sendChat(text){
  if(aiTyping) return;
  const fromInput = (text===undefined);
  const msg = (fromInput ? state.chatInput : text).trim();
  if(!msg) return;
  state.chatMessages.push({role:'user', text:msg});
  if(state.chatMessages.length>100) state.chatMessages = state.chatMessages.slice(-100);
  state.chatInput = '';
  aiTyping = true;
  chatRender(fromInput);           // user's message + typing indicator show immediately
  setTimeout(()=>{
    let res;
    try{ res = aiService_ask(msg); }
    catch(e){ console.warn('AI error', e); res = {urgent:false, text:"Sorry, something went wrong while answering. Please try again."}; }
    aiTyping = false;              // always removed, even on error
    state.chatMessages.push({role:'ai', text:res.text, urgent:res.urgent});
    chatRender(false);
  }, 700);
}
function toggleAiUseData(){ state.aiUseData = !state.aiUseData; render(); }
function clearChat(){ state.chatMessages = []; aiTyping = false; render(); }

function aiPage(){
  const msgs = state.chatMessages;
  return `
  <div class="page active">
    <header class="top"><div><h1>AI Women's Health Assistant</h1><p>Ask about periods, women's health, or the Smart Period Relief Belt project.</p></div></header>
    <div class="alert warning"><div><b>NOT A DOCTOR</b>Educational information only — not a diagnosis or prescription. For emergencies, call 112 (India) or your local emergency number.</div></div>
    <div class="therapy-toggle">
      <div><div class="t">Use my tracked data</div><div class="d">Lets answers reference your logged pain/cycle — off by default</div></div>
      <div class="switch ${state.aiUseData?'on':''}" onclick="toggleAiUseData()"><div class="knob"></div></div>
    </div>
    <div class="therapy-toggle">
      <div><div class="t">Language</div><div class="d">Ask and get answers in your language</div></div>
      ${window.langSelectHtml?window.langSelectHtml('chatLang'):''}
    </div>
    <div class="qchip-row">${QUICK_QUESTIONS.map(([label,q])=>`<div class="chip" onclick="sendChat('${q.replace(/'/g,"\\'")}')">${label}</div>`).join('')}</div>
    <div class="slider-card chat-wrap">
      ${msgs.length===0 && !aiTyping?`<p style="font-size:13px;color:var(--inksoft);">Ask a question below or tap a quick topic to start.</p>`:''}
      ${msgs.map(m=>`<div class="bubble ${m.urgent?'urgent':m.role}" dir="auto">${fmtChat(m.text)}${m.note?`<div class="bnote">${escapeHtml(m.note)}</div>`:''}${m.urgent?`<div class="actions" style="margin-top:10px;"><button class="btn btn-garnet" onclick="setPage('doctors')" style="grid-column:1/3;">Find Nearby Medical Help</button></div>`:''}</div>`).join('')}
      ${aiTyping?`<div class="bubble ai typing"><div class="tlabel">AI is thinking…</div><div class="dots"><i></i><i></i><i></i></div></div>`:''}
      <div id="chatEnd"></div>
    </div>
    <div class="chat-input-row">
      <input id="chatInput" dir="auto" class="field" type="text" autocomplete="off" placeholder="Type your question…" value="${escapeHtml(state.chatInput)}" oninput="state.chatInput=this.value" onkeydown="if(event.key==='Enter')sendChat()">
      <button class="btn btn-berry" onclick="sendChat()">Send</button>
    </div>
    ${msgs.length>0?`<a class="linklike" style="font-size:12px;" onclick="clearChat()">Clear conversation</a>`:''}
  </div>`;
}

// ============ FIND A GYNECOLOGIST ============
// NOTE: no doctor/clinic database or Places API key is available in this
// static page, so results are NOT fabricated in-app cards. Instead this
// opens a live, dynamically-built Google Maps search — real data, no
// invented names or addresses. A doctorService layer is stubbed below so a
// real Places/Practo-style API (via a backend that hides the key) can
// replace the Maps link later.

