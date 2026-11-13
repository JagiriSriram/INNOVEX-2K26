"""STEP 3 - GUARDRAILS. Input checks run BEFORE retrieval, output checks run AFTER the answer is built."""
import re

EMERGENCY = ['severe pain', 'unbearable pain', "can't breathe", 'cant breathe', 'cannot breathe', 'difficulty breathing',
             'trouble breathing', 'chest pain', 'fainted', 'fainting', 'passed out', 'lost consciousness', 'unconscious',
             'soaking a pad every hour', 'soaking through a pad', 'very heavy bleeding', 'heavy bleeding and dizzy',
             'severe allergic', 'swelling of my face', 'severe dizziness', "can't stand", 'cant stand', 'severe weakness',
             'high fever and', 'life threatening', 'life-threatening', 'suicide', 'kill myself', 'want to die', 'self harm']

SCOPE_RE = re.compile(
    r"\b(?:periods?|menstru|cramp|pain|ache|bleed|spotting|flow|clot|pcos|pcod|ovar|ovulat|endometr|fibroid|cycle|missed|"
    r"irregular|pregnan|hormon|pms|mood|pads?|tampon|cups?|hygien|discharge|itch|infect|uti|urine|acne|hair|weight|breast|"
    r"nausea|vomit|headache|dizz|fatigue|tired|weak|fever|anemi|anaemi|iron|haemoglobin|hemoglobin|vitamin|diet|food|water|"
    r"exercise|yoga|sleep|stress|medic|tablet|pills?|painkill|drug|dose|doctor|gyn|hospital|clinic|blood|symptom|health|"
    r"women|girls?|belt|heat|heater|vibrat|sensor|esp32|temperature|app|project|team|member|college|guide|hod|device|"
    r"contracept|birth control|sad|hopeless|depress|safe|handbook|manual|guideline|leaflet|document|docx)", re.I)

INJECTION_RE = re.compile(r"ignore (all |the )?(previous|above|prior)|system prompt|you are now|act as|jailbreak|"
                          r"pretend (to be|you)|reveal your (prompt|instructions)|developer mode", re.I)

# common typos / casual spellings (same idea as the dashboard's TOKEN_ALIASES)
ALIASES = {"pcod": "pcos", "crams": "cramps", "periodd": "period", "preiod": "period", "peroid": "period", "perod": "period",
           "bleding": "bleeding", "bleeeding": "bleeding", "painfull": "painful", "clg": "college", "gide": "guide"}

OFFTOPIC = ("Sorry, I can only answer questions about periods, women's health, and this Smart Period Relief app and project. "
            "Try asking about cramps, heavy bleeding, PCOS, hygiene, or how the belt works.")
EMERGENCY_TEXT = ("Seek urgent medical care now. These symptoms should be evaluated in person right away - "
                  "please don't wait on a chat response.\n\nEmergency Number (India): 112")
DISCLAIMER = "_General educational information, not a diagnosis - a healthcare professional can evaluate your situation._"
DOSE_RE = re.compile(r"\b(how many|what|which)\b.*\b(mg|dose|dosage|tablets?|pills?)\b|\bprescri", re.I)
DOSE_TEXT = ("I can't recommend specific medicine doses or prescriptions - that depends on your age, weight and health. "
             "Please check the label or ask a pharmacist/doctor.")


def normalize(text):
    t = re.sub(r"[^a-z0-9\s]", " ", text.lower().replace("'", ""))
    return " ".join(ALIASES.get(w, w) for w in t.split())


def check_input(raw):
    """Returns (route, reply_text). route: ok | empty | too_long | injection | emergency | offtopic | dose"""
    raw = (raw or "").strip()
    if not raw:
        return "empty", "Please type a question."
    if len(raw) > 500:
        return "too_long", "Please keep your question under 500 characters."
    if INJECTION_RE.search(raw):
        return "injection", "I can only help with period and women's-health questions, so I can't follow that instruction."
    low, norm = raw.lower().replace("\u2019", "'"), normalize(raw)
    if any(k in low or k in norm for k in EMERGENCY):
        return "emergency", EMERGENCY_TEXT
    if DOSE_RE.search(low):
        return "dose", DOSE_TEXT
    if not (SCOPE_RE.search(low) or SCOPE_RE.search(norm)):
        return "offtopic", OFFTOPIC
    return "ok", ""


def check_output(answer, context_text=""):
    """Output guard: never let numbers (doses etc.) appear that are not in the verified source text."""
    if context_text:
        bad = set(re.findall(r"\d+", answer)) - set(re.findall(r"\d+", context_text))
        if bad:
            return False
    return not re.search(r"\byou (definitely |certainly )?have\b|\bdiagnos(ed|is) (is|:)", answer, re.I)
