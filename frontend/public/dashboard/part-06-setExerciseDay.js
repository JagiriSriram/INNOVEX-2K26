function setExerciseDay(d){ state.exerciseDay=d; render(); }

function exercisePage(){
  const auto = cycleDayToday();
  const day = state.exerciseDay || auto || 1;
  const phase = getPhase(day, state.cycleLength);
  const days = Array.from({length: state.cycleLength}, (_,i)=>i+1);
  return `
  <div class="page active">
    <header class="top"><div><h1>Exercise</h1><p>Changes with your cycle day</p></div></header>
    ${auto ? `<p style="font-size:12px;color:var(--inksoft);margin:-6px 0 2px;">Auto-set to today — cycle day ${auto}. Pick another day below to preview it.</p>` : `<p style="font-size:12px;color:var(--inksoft);margin:-6px 0 2px;">No period logged yet — showing day ${day}. Log a period on Track to auto-sync.</p>`}
    <div class="daypills">${days.map(d=>`<div class="pill ${day===d?'active':''}" onclick="setExerciseDay(${d})">Day ${d}</div>`).join('')}</div>
    <div class="slider-card">
      <span class="phase-tag tone-${phase.tone}">${phase.name}</span>
      ${phase.exercises.map(([name,dur])=>`<div class="ex-item"><span>${name}</span><span style="color:var(--inksoft);">${dur}</span></div>`).join('')}
    </div>
    <p style="font-size:11px;color:var(--inksoft);line-height:1.5;">Suggestions only — ease off further on high-pain or emergency-stop days.</p>
  </div>`;
}

// ============ AI WOMEN'S HEALTH ASSISTANT ============
// NOTE: this runs as a rule-based, keyword-matched educational responder.
// A published static page cannot securely hold a real AI API key or call
// api.anthropic.com, so this is NOT a live generative AI — it's a scripted
// service layer (aiService.ask) that a real backend-proxied AI API could
// replace later without changing the chat UI below.

const EMERGENCY_KEYWORDS = ['severe pain','unbearable pain','can\'t breathe',"can't breathe",'cannot breathe','difficulty breathing','chest pain','fainted','fainting','passed out','lost consciousness','unconscious','soaking a pad every hour','soaking through a pad','very heavy bleeding','heavy bleeding and dizzy','severe allergic','swelling of my face','trouble breathing','severe dizziness','can\'t stand',"can't stand",'severe weakness','high fever and','suspected pregnancy with severe','life threatening','life-threatening'];

