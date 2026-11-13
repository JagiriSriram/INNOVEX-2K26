"""STEP 1b - load a GIVEN Word (.docx) document into the same shape as the FAQ CSV rows.

Headings group paragraphs into sections; long sections are split into overlapping
chunks; tables are flattened row-by-row. The result is a list of docs with the same
keys the retriever expects (`question`, `answer`, `keywords`, `category`, `urgent`,
`text`, `match`), tagged with `source="docx"`.

Fails safe: if python-docx is not installed or the file is missing, returns [] so the
assistant keeps working from the CSV alone.
"""
from pathlib import Path

from . import config


def _iter_blocks(path):
    """Yield (kind, text) where kind is 'heading', 'para' or 'table'."""
    from docx import Document  # imported lazily so a missing package never breaks startup

    doc = Document(str(path))
    for para in doc.paragraphs:
        style = (para.style.name or "").lower()
        text = para.text.strip()
        if not text:
            continue
        kind = "heading" if (style.startswith("heading") or style == "title" or style == "subtitle") else "para"
        yield kind, text
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells]
            if any(cells):
                yield "table", " | ".join(cells)


def _sections(blocks):
    """Group blocks under their nearest preceding heading."""
    sections, heading, buf = [], config.DOC_CATEGORY, []
    for kind, text in blocks:
        if kind == "heading":
            if buf:
                sections.append((heading, " ".join(buf)))
                buf = []
            heading = text
        else:
            buf.append(text)
    if buf:
        sections.append((heading, " ".join(buf)))
    return sections


def _windows(text, size, overlap):
    """Split text into word windows of ~size chars, carrying ~overlap chars forward."""
    words = text.split()
    out, cur, n = [], [], 0
    for w in words:
        cur.append(w)
        n += len(w) + 1
        if n >= size:
            out.append(" ".join(cur))
            keep, kn = [], 0
            for w2 in reversed(cur):
                keep.append(w2)
                kn += len(w2) + 1
                if kn >= overlap:
                    break
            cur, n = list(reversed(keep)), kn
    if cur:
        out.append(" ".join(cur))
    return out


def _make_doc(idx, category, text):
    first = text.split(". ")[0].strip() or text
    question = first[:120]
    return {
        "id": config.DOC_ID_BASE + idx,
        "category": category,
        "question": question,
        "keywords": "",
        "answer": text,
        "urgent": False,
        "source": "docx",
        # question counted twice so it weighs more, mirroring the CSV loader
        "text": f"{question} {question} {category} {text}",
        "match": f"{question} {text}",
    }


def load_docx(path=None):
    """Return a list of retriever-shaped docs from the given .docx (or [] on any failure)."""
    p = Path(path) if path is not None else Path(config.DOCX_PATH)
    if not p.exists():
        return []
    try:
        blocks = list(_iter_blocks(p))
    except Exception:
        return []

    docs = []
    for heading, body in _sections(blocks):
        for chunk in _windows(body, config.DOC_CHUNK_CHARS, config.DOC_CHUNK_OVERLAP):
            docs.append(_make_doc(len(docs), heading or config.DOC_CATEGORY, chunk))
    return docs
