function setDietTab(t){ state.dietTab=t; render(); }
function dietSet(k,v){ state.diet[k]=v; if(k==='cond'||k==='pref'||k==='act') render(); }
function dietDay(i){ state.diet.day=i; render(); }
function dietGen(){ const d=state.diet; if(!(+d.weight>0)||!(+d.height>0)){ d.err='Please enter your weight (kg) and height (cm) to build your plan.'; d.generated=false; } else { d.err=''; d.generated=true; d.day=0; } render(); }
function dietCalc(){
  const d=state.diet, w=+d.weight, h=+d.height, a=+d.age||22, hm=h/100;
  const bmi=w/(hm*hm), tdee=(10*w+6.25*h-5*a-161)*(+d.act);
  let goal,kc; if(bmi>=25){goal='Gentle weight loss'; kc=tdee-400;} else if(bmi<18.5){goal='Healthy weight gain'; kc=tdee+300;} else {goal='Maintain weight & balance hormones'; kc=tdee;}
  kc=Math.max(1200,Math.round(kc/50)*50);
  return {bmi:bmi.toFixed(1), cat:bmi<18.5?'Underweight':bmi<25?'Healthy range':bmi<30?'Overweight':'Obese range', goal, kc,
    pro:Math.round(Math.min(w*1.1,kc*0.3/4)), carb:Math.round(kc*0.4/4), fat:Math.round(kc*0.3/4), water:(w*0.033).toFixed(1),
    lo:Math.round(18.5*hm*hm), hi:Math.round(24.9*hm*hm), size:kc<1400?0:kc<1800?1:2, loss:bmi>=25};
}
const DIET_EAT=[
 {ic:'🌾',t:'Whole grains & millets',items:['Ragi','Jowar','Bajra','Foxtail millet','Brown rice','Oats','Dalia','Quinoa'],why:'Slow-digesting, high fibre — keeps blood sugar and insulin steady.'},
 {ic:'🫘',t:'Protein',items:['Moong dal','Chana','Rajma','Sprouts','Paneer','Tofu','Curd','Eggs','Fish','Chicken'],why:'Keeps you full, protects muscle and reduces sugar cravings.'},
 {ic:'🥬',t:'Vegetables',items:['Spinach','Methi','Broccoli','Cabbage','Cauliflower','Bhindi','Beans','Lauki','Bitter gourd','Carrot'],why:'Fibre, iron and antioxidants — fill half your plate with them.'},
 {ic:'🍎',t:'Low-GI fruits',items:['Apple','Guava','Pear','Papaya','Berries','Orange','Jamun'],why:'Eat 1–2 small portions daily, with nuts or curd, not as juice.'},
 {ic:'🥜',t:'Healthy fats',items:['Almonds','Walnuts','Flax seeds','Pumpkin seeds','Chia seeds','Olive oil','Groundnut oil'],why:'Omega-3 and good fats help lower inflammation and support hormones.'},
 {ic:'🍵',t:'Drinks & spices',items:['Spearmint tea','Cinnamon water','Methi water','Green tea','Buttermilk','Coconut water','Turmeric','Jeera'],why:'Cinnamon and spearmint are traditionally used to support sugar control and hormones.'}];
const DIET_AVOID=[
 {ic:'🍬',t:'Sugar & sweets',items:['Sugar','Mithai','Chocolates','Ice cream','Sweet biscuits','Jaggery in excess'],why:'Spikes insulin, which can worsen irregular periods and acne.'},
 {ic:'🍞',t:'Refined carbs',items:['Maida','White bread','Bakery items','Noodles','Pasta','Polished white rice (large portions)'],why:'Quickly turns to sugar; swap for millets and whole grains.'},
 {ic:'🍟',t:'Fried & junk food',items:['Samosa','Chips','French fries','Pizza','Burgers','Packaged snacks'],why:'High in trans/unhealthy fats and salt; increases inflammation and weight.'},
 {ic:'🥤',t:'Sugary drinks',items:['Cold drinks','Packed juices','Energy drinks','Sweet tea/coffee','Milkshakes'],why:'Liquid sugar — the fastest way to raise insulin.'},
 {ic:'🥓',t:'Processed & red meat',items:['Sausages','Salami','Packaged nuggets','Excess red meat'],why:'Linked with inflammation; choose fish, eggs or lean chicken instead.'},
 {ic:'🧈',t:'Limit (not always avoid)',items:['Full-fat dairy in excess','Very-late-night meals','Skipping meals','Excess caffeine'],why:'Regular timing and moderation matter more than strict bans.'}];
