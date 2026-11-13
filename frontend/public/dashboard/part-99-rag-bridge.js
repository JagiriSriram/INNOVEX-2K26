// Replaces the dashboard's scripted chat (aiService_ask) with the real RAG backend.
// Sends the chosen language so the backend answers in it. If the backend is offline it falls back
// to the old built-in (English) answers, so the demo never breaks.
(function () {
  const API = window.RAG_API || "http://localhost:8000";
  window.sendChat = function (text) {
    if (aiTyping) return;
    const fromInput = text === undefined;
    const msg = (fromInput ? state.chatInput : text).trim();
    if (!msg) return;
    if (window.stopSpeaking) window.stopSpeaking();
    state.chatMessages.push({ role: "user", text: msg, lang: state.lang });
    if (state.chatMessages.length > 100) state.chatMessages = state.chatMessages.slice(-100);
    state.chatInput = "";
    aiTyping = true;
    chatRender(fromInput);
    const tracked = state.aiUseData && state.pain.length ? { pain_levels: state.pain.map((p) => p.level) } : null;
    fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, tracked, lang: state.lang || "en", session_id: window.getSessionId ? window.getSessionId() : null }) })
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); })
      .catch(() => {
        let res; try { res = aiService_ask(msg); } catch (e) { res = { urgent: false, text: "Sorry, something went wrong." }; }
        return { ...res, lang: "en", note: state.lang && state.lang !== "en" ? "Offline mode: answers are in English until the backend is running." : "" };
      })
      .then((res) => {
        aiTyping = false;
        const m = { role: "ai", text: res.text, urgent: res.urgent, lang: res.lang || "en", note: res.note || "" };
        state.chatMessages.push(m);
        chatRender(false);
      });
  };
})();
