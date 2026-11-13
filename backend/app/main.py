"""STEP 6 - FastAPI server. Run from the project root:  uvicorn backend.app.main:app --reload --port 8000"""
import shutil
from typing import Optional
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from . import config
from .config import ADMIN_TOKEN
from .history import ChatHistory
from .rag import RagPipeline
from .translate import LANGUAGES, translate

app = FastAPI(title="Smart Period Relief RAG API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
rag = RagPipeline()
history = ChatHistory(config.HISTORY_DB)

QUICK = [["Painful period", "Why is my period painful?"], ["Late period", "My period is late"],
         ["Heavy bleeding", "Why is my bleeding heavy?"], ["Irregular cycle", "Is irregular menstruation common?"],
         ["Discharge", "Why do I have white discharge?"], ["PCOS", "What is PCOS?"],
         ["Endometriosis", "What is endometriosis?"], ["See a doctor?", "When should I see a gynecologist?"],
         ["Who made this?", "Who made this project?"]]


class ChatIn(BaseModel):
    message: str
    tracked: Optional[dict] = None
    lang: str = "en"          # reply language (any code from /api/languages)
    session_id: Optional[str] = None   # anonymous browser id; when present the Q&A is saved to history


class UiTranslateIn(BaseModel):
    lang: str
    texts: list[str]


class FeedbackIn(BaseModel):
    query: str
    doc_id: int
    helpful: bool


class FaqIn(BaseModel):
    category: str
    question: str
    keywords: str
    answer: str
    urgent: bool = False


def _by_source():
    counts = {}
    for d in rag.docs:
        s = d.get("source", "csv")
        counts[s] = counts.get(s, 0) + 1
    return counts


@app.get("/api/health")
def health():
    return {"ok": True, "docs": len(rag.docs), "by_source": _by_source(),
            "engine": rag.retriever.emb.kind + "+" + rag.retriever.backend}


@app.get("/api/documents")
def documents():
    return {"total": len(rag.docs), "by_source": _by_source(),
            "docx": config.DOCX_PATH.name, "exists": config.DOCX_PATH.exists()}


@app.post("/api/ingest/docx")
def ingest_docx(file: UploadFile = File(...), x_admin_token: str = Header("")):
    """Admin uploads the given Word document; it becomes searchable immediately."""
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(403, "bad admin token")
    if not (file.filename or "").lower().endswith(".docx"):
        raise HTTPException(400, "file must be a .docx")
    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = config.UPLOAD_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    config.DOCX_PATH = dest          # loader reads config.DOCX_PATH at call time
    rag.reload()
    return {"ok": True, "file": dest.name, "chunks": _by_source().get("docx", 0), "docs": len(rag.docs)}


@app.get("/api/quick")
def quick():
    return QUICK


@app.post("/api/chat")
def chat(body: ChatIn):
    res = rag.ask(body.message, body.tracked, body.lang)
    sid = (body.session_id or "").strip()[:64]
    if sid:
        try:                                   # history must never break the chat itself
            res["history_id"] = history.add(sid, body.message, res.get("text", ""), res.get("urgent", False),
                                            res.get("lang", "en"), res.get("route", ""))
        except Exception:
            pass
    return res


@app.get("/api/history")
def get_history(session_id: str, limit: int = 50):
    if not session_id.strip():
        raise HTTPException(400, "session_id required")
    return history.list(session_id.strip()[:64], limit)


@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: int, session_id: str):
    return {"ok": True, "deleted": history.delete(session_id.strip()[:64], item_id)}


@app.delete("/api/history")
def clear_history(session_id: str):
    return {"ok": True, "deleted": history.clear(session_id.strip()[:64])}


@app.get("/api/languages")
def languages():
    return LANGUAGES


@app.post("/api/translate-ui")
def translate_ui(body: UiTranslateIn):
    """Batch-translate dashboard text (English -> chosen language). Failed items are returned as null."""
    if body.lang not in LANGUAGES:
        raise HTTPException(400, "unsupported language")
    from concurrent.futures import ThreadPoolExecutor
    texts = [t[:600] for t in body.texts[:200]]
    if body.lang == "en":
        return {"lang": "en", "texts": texts}
    with ThreadPoolExecutor(max_workers=8) as ex:          # parallel, so a whole page translates in a second or two
        out = list(ex.map(lambda t: translate(t, body.lang, "en"), texts))
    return {"lang": body.lang, "texts": out}


@app.post("/api/feedback")
def feedback(body: FeedbackIn):
    rag.evolve.feedback(body.query, body.doc_id, body.helpful)
    return {"ok": True}


@app.get("/api/evolve/report")
def report(x_admin_token: str = Header("")):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(403, "bad admin token")
    return rag.evolve.report()


@app.post("/api/evolve/add")
def add_faq(body: FaqIn, x_admin_token: str = Header("")):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(403, "bad admin token")
    new_id = rag.evolve.add_faq(body.category, body.question, body.keywords, body.answer, body.urgent)
    rag.reload()          # rebuild BM25 + FAISS so the new row is searchable immediately
    return {"ok": True, "id": new_id}