const DIET_RECIPES=[
 {n:'Moong dal chilla',t:'15 min',ing:'½ cup soaked moong dal, green chilli, ginger, cumin, chopped spinach, salt',st:'Blend dal with chilli, ginger and cumin into a batter. Stir in spinach. Cook thin on a non-stick tawa with a few drops of oil until golden. Serve with mint chutney.'},
 {n:'Spearmint–cinnamon tea',t:'5 min',ing:'1 tsp dried spearmint (or 6 fresh leaves), small cinnamon stick, 1 cup water',st:'Boil water with cinnamon 3 min, add spearmint, cover 5 min, strain and sip warm. No sugar. 1–2 cups a day.'},
 {n:'Sprouts chaat',t:'10 min',ing:'1 cup sprouts (steamed), onion, tomato, cucumber, lemon, chaat masala, coriander',st:'Toss everything together, squeeze lemon, and serve fresh as an evening snack.'},
 {n:'Millet vegetable khichdi',t:'25 min',ing:'½ cup foxtail millet, ¼ cup moong dal, carrot, beans, peas, turmeric, cumin, ghee 1 tsp',st:'Pressure-cook everything with 3 cups water for 4 whistles. Serve with curd and a salad.'}];
const DIET_TIPS=[
 ['⏰','Eat on time','Have 3 meals + 1–2 small snacks at regular times. Do not skip breakfast; finish dinner 2–3 hours before sleep.'],
 ['🍽️','Balance your plate','Half vegetables, a quarter protein, a quarter whole grains. Eat veggies and protein first, carbs last.'],
 ['🚶','Move daily','30 minutes of walking, yoga or strength training improves insulin response. A 10-minute walk after meals helps too.'],
 ['😴','Sleep 7–8 hours','Poor sleep raises cravings and insulin resistance. Keep a fixed bedtime.'],
 ['🧘','Manage stress','High stress raises cortisol, which can worsen PCOS symptoms. Try yoga, breathing or journaling.'],
 ['💧','Drink water','Aim for the target on your plan. Limit sugary tea, coffee and cold drinks.'],
 ['🩺','See your doctor','Diet supports treatment; it does not replace it. Get regular checks (sugar, thyroid, hormones) and ask before taking supplements such as inositol or vitamin D.']];

