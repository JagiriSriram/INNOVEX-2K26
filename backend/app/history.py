"""Chat history stored in SQLite (stdlib only - no extra dependency).

Every question + answer is saved here. The chat window on screen is cleared for each new
question, and the user can reopen old ones from the History panel.
History is kept per anonymous browser session_id (a random id the frontend creates), so one
visitor never sees another visitor's questions.
"""
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

_lock = threading.Lock()


class ChatHistory:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as c:
            c.execute(
                """CREATE TABLE IF NOT EXISTS chat_history (
                       id         INTEGER PRIMARY KEY AUTOINCREMENT,
                       session_id TEXT NOT NULL,
                       question   TEXT NOT NULL,
                       answer     TEXT NOT NULL,
                       urgent     INTEGER NOT NULL DEFAULT 0,
                       lang       TEXT NOT NULL DEFAULT 'en',
                       route      TEXT NOT NULL DEFAULT '',
                       created_at TEXT NOT NULL
                   )"""
            )
            c.execute("CREATE INDEX IF NOT EXISTS idx_hist_session ON chat_history(session_id, id DESC)")

    def _conn(self):
        conn = sqlite3.connect(self.path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def add(self, session_id, question, answer, urgent=False, lang="en", route=""):
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with _lock, self._conn() as c:
            cur = c.execute(
                "INSERT INTO chat_history (session_id, question, answer, urgent, lang, route, created_at) "
                "VALUES (?,?,?,?,?,?,?)",
                (session_id, question, answer, int(bool(urgent)), lang, route, now),
            )
            return cur.lastrowid

    def list(self, session_id, limit=50):
        with self._conn() as c:
            rows = c.execute(
                "SELECT id, question, answer, urgent, lang, route, created_at FROM chat_history "
                "WHERE session_id=? ORDER BY id DESC LIMIT ?",
                (session_id, max(1, min(int(limit), 200))),
            ).fetchall()
        return [{**dict(r), "urgent": bool(r["urgent"])} for r in rows]

    def delete(self, session_id, item_id):
        with _lock, self._conn() as c:
            return c.execute("DELETE FROM chat_history WHERE id=? AND session_id=?", (item_id, session_id)).rowcount

    def clear(self, session_id):
        with _lock, self._conn() as c:
            return c.execute("DELETE FROM chat_history WHERE session_id=?", (session_id,)).rowcount
