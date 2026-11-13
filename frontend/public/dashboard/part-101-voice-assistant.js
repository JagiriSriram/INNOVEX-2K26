// Standalone voice assistant - lives OUTSIDE the chat. A round WhatsApp-style green mic button (bottom-right, beside the chat button) is visible on every
// page: tap it, speak, and the answer is shown on a small card and read aloud. It uses the same RAG backend,
// language setting and saved History as the chat, but never touches the chat window.
(function () {
  const API = window.RAG_API || "http://localhost:8000";
  const V = { open: false, listening: false, busy: false, heard: "", reply: null, error: "" };
  let rec = null;

  const locale = (code) => ((window.LANGS || []).find((l) => l[0] === code) || ["en", "English", "en-IN"])[2];
  // WhatsApp-style voice icon: white microphone on a green circle
  const WA_MIC = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><path fill="#fff" d="M12 15.2a3.4 3.4 0 0 0 3.4-3.4V6.4a3.4 3.4 0 1 0-6.8 0v5.4a3.4 3.4 0 0 0 3.4 3.4zm6-3.4a.9.9 0 0 0-1.8 0 4.2 4.2 0 0 1-8.4 0 .9.9 0 0 0-1.8 0 6 6 0 0 0 5.1 5.93V20.4H9.6a.9.9 0 0 0 0 1.8h4.8a.9.9 0 0 0 0-1.8h-1.5v-2.67A6 6 0 0 0 18 11.8z"/></svg>';
  const esc = (s) => escapeHtml(String(s == null ? "" : s));

  function root() {
    let w = document.getElementById("voiceAssist");
    if (!w) {
      w = document.createElement("div"); w.id = "voiceAssist";
      document.body.appendChild(w);
    }
    return w;
  }

  function paint() {
    const w = root();
    const status = V.listening ? "🎤 Listening… speak now" : V.busy ? "Thinking…" : V.error ? V.error : "Tap the mic and ask your question";
    const r = V.reply;
    w.innerHTML = `
      <button id="voiceFab" type="button" class="${V.listening ? "on" : ""}" aria-label="Voice assistant" title="Ask by voice" onclick="voiceFabTap()">${WA_MIC}</button>
      <div id="voiceCard" ${V.open ? "" : "hidden"} role="dialog" aria-label="Voice assistant">
        <div class="vc-head"><b>🎙️ Voice assistant</b>
          <button type="button" title="Close" onclick="voiceClose()">✕</button></div>
        <div class="vc-lang">${window.langSelectHtml ? window.langSelectHtml("vLang") : ""}</div>
        <div class="vc-status ${V.listening ? "live" : ""}" aria-live="polite">${esc(status)}</div>
        ${V.heard ? `<div class="vc-you" dir="auto"><small>You asked</small>${esc(V.heard)}</div>` : ""}
        ${V.busy ? '<div class="dots"><i></i><i></i><i></i></div>' : ""}
        ${r ? `<div class="vc-ans ${r.urgent ? "urgent" : ""}" dir="auto">${fmtChat(r.text)}${r.note ? `<div class="bnote">${esc(r.note)}</div>` : ""}</div>
          <div class="vc-btns"><button type="button" onclick="voiceReplay()">🔊 Listen again</button><button type="button" onclick="stopSpeaking()">⏹ Stop</button>
          ${r.urgent ? '<button type="button" class="danger" onclick="voiceClose();setPage(\'doctors\')">Find nearby help</button>' : ""}</div>` : ""}
        <button type="button" class="vc-mic ${V.listening ? "on" : ""}" onclick="voiceListen()" aria-label="Speak your question">${V.listening ? "⏹ Stop" : WA_MIC + " Ask by voice"}</button>
      </div>`;
    document.getElementById("voiceFab").style.display = V.open ? "none" : "";
  }

  window.voiceFabTap = function () { V.open = true; paint(); window.voiceListen(); };   // one tap: open + start listening
  window.voiceClose = function () {
    if (rec && V.listening) { try { rec.abort(); } catch (e) {} }
    window.stopSpeaking && window.stopSpeaking();
    V.open = false; V.listening = false; paint();
  };
  window.voiceReplay = function () { if (V.reply && window.speakText) window.speakText(V.reply.text, V.reply.lang || "en"); };

  window.voiceListen = function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { V.error = "Voice input needs Chrome, Edge or Safari."; paint(); return; }
    if (V.listening) { rec && rec.stop(); return; }
    window.stopSpeaking && window.stopSpeaking();
    V.error = ""; V.heard = ""; V.reply = null;
    rec = new SR();
    rec.lang = locale(state.lang); rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let finalText = "";
    rec.onstart = () => { V.listening = true; paint(); };
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      V.heard = (finalText + interim).trim(); paint();
    };
    rec.onerror = (e) => {
      V.error = { "not-allowed": "Microphone is blocked. Allow it in the browser address bar and try again.",
        "service-not-allowed": "Microphone is blocked in the browser settings.",
        "no-speech": "I did not hear anything. Tap the mic and try again.",
        "language-not-supported": "Voice input is not available for this language in your browser.",
        "network": "Voice recognition needs an internet connection.", "audio-capture": "No microphone found." }[e.error] || "";
    };
    rec.onend = () => {
      V.listening = false;
      const t = finalText.trim();
      if (t) ask(t); else paint();
    };
    try { rec.start(); } catch (err) { V.error = "Could not start the microphone."; paint(); }
  };

  function ask(text) {
    V.heard = text; V.busy = true; V.reply = null; paint();
    const tracked = state.aiUseData && state.pain.length ? { pain_levels: state.pain.map((p) => p.level) } : null;
    fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, tracked, lang: state.lang || "en", session_id: window.getSessionId ? window.getSessionId() : null }) })   // saved to History too
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); })
      .catch(() => {
        let res; try { res = aiService_ask(text); } catch (e) { res = { urgent: false, text: "Sorry, something went wrong." }; }
        return { ...res, lang: "en", note: state.lang && state.lang !== "en" ? "Offline mode: answers are in English until the backend is running." : "" };
      })
      .then((res) => {
        V.busy = false; V.reply = res; paint();
        if (window.speakText) window.speakText(res.text, res.lang || "en");
      });
  }

  // keep the language picker on the card in sync when the language changes anywhere
  const _setLang = window.setLang;
  window.setLang = function (l) { _setLang(l); paint(); };
  // hide the voice button while the floating chat box is open (they share the bottom-right corner)
  const _toggleChat = window.toggleChatBox;
  if (_toggleChat) window.toggleChatBox = function () {
    _toggleChat();
    const b = document.getElementById("chatBox");
    document.body.classList.toggle("chat-open", !!b && !b.hidden);
  };
  paint();
})();
