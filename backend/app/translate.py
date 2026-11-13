"""Multilingual support: user language -> English (for retrieval + safety checks) -> user language.

The verified knowledge base is English, so we translate the question to English, run the normal
pipeline (guardrails, hybrid retrieval, evolve), then translate the verified answer back.
Providers are tried in this order and every failure falls back to the next one:
  1. OpenAI   (if OPENAI_API_KEY is set)
  2. Anthropic (if ANTHROPIC_API_KEY is set)
  3. deep-translator / Google Translate (free, needs internet, no key)
If nothing works, the English answer is returned with a note, so the chat never breaks.
"""
import json
import os
import urllib.request
from functools import lru_cache

from .config import OPENAI_API_KEY, OPENAI_MODEL, LLM_MODEL

# code -> English name. Google Translate supports many more; any code in this table is accepted.
LANGUAGES = {
    "en": "English", "hi": "Hindi", "te": "Telugu", "ta": "Tamil", "kn": "Kannada", "ml": "Malayalam",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "pa": "Punjabi", "ur": "Urdu", "or": "Odia",
    "as": "Assamese", "ne": "Nepali", "es": "Spanish", "fr": "French", "de": "German", "pt": "Portuguese",
    "it": "Italian", "ru": "Russian", "ar": "Arabic", "zh-CN": "Chinese (Simplified)", "ja": "Japanese",
    "ko": "Korean", "id": "Indonesian", "tr": "Turkish", "sw": "Swahili", "th": "Thai", "vi": "Vietnamese",
    "fa": "Persian", "si": "Sinhala", "ms": "Malay", "tl": "Filipino", "nl": "Dutch", "pl": "Polish",
}


def _chunks(text, limit=1800):
    out, cur = [], ""
    for para in text.split("\n"):
        if len(cur) + len(para) + 1 > limit and cur:
            out.append(cur)
            cur = ""
        cur += para + "\n"
    if cur.strip():
        out.append(cur)
    return out


def _llm_prompt(target, source):
    src = LANGUAGES.get(source, source) if source and source != "auto" else "the input language"
    return (f"Translate the user's text from {src} into {LANGUAGES.get(target, target)}. Keep numbers, "
            "emergency numbers, **bold markers**, bullet symbols and line breaks exactly. "
            "Output ONLY the translation, nothing else.")


def _openai(text, target, source):
    if not OPENAI_API_KEY:
        return None
    payload = json.dumps({"model": OPENAI_MODEL, "temperature": 0, "messages": [
        {"role": "system", "content": _llm_prompt(target, source)}, {"role": "user", "content": text}]}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=payload, headers={
        "Content-Type": "application/json", "Authorization": "Bearer " + OPENAI_API_KEY})
    with urllib.request.urlopen(req, timeout=25) as r:
        return (json.loads(r.read().decode())["choices"][0]["message"]["content"] or "").strip() or None


def _anthropic(text, target, source):
    if not os.getenv("ANTHROPIC_API_KEY"):
        return None
    import anthropic
    msg = anthropic.Anthropic().messages.create(model=LLM_MODEL, max_tokens=1500, system=_llm_prompt(target, source),
                                                messages=[{"role": "user", "content": text}])
    return msg.content[0].text.strip() or None


def _google(text, target, source):
    from deep_translator import GoogleTranslator
    parts = text.split("**")                       # translate piece by piece so **bold** survives
    idx = [i for i, p in enumerate(parts) if p.strip()]
    done = GoogleTranslator(source=source or "auto", target=target).translate_batch([parts[i] for i in idx])
    for i, t in zip(idx, done):
        lead = parts[i][:len(parts[i]) - len(parts[i].lstrip())]
        trail = parts[i][len(parts[i].rstrip()):]
        parts[i] = lead + (t or parts[i]).strip() + trail
    return "**".join(parts)


PROVIDERS = [_openai, _anthropic, _google]        # tests can replace this list


@lru_cache(maxsize=512)
def _cached(text, target, source):
    for fn in PROVIDERS:
        try:
            out = fn(text, target, source)
            if out:
                return out
        except Exception:
            continue
    return None


def translate(text, target, source="auto"):
    """Return the translated text, or None if no provider could do it."""
    if not text or not text.strip():
        return text
    out = []
    for ch in _chunks(text):
        t = _cached(ch.rstrip("\n"), target, source)
        if t is None:
            return None
        out.append(t)
    return "\n".join(out)


def to_english(text, lang):
    """Question -> English. Returns (english_text, ok). Plain-ASCII English input is left alone."""
    if lang == "en" and text.isascii():
        return text, True
    t = translate(text, "en", "auto")
    return (t, True) if t else (text, False)


def from_english(text, lang):
    """Answer -> user's language. Returns (text, ok)."""
    if lang == "en":
        return text, True
    t = translate(text, lang, "en")
    return (t, True) if t else (text, False)
