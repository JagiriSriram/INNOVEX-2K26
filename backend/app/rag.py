"""STEP 5 - the full pipeline:  input guardrails -> hybrid retrieve -> evolve boost -> answer -> output guardrails."""
from . import guardrails as G
from .config import TOP_K, USE_LLM, LLM_MODEL, OPENAI_API_KEY, OPENAI_MODEL
from .data_loader import load_docs
from .evolve import Evolve
from .project_info import project_answer
from .retriever import HybridRetriever
from . import translate as T

GREETING = "Hello! I'm the Smart Period Relief assistant. Ask me about cramps, heavy bleeding, PCOS, hygiene, or how the belt works."


class RagPipeline:
    def __init__(self):
        self.reload()

    def reload(self):
        self.docs = load_docs()
        self.retriever = HybridRetriever(self.docs)
        self.evolve = getattr(self, "evolve", None) or Evolve()

    _SYS = ("Answer ONLY using the CONTEXT. Do not add facts, numbers, doses or diagnoses. "
            "Be kind and brief.")

    def _llm_rewrite(self, question, ctx):
        """Optional: rephrase the verified answer with an LLM. Returns None (so we keep the
        verified text) if the model is unavailable or adds new facts/numbers."""
        if OPENAI_API_KEY:
            return self._openai_rewrite(question, ctx)
        return self._anthropic_rewrite(question, ctx)

    def _openai_rewrite(self, question, ctx):
        import json
        import urllib.request
        payload = json.dumps({
            "model": OPENAI_MODEL,
            "max_tokens": 400,
            "temperature": 0.3,
            "messages": [
                {"role": "system", "content": self._SYS},
                {"role": "user", "content": f"CONTEXT:\n{ctx}\n\nQUESTION: {question}"},
            ],
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + OPENAI_API_KEY},
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                data = json.loads(r.read().decode("utf-8"))
            out = (data["choices"][0]["message"]["content"] or "").strip()
            return out if out and G.check_output(out, ctx) else None
        except Exception:
            return None

    def _anthropic_rewrite(self, question, ctx):
        try:
            import anthropic
            msg = anthropic.Anthropic().messages.create(
                model=LLM_MODEL, max_tokens=400, system=self._SYS,
                messages=[{"role": "user", "content": f"CONTEXT:\n{ctx}\n\nQUESTION: {question}"}])
            out = msg.content[0].text
            return out if G.check_output(out, ctx) else None
        except Exception:
            return None

    def ask(self, message, tracked=None, lang="en"):
        """Any-language entry point: translate in -> English pipeline -> translate out."""
        lang = lang if lang in T.LANGUAGES else "en"
        if lang == "en" and message.isascii():
            return {**self._ask_en(message, tracked), "lang": "en"}
        english, ok_in = T.to_english(message, lang)
        res = self._ask_en(english, tracked)
        text, ok_out = T.from_english(res["text"], lang)
        res = {**res, "text": text, "lang": lang if ok_out else "en"}
        if not (ok_in and ok_out):
            res["note"] = ("Translation is unavailable right now (needs internet or an API key), so this answer is in "
                           "English.")
        return res

    def _ask_en(self, message, tracked=None):
        norm = G.normalize(message)
        if norm in {"hi", "hello", "hey", "hai", "hii", "namaste", "thanks", "thank you", "ok", "okay"}:
            return {"urgent": False, "route": "greeting", "text": GREETING, "sources": [], "confidence": 0.0,
                    "engine": self.retriever.emb.kind + "+" + self.retriever.backend}
        route, reply = G.check_input(message)
        base = {"urgent": False, "route": route, "sources": [], "confidence": 0.0, "engine": self.retriever.emb.kind + "+" + self.retriever.backend}
        if route == "emergency":
            return {**base, "urgent": True, "text": reply}
        if route != "ok":
            return {**base, "text": reply}
        proj = project_answer(norm)
        if proj:
            return {**base, "route": "project", "text": proj}

        hits = self.retriever.search(norm, TOP_K, boost=self.evolve.boost)
        if not hits or not self.retriever.confident(hits[0], norm):
            self.evolve.log_unanswered(message)                       # EVOLVE: remember what we could not answer
            return {**base, "route": "no_match", "text": "I couldn't find a reliable answer for that in my health knowledge base. "
                    "Try rephrasing, or ask a gynecologist. I've noted this question so the team can add it."}
        top = hits[0]["doc"]
        text = top["answer"]
        if USE_LLM:
            text = self._llm_rewrite(message, top["answer"]) or text
        if tracked and tracked.get("pain_levels"):                    # optional personal-data context
            lv = tracked["pain_levels"]
            text += f"\n\n**From your tracked data:** average pain {sum(lv)/len(lv):.1f}/10, latest {lv[0]}/10."
        urgent = bool(top["urgent"])
        if urgent:
            text += "\n\nIf this is happening now, call 112 or find nearby medical help."
        if not G.check_output(text, top["answer"] + str(tracked or "")):
            text = top["answer"]
        text += "\n\n" + G.DISCLAIMER
        return {**base, "text": text, "urgent": urgent, "route": "rag", "confidence": round(hits[0]["dense"], 3),
                "sources": [{"id": h["doc"]["id"], "category": h["doc"]["category"], "question": h["doc"]["question"],
                             "source": h["doc"].get("source", "csv"), "score": round(h["score"], 4)} for h in hits]}
