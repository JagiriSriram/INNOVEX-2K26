import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_dotenv(path: Path) -> None:
    """Tiny stdlib .env loader (no extra dependency). Existing env vars win."""
    try:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
    except FileNotFoundError:
        pass


_load_dotenv(ROOT / ".env")

DATA_CSV = ROOT / "data" / "faq_database.csv"
EVOLVE_FILE = ROOT / "data" / "evolve_state.json"
HISTORY_DB = ROOT / "data" / "history.db"          # SQLite chat history
# Given Word document + uploads (ingested into the same knowledge base as the CSV)
DOCX_PATH = Path(os.getenv("DOCX_PATH", ROOT / "data" / "knowledge.docx"))
UPLOAD_DIR = ROOT / "data" / "uploads"
DOC_CATEGORY = "Document"
DOC_ID_BASE = 10000        # docx chunk ids start here so they never collide with CSV ids
DOC_CHUNK_CHARS = 500      # target chunk size for long document sections
DOC_CHUNK_OVERLAP = 80     # overlap between consecutive chunks
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 3
RRF_K = 60                 # reciprocal-rank-fusion constant
W_BM25, W_DENSE = 1.0, 1.0 # fusion weights
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "expo123")
USE_LLM = os.getenv("USE_LLM", "0") == "1"
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-5-5")
# OpenAI (server-side only — never expose this key to the frontend)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
