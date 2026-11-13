const MED_PRESETS=[['Paracetamol','500 mg',4],['Ibuprofen','400 mg',6],['Mefenamic acid','250 mg',8],['Iron + folic acid','1 tablet',24]];
/* Medicines */
function addMed(n,d,g){
  n=(n||'').trim(); if(!n) return;
  state.meds.push({id:Date.now()+Math.random(),name:n,dose:(d||'').trim(),gap:Math.max(0.5,+g||6)});
  state.medForm={n:'',d:'',g:6}; render();
}
function removeMed(id){ if(confirm('Remove this medicine from your list?')){ state.meds=state.meds.filter(m=>m.id!==id); render(); } }
function lastDose(id){ return state.medLog.filter(l=>l.mid===id).sort((a,b)=>b.t-a.t)[0]; }
function logDose(id){
  const m=state.meds.find(x=>x.id===id); if(!m) return;
  const l=lastDose(id);
  if(l && Date.now()-l.t < m.gap*3600000){
    const left=(m.gap*3600000-(Date.now()-l.t))/3600000;
    if(!confirm(`⚠️ Too soon! You took ${m.name} ${ago(l.t)}. Usual gap is ${m.gap} h — wait about ${left.toFixed(1)} h more.\n\nTaking doses too close together can be harmful. Log it anyway?`)) return;
  }
  state.medLog.unshift({mid:id,name:m.name+(m.dose?' '+m.dose:''),t:Date.now()});
  state.medLog=state.medLog.slice(0,200); render();
}
function delLog(i){ state.medLog.splice(i,1); render(); }
/* ===== Medicine database + search ===== */
const MED_DB=[
 {n:'Paracetamol',b:'Dolo, Crocin',t:'OTC',tags:'painkiller pain killer analgesic pain relief headache fever body ache',uses:'Mild to moderate pain, headache, back pain, fever. Gentler on the stomach but less effective than NSAIDs for strong period cramps.',dose:'500 mg',gap:4,label:'500–1000 mg every 4–6 h; max 4 g in 24 h',care:'Avoid with liver disease or regular alcohol. Do not combine with other paracetamol-containing products.'},
 {n:'Ibuprofen',b:'Brufen',t:'OTC',tags:'painkiller pain killer analgesic nsaid anti-inflammatory period cramps dysmenorrhea pain relief headache',uses:'Period cramps, headache, back pain, inflammation. Works by lowering prostaglandins that cause cramps.',dose:'400 mg',gap:6,label:'200–400 mg every 6–8 h with food; OTC max 1200 mg/day',care:'Take with food. Avoid with stomach ulcers, kidney disease, asthma triggered by NSAIDs, or pregnancy.'},
 {n:'Mefenamic acid',b:'Meftal',t:'OTC/Rx',tags:'painkiller pain killer analgesic nsaid period cramps dysmenorrhea heavy bleeding menorrhagia pain relief',uses:'Period pain; sometimes used to reduce menstrual blood loss.',dose:'250 mg',gap:8,label:'250–500 mg every 8 h with food, short course (few days)',care:'Take after food. Stop and see a doctor if you get rash, severe stomach pain or diarrhoea. Avoid with ulcers/kidney disease.'},
 {n:'Naproxen',b:'Naprosyn',t:'OTC/Rx',tags:'painkiller pain killer analgesic nsaid period cramps long acting pain relief',uses:'Period cramps and other pain; longer lasting so fewer doses.',dose:'250 mg',gap:12,label:'250–500 mg every 12 h with food',care:'Same cautions as other NSAIDs (stomach, kidney, asthma, pregnancy).'},
 {n:'Diclofenac',b:'Voveran',t:'OTC/Rx',tags:'painkiller pain killer analgesic nsaid strong pain back pain cramps pain relief',uses:'Stronger pain relief for severe cramps, back or joint pain.',dose:'50 mg',gap:8,label:'50 mg every 8–12 h with food',care:'Not for long use. Avoid with heart, kidney or stomach problems.'},
 {n:'Drotaverine',b:'Drotin',t:'OTC/Rx',tags:'antispasmodic cramps spasm period cramps stomach cramps pain relief',uses:'Relaxes smooth muscle to ease uterine and abdominal cramping spasms.',dose:'40 mg',gap:8,label:'40–80 mg up to 3 times a day',care:'May cause dizziness or low blood pressure. Avoid with low BP or severe liver/kidney disease.'},
 {n:'Hyoscine butylbromide',b:'Buscopan',t:'OTC',tags:'antispasmodic cramps spasm period cramps stomach cramps pain relief',uses:'Eases cramping pains in the abdomen and uterus.',dose:'10 mg',gap:6,label:'10–20 mg up to 3–4 times a day',care:'Can cause dry mouth, blurred vision. Avoid with glaucoma or urinary retention.'},
 {n:'Tranexamic acid',b:'Cyklokapron',t:'Rx only',tags:'heavy bleeding heavy periods menorrhagia reduce bleeding bleeding stop flow',uses:'Reduces blood loss in heavy periods; taken only on heavy-flow days.',dose:'As prescribed',gap:8,label:'Dose set by your doctor',care:'Prescription only. Not safe with a history of blood clots/stroke. Get a doctor to find the cause of heavy bleeding.'},
 {n:'Iron + folic acid',b:'',t:'OTC',tags:'iron anemia anaemia heavy bleeding tired fatigue weakness haemoglobin hemoglobin supplement',uses:'Replaces iron lost in heavy periods; helps tiredness, dizziness and low haemoglobin.',dose:'1 tablet',gap:24,label:'Usually 1 tablet daily',care:'Can darken stools or cause constipation. Take with vitamin C; avoid tea/coffee/calcium within 2 h.'},
 {n:'ORS',b:'Electral',t:'OTC',tags:'dehydration dizziness weak heavy bleeding fluid electrolytes',uses:'Replaces fluids and salts if you feel weak or dizzy, e.g. during heavy flow or diarrhoea.',dose:'1 sachet in 1 L water',gap:6,label:'Sip through the day as directed on pack',care:'Dizziness with heavy bleeding needs medical attention too.'},
 {n:'Domperidone',b:'Domstal',t:'OTC/Rx',tags:'nausea vomiting sickness period nausea',uses:'Nausea and vomiting that comes with painful periods.',dose:'10 mg',gap:8,label:'10 mg up to 3 times a day before food',care:'Avoid with heart rhythm problems. Short use only.'},
 {n:'Norethisterone / hormonal pills',b:'',t:'Rx only',tags:'hormonal pills heavy bleeding irregular periods delay period regulate cycle contraceptive',uses:'Doctors prescribe hormones to control heavy or irregular bleeding and severe cramps.',dose:'As prescribed',gap:24,label:'Only as prescribed',care:'Never self-start. Needs a doctor’s check (clot risk, pregnancy, other conditions).'},
 {n:'Aspirin',b:'Ecosprin',t:'AVOID',tags:'painkiller pain killer analgesic aspirin blood thinner heavy bleeding',uses:'A painkiller, but it thins the blood and can make period bleeding heavier.',dose:'',gap:0,label:'Usually avoided for period pain',care:'Prefer paracetamol or ibuprofen unless your doctor says otherwise. Not for children/teens with fever.'}
];

