from backend.app.history import ChatHistory


def test_history_roundtrip_and_isolation(tmp_path):
    h = ChatHistory(tmp_path / "h.db")
    a = h.add("s1", "Why is my period painful?", "Cramps are caused by...", False, "en", "rag")
    h.add("s1", "My period is late", "Possible causes...", False, "en", "rag")
    h.add("s2", "other user", "answer")
    rows = h.list("s1")
    assert [r["question"] for r in rows] == ["My period is late", "Why is my period painful?"]   # newest first
    assert h.list("s2")[0]["question"] == "other user"                                             # per-session
    assert h.delete("s2", a) == 0                          # cannot delete someone else's row
    assert h.delete("s1", a) == 1 and len(h.list("s1")) == 1
    assert h.clear("s1") == 1 and h.list("s1") == []
