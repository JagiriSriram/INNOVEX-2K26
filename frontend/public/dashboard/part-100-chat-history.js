// Chat history: every question/answer is saved by the backend (SQLite). The chat window is cleared
// once per NEW SESSION (when the browser tab / app is opened fresh), not on every new question or every
// time the chat is opened. Old questions always live in the History panel.
(function () {
  const API = window.RAG_API || "http://localhost:8000";

  // anonymous per-browser id, so each visitor only sees their own history
  window.getSessionId = function () {
    try {
      let id = localStorage.getItem("spr_session_id");
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
        localStorage.setItem("spr_session_id", id);
      }
      return id;
    } catch (e) { return "anonymous"; }
  };

  function wipeChat() {
    state.chatMessages = []; state.chatInput = "";
    if (window.stopSpeaking) window.stopSpeaking();
    try { saveState(); } catch (e) {}
  }

  // a fresh chat only when a NEW SESSION starts (sessionStorage lives until the tab/app is closed)
  let freshSession = true;
  try { freshSession = !sessionStorage.getItem("spr_chat_session"); sessionStorage.setItem("spr_chat_session", "1"); } catch (e) {}
  if (freshSession) wipeChat();

  // ---- History panel ----
  function fmtTime(iso) {
    try { return new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }
  function modal() {
    let m = document.getElementById("histModal");
    if (!m) {
      m = document.createElement("div"); m.id = "histModal"; m.hidden = true;
      m.onclick = (e) => { if (e.target === m) closeHistory(); };
      document.body.appendChild(m);
    }
    return m;
  }
  window.closeHistory = function () { modal().hidden = true; };

  window.openHistory = function () {
    const m = modal(); m.hidden = false;
    m.innerHTML = `<div class="hist-card"><div class="hist-head"><b>🕘 Chat history</b>
      <button type="button" onclick="closeHistory()" title="Close">✕</button></div>
      <div class="hist-list"><p class="hist-empty">Loading…</p></div></div>`;
    fetch(API + "/api/history?session_id=" + encodeURIComponent(getSessionId()))
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); })
      .then(paintHistory)
      .catch(() => { m.querySelector(".hist-list").innerHTML = '<p class="hist-empty">History is unavailable while the backend is offline.</p>'; });
  };

  function paintHistory(items) {
    const m = modal(); const list = m.querySelector(".hist-list"); if (!list) return;
    window.__hist = items;
    list.innerHTML = items.length
      ? items.map((it, i) => `<details class="hist-item ${it.urgent ? "urgent" : ""}">
          <summary><span class="hq" dir="auto">${escapeHtml(it.question)}</span><span class="ht">${escapeHtml(fmtTime(it.created_at))}</span></summary>
          <div class="ha" dir="auto">${fmtChat(it.answer)}</div>
          <div class="hbtns"><button type="button" onclick="reuseQuestion(${i})">Ask again</button>
          <button type="button" onclick="deleteHistoryItem(${it.id})">Delete</button></div></details>`).join("") +
        '<a class="linklike hist-clear" onclick="clearHistory()">Delete all history</a>'
      : '<p class="hist-empty">No saved questions yet. Ask something and it will appear here.</p>';
  }

  window.reuseQuestion = function (i) {
    const it = (window.__hist || [])[i]; if (!it) return;
    closeHistory();
    if (state.page !== "ai" && document.getElementById("chatBox") && document.getElementById("chatBox").hidden) window.toggleChatBox();
    sendChat(it.question);
  };
  window.deleteHistoryItem = function (id) {
    fetch(API + "/api/history/" + id + "?session_id=" + encodeURIComponent(getSessionId()), { method: "DELETE" })
      .then(() => window.openHistory()).catch(() => {});
  };
  window.clearHistory = function () {
    if (!confirm("Delete all saved chat history?")) return;
    fetch(API + "/api/history?session_id=" + encodeURIComponent(getSessionId()), { method: "DELETE" })
      .then(() => window.openHistory()).catch(() => {});
  };

  // ---- entry points: AI page link + floating chat box button ----
  const _aiPage = window.aiPage;
  if (_aiPage) window.aiPage = function () {
    return _aiPage().replace('<div class="qchip-row">', '<a class="linklike hist-link" onclick="openHistory()">🕘 View chat history</a><div class="qchip-row">');
  };
  const tools = document.querySelector("#chatBox .cb-tools");
  if (tools && !document.getElementById("wHistBtn")) {
    const b = document.createElement("button");
    b.type = "button"; b.id = "wHistBtn"; b.title = "Chat history"; b.textContent = "🕘"; b.onclick = window.openHistory;
    tools.insertBefore(b, tools.firstChild);
  }
  if (state.page === "ai") render();
})();
