function homePage(){
  const painToday = state.pain[0];
  let alerts = '';
  if(state.emergency){
    alerts += `<div class="alert danger"><div><b>EMERGENCY STOP ACTIVE</b>Therapy is locked out. Go to Therapy to reset once it's safe.</div></div>`;
  } else if(heaterDisabled()){
    alerts += `<div class="alert warning"><div><b>HIGH TEMPERATURE</b>Heater disabled until the belt cools below ${state.threshold}°C.</div></div>`;
  }
  const padBanner = padBannerHTML() + homeExtras();
  return `
  <div class="page active">
    <header class="top">
      <div><h1>Smart Period Relief</h1><p>Good day — here's today's snapshot</p></div>
      <div class="header-btns">
        ${(DEMO_CONNECT&&liveOn()&&hrLive.conn==='connected')?'':`<div class="status ${devConn()}" onclick="connectWifi()" style="cursor:pointer;">
          <span class="dot"></span>${chipText()}
        </div>`}
        <button class="refresh-btn" onclick="refreshAll()" title="Reset hydration & steps to 0">⟳</button>
      </div>
    </header>
    ${espTopBtn()}${espPanel()}
    ${liveBanner()}
    ${alerts}
    ${pregHomeCard()}
    ${padBanner}
    <div class="grid2">
      ${hrCard()}
      ${sCard(TONE_ICON.spo2,'teal','SpO₂','spo2','%')}
      ${sCard(TONE_ICON.temp,'amber','Temperature','temp','°C')}
      ${stepsCard()}
      ${painCard(painToday)}
      ${sCard(TONE_ICON.batt,'neutral','Device battery','battery','%')}
      ${sCard(TONE_ICON.drop,'berry','Blood pressure','bp','mmHg')}
    </div>
    <div class="hydration">
      <div class="row"><b>Hydration</b><span>${state.demoWater} / ${state.waterTarget} ml</span></div>
      <div class="bar"><div class="fill" style="width:${Math.min(100,(state.demoWater/state.waterTarget)*100)}%"></div></div>
      <div class="row"><span>${Math.round((state.demoWater/state.waterTarget)*100)}% of daily goal</span></div>
    </div>
    <section>
      <p class="section-title">Quick actions</p>
      <div class="actions">
        <button class="btn btn-berry" onclick="setPage('therapy')">⚡ Start therapy</button>
        <button class="btn btn-teal" onclick="addWater(250)">+ Add water</button>
        <button class="btn btn-alt" onclick="state.subTrack='pain';setPage('track')">◔ Track pain</button>
        <button class="btn btn-garnet" onclick="emergencyStop()">⏻ Emergency stop</button>
      </div>
    </section>
    <section>
      <p class="section-title">AI Women's Health Assistant</p>
      <p style="font-size:12px;color:var(--inksoft);margin:0 0 8px;">Ask questions about your menstrual and gynecological health.</p>
      <button class="btn btn-berry" style="width:100%;" onclick="setPage('ai')">💬 Chat with AI</button>
    </section>
    <section>
      <p class="section-title">Health Tools</p>
      <div class="chip-row">
        <div class="chip" onclick="openTools('meds')">💊 Medicines</div><div class="chip" onclick="openTools('jan')">🏪 Jan Aushadhi</div><div class="chip" onclick="openTools('sos')">🆘 SOS</div><div class="chip" onclick="openTools('blood')">🩸 Blood banks</div><div class="chip" onclick="openTools('pcod')">🌸 PCOD / PCOS</div><div class="chip" onclick="openTools('prec')">🛡️ Precautions</div><div class="chip" onclick="openTools('report')">📄 Doctor report</div><div class="chip" onclick="openTools('pcos')">🩺 PCOS check</div><div class="chip" onclick="openTools('hyg')">🧼 Hygiene</div>
      </div>
    </section>
    <section>
      <p class="section-title">Find a Gynecologist</p>
      <p style="font-size:12px;color:var(--inksoft);margin:0 0 8px;">Find nearby gynecologists and women's health clinics.</p>
      <button class="btn btn-teal" style="width:100%;" onclick="setPage('doctors')">🩺 Find Doctor</button>
    </section>
  </div>`;
}