const AI_TOPICS = [
  {kw:['cramp'], a:"Period cramps happen when the uterus contracts to shed its lining, and prostaglandins (hormone-like chemicals) drive the intensity. Mild-to-moderate cramps are common. This symptom can have several possible causes — a healthcare professional can evaluate your history to see if something like endometriosis or fibroids needs ruling out if they're severe or worsening."},
  {kw:['late period','period is late','missed period'], a:"A late period can come from pregnancy, stress, significant weight change, intense exercise, thyroid changes, PCOS, or simply a naturally variable cycle. This symptom can have several possible causes — a healthcare professional can evaluate your symptoms and history to determine the cause, and a home pregnancy test is a reasonable first step if that's possible for you."},
  {kw:['irregular','cycle length','cycle varies'], a:"Irregular cycles are fairly common, especially in the first few years after periods start and around perimenopause, and can also relate to PCOS, thyroid conditions, stress, or significant weight changes. Tracking your cycle length over a few months gives a doctor useful information to work with."},
  {kw:['heavy bleeding','heavy flow','soaking'], a:"Heavy bleeding (needing to change a pad/tampon every hour or two, or passing large clots) can have causes ranging from hormonal imbalance to fibroids to bleeding disorders. This symptom can have several possible causes — a healthcare professional can evaluate this properly, and if it's soaking through protection every hour, that's worth urgent attention (see the note below)."},
  {kw:['spotting'], a:"Spotting between periods can relate to ovulation, hormonal birth control, early pregnancy, or occasionally other causes. If it's persistent or paired with pain, it's worth discussing with a gynecologist."},
  {kw:['white discharge','discharge'], a:"Some white or clear discharge through the cycle is normal and changes with your hormones. Discharge that's thick, has a strong odor, or comes with itching or irritation can point to an infection, which a professional can check with a simple exam."},
  {kw:['itch','itching'], a:"Vaginal itching is often caused by yeast infections, irritation from products (soap, detergent), or skin conditions. This symptom can have several possible causes — a healthcare professional can evaluate your symptoms and history to determine the cause and the right treatment."},
  {kw:['pelvic pain'], a:"Pelvic pain can come from period cramps, ovulation, digestive causes, urinary tract infections, or conditions like endometriosis or ovarian cysts. This symptom can have several possible causes — a healthcare professional can evaluate your symptoms and history to determine the cause, especially if it's persistent or severe."},
  {kw:['painful period','dysmenorrhea'], a:"Periods that are painful enough to disrupt daily life aren't something you just have to live with — they can sometimes point to endometriosis, fibroids, or other treatable causes. A gynecologist can help figure out what's driving it."},
  {kw:['pcos'], a:"PCOS (polycystic ovary syndrome) is a hormonal condition that can involve irregular periods, acne, excess hair growth, and weight changes. Diagnosis needs a professional evaluation (symptoms, bloodwork, sometimes ultrasound) — it isn't something an app can confirm."},
  {kw:['endometriosis'], a:"Endometriosis is a condition where tissue similar to the uterine lining grows outside the uterus, often causing painful periods, pelvic pain, and sometimes fertility difficulties. Diagnosis typically needs a specialist evaluation."},
  {kw:['fibroid'], a:"Fibroids are non-cancerous growths in or around the uterus. They're common and often cause no symptoms, but can sometimes cause heavy bleeding or pelvic pressure. A doctor can check for them with an ultrasound if needed."},
  {kw:['cyst'], a:"Ovarian cysts are fluid-filled sacs on the ovary. Many are harmless and resolve on their own, but persistent or painful ones should be checked by a doctor, usually with an ultrasound."},
  {kw:['pmdd'], a:"PMDD (premenstrual dysphoric disorder) is a more severe form of PMS involving significant mood symptoms before your period. It's a recognized condition that a doctor or mental-health professional can help diagnose and manage."},
  {kw:['pms','mood swing','mood change'], a:"PMS symptoms — mood changes, bloating, breast tenderness, irritability — are common in the days before a period, driven by hormone shifts. If they're severely disrupting your life, it's worth flagging to a doctor, since options like PMDD-specific care exist."},
  {kw:['menopause','perimenopause'], a:"Perimenopause is the transition period before menopause, often involving irregular cycles and symptoms like hot flashes. Menopause is confirmed after 12 months without a period. A doctor can help manage symptoms and confirm what stage you're in."},
  {kw:['intercourse','sex hurts','painful sex'], a:"Pain during intercourse can have several causes — infections, dryness, endometriosis, or other conditions. This is common and treatable, and a gynecologist can help identify the cause without judgment."},
  {kw:['urination','peeing hurts','burning when i pee'], a:"Pain during urination often points to a urinary tract infection, though other causes exist. This symptom can have several possible causes — a healthcare professional can evaluate your symptoms and history to determine the cause, and UTIs are usually straightforward to treat once identified."},
  {kw:['odor','smell'], a:"Changes in odor can sometimes indicate an infection like bacterial vaginosis. This symptom can have several possible causes — a healthcare professional can evaluate your symptoms and history to determine the cause with a simple exam."},
  {kw:['when should i see','see a gynecologist','see a doctor'], a:"General guidance: see a gynecologist if periods are very painful, very heavy, irregular for several cycles, if you have unusual discharge/odor/itching, pelvic pain outside your period, or any symptom that's new, worsening, or worrying you. You don't need to wait for something to feel 'serious enough.'"},
  {kw:['what should i track','what questions should i ask','before visiting'], a:"Useful things to bring to a gynecologist visit: your last few period start/end dates, cycle length, pain levels, any symptoms (cramps, bleeding pattern, discharge), and specific questions you want answered. Track → Period and Track → Symptoms in this app, plus the 'Generate Doctor Visit Summary' on the Doctors page, can put this together for you."},
];