function dietMenu(p){
  const R=p.roti, R1=p.roti1, C=p.rice;
  return {
   early:['Warm water + 1 tsp soaked methi seeds + 4 soaked almonds','Cinnamon water (½ tsp) + 1 walnut','Jeera water + 4 soaked almonds','Warm lemon water (no sugar) + 5 soaked raisins? no'.replace(' + 5 soaked raisins? no',''),'Methi water + 2 walnuts','Spearmint tea + 4 soaked almonds','Warm water + 1 tsp soaked chia seeds'],
   bf:[[`Moong dal chilla ×${p.chilla} + mint chutney + cucumber`,`Veg omelette (2 eggs) + 1 multigrain toast + cucumber`],`Ragi dosa ×2 + sambar`,`Vegetable oats upma (${p.oats}) + 1 tsp flax seeds`,[`Besan-spinach cheela ×2 + ½ cup curd`,`2 boiled eggs + sautéed spinach + 1 multigrain toast`],`Vegetable poha with peanuts (1 small bowl) + buttermilk`,`Idli ×2 + sambar + veg chutney`,[`Paneer-veg stuffed jowar roti ×1 + curd`,`Egg bhurji + 1 jowar roti`]],
   mid:['1 small apple or guava','Handful roasted chana','Coconut water (unsweetened)','Spearmint tea + 5 almonds','1 pear or 1 orange','Buttermilk + roasted jeera','Papaya bowl (1 cup) + 4 walnut halves'],
   lunch:[[`${C} brown rice + dal (1 katori) + bhindi/beans sabzi + salad`,`${C} brown rice + fish curry (light oil) + sabzi + salad`],[`${R} jowar rotis + palak paneer + dal + salad`,`${R} jowar rotis + chicken curry (less oil) + sabzi + salad`],`Foxtail millet khichdi + curd + cucumber salad`,[`${C} brown rice + rajma/chana curry + sabzi + salad`,`${C} brown rice + egg curry (2 eggs) + sabzi + salad`],`${R} multigrain rotis + sambar + lauki sabzi + salad`,[`Vegetable millet pulao + raita + sprouts salad`,`Chicken millet pulao + raita + salad`],[`${C} brown rice + sambar + cabbage poriyal + curd`,`${C} brown rice + grilled fish + poriyal + curd`]],
   snack:['Sprouts chaat','Roasted makhana (1 cup)','Boiled chana salad','Buttermilk + 1 tbsp roasted pumpkin/sunflower seeds','Cucumber & carrot sticks + hummus','Spearmint tea + 1 tbsp roasted seeds','Apple slices + 1 tsp peanut butter'],
   dinner:[[`Vegetable soup + ${R1} roti + paneer/tofu bhurji`,`Vegetable soup + ${R1} roti + grilled chicken`],`Moong dal + sautéed vegetables + ${R1} roti`,`Ragi/jowar roti ×${R1} + mixed veg curry + curd`,[`Grilled paneer/tofu salad bowl with greens`,`Grilled fish + sautéed vegetable salad`],`Vegetable dalia khichdi + raita`,[`Lentil soup + stir-fried veggies + ${R1} roti`,`Egg curry (2 eggs) + veggies + ${R1} roti`],[`Palak dal + ${R1} roti + salad`,`Chicken soup + sautéed vegetables`]],
   bed:['Warm turmeric milk (unsweetened)','Chamomile tea','Warm milk with a pinch of cinnamon','Warm turmeric milk (unsweetened)','Chamomile tea','Warm milk with a pinch of cinnamon','Warm turmeric milk (unsweetened)']
  };
}
function dietPage(){
  const tabs=[['plan','My Plan'],['eat','Eat'],['avoid','Avoid'],['recipes','Recipes'],['period','Period days'],['tips','Tips']];
  const bodies={plan:dietPlanSub,eat:()=>dietFoodSub(DIET_EAT),avoid:()=>dietFoodSub(DIET_AVOID),recipes:dietRecipeSub,period:dietPeriodSub,tips:dietTipsSub};
  return `<div class="page active"><header class="top"><div><h1>Diet &amp; Food</h1><p>PCOD / PCOS friendly eating</p></div></header>
  <div class="subtabs">${tabs.map(([id,l])=>`<button class="${state.dietTab===id?'active':''}" onclick="setDietTab('${id}')">${l}</button>`).join('')}</div>
  ${(bodies[state.dietTab]||dietPlanSub)()}</div>`;
}
function dietFoodSub(list){
  return list.map(g=>`<div class="slider-card" style="margin-bottom:10px"><p class="section-title">${g.ic} ${g.t}</p><div class="chip-row">${g.items.map(i=>`<span class="chip" style="cursor:default">${i}</span>`).join('')}</div><p style="font-size:12px;color:var(--inksoft);margin:10px 0 0">${g.why}</p></div>`).join('');
}
function dietRecipeSub(){
  return DIET_RECIPES.map(r=>`<div class="slider-card" style="margin-bottom:10px"><p class="section-title">🍳 ${r.n} · ${r.t}</p><p style="font-size:13px;margin:0 0 6px"><b>You need:</b> ${r.ing}</p><p style="font-size:13px;margin:0;color:var(--inksoft)">${r.st}</p></div>`).join('');
}
function dietTipsSub(){
  return DIET_TIPS.map(t=>`<div class="slider-card" style="margin-bottom:10px"><p class="section-title">${t[0]} ${t[1]}</p><p style="font-size:13px;margin:0;color:var(--inksoft)">${t[2]}</p></div>`).join('');
}
function dietPlanSub(){
  const d=state.diet, ch=(k,v,l)=>`<div class="chip ${String(d[k])===String(v)?'active':''}" onclick="dietSet('${k}',${typeof v==='number'?v:`'${v}'`})">${l}</div>`;
  const inp=(k,ph,val)=>`<input type="number" inputmode="decimal" placeholder="${ph}" value="${val}" oninput="dietSet('${k}',this.value)" style="width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font-size:14px;font-family:inherit">`;
  let out=`<div class="slider-card" style="margin-bottom:12px">
    <p class="section-title">Your details</p>
    <p style="font-size:12px;color:var(--inksoft);margin:0 0 6px">Condition</p><div class="chip-row" style="margin-bottom:12px">${ch('cond','PCOD','PCOD')}${ch('cond','PCOS','PCOS')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div><p style="font-size:12px;color:var(--inksoft);margin:0 0 4px">Weight (kg)</p>${inp('weight','e.g. 65',d.weight)}</div>
      <div><p style="font-size:12px;color:var(--inksoft);margin:0 0 4px">Height (cm)</p>${inp('height','e.g. 158',d.height)}</div>
      <div><p style="font-size:12px;color:var(--inksoft);margin:0 0 4px">Age</p>${inp('age','e.g. 22',d.age)}</div></div>
    <p style="font-size:12px;color:var(--inksoft);margin:0 0 6px">Food preference</p><div class="chip-row" style="margin-bottom:12px">${ch('pref','veg','🥦 Vegetarian')}${ch('pref','nonveg','🍗 Non-veg (egg, fish, chicken)')}</div>
    <p style="font-size:12px;color:var(--inksoft);margin:0 0 6px">Activity</p><div class="chip-row" style="margin-bottom:14px">${ch('act',1.375,'Light')}${ch('act',1.55,'Moderate')}${ch('act',1.725,'Active')}</div>
    ${d.err?`<p style="font-size:12px;color:#C2185B;margin:0 0 10px">${d.err}</p>`:''}
    <button onclick="dietGen()" style="width:100%;border:none;border-radius:14px;padding:13px;font-size:14px;font-weight:700;color:#fff;background:var(--berry-500);cursor:pointer;font-family:inherit">Get my ${d.cond} food plan</button></div>`;
  if(!d.generated) return out+`<p style="font-size:12px;color:var(--inksoft)">Enter your weight and height and choose PCOD or PCOS — you'll get calories, protein, water and a full 7-day meal plan.</p>`;
  const c=dietCalc();
  const p=[{roti:'1',roti1:'1',rice:'½ cup',chilla:'2',oats:'⅓ cup dry oats'},{roti:'2',roti1:'1–2',rice:'¾ cup',chilla:'2–3',oats:'½ cup dry oats'},{roti:'2–3',roti1:'2',rice:'1 cup',chilla:'3',oats:'¾ cup dry oats'}][c.size];
  const M=dietMenu(p), day=d.day, nv=d.pref==='nonveg';
  const pick=x=>Array.isArray(x)?(nv?x[1]:x[0]):x;
  const slots=[['🌅','Early morning','6:30–7:00 am','early',0],['🍳','Breakfast','8:00–9:00 am','bf',.25],['🍏','Mid-morning','11:00 am','mid',.08],['🍛','Lunch','1:00–2:00 pm','lunch',.32],['🥜','Evening snack','4:30–5:00 pm','snack',.10],['🌙','Dinner','7:00–8:00 pm','dinner',.25],['🥛','Bedtime','9:30 pm','bed',0]];
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const note=d.cond==='PCOS'?'PCOS often comes with insulin resistance, so this plan keeps carbs low-GI and protein-rich at every meal.':'PCOD is mostly lifestyle-driven — regular meals, whole grains and daily movement can improve cycles and weight.';
  out+=`<div class="slider-card" style="margin-bottom:12px">
    <p class="section-title">Your ${d.cond} summary</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><div style="font-size:11px;color:var(--inksoft)">BMI</div><b style="font-size:20px">${c.bmi}</b> <span style="font-size:12px;color:var(--inksoft)">${c.cat}</span></div>
      <div><div style="font-size:11px;color:var(--inksoft)">Daily calories</div><b style="font-size:20px">${c.kc}</b> <span style="font-size:12px;color:var(--inksoft)">kcal</span></div>
      <div><div style="font-size:11px;color:var(--inksoft)">Protein</div><b style="font-size:18px">${c.pro} g</b></div>
      <div><div style="font-size:11px;color:var(--inksoft)">Water</div><b style="font-size:18px">${c.water} L</b></div>
      <div><div style="font-size:11px;color:var(--inksoft)">Carbs · Fat</div><b style="font-size:15px">${c.carb} g · ${c.fat} g</b></div>
      <div><div style="font-size:11px;color:var(--inksoft)">Healthy weight</div><b style="font-size:15px">${c.lo}–${c.hi} kg</b></div></div>
    <p style="font-size:13px;margin:12px 0 4px"><b>Goal:</b> ${c.goal}${c.loss?' — aim for about 0.25–0.5 kg per week. Even 5–10% weight loss can help regularise periods.':''}</p>
    <p style="font-size:12px;color:var(--inksoft);margin:0">${note}</p></div>
    <div class="daypills" style="margin-bottom:10px">${days.map((x,i)=>`<div class="pill ${day===i?'active':''}" onclick="dietDay(${i})">${x}</div>`).join('')}</div>`;
  slots.forEach(([ic,n,tm,k,f])=>{
    out+=`<div class="slider-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">${ic} ${n}</b><span style="font-size:11px;color:var(--inksoft);white-space:nowrap">${tm}${f?' · ~'+Math.round(c.kc*f/10)*10+' kcal':''}</span></div><p style="font-size:13px;margin:6px 0 0">${pick(M[k][day])}</p></div>`;
  });
  return out+`<p style="font-size:11px;color:var(--inksoft);line-height:1.5;margin-top:10px">Portion guide for ${c.kc} kcal: roti ${p.roti}, cooked rice ${p.rice}, dal 1 katori, vegetables as much as you like. Use 1 tsp oil per meal. This is general guidance, not medical advice — please confirm with your doctor or a dietitian, especially if you take medicines or have other conditions.</p>`;
}


