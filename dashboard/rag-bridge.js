// Replaces the dashboard's scripted chat (aiService_ask) with the real RAG backend.
// If the backend is offline it falls back to the old built-in answers, so the demo never breaks.
(function () {
  const API = window.RAG_API || "http://localhost:8000";
  window.sendChat = function (text) {
    if (aiTyping) return;
    const fromInput = text === undefined;
    const msg = (fromInput ? state.chatInput : text).trim();
    if (!msg) return;
    state.chatMessages.push({ role: "user", text: msg });
    state.chatInput = "";
    aiTyping = true;
    chatRender(fromInput);
    const tracked = state.aiUseData && state.pain.length ? { pain_levels: state.pain.map((p) => p.level) } : null;
    fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, tracked }) })
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); })
      .catch(() => { try { return aiService_ask(msg); } catch (e) { return { urgent: false, text: "Sorry, something went wrong." }; } })
      .then((res) => { aiTyping = false; state.chatMessages.push({ role: "ai", text: res.text, urgent: res.urgent }); chatRender(false); });
  };
})();
