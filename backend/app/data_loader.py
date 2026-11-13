"""STEP 1 - load the knowledge base into a list of dicts.

Sources:
  * the FAQ CSV (your Database_sr file), and
  * a given Word document (.docx) via docx_loader, if present.
"""
import pandas as pd
from .config import DATA_CSV
from .docx_loader import load_docx


def load_csv_docs(path=DATA_CSV):
    df = pd.read_csv(path, encoding="utf-8-sig").fillna("")
    docs = []
    for r in df.to_dict("records"):
        r["urgent"] = str(r["urgent"]).strip().lower() == "true"
        r["source"] = "csv"
        # text used for searching: question counted twice so it weighs more
        r["text"] = f'{r["question"]} {r["question"]} {r["keywords"]} {r["category"]} {r["answer"]}'   # for BM25
        r["match"] = f'{r["question"]} {r["keywords"]}'                                               # for embeddings
        docs.append(r)
    return docs


def load_docs(path=DATA_CSV, docx_path=None):
    """CSV rows first (stable ids), then any Word-document chunks."""
    docs = load_csv_docs(path)
    docs += load_docx(docx_path)
    return docs