function detectEmergency(text){
  const t = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(k=>t.includes(k));
}

// ============ PROJECT IDENTITY / TEAM CREDITS ============
// Official configured project information. The assistant answers project
// questions ONLY from this object and never guesses anything else.
const PROJECT_IDENTITY = {
  name: "Smart Period Relief Belt",
  type: "Student Innovation / Smart Wearable Women's Health Technology",
  leader: "Parshuram Reddy",
  members: ["Mahitha","Harini","Rishwitha","Bindu"]
};
const NO_INFO = "I don't have that project information available.";

// ---------- typo / casual-typing / Telugu-English normalisation ----------
const TOKEN_ALIASES = {
  clg:'college', colg:'college', collge:'college', collage:'college', collages:'college', colleg:'college', collegee:'college', colleges:'college',
  guid:'guide', gide:'guide', gudie:'guide', guied:'guide', guides:'guide', guyd:'guide',
  hods:'hod',
  leadr:'leader', ledaer:'leader', lider:'leader', leder:'leader', leaders:'leader',
  teem:'team', tem:'team', teamates:'teammates', teamate:'teammates', teammate:'teammates', tammates:'teammates',
  memebers:'members', membrs:'members', memebrs:'members', membars:'members', member:'members',
  made:'made', make:'made', makes:'made', maked:'made', create:'made', creates:'made', created:'made',
  develop:'made', develops:'made', developed:'made', devloped:'made', develope:'made', developd:'made', devlop:'made',
  built:'made', build:'made', design:'made', designed:'made',
  chesaru:'made', chesadu:'made', chesindi:'made', chesara:'made', chesaaru:'made', chesam:'made',
  evaru:'who', evru:'who', evari:'who', whos:'who is',
  enti:'what', entidi:'what', emiti:'what',
  unnaru:'are', unnara:'are',
  ur:'your', ure:'your', dis:'this', wht:'what', wat:'what', wut:'what',
  pcod:'pcos', crams:'cramps', paining:'pain', pian:'pain', painfull:'painful', painfl:'painful',
  periodd:'period', preiod:'period', peroid:'period', perod:'period', periods:'period',
  bleding:'bleeding', bleeeding:'bleeding'
};
const FUZZY_VOCAB = ['college','members','developer','creator','teammates','department','project','bleeding','painful','endometriosis',
  'menstrual','irregular','discharge','gynecologist','gynaecologist','hydration','leader','mentor','headache','nausea','bloating','period','cramps'];

