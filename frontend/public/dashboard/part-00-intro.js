(function(){
  var overlay = document.getElementById('introOverlay');
  var FLAG = 'smart_period_relief_intro_seen';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seenBefore = false;
  try { seenBefore = localStorage.getItem(FLAG) === '1'; } catch(e){}
  var timers = [];
  var particlesRunning = false;
  var replayBtnVisible = false;
  var $ = function(id){ return document.getElementById(id); };
  var ALL_ON = ['iLogo','iLine','iHeart','iS3','iK3','iD3','iT3','iG3','iL3','iEnter'];

  function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
  function on(id){ var e=$(id); if(e){ e.classList.add('on'); } }
  function markSeen(){ try{ localStorage.setItem(FLAG,'1'); }catch(e){} }

  function setReplayBtnVisible(v){
    replayBtnVisible = v;
    var btn = $('replayIntroBtn');
    if(btn) btn.disabled = !v;
  }

  function resetIntroVisuals(){
    clearTimers();
    particlesRunning = false;
    ['iLogo','iLine','iHeart','iEnter','iA','iS2','iS3','iC1','iC2','iC3','iK3','iD3','iT3','iG3','iL3','sc2'].forEach(function(id){ var e=$(id); if(e) e.classList.remove('on','off'); });
    ['iName','iPres'].forEach(function(id){ $(id).classList.remove('on2'); });
    overlay.classList.remove('intro-hidden','intro-removed');
  }

  function finishIntro(){
    clearTimers();
    particlesRunning = false;
    overlay.classList.add('intro-hidden');
    markSeen();
    if(typeof pinAfterIntro==='function') pinAfterIntro();
    setReplayBtnVisible(true);
    setTimeout(function(){ overlay.classList.add('intro-removed'); }, 850);
  }

  $('introSkipBtn').addEventListener('click', finishIntro);
  $('iEnter').addEventListener('click', finishIntro);

  // Butterflies, flowers, petals & sparkles
  function startParticles(){
    var canvas=$('introParticles'), ctx=canvas.getContext('2d'), w, h, items=[];
    particlesRunning=true;
    function size(){ w=canvas.width=overlay.clientWidth; h=canvas.height=overlay.clientHeight; }
    size(); window.addEventListener('resize',size);
    var cols=['#FF8FBF','#F06FA8','#C9A0FF','#FFB38A','#FF6FAE','#B388FF'];
    function make(init){ var t=Math.random(), k=t<.4?'flower':t<.65?'butter':t<.85?'petal':'spark';
      return {k:k,x:Math.random()*w,y:init?Math.random()*h:(k==='butter'?h+30:-30),s:k==='butter'?12+Math.random()*9:7+Math.random()*10,vy:k==='butter'?-(.5+Math.random()*.7):.4+Math.random()*.8,sw:Math.random()*6.28,sp:.015+Math.random()*.02,r:Math.random()*6.28,vr:(Math.random()-.5)*.03,c:cols[(Math.random()*cols.length)|0],o:.55+Math.random()*.4,f:Math.random()*6.28}; }
    for(var i=0;i<30;i++) items.push(make(true));
    function petal(x,y,s,rot){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,-s*.6,s*.38,s*.7,0,0,6.28); ctx.fill(); ctx.restore(); }
    function draw(p,x){
      ctx.globalAlpha=p.o; ctx.fillStyle=p.c;
      if(p.k==='flower'){ for(var a=0;a<5;a++) petal(x,p.y,p.s,p.r+a*1.2566); ctx.fillStyle='#FFE58A'; ctx.beginPath(); ctx.arc(x,p.y,p.s*.22,0,6.28); ctx.fill(); }
      else if(p.k==='petal'){ petal(x,p.y,p.s,p.r); }
      else if(p.k==='spark'){ ctx.fillStyle='#fff'; ctx.shadowColor='#FF6FAE'; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(x,p.y,p.s*.22+Math.sin(p.f),0,6.28); ctx.fill(); ctx.shadowBlur=0; }
      else { var fl=Math.abs(Math.sin(p.f*3)); ctx.save(); ctx.translate(x,p.y); ctx.rotate(Math.sin(p.sw)*.4);
        [-1,1].forEach(function(d){ ctx.save(); ctx.scale(d*(.25+.75*fl),1); ctx.beginPath(); ctx.ellipse(p.s*.55,-p.s*.35,p.s*.55,p.s*.75,.5,0,6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(p.s*.4,p.s*.5,p.s*.35,p.s*.5,-.4,0,6.28); ctx.fill(); ctx.restore(); });
        ctx.fillStyle='#5A1F45'; ctx.fillRect(-1,-p.s*.6,2,p.s*1.4); ctx.restore(); }
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      if(!particlesRunning) return;
      for(var i=0;i<items.length;i++){ var p=items[i]; p.y+=p.vy; p.sw+=p.sp; p.r+=p.vr; p.f+=.04;
        if(p.y>h+40||p.y<-40){ items[i]=make(false); continue; }
        draw(p,p.x+Math.sin(p.sw)*(p.k==='butter'?40:20)); }
      ctx.globalAlpha=1; requestAnimationFrame(tick);
    }
    tick();
  }
  function off(id){ var e=$(id); e.classList.remove('on'); e.classList.add('off'); }
  function runFullIntro(){
    // Scene 1: logo (0 - 4.8s)  |  Scene 2: story (4.8s - ~25s, about 20 seconds)
    at(300,  function(){ on('iLogo'); });
    at(1500, function(){ on('iLine'); $('iName').classList.add('on2'); });
    at(2700, function(){ $('iPres').classList.add('on2'); });
    at(4800, function(){ on('sc2'); if(!reduced) startParticles(); });
    at(5700, function(){ on('iHeart'); });
    at(6400, function(){ on('iA'); });
    at(10400,function(){ off('iA'); });
    at(10900,function(){ on('iS2'); });
    at(12000,function(){ on('iC1'); });
    at(13100,function(){ on('iC2'); });
    at(14200,function(){ on('iC3'); });
    at(16600,function(){ off('iS2'); });
    at(17100,function(){ on('iS3'); on('iK3'); });
    at(18100,function(){ on('iD3'); });
    at(19600,function(){ on('iT3'); });
    at(21200,function(){ on('iG3'); });
    at(22600,function(){ on('iL3'); });
    at(23500,function(){ on('iEnter'); });
    at(28000, finishIntro);
  }
  function showFinalState(){
    on('sc2'); ALL_ON.forEach(on);
    ['iName','iPres'].forEach(function(id){ $(id).classList.add('on2'); });
  }
  function runShortReplay(){
    showFinalState();
    if(!reduced) startParticles();
    at(2200, finishIntro);
  }
  function runReducedMotion(){
    showFinalState();
    at(seenBefore ? 600 : 3000, finishIntro);
  }
  function playIntro(auto){
    resetIntroVisuals();
    setReplayBtnVisible(false);
    // Always play the full starting animation (the HTML's short replay on repeat visits
    // looked like the animation was missing/inexact).
    runFullIntro();
  }

  function ensureReplayButton(){
    var app = document.getElementById('app');
    if(!app || app.querySelector('#replayIntroBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'replayIntroBtn';
    btn.type = 'button';
    btn.title = 'Replay Introduction';
    btn.setAttribute('aria-label','Replay introduction animation');
    btn.disabled = !replayBtnVisible;
    btn.innerHTML = '<span class="ri-ic">▶</span><span class="ri-label">Intro</span>';
    app.insertBefore(btn, app.firstChild);
  }
  function watchApp(){
    var app = document.getElementById('app');
    if(!app){ requestAnimationFrame(watchApp); return; }
    ensureReplayButton();
    new MutationObserver(ensureReplayButton).observe(app, {childList:true});
  }
  watchApp();
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest && e.target.closest('#replayIntroBtn');
    if(t && !t.disabled) playIntro(false);
  });

  playIntro(true);
})();
