function setDoctorTab(t){ state.doctorTab=t; render(); }
function toggleDoctorFilter(f){ state.doctorFilters[f] = !state.doctorFilters[f]; render(); }

function buildMapsQuery(){
  let q = 'gynecologist';
  if(state.doctorFilters.clinic) q += ' clinic';
  if(state.doctorFilters.femaleDoctor) q += ' female doctor';
  if(state.doctorFilters.openNow) q += ' open now';
  return q;
}

function useMyLocation(){
  if(!navigator.geolocation){ geoStatus='denied'; render(); return; }
  geoStatus='loading'; render();
  navigator.geolocation.getCurrentPosition(
    pos=>{ sessionGeo = {lat:pos.coords.latitude, lng:pos.coords.longitude}; geoStatus='granted'; render(); },
    err=>{ geoStatus='denied'; render(); },
    {timeout:10000}
  );
}
function openMapsNearMe(){
  if(!sessionGeo) return;
  const q = encodeURIComponent(buildMapsQuery());
  window.open(`https://www.google.com/maps/search/${q}/@${sessionGeo.lat},${sessionGeo.lng},14z`, '_blank', 'noopener');
}
function openMapsCity(){
  const city = state.doctorCity.trim();
  if(!city) return;
  const q = encodeURIComponent(buildMapsQuery()+' in '+city+', India');
  window.open(`https://www.google.com/maps/search/${q}`, '_blank', 'noopener');
}
function openMapsState(){
  const st = state.doctorState.trim();
  if(!st) return;
  const q = encodeURIComponent(buildMapsQuery()+' in '+st+', India');
  window.open(`https://www.google.com/maps/search/${q}`, '_blank', 'noopener');
}
function openMapsAllIndia(){
  const q = encodeURIComponent(buildMapsQuery()+' hospital India');
  window.open(`https://www.google.com/maps/search/${q}`, '_blank', 'noopener');
}

const INDIA_CITIES = ['Hyderabad','Delhi','Mumbai','Bengaluru','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow','Vijayawada','Visakhapatnam','Warangal','Karimnagar'];

function generateVisitSummary(){
  const latest = [...state.periodRecords].sort((a,b)=>b.start-a.start)[0];
  const levels = state.pain.map(p=>p.level);
  const avgPain = levels.length ? (levels.reduce((a,b)=>a+b,0)/levels.length).toFixed(1) : 'not logged';
  const recentSymptoms = Object.entries(state.symptoms).slice(0,3).map(([d,l])=>`${d}: ${l.join(', ')}`).join('; ') || 'none logged';
  const lines = [
    `Cycle length: ${state.cycleLength} days`,
    `Last period: ${latest ? fmtDate(latest.start)+(latest.end?' to '+fmtDate(latest.end):' (ongoing)') : 'not logged'}`,
    `Average logged pain: ${avgPain}/10${levels.length?` (most recent: ${levels[0]}/10)`:''}`,
    `Recent symptoms: ${recentSymptoms}`,
    state.doctorQuestions.trim() ? `Questions for the doctor: ${state.doctorQuestions.trim()}` : ''
  ].filter(Boolean);
  state.visitSummary = lines.join('\n');
  render();
}
function copySummary(){
  try{ navigator.clipboard.writeText(state.visitSummary); }catch(e){}
}