// ===== Extras: language, theme, reminders, mood, routine, care =====
const TR={te:{Home:'హోమ్',Therapy:'థెరపీ',Track:'ట్రాక్',Exercise:'వ్యాయామం',Diet:'ఆహారం',Profile:'ప్రొఫైల్'},hi:{Home:'होम',Therapy:'थेरेपी',Track:'ट्रैक',Exercise:'व्यायाम',Diet:'आहार',Profile:'प्रोफ़ाइल'}};
const tr=k=>(TR[state.lang]&&TR[state.lang][k])||k;
const L3=(en,te,hi)=>state.lang==='te'?te:state.lang==='hi'?hi:en;
const QUOTES=[['You are stronger than your pain.','మీరు మీ నొప్పి కంటే బలమైనవారు.','आप अपने दर्द से ज़्यादा मज़बूत हैं।'],['Rest is productive too — take care of yourself today.','విశ్రాంతి కూడా ముఖ్యమే, ఈరోజు మిమ్మల్ని మీరు జాగ్రత్తగా చూసుకోండి.','आराम भी ज़रूरी है, आज अपना ख्याल रखें।'],['Your body is doing something amazing. Be kind to it.','మీ శరీరం అద్భుతమైన పని చేస్తోంది. దానిపై దయ చూపండి.','आपका शरीर कमाल का काम कर रहा है। उसके साथ प्यार से पेश आएँ।'],['Every girl deserves comfort, not pain.','ప్రతి అమ్మాయికి నొప్పి కాదు, సౌకర్యం కావాలి.','हर लड़की को आराम मिलना चाहिए, दर्द नहीं।'],['Asking for help is a sign of strength.','సహాయం అడగడం బలానికి గుర్తు.','मदद माँगना ताकत की निशानी है।'],['You are not alone — many girls feel this and rise anyway.','మీరు ఒంటరి కాదు; ఎందరో అమ్మాయిలు ఇదే అనుభవించి ముందుకు సాగుతున్నారు.','आप अकेली नहीं हैं; बहुत सी लड़कियाँ यह सहकर भी आगे बढ़ती हैं।'],['Small steps, warm heart, brave you.','చిన్న అడుగులు, వెచ్చని హృదయం, ధైర్యవంతురాలివి నువ్వు.','छोटे कदम, गर्म दिल, बहादुर आप।']];
function applyTheme(){ const r=document.documentElement; if(state.theme==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',state.theme); r.lang=state.lang; }
function setTheme(t){ state.theme=t; render(); }

/* ---- Animated full-screen themes: whole app + sides change colour, with a tap ripple ---- */
const FX_THEMES=[
 {id:'fx-aurora',ic:'🌌',name:'Aurora',c:['#7C4DFF','#FF4DA6','#2DD4BF','#60A5FA'],accent:'#8E3FD6'},
 {id:'fx-sunset',ic:'🌅',name:'Sunset Glow',c:['#FF9A5A','#FF5E8A','#B04DDB','#FFC857'],accent:'#E0457B'},
 {id:'fx-ocean',ic:'🌊',name:'Ocean Wave',c:['#2193B0','#6DD5ED','#1E5FBF','#7EE8D8'],accent:'#0A6FA8'},
 {id:'fx-candy',ic:'🍬',name:'Candy Pop',c:['#FF9ECD','#C7A6FF','#9AD9FF','#FFD3E8'],accent:'#D6409A'},
 {id:'fx-forest',ic:'🌿',name:'Forest Mist',c:['#2E8B57','#A8E063','#56AB91','#D4F5C4'],accent:'#1E7A4A'},
 {id:'fx-berry',ic:'🫐',name:'Berry Blast',c:['#C2185B','#7B1FA2','#E91E63','#9C27B0'],accent:'#B3125A'},
 {id:'fx-gold',ic:'✨',name:'Golden Hour',c:['#FFD86B','#FFA25E','#FF7E7E','#FFE9A8'],accent:'#D9731C'},
 {id:'fx-cloud',ic:'☁️',name:'Cotton Cloud',c:['#E8F1FF','#FFE6F2','#EAFBF1','#F3E8FF'],accent:'#6B7FD7'},
 {id:'fx-fire',ic:'🔥',name:'Fire',c:['#FF512F','#F09819','#DD2476','#FF8A00'],accent:'#D63A14'},
 {id:'fx-galaxy',ic:'🪐',name:'Galaxy Night',c:['#0B0B2B','#2A1B5E','#5B1A8C','#0F3A6B'],accent:'#A78BFA',dark:true},
 {id:'fx-neon',ic:'💡',name:'Neon Night',c:['#06141F','#0A3A4A','#4A0E5C','#07263A'],accent:'#2DE2C8',dark:true}
];
(function(){
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)), hex=a=>'#'+a.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
  const mix=(a,b,t)=>{ const x=rgb(a),y=rgb(b); return hex(x.map((v,i)=>v+(y[i]-v)*t)); };
  let css=`@keyframes fxMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes fxFloatA{0%,100%{transform:translate(-8%,-6%) scale(1)}50%{transform:translate(10%,12%) scale(1.25)}}
@keyframes fxFloatB{0%,100%{transform:translate(8%,10%) scale(1.15)}50%{transform:translate(-12%,-8%) scale(.9)}}
:root[data-theme^="fx-"] body{background-size:300% 300%;animation:fxMove 14s ease infinite;min-height:100vh}
:root[data-theme^="fx-"] .wrap{position:relative;z-index:1;background:transparent}
:root[data-theme^="fx-"] .bottom{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
:root[data-theme^="fx-"] body::before,:root[data-theme^="fx-"] body::after{content:"";position:fixed;z-index:0;pointer-events:none;border-radius:50%;filter:blur(40px);opacity:.55;width:46vmax;height:46vmax}
:root[data-theme^="fx-"] body::before{left:-14vmax;top:-12vmax;background:radial-gradient(circle,rgba(255,255,255,.75),rgba(255,255,255,0) 70%);animation:fxFloatA 16s ease-in-out infinite}
:root[data-theme^="fx-"] body::after{right:-14vmax;bottom:-12vmax;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,0) 70%);animation:fxFloatB 20s ease-in-out infinite}
:root[data-theme^="fx-"][data-fxdark] body::before,:root[data-theme^="fx-"][data-fxdark] body::after{opacity:.35}
@media (prefers-reduced-motion:reduce){:root[data-theme^="fx-"] body,:root[data-theme^="fx-"] body::before,:root[data-theme^="fx-"] body::after{animation:none}}
`;
  FX_THEMES.forEach(t=>{
    const a=t.accent, c=t.c, grad=`linear-gradient(135deg,${c.join(',')})`; t.grad=grad;
    const dk=!!t.dark;
    const v=dk?{
      surface:'rgba(10,12,32,.74)', alt:'rgba(255,255,255,.09)', ink:'#F2F4FF', soft:'#B9BFDE', line:'rgba(255,255,255,.16)',
      b50:mix(a,'#000000',.78), b100:mix(a,'#000000',.62), b300:mix(a,'#FFFFFF',.15), b500:mix(a,'#000000',.25), b600:mix(a,'#000000',.4), b700:mix(a,'#000000',.55),
      t50:mix(c[1],'#000000',.6), t100:mix(c[1],'#000000',.4), t400:mix(c[1],'#FFFFFF',.35), t500:mix(c[1],'#FFFFFF',.2), t600:c[1]
    }:{
      surface:'rgba(255,255,255,.9)', alt:'rgba(255,255,255,.62)', ink:mix(a,'#000000',.78), soft:mix(a,'#000000',.45), line:mix(a,'#FFFFFF',.72),
      b50:mix(a,'#FFFFFF',.9), b100:mix(a,'#FFFFFF',.78), b300:mix(a,'#FFFFFF',.4), b500:a, b600:mix(a,'#000000',.2), b700:mix(a,'#000000',.4),
      t50:mix(c[1],'#FFFFFF',.9), t100:mix(c[1],'#FFFFFF',.72), t400:mix(c[1],'#FFFFFF',.15), t500:mix(c[1],'#000000',.12), t600:mix(c[1],'#000000',.3)
    };
    css+=`:root[data-theme="${t.id}"]{--bg:${c[0]};--surface:${v.surface};--surfacealt:${v.alt};--ink:${v.ink};--inksoft:${v.soft};--line:${v.line};--berry-50:${v.b50};--berry-100:${v.b100};--berry-300:${v.b300};--berry-500:${v.b500};--berry-600:${v.b600};--berry-700:${v.b700};--teal-50:${v.t50};--teal-100:${v.t100};--teal-400:${v.t400};--teal-500:${v.t500};--teal-600:${v.t600};}
:root[data-theme="${t.id}"] html,:root[data-theme="${t.id}"] body{background-image:${grad};background-color:${c[0]};}
`;
  });
  const st=document.createElement('style'); st.id='fxThemes'; st.textContent=css; document.head.appendChild(st);
})();
