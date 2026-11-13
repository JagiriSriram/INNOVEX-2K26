"""STEP 4 - EVOLVE: the assistant learns from usage and gets better over time.
  1. thumbs up/down  -> boosts or demotes that FAQ entry in ranking
  2. liked (question -> answer) pairs are remembered; similar future questions are boosted to that answer
  3. low-confidence questions are logged -> admin can promote them into new FAQ rows (data CSV grows)
State is stored in data/evolve_state.json (no database needed)."""
import json, math, csv, threading
from collections import Counter
from .config import EVOLVE_FILE, DATA_CSV
from .retriever import tokenize

_lock = threading.Lock()


class Evolve:
    def __init__(self, path=EVOLVE_FILE):
        self.path = path
        self.s = {"votes": {}, "learned": [], "unanswered": []}
        if path.exists():
            self.s = json.loads(path.read_text(encoding="utf-8"))

    def _save(self):
        self.path.write_text(json.dumps(self.s, indent=2), encoding="utf-8")

    def boost(self, doc_id, query):
        up, down = self.s["votes"].get(str(doc_id), [0, 0])
        b = 1 + 0.25 * math.tanh((up - down) / 3)          # between 0.75x and 1.25x
        q = set(tokenize(query))
        for item in self.s["learned"]:                       # similar liked question -> extra boost
            lq = set(item["tokens"])
            if item["doc_id"] == doc_id and q and len(q & lq) / len(q | lq) >= 0.5:
                b += 0.5
        return b

    def feedback(self, query, doc_id, helpful):
        with _lock:
            v = self.s["votes"].setdefault(str(doc_id), [0, 0])
            v[0 if helpful else 1] += 1
            if helpful:
                self.s["learned"].append({"doc_id": doc_id, "tokens": sorted(set(tokenize(query)))})
                self.s["learned"] = self.s["learned"][-500:]
            self._save()

    def log_unanswered(self, query):
        with _lock:
            self.s["unanswered"].append(query.strip()[:300])
            self.s["unanswered"] = self.s["unanswered"][-500:]
            self._save()

    def report(self):
        top = Counter(q.lower() for q in self.s["unanswered"]).most_common(20)
        return {"votes": self.s["votes"], "learned_count": len(self.s["learned"]),
                "unanswered_top": [{"question": q, "count": c} for q, c in top]}

    def add_faq(self, category, question, keywords, answer, urgent=False):
        """Admin promotes an unanswered question into the real database."""
        with _lock:
            with open(DATA_CSV, encoding="utf-8-sig", newline="") as f:
                rows = list(csv.DictReader(f))
            new_id = max(int(r["id"]) for r in rows) + 1
            with open(DATA_CSV, "a", encoding="utf-8", newline="") as f:
                csv.writer(f).writerow([new_id, category, question, keywords, answer, str(urgent)])
            self.s["unanswered"] = [q for q in self.s["unanswered"] if q.lower() != question.lower()]
            self._save()
        return new_id