function therapyPage(){
  const hd = heaterDisabled();
  return `
  <div class="page active">
    <header class="top"><div><h1>Therapy</h1><p>Heat and vibration control</p></div></header>
    ${routineCard()}
    ${state.emergency?`<div class="alert danger"><div><b>EMERGENCY STOP ACTIVE</b>App stop only — the physical ESP32 stop is NOT confirmed. Switch the belt off manually if unsafe.</div></div>`:''}
    <div class="alert warning"><div><b>Hardware control unavailable</b>The ESP32 API has no heater / vibration / emergency-stop endpoints yet. These buttons change the app only; they do not command the belt.</div></div>
    <div class="therapy-toggle">
      <div><div class="t">Heater</div><div class="d">${hd?`Disabled — ${state.emergency?'emergency stop':'temperature ≥ '+state.threshold+'°C'}`:'Ready'}</div></div>
      <div class="switch ${state.heater?'on':''} ${hd?'disabled':''}" onclick="toggleHeater()"><div class="knob"></div></div>
    </div>
    <div class="therapy-toggle">
      <div><div class="t">Vibration</div><div class="d">${state.emergency?'Disabled — emergency stop':'Ready'}</div></div>
      <div class="switch ${state.vibration?'on':''} ${state.emergency?'disabled':''}" onclick="toggleVibration()"><div class="knob"></div></div>
    </div>
    <div class="timer">
      ${state.sessionActive
        ? `<div class="big">${fmtTime(state.sessionSecs)}</div><div class="lbl">Session running — ${state.sessionMinutes} min</div>
           <div class="actions" style="margin-top:14px;"><button class="btn btn-garnet" onclick="stopSession()" style="grid-column:1/3;">Stop session</button></div>`
        : `<div class="big">Ready</div><div class="lbl">Choose a duration to start</div>
           <div class="pillrow">
             ${[5,10,15,20].map(m=>`<div class="pill" onclick="startSession(${m})">${m} min</div>`).join('')}
           </div>`}
    </div>
    ${!state.emergency?'':`<button class="btn btn-alt" onclick="clearEmergency()" style="width:100%;">Reset emergency stop (app only)</button>`}
  </div>`;
}

function setSubTrack(t){ state.subTrack=t; render(); }