function doctorsPage(){
  return `
  <div class="page active">
    <header class="top"><div><h1>Find a Gynecologist</h1><p>Search opens live results in Google Maps — no invented listings.</p></div></header>
    <div class="subtabs">
      ${[['near','Near Me'],['city','City'],['state','State'],['all','All India']].map(([id,l])=>`<button class="${state.doctorTab===id?'active':''}" onclick="setDoctorTab('${id}')">${l}</button>`).join('')}
    </div>
    <div class="slider-card">
      <p class="section-title">Filters</p>
      <div class="chip-row">
        <div class="chip ${state.doctorFilters.clinic?'active':''}" onclick="toggleDoctorFilter('clinic')">Hospital / Clinic</div>
        <div class="chip ${state.doctorFilters.openNow?'active':''}" onclick="toggleDoctorFilter('openNow')">Open Now</div>
        <div class="chip ${state.doctorFilters.femaleDoctor?'active':''}" onclick="toggleDoctorFilter('femaleDoctor')">Female doctor</div>
      </div>
      <p style="font-size:11px;color:var(--inksoft);margin-top:8px;">Filters are added to your Maps search terms — Google's own listing data decides the results, nothing is filtered by us.</p>
    </div>
    ${state.doctorTab==='near' ? `
      <div class="slider-card">
        <p class="section-title">Near me</p>
        ${geoStatus==='idle'||geoStatus==='denied' ? `
          <button class="btn btn-berry" style="width:100%;" onclick="useMyLocation()">📍 Use My Location</button>
          ${geoStatus==='denied' ? `<p style="font-size:12px;color:var(--garnet-600);margin-top:8px;">Location wasn't available — enter a city or area instead.</p>` : ''}
          <label style="font-size:11px;color:var(--inksoft);display:block;margin-top:10px;">Enter City / Area</label>
          <input class="field" type="text" placeholder="e.g. Karimnagar" value="${state.doctorCity}" oninput="state.doctorCity=this.value">
          <button class="btn btn-alt" style="width:100%;margin-top:8px;" onclick="openMapsCity()">Search this area</button>
        ` : geoStatus==='loading' ? `<p style="font-size:13px;color:var(--inksoft);">Getting your location…</p>` : `
          <p style="font-size:13px;color:var(--inksoft);margin-bottom:10px;">Location found. This isn't stored — it's used only for this search.</p>
          <button class="btn btn-berry" style="width:100%;" onclick="openMapsNearMe()">Open nearby results in Google Maps</button>
        `}
      </div>` : ''}
    ${state.doctorTab==='city' ? `
      <div class="slider-card">
        <p class="section-title">Search by city</p>
        <input class="field" type="text" placeholder="Enter a city" value="${state.doctorCity}" oninput="state.doctorCity=this.value">
        <div class="chip-row" style="margin-top:8px;">${INDIA_CITIES.map(c=>`<div class="chip ${state.doctorCity===c?'active':''}" onclick="state.doctorCity='${c}';render()">${c}</div>`).join('')}</div>
        <button class="btn btn-berry" style="width:100%;margin-top:10px;" onclick="openMapsCity()">Search in ${state.doctorCity||'this city'}</button>
      </div>` : ''}
    ${state.doctorTab==='state' ? `
      <div class="slider-card">
        <p class="section-title">Search by state</p>
        <input class="field" type="text" placeholder="e.g. Telangana" value="${state.doctorState}" oninput="state.doctorState=this.value">
        <button class="btn btn-berry" style="width:100%;margin-top:10px;" onclick="openMapsState()">Search this state</button>
      </div>` : ''}
    ${state.doctorTab==='all' ? `
      <div class="slider-card">
        <p class="section-title">All India</p>
        <p style="font-size:12px;color:var(--inksoft);margin:0 0 10px;">Opens a broad India-wide search for gynecology hospitals.</p>
        <button class="btn btn-berry" style="width:100%;" onclick="openMapsAllIndia()">Search all India</button>
      </div>` : ''}
    <div class="slider-card">
      <p class="section-title">Doctor visit summary</p>
      <button class="btn btn-alt" style="width:100%;margin-bottom:10px" onclick="openTools('report')">📄 One-page doctor report (with medicines)</button>
      <label style="font-size:11px;color:var(--inksoft);">Questions you want to ask</label>
      <textarea class="field" placeholder="e.g. Is this pain level normal?" oninput="state.doctorQuestions=this.value">${state.doctorQuestions}</textarea>
      <button class="btn btn-teal" style="width:100%;margin-top:10px;" onclick="generateVisitSummary()">Ask AI what I should tell my doctor</button>
      ${state.visitSummary ? `
        <textarea class="field" style="margin-top:10px;" oninput="state.visitSummary=this.value">${state.visitSummary}</textarea>
        <button class="btn btn-alt" style="width:100%;margin-top:8px;" onclick="copySummary()">Copy summary</button>
        <p style="font-size:11px;color:var(--inksoft);margin-top:6px;">Built from your own logged data — edit anything before sharing it. Not a diagnosis.</p>
      ` : ''}
    </div>
  </div>`;
}


function profilePage(){
  return `
  <div class="page active">
    <header class="top"><div><h1>Profile</h1><p>Device &amp; connection settings</p></div></header>
    ${settingsCard()}${pinCard()}
    <div class="slider-card">
      <p class="section-title">Device — ESP32 Smart Relief Belt</p>
      <div class="settings-row"><span>Connection</span><span class="badge" style="${devConn()==='connected'?'background:var(--teal-100);color:var(--teal-600);':devConn()==='connecting'?'background:var(--amber-100);color:var(--amber-600);':''}">${devConn()==='connected'?'Connected':devConn()==='connecting'?'Connecting':liveOn()?'DISCONNECTED':'Not connected'}</span></div>
      <div class="settings-row"><span>Body temperature</span><span>${liveInfo('temp').val==='—'?'—':liveInfo('temp').val+'°C'}${liveOn()?'':' · DEMO DATA'}</span></div>
      <div class="settings-row"><span>Heating level</span><span>${state.heater?'ON (app only)':'OFF'}</span></div>
      <div class="settings-row"><span>Battery</span><span>${liveInfo('battery').val==='—'?'—':liveInfo('battery').val+'%'}${liveOn()?'':' · DEMO DATA'}</span></div>
      <div class="settings-row"><span>Team</span><span>JUMPER WIRES</span></div>
      <button class="btn btn-alt" style="width:100%;margin-top:8px;" onclick="connectWifi()">${liveOn()?'Reconnect to ESP32':state.wifiStatus==='connected'?'Disconnect':'Connect to ESP32'}</button>
    </div>
    ${hrSettingsCard()}
    <div class="slider-card">
      <p class="section-title">Safety</p>
      <div class="settings-row"><span>Heater safety threshold</span><span>${state.threshold}°C</span></div>
      <div class="settings-row"><span>Water target</span><span>${state.waterTarget} ml</span></div>
      <div class="settings-row"><span>Emergency stop</span><span class="badge" style="${state.emergency?'background:var(--garnet-100);color:var(--garnet-600);':''}">${state.emergency?'ACTIVE':'Clear'}</span></div>
    </div>
    <div class="slider-card">
      <p class="section-title">Credits</p>
      <div class="settings-row"><span>Team leader name</span><span>Sriram</span></div>
      <div class="settings-row"><span>Team members</span><span>Revathi , Parshuram Reddy</span></div>
      
      <p style="font-size:11px;color:var(--inksoft);line-height:1.5;margin:8px 0 0;">One of the first student-built smart period-relief wearable projects.</p>
    </div>
    ${dataCard()}
    <div class="slider-card">
      <p class="section-title">Privacy</p>
      <p style="font-size:12px;color:var(--inksoft);line-height:1.5;margin:0 0 8px;">Your health information is sensitive. Everything you enter — period records, pain, symptoms, chat history — stays in this browser's local storage on this device; nothing is sent to a server. Location is only requested when you tap "Use My Location" on the Doctors page, is used for that search alone, and is never saved. AI chat responses are educational only, not medical advice.</p>
      <button class="btn btn-garnet" style="width:100%;" onclick="deleteAllData()">${state.confirmDelete?'Tap again to confirm — this cannot be undone':'Delete all my stored data'}</button>
      ${state.confirmDelete?`<a class="linklike" style="font-size:12px;display:block;margin-top:8px;text-align:center;" onclick="state.confirmDelete=false;render()">Cancel</a>`:''}
    </div>
    <p style="font-size:12px;color:var(--inksoft);line-height:1.5;">Academic engineering prototype. Not a clinically validated medical device — no diagnosis or blood-pressure estimation.</p>
  </div>`;
}


// ============ DARK CHOCOLATE SCREEN (opens ONLY when the user clicks the Dark Chocolate card) ============
// It lives in its own overlay outside #app and never calls render()/setPage(), so the
// tracker underneath (sub-tab, form inputs, scroll position, all data) stays exactly as it was.

// ============ BLINKIT DARK CHOCOLATE ============
