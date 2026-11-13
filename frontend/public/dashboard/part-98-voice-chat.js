// Multi-language chat box + speech output helper (the voice assistant itself is in part-101).
//  - LANGS: every language the app can talk in (chat replies come from the backend in the chosen language)
//  - Voice input: browser SpeechRecognition (Chrome / Edge / Safari). Voice output: speechSynthesis.
//  - A floating chat box (bottom-right) shares the same conversation as the AI page.
(function () {
  // [code, native name, speech locale]
  const LANGS = [
    ['en','English','en-IN'], ['hi','हिन्दी','hi-IN'], ['te','తెలుగు','te-IN'], ['ta','தமிழ்','ta-IN'],
    ['kn','ಕನ್ನಡ','kn-IN'], ['ml','മലയാളം','ml-IN'], ['bn','বাংলা','bn-IN'], ['mr','मराठी','mr-IN'],
    ['gu','ગુજરાતી','gu-IN'], ['pa','ਪੰਜਾਬੀ','pa-IN'], ['ur','اردو','ur-IN'], ['or','ଓଡ଼ିଆ','or-IN'],
    ['as','অসমীয়া','as-IN'], ['ne','नेपाली','ne-NP'], ['es','Español','es-ES'], ['fr','Français','fr-FR'],
    ['de','Deutsch','de-DE'], ['pt','Português','pt-BR'], ['it','Italiano','it-IT'], ['ru','Русский','ru-RU'],
    ['ar','العربية','ar-SA'], ['zh-CN','中文','zh-CN'], ['ja','日本語','ja-JP'], ['ko','한국어','ko-KR'],
    ['id','Bahasa Indonesia','id-ID'], ['tr','Türkçe','tr-TR'], ['sw','Kiswahili','sw-KE'], ['th','ไทย','th-TH'],
    ['vi','Tiếng Việt','vi-VN'], ['fa','فارسی','fa-IR'], ['si','සිංහල','si-LK'], ['ms','Bahasa Melayu','ms-MY'],
    ['tl','Filipino','fil-PH'], ['nl','Nederlands','nl-NL'], ['pl','Polski','pl-PL']
  ];
  const locale = (code) => (LANGS.find((l) => l[0] === code) || LANGS[0])[2];
  const base = (loc) => String(loc).toLowerCase().split(/[-_]/)[0];

  // Bottom-nav labels for more languages (anything missing falls back to English)
  try {
    Object.assign(TR, {
      ta:{Home:'முகப்பு',Therapy:'சிகிச்சை',Track:'கண்காணி',Exercise:'உடற்பயிற்சி',Diet:'உணவு',Profile:'சுயவிவரம்'},
      kn:{Home:'ಮುಖಪುಟ',Therapy:'ಚಿಕಿತ್ಸೆ',Track:'ಟ್ರ್ಯಾಕ್',Exercise:'ವ್ಯಾಯಾಮ',Diet:'ಆಹಾರ',Profile:'ಪ್ರೊಫೈಲ್'},
      ml:{Home:'ഹോം',Therapy:'ചികിത്സ',Track:'ട്രാക്ക്',Exercise:'വ്യായാമം',Diet:'ഭക്ഷണം',Profile:'പ്രൊഫൈൽ'},
      bn:{Home:'হোম',Therapy:'থেরাপি',Track:'ট্র্যাক',Exercise:'ব্যায়াম',Diet:'খাদ্য',Profile:'প্রোফাইল'},
      mr:{Home:'मुख्यपृष्ठ',Therapy:'उपचार',Track:'नोंद',Exercise:'व्यायाम',Diet:'आहार',Profile:'प्रोफाइल'},
      gu:{Home:'હોમ',Therapy:'થેરાપી',Track:'ટ્રેક',Exercise:'કસરત',Diet:'આહાર',Profile:'પ્રોફાઇલ'},
      pa:{Home:'ਹੋਮ',Therapy:'ਥੈਰੇਪੀ',Track:'ਟ੍ਰੈਕ',Exercise:'ਕਸਰਤ',Diet:'ਖੁਰਾਕ',Profile:'ਪ੍ਰੋਫਾਈਲ'},
      ur:{Home:'ہوم',Therapy:'تھراپی',Track:'ٹریک',Exercise:'ورزش',Diet:'خوراک',Profile:'پروفائل'},
      es:{Home:'Inicio',Therapy:'Terapia',Track:'Registro',Exercise:'Ejercicio',Diet:'Dieta',Profile:'Perfil'},
      fr:{Home:'Accueil',Therapy:'Thérapie',Track:'Suivi',Exercise:'Exercice',Diet:'Régime',Profile:'Profil'},
      de:{Home:'Start',Therapy:'Therapie',Track:'Tracking',Exercise:'Übung',Diet:'Ernährung',Profile:'Profil'},
      pt:{Home:'Início',Therapy:'Terapia',Track:'Registro',Exercise:'Exercício',Diet:'Dieta',Profile:'Perfil'},
      ar:{Home:'الرئيسية',Therapy:'العلاج',Track:'التتبع',Exercise:'التمارين',Diet:'النظام الغذائي',Profile:'الملف'}
    });
  } catch (e) {}

  window.LANGS = LANGS;
  window.langSelectHtml = function (id) {
    return `<select class="field lang-select" ${id ? `id="${id}"` : ''} aria-label="Language" onchange="setLang(this.value)">` +
      LANGS.map((l) => `<option value="${l[0]}" ${state.lang === l[0] ? 'selected' : ''}>${l[1]}${l[0] === 'en' ? '' : ' (' + l[0] + ')'}</option>`).join('') + '</select>';
  };

  // ---- small toast for voice problems ----
  let toastT = null;
  function toast(msg) {
    let t = document.getElementById('voiceToast');
    if (!t) { t = document.createElement('div'); t.id = 'voiceToast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4500);
  }

  window.__sprToast = toast;

  // ---- voice output ----
  const synth = window.speechSynthesis;
  function plain(s) {
    return String(s).replace(/\*\*/g, '').replace(/_/g, ' ').replace(/[•●▪]/g, ',').replace(/\n+/g, '. ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  }
  function pickVoice(loc) {
    const vs = synth ? synth.getVoices() : [];
    return vs.find((v) => v.lang.toLowerCase().replace('_', '-') === loc.toLowerCase()) || vs.find((v) => base(v.lang) === base(loc));
  }
  function speak(text, lang) {
    if (!synth) { toast('Voice output is not supported in this browser.'); return; }
    synth.cancel();
    const loc = locale(lang || 'en'), voice = pickVoice(loc);
    if (!voice && synth.getVoices().length) toast('No ' + loc + ' voice is installed on this device, so it may sound off. Install one in your system speech settings.');
    // speak sentence by sentence (long utterances get cut off in Chrome)
    const parts = plain(text).match(/[^.!?।۔]+[.!?।۔]*/g) || [plain(text)];
    const chunks = []; let cur = '';
    parts.forEach((p) => { if ((cur + p).length > 180 && cur) { chunks.push(cur); cur = ''; } cur += p; });
    if (cur.trim()) chunks.push(cur);
    chunks.forEach((c) => { const u = new SpeechSynthesisUtterance(c.trim()); u.lang = loc; if (voice) u.voice = voice; u.rate = 0.95; synth.speak(u); });
  }
  window.speakText = speak;                       // used by the standalone voice assistant (part-101)
  window.stopSpeaking = function () { if (synth) synth.cancel(); };

  // ---- floating chat box (shares state.chatMessages with the AI page) ----
  let open = false;
  function ensureWidget() {
    let w = document.getElementById('chatWidget');
    if (w) return w;
    w = document.createElement('div'); w.id = 'chatWidget';
    w.innerHTML = `<button id="chatFab" type="button" aria-label="Open chat" onclick="toggleChatBox()">💬</button>
      <div id="chatBox" role="dialog" aria-label="Chat assistant" hidden>
        <div class="cb-head"><b>💬 Ask Relief AI</b>
          <span class="cb-tools"><button type="button" title="Close" onclick="toggleChatBox()">✕</button></span></div>
        <div class="cb-lang">${window.langSelectHtml('wLang')}</div>
        <div class="cb-msgs" id="wMsgs"></div>
        <div class="cb-input">
          <input id="wChatInput" type="text" dir="auto" autocomplete="off" placeholder="Type your question…"
            oninput="state.chatInput=this.value" onkeydown="if(event.key==='Enter')sendChat()">
          <button type="button" class="btn btn-berry" onclick="sendChat()">Send</button>
        </div>
      </div>`;
    document.body.appendChild(w);
    return w;
  }
  window.toggleChatBox = function () {
    open = !open; ensureWidget();
    document.getElementById('chatBox').hidden = !open;
    document.getElementById('chatFab').style.display = open ? 'none' : '';
    if (open) { widgetRefresh(); setTimeout(() => { const i = document.getElementById('wChatInput'); i && i.focus(); }, 50); }
  };
  window.widgetRefresh = function () {
    const w = ensureWidget();
    w.classList.toggle('on-ai-page', state.page === 'ai');       // the AI page already is a chat
    const box = document.getElementById('wMsgs'); if (!box) return;
    const msgs = state.chatMessages;
    box.innerHTML = (msgs.length ? '' : '<p class="cb-empty">Ask about periods, cramps, PCOS or the belt — in your own language.</p>') +
      msgs.map((m, i) => `<div class="bubble ${m.urgent ? 'urgent' : m.role}" dir="auto">${fmtChat(m.text)}${m.note ? `<div class="bnote">${escapeHtml(m.note)}</div>` : ''}</div>`).join('') +
      (aiTyping ? '<div class="bubble ai typing"><div class="dots"><i></i><i></i><i></i></div></div>' : '');
    box.scrollTop = box.scrollHeight;
    const wi = document.getElementById('wChatInput'); if (wi && document.activeElement !== wi) wi.value = state.chatInput || '';
    const sel = document.getElementById('wLang'); if (sel) sel.value = state.lang;
  };

  // keep the widget in sync with the original chat functions
  const _chatRender = window.chatRender;
  window.chatRender = function (refocus) { if (state.page === 'ai') _chatRender(refocus); window.widgetRefresh(); };
  const _clearChat = window.clearChat;
  window.clearChat = function () { window.stopSpeaking(); _clearChat(); window.widgetRefresh(); };
  const _setLang = window.setLang;
  window.setLang = function (l) {
    _setLang(l);                                   // the original re-renders the whole app with the new language
    window.widgetRefresh();
  };
  const _render = window.render;
  window.render = function () { _render(); const w = document.getElementById('chatWidget'); if (w) w.classList.toggle('on-ai-page', state.page === 'ai'); };
  if (synth) synth.onvoiceschanged = () => {};     // warms up the voice list
  ensureWidget(); window.widgetRefresh();
  if (state.page === 'ai') render();               // re-draw once so the AI page picks up the new mic / language controls
})();