function editDistance(a,b){
  const m=a.length, n=b.length, d=[];
  for(let i=0;i<=m;i++){ d[i]=[i]; }
  for(let j=1;j<=n;j++){ d[0][j]=j; }
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    }
  }
  return d[m][n];
}
function fixToken(t){
  if(Object.prototype.hasOwnProperty.call(TOKEN_ALIASES,t)) return TOKEN_ALIASES[t];
  if(t.length<6 || /\d/.test(t) || FUZZY_VOCAB.includes(t)) return t;
  const maxD = t.length>=8 ? 2 : 1;
  let best=t, bd=99;
  for(const v of FUZZY_VOCAB){
    if(Math.abs(v.length-t.length)>maxD) continue;
    const d=editDistance(t,v);
    if(d<=maxD && d<bd){ bd=d; best=v; }
  }
  return best;
}
function normalizeQuery(raw){
  let t = String(raw).toLowerCase().replace(/[\u2019']/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  t = t.replace(/\bhead of (the )?(department|dept)\b|\b(department|dept) head\b/g,'hod');
  t = t.replace(/\bteam ?mates?\b/g,'teammates').replace(/\bproject members?\b/g,'team members');
  return t.split(' ').map(fixToken).join(' ');
}

// ---------- project intent detection ----------
function aiProject_ask(c, raw){
  const short = raw.trim().split(/\s+/).length <= 3;
  const P = PROJECT_IDENTITY;
  const projectCtx = /\b(project|belt|device|team|college|guide|hod|leader|this|your|jits|knr)\b/.test(c);
  const asksDetail = /\b(qualification|qualifications|designation|department|age|phone|mobile|number|email|mail|salary|degree|experience|address|photo|contact|linkedin)\b/.test(c);
  const named = c.match(/\b(mahitha|harini|rishwitha|bindu)\b/);

  if(/\b(hod|ravikiran|guide|mentor|karthik)\b/.test(c)) return NO_INFO;
  if(/\b(leader|parshuram)\b/.test(c)){
    if(asksDetail) return NO_INFO;
    return short ? `${P.leader} is our Team Leader.` : `${P.leader} is the Team Leader of the ${P.name} project.`;
  }
  if(named){
    const n = named[1].charAt(0).toUpperCase()+named[1].slice(1);
    if(asksDetail) return NO_INFO;
    return `${n} is a team member of the ${P.name} project. The Team Leader is ${P.leader}.`;
  }
  if(/\b(team|teammates|members)\b/.test(c)){
    if(/\bare\b|\bwho\b|\bteam\b|\bmembers\b|\bteammates\b/.test(c)){
      return short || /\bwho are\b|\bteam members\b|\bteammates\b|\bteam\b/.test(c)
        ? `Team Leader: ${P.leader}\n\nTeam Members:\n${P.members.map(m=>'• '+m).join('\n')}`
        : `Our team members are ${P.members.join(', ')}. ${P.leader} is the Team Leader.`;
    }
  }
  if(/\b(college|jits|jyothishmathi|institute|university|knr)\b/.test(c)) return NO_INFO;
  if(/\bwho\b.*\bmade\b|\bmade\b.*\b(by|who)\b|\bdevelopers?\b|\bcreators?\b|\bdesigners?\b|\bwho\b.*\bstudents\b/.test(c)){
    return `The ${P.name} was developed by students. The Team Leader is ${P.leader}, and the team members are ${P.members.slice(0,-1).join(', ')}, and ${P.members[P.members.length-1]}.`;
  }
  if(/\b(belt|device)\b.*\b(work|works|avutundi|avtundi|function)\b|\b(how|ela)\b.*\b(belt|device)\b|\bfeatures?\b|\b(pain|cramps?)\b.*\b(ki|for)\b.*\b(use|belt|helps?)\b|\b(belt|device)\b.*\b(pain|cramps?|helps?|useful|benefit)\b/.test(c)){
    return `The ${P.name} is a student-developed smart wearable designed to give period-care comfort support. In this app you can:\n• Control the belt's heat and vibration from the Therapy page\n• Watch body temperature — the heater is disabled automatically at ${state.threshold}°C or above\n• Use the Emergency Stop to lock therapy out instantly\n• Connect the belt over ESP32 (tap the connection status on Home)\n• Track periods, pain, symptoms and hydration\n• Find gynecologists and chat with this assistant\n\nGentle heat may help you feel more comfortable during cramps. The belt supports comfort — it does not cure or medically treat any condition.`;
  }
  if(/\bsmart period relief\b|\brelief belt\b|\b(what|tell)\b.*\b(project|belt)\b|\babout\b.*\b(project|belt)\b|^what is this$|^what is it$/.test(c)){
    return `The ${P.name} is a student-developed smart wearable project focused on period-care support. It is a ${P.type} project, and this app pairs the belt with period tracking, pain and hydration tracking, temperature monitoring, gynecologist finder and this Women's Health Assistant.`;
  }
  if(projectCtx && /\b(sponsor|sponsors|award|awards|founder|investor|funded|funding|price|cost|launch|patent|batch|year|semester|branch|department|prize|budget|competition)\b/.test(c)){
    return NO_INFO;
  }
  return null;
}

// ---------- structured women's-health answers ----------