const MED_CAT={P:'painkiller pain killer pain relief cramps',H:'hormonal period cycle irregular heavy bleeding pcos',G:'stomach nausea acidity digestion',V:'vitamin supplement iron anemia deficiency',I:'infection vaginal uti itching discharge',Y:'hygiene period product essentials',S:'skin acne hair',M:'mood pms stress sleep'};
const MED_MORE=`P|Aceclofenac|OTC/Rx|nsaid|Pain and inflammation, period cramps|Take after food; avoid with ulcers or kidney disease|12
P|Ibuprofen + Paracetamol|OTC|combiflam nsaid|Stronger relief for cramps, headache, body ache|Take after food; avoid in pregnancy or ulcers|8
P|Dicyclomine|OTC/Rx|antispasmodic spasm|Relieves abdominal and period cramp spasms|Can cause dry mouth and drowsiness|8
P|Paracetamol + Dicyclomine|OTC/Rx|cyclopam antispasmodic|Cramp relief with pain and fever control|Avoid with glaucoma; watch total paracetamol|8
P|Mefenamic acid + Dicyclomine|OTC/Rx|meftal spas antispasmodic|Period cramps with spasm|Take after food; short course only|8
P|Hyoscine + Paracetamol|OTC/Rx|buscopan plus antispasmodic|Cramps with pain|Avoid with glaucoma; watch total paracetamol|8
P|Etoricoxib|Rx only|nsaid strong|Strong pain and inflammation|Prescription only; heart and BP risk|24
P|Diclofenac gel|OTC|topical volini rub|Rub-on relief for back or lower-abdomen muscle pain|External use only; not on broken skin|8
P|Pain relief spray or balm|Product|menthol rub|Cooling or warming rub for back pain|Avoid broken skin and intimate areas|0
H|Tranexamic acid + Mefenamic acid|Rx only|combination reduce bleeding|Heavy period bleeding with cramps|Prescription only; clot-risk check needed|8
H|Ethamsylate|Rx only|reduce bleeding|Reduces heavy period bleeding|Doctor-guided use only|8
H|Medroxyprogesterone|Rx only|progestin|Irregular or heavy periods|Prescription only; doctor sets dose|24
H|Dydrogesterone|Rx only|progesterone duphaston|Irregular periods, cycle regulation|Prescription only|12
H|Progesterone (micronized)|Rx only|luteal|Cycle and luteal support|Prescription only|24
H|Combined oral contraceptive pill|Rx only|birth control ocp contraception|Cycle control, PCOS, heavy periods, contraception|Needs doctor check; clot and migraine risk|24
H|Desogestrel (progestin-only pill)|Rx only|mini pill contraception|Contraception when estrogen is unsuitable|Take at the same time daily; doctor advice|24
H|Emergency contraceptive pill|OTC|levonorgestrel i-pill unwanted 72 contraception|Reduces pregnancy risk after unprotected sex (within 72 h)|Not for regular use; may shift next period|0
H|Letrozole|Rx only|pcos ovulation|Ovulation induction in PCOS|Prescription only|24
H|Clomiphene|Rx only|pcos ovulation|Ovulation induction|Prescription only; doctor-monitored|24
H|Metformin|Rx only|pcos insulin|PCOS with insulin resistance|Prescription only; take with food|12
H|Spironolactone|Rx only|pcos hirsutism|PCOS facial hair and acne|Prescription only; avoid in pregnancy|24
H|Cyproterone + ethinylestradiol|Rx only|pcos acne|PCOS acne and excess hair|Prescription only; clot risk|24
H|Myo-inositol|Supplement|pcos|Often used for PCOS and cycle support|Evidence is limited; ask your doctor|12
H|Levothyroxine|Rx only|thyroid|Thyroid hormone; thyroid problems change periods|Empty stomach; dose set by doctor|24
H|Cabergoline|Rx only|prolactin|High prolactin causing missed periods|Prescription only|0
H|Ormeloxifene|Rx only|saheli contraception non hormonal|Non-hormonal contraceptive|Prescription; doctor guidance|0
G|Ondansetron|OTC/Rx|nausea vomiting|Nausea and vomiting with periods|May cause constipation or headache|8
G|Antacid (aluminium + magnesium)|OTC|acidity gas heartburn|Acidity, bloating, heartburn|Space apart from other medicines|6
G|Pantoprazole|OTC/Rx|acidity ppi|Acidity; protects stomach when taking NSAIDs|Short courses; take before food|24
G|Omeprazole|OTC|acidity ppi|Acidity and heartburn|Take before food|24
G|Famotidine|OTC|acidity|Acidity and heartburn|See a doctor if frequent|12
G|Simethicone|OTC|gas bloating|Period bloating and gas|Generally well tolerated|8
G|Isabgol (psyllium husk)|OTC|constipation fibre|Constipation (common with iron tablets)|Take with plenty of water|24
G|Lactulose|OTC|constipation|Constipation|May cause gas or loose stools|24
G|Loperamide|OTC|diarrhoea loose motions|Loose motions during periods|Not with fever or blood in stool|8
G|Probiotic|Supplement|gut|Gut health, loose stools|Ask a doctor if immunocompromised|24
G|Electrolyte powder|Product|dehydration weakness|Replaces fluids and salts|Follow pack directions|0
G|Ginger capsules|Supplement|nausea cramps natural|Nausea and mild cramps (some evidence)|May thin blood slightly; ask doctor|12
G|Chamomile tea|Product|cramps calming|A warm drink many find soothing|Avoid if allergic to daisy family|0
V|Ferrous ascorbate|OTC|iron anemia|Iron deficiency from heavy periods|Dark stools or constipation possible|24
V|Ferrous sulphate|OTC|iron anemia|Iron deficiency anaemia|Take with vitamin C; may upset stomach|24
V|Ferrous bisglycinate|Supplement|iron gentle|Gentler-on-stomach iron|Dark stools possible|24
V|Lactoferrin|Supplement|iron anemia|Supports iron absorption|Ask doctor if taking with iron|24
V|Vitamin B12|Supplement|methylcobalamin tired|Tiredness and B12 deficiency|Check levels if taken long term|24
V|Folic acid|OTC|folate|Anaemia; needed before and during pregnancy|Dose per doctor|24
V|Vitamin D3|Supplement|cholecalciferol bones|Low vitamin D, bone health|Excess can harm; follow the dose|24
V|Calcium + D3|Supplement|bones pms|Bone health; may ease PMS|Take 2 h apart from iron|24
V|Magnesium|Supplement|cramps pms sleep|Cramps, PMS, sleep|Can loosen stools|24
V|Vitamin C|Supplement|iron absorption|Helps iron absorption|High doses upset the stomach|24
V|Women's multivitamin|Supplement|daily|Fills general nutrition gaps|Avoid doubling up on iron or vitamin A|24
V|Omega-3|Supplement|fish oil cramps|May reduce period pain slightly|Can thin blood; ask doctor|24
V|Vitamin B6|Supplement|pms mood|Used for PMS mood symptoms|Too much can damage nerves|24
V|Zinc|Supplement|acne immunity|Immunity and skin|Take with food|24
V|Vitamin B-complex|Supplement|energy|Fatigue, general support|Urine may turn bright yellow|24
V|Biotin|Supplement|hair nails pcos|Hair and nail support|Can affect some lab tests|24
V|Vitamin E|Supplement|pms breast tenderness|Sometimes used for PMS|High doses raise bleeding risk|24
V|Evening primrose oil|Supplement|pms breast pain|Used for PMS and breast tenderness|Limited evidence; ask doctor|24
V|Prenatal vitamin|OTC/Rx|pregnancy folic|When planning or during pregnancy|Doctor-guided|24
I|Fluconazole|OTC/Rx|yeast candida thrush|Vaginal yeast infection|See doctor if frequent or pregnant|0
I|Clotrimazole cream or pessary|OTC|antifungal yeast itching|Vaginal itching, yeast infection|See doctor if no better in a week|0
I|Metronidazole|Rx only|bv bacterial vaginosis|Bacterial vaginosis and some infections|No alcohol during the course|8
I|Tinidazole|Rx only|bv bacterial vaginosis|Bacterial vaginosis|Prescription; avoid alcohol|24
I|Secnidazole|Rx only|bv bacterial vaginosis|Bacterial vaginosis|Prescription only|0
I|Nitrofurantoin|Rx only|uti urine infection|Urinary tract infection|Prescription only; take with food|12
I|Disodium hydrogen citrate|OTC|uti burning urine cital|Eases burning while passing urine|See doctor if fever or beyond 2 days|8
I|Cranberry supplement|Supplement|uti prevention|May help prevent UTIs|Not a treatment for an active infection|24
I|Vaginal lactobacillus capsules|Rx only|probiotic vaginal flora|Restores vaginal flora|Doctor-guided|24
I|Intimate wash (pH balanced)|Product|hygiene|Gentle external cleansing|External only; avoid douching|0
I|Intimate wipes|Product|hygiene|Freshness on the go|External use only|0
Y|Sanitary pads|Product|period|Everyday period protection|Change every 4 to 6 hours|0
Y|Overnight XL pads|Product|heavy flow night|Heavy-flow and night protection|Change every 4 to 6 hours|0
Y|Panty liners|Product|spotting discharge|Light flow and spotting|Change often|0
Y|Tampons|Product|period|Internal protection|Change every 4 to 8 h; toxic shock risk if left longer|0
Y|Menstrual cup|Product|reusable|Reusable internal collection|Sterilise between cycles; empty every 8 to 12 h|0
Y|Menstrual disc|Product|reusable|Flexible internal disc|Empty at least every 12 h|0
Y|Period underwear|Product|reusable leak proof|Leak-proof backup|Rinse in cold water first|0
Y|Heat patch|Product|cramps heat|Adhesive warmth for cramps|Do not sleep with it on or use on broken skin|0
Y|Electric heating pad|Product|cramps heat|Warmth for cramps|Use low setting; do not fall asleep on it|0
Y|Hot water bag|Product|cramps heat|Classic cramp relief|Never use boiling water; cover with cloth|0
Y|Disposal bags|Product|hygiene|Discreet pad disposal|Wrap pads before disposal|0
Y|Pregnancy test kit|Product|late period|Check for pregnancy if a period is late|Repeat after a week if negative; see a doctor|0
Y|Ovulation test kit|Product|fertility|Predicts the fertile window|Not a contraceptive|0
Y|Condoms|Product|contraception|Contraception and STI protection|Check expiry; use once|0
S|Adapalene gel|OTC/Rx|acne|Acne|Avoid in pregnancy; use sunscreen|0
S|Benzoyl peroxide gel|OTC|acne|Acne spots|May bleach fabric; can irritate|0
S|Clindamycin gel|Rx only|acne|Inflammatory acne|Prescription only|0
S|Salicylic acid face wash|Product|acne|Mild acne care|Do not overuse; can dry skin|0
M|Ashwagandha|Supplement|stress sleep|Stress support|Avoid in pregnancy; ask doctor with thyroid issues|24`;
MED_MORE.split('\n').forEach(l=>{const [c,n,t,x,u,r,g]=l.split('|'); MED_DB.push({n,b:'',t,tags:(MED_CAT[c]||'')+' '+x,uses:u,dose:'',gap:+g||0,label:'',care:r});});
function blinkLink(m){
  if(m.t==='AVOID') return '';
  const q=encodeURIComponent(m.n);
  const L=[['Tata 1mg',`https://www.1mg.com/search/all?name=${q}`],['PharmEasy',`https://pharmeasy.in/search/all?name=${q}`],['Apollo',`https://www.apollopharmacy.in/search-medicines/${q}`]];
  const B=['Blinkit',`https://blinkit.com/s/?q=${q}`];
  const list = m.t==='Product' ? [B,L[0]] : m.t==='Supplement' ? [L[0],L[1],B] : L;
  const note = m.t==='Rx only' ? '<br><small style="color:#B26A00">Prescription needed — upload it on the pharmacy app.</small>' : m.t==='OTC/Rx' ? '<br><small style="color:#B26A00">Some strengths need a prescription.</small>' : '';
  return `${note}<div class="chip-row" style="margin-top:6px">${list.map(([n,u])=>`<a class="chip" href="${u}" target="_blank" rel="noopener" style="text-decoration:none">🛒 ${n}</a>`).join('')}</div>`;
}