function periodSubpage(){
  const np = nextPeriodDate();
  const dun = daysUntilNextPeriod();
  const cd = cycleDayToday();
  const cpd = currentPeriodDay();
  const history = [...state.periodRecords].sort((a,b)=>b.start-a.start);
  return `
    ${padBannerHTML()}
    <div class="slider-card">
      <p class="section-title">Cycle status</p>
      ${state.lastPeriodStart ? `
        <div class="row"><span>Last period started</span><span>${fmtDate(state.lastPeriodStart)}</span></div>
        <div class="big-date">Day ${cd} of cycle</div>
        <div class="row"><span>Current period day</span><span>${cpd?('Day '+cpd):'Not currently on period'}</span></div>
        <div class="row"><span>Next period predicted</span><span><b>${fmtDate(np)}</b></span></div>
        <div class="row"><span>Days remaining</span><span>${dun}</span></div>
      ` : `<p style="font-size:13px;color:var(--inksoft);">No period logged yet — add your first record below.</p>`}
    </div>
    <div class="slider-card choco-entry" onclick="chocolateBlinkOpen()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();chocolateBlinkOpen();}">
      <div class="choco-entry-ic" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="44" height="44"><rect x="6" y="8" width="36" height="32" rx="6" fill="#4A2818"/><g fill="#7A4A34"><rect x="9" y="11" width="9" height="8" rx="2"/><rect x="19.5" y="11" width="9" height="8" rx="2"/><rect x="30" y="11" width="9" height="8" rx="2"/><rect x="9" y="21" width="9" height="8" rx="2"/><rect x="19.5" y="21" width="9" height="8" rx="2"/><rect x="30" y="21" width="9" height="8" rx="2"/></g><rect x="6" y="33" width="36" height="7" rx="3" fill="#B8955A"/></svg>
      </div>
      <div class="choco-entry-tx">
        <span class="phase-tag tone-garnet">PERIOD COMFORT</span>
        <div class="t">\uD83C\uDF6B Dark Chocolate</div>
        <div class="d">${cpd?('You\u2019re on day '+cpd+' of your period \u2014 '):''}an optional, small-portion comfort snack idea.</div>
      </div>
      <span class="choco-entry-go">View <b>\u203A</b></span>
    </div>
    <div class="blinkit-wrap">${BLINKIT_BTN_HTML}</div>
    <div class="slider-card">
      <p class="section-title">${state.editingId?'Edit record':'Log a period'}</p>
      <label style="font-size:11px;color:var(--inksoft);">First day</label>
      <input class="field" type="date" value="${state.formStart?dateKey(state.formStart):''}" onchange="saveFormDates('formStart',this.value)">
      <label style="font-size:11px;color:var(--inksoft);">Last day (optional)</label>
      <input class="field" type="date" value="${state.formEnd?dateKey(state.formEnd):''}" onchange="saveFormDates('formEnd',this.value)">
      <div class="actions" style="margin-top:10px;">
        <button class="btn btn-berry" onclick="savePeriodRecord()">Save record</button>
        <button class="btn btn-alt" onclick="cancelEdit()">${state.editingId?'Cancel edit':'Clear'}</button>
      </div>
    </div>
    <div class="slider-card">
      <p class="section-title">Supplies</p>
      <a class="btn btn-teal link-btn" style="width:100%;" href="https://blinkit.com/s/?q=sanitary%20pads" target="_blank" rel="noopener">🛒 Order sanitary pads on Blinkit</a>
    </div>
    <div class="slider-card">
      <p class="section-title">Cycle length &amp; average duration</p>
      <label style="font-size:11px;color:var(--inksoft);">Cycle length (days)</label>
      <input class="field" type="number" min="20" max="45" value="${state.cycleLength}" oninput="state.cycleLength=Number(this.value)||25;render()">
      <p style="font-size:11px;color:var(--inksoft);margin:8px 0 0;">Average period duration from your history: <b>${avgPeriodDuration()} days</b>.</p>
    </div>
    <div class="slider-card">
      <p class="section-title">Period history</p>
      ${history.length===0 ? `<p style="font-size:13px;color:var(--inksoft);">No records yet.</p>` : history.map(r=>`
        <div class="log-entry">
          <span>${fmtDate(r.start)} — ${r.end?fmtDate(r.end):'ongoing'}${r.end?` (${daysBetween(r.start,r.end)+1}d)`:''}</span>
          <span style="display:flex;gap:8px;">
            <a style="cursor:pointer;color:var(--teal-600);font-weight:700;" onclick="editRecord(${r.id})">Edit</a>
            <a style="cursor:pointer;color:var(--garnet-500);font-weight:700;" onclick="deleteRecord(${r.id})">Delete</a>
          </span>
        </div>`).join('')}
    </div>
    <div class="slider-card">
      <p class="section-title">Demo controls</p>
      <p style="font-size:11px;color:var(--inksoft);margin:0 0 8px;">Fast-forward the simulated date to see the pad auto-reorder trigger on Home.</p>
      <button class="btn btn-alt" style="width:100%;" onclick="advanceDemoDay()">Skip forward 1 day (today: ${fmtDate(todayDate())})</button>
    </div>`;
}

