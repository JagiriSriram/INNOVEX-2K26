"""STEP 2 - HYBRID retrieval = BM25 (keywords) + FAISS (meaning), merged with RRF."""
import re
import numpy as np
from .config import EMBED_MODEL, RRF_K, W_BM25, W_DENSE

STOP = set("a an the is are was am i my me do does to of in on for it and or with be can how what why when should "
           "you your this that have has at as by from so if not no".split())


def tokenize(text):
    out = []
    for w in re.findall(r"[a-z0-9]+", text.lower()):
        if w in STOP:
            continue
        for suf in ("ing", "es", "s"):          # tiny stemmer: cramps->cramp
            if len(w) > 4 and w.endswith(suf):
                w = w[: -len(suf)]
                break
        out.append(w)
    return out


class _BM25:  # fallback if rank_bm25 is not installed
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.c, self.k1, self.b = corpus, k1, b
        self.avg = sum(map(len, corpus)) / len(corpus)
        df = {}
        for d in corpus:
            for t in set(d):
                df[t] = df.get(t, 0) + 1
        n = len(corpus)
        self.idf = {t: np.log((n - f + .5) / (f + .5) + 1) for t, f in df.items()}

    def get_scores(self, q):
        s = np.zeros(len(self.c))
        for i, d in enumerate(self.c):
            for t in q:
                f = d.count(t)
                if f:
                    s[i] += self.idf.get(t, 0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(d) / self.avg))
        return s


def make_bm25(corpus):
    try:
        from rank_bm25 import BM25Okapi
        return BM25Okapi(corpus)
    except Exception:
        return _BM25(corpus)


class Embedder:
    """Sentence-Transformers if available (best); otherwise TF-IDF vectors (works offline)."""

    def __init__(self, texts):
        try:
            from sentence_transformers import SentenceTransformer
            self.m, self.kind, self.min_sim = SentenceTransformer(EMBED_MODEL), "sbert", 0.30
        except Exception:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.v = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english").fit(texts)
            self.kind, self.min_sim = "tfidf", 0.12

    def encode(self, texts):
        if self.kind == "sbert":
            x = self.m.encode(texts, normalize_embeddings=True)
        else:
            x = self.v.transform(texts).toarray()
        x = np.asarray(x, dtype="float32")
        return x / np.maximum(np.linalg.norm(x, axis=1, keepdims=True), 1e-9)


class HybridRetriever:
    def __init__(self, docs):
        self.docs = docs
        self.bm25 = make_bm25([tokenize(d["text"]) for d in docs])
        self.emb = Embedder([d["match"] for d in docs])
        self.vocab = {t for d in docs for t in tokenize(d["text"])}
        self.vecs = self.emb.encode([d["match"] for d in docs])
        try:
            import faiss
            self.index = faiss.IndexFlatIP(self.vecs.shape[1])   # inner product == cosine (vectors normalised)
            self.index.add(self.vecs)
            self.backend = "faiss"
        except Exception:
            self.index, self.backend = None, "numpy"

    def _dense(self, q, n):
        qv = self.emb.encode([q])
        if self.index is not None:
            sims, ids = self.index.search(qv, n)
            return list(ids[0]), list(sims[0])
        sims = (self.vecs @ qv[0])
        ids = np.argsort(-sims)[:n]
        return list(ids), list(sims[ids])

    def search(self, query, k=3, boost=None):
        n = len(self.docs)
        bm = self.bm25.get_scores(tokenize(query))
        bm_rank = list(np.argsort(-bm))
        d_ids, d_sims = self._dense(query, n)
        dense_sim = {int(i): float(s) for i, s in zip(d_ids, d_sims)}
        fused = {}
        for r, i in enumerate(bm_rank):
            if bm[i] > 0:
                fused[int(i)] = fused.get(int(i), 0) + W_BM25 / (RRF_K + r + 1)
        for r, i in enumerate(d_ids):
            fused[int(i)] = fused.get(int(i), 0) + W_DENSE / (RRF_K + r + 1)
        qw = set(re.findall(r"[a-z0-9]+", query.lower()))
        for i in fused:                              # near-exact question match bonus (keeps "what is X" on "What is X?")
            dw = set(re.findall(r"[a-z0-9]+", self.docs[i]["question"].lower()))
            if len(qw & dw) / max(len(qw | dw), 1) >= 0.6:
                fused[i] *= 1.5
        if boost:                                    # EVOLVE: learned feedback multiplier
            for i in fused:
                fused[i] *= boost(self.docs[i]["id"], query)
        top = sorted(fused, key=fused.get, reverse=True)[:k]
        return [{"doc": self.docs[i], "score": fused[i], "bm25": float(bm[i]), "dense": dense_sim[i]} for i in top]

    def confident(self, hit, query=""):
        if self.emb.kind == "tfidf":     # weak embedder: also require the query words to exist in our knowledge base
            toks = [t for t in tokenize(query) if t not in ("period", "month")]
            known = sum(t in self.vocab for t in toks)
            if toks and known / len(toks) < 0.5:
                return False
        return hit["dense"] >= self.emb.min_sim or hit["bm25"] >= 4.0
