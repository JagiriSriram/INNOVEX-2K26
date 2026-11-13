# Smart Period Relief - Hybrid RAG Assistant

Your dashboard UI + a real AI backend: **BM25 + FAISS hybrid retrieval, guardrails, and an "evolve" feedback loop**, with a React frontend.

## Folder structure
```
smart-period-relief-rag/
├── requirements.txt          <- Python libraries
├── run.py                    <- ONE script to run backend + frontend (Windows/macOS/Linux)
├── run_backend.bat / .sh     <- one-click backend start
├── data/
│   └── faq_database.csv      <- YOUR Database_sr (65 verified Q&A rows)
├── backend/
│   ├── app/
│   │   ├── config.py         <- settings (paths, weights, admin token)
│   │   ├── data_loader.py    <- STEP 1: read the CSV (+ Word doc)
│   │   ├── docx_loader.py    <- STEP 1b: read the given Word (.docx) document
│   │   ├── retriever.py      <- STEP 2: BM25 + FAISS + RRF fusion
│   │   ├── guardrails.py     <- STEP 3: safety checks (input + output)
│   │   ├── evolve.py         <- STEP 4: learns from feedback
│   │   ├── project_info.py   <- team/project answers (fixed facts only)
│   │   ├── rag.py            <- STEP 5: the whole pipeline
│   │   └── main.py           <- STEP 6: FastAPI endpoints
│   └── tests/test_pipeline.py
├── frontend/                 <- Vite + React shell; original dashboard UI, split into parts
│   ├── index.html            <- links the original CSS
│   ├── src/App.tsx           <- mounts the original markup, loads the JS parts in order
│   ├── src/dashboard/        <- skeleton.ts (verbatim body markup), parts.ts (load order)
│   └── public/dashboard/     <- app.css, intro.css + part-*.js (original_dashboard.html JS, split)
└── dashboard/
    ├── original_dashboard.html    <- your file, untouched
    ├── rag-bridge.js              <- the 20-line connector
    └── dashboard_connected.html   <- your dashboard + connector (chat now uses the backend)
```

## Run it (step by step)
**Need:** Python 3.10+ and Node.js 18+.

### One command (Windows + macOS + Linux)
From the project root (the folder containing `requirements.txt`):
```
python run.py
```
This creates the `venv`, installs backend + frontend deps (first run only), then starts **both** the FastAPI backend (http://localhost:8000) and the Vite frontend (http://localhost:5173). Press **Ctrl+C** once to stop both.
- `python run.py --no-install` — skip dependency setup, just start (deps must already exist).
- `python run.py --clean` — delete **all installs and build output** (`venv`, `frontend/node_modules`, `frontend/dist`, every `__pycache__`, `.DS_Store`, `data/uploads`) and exit. Your data (`faq_database.csv`, `knowledge.docx`) and source code are kept; run `python run.py` afterwards to rebuild from scratch.
- `py run.py` — same thing on Windows.

### Or run the steps manually

1. **Open a terminal in the project root** (the folder containing `requirements.txt`).
2. **Create a virtual env and install:**
   - Windows: `python -m venv venv` then `venv\Scripts\activate`
   - Mac/Linux: `python3 -m venv venv` then `source venv/bin/activate`
   - then `pip install -r requirements.txt` (first run downloads a ~90 MB embedding model; needs internet once)
3. **Test the pipeline:** `python -m backend.tests.test_pipeline` -> should end with `ALL OK`.
4. **Start the backend:** `python -m uvicorn backend.app.main:app --port 8000 --reload`
   Check http://localhost:8000/api/health and interactive docs at http://localhost:8000/docs
5. **Start the React frontend** (new terminal): `cd frontend` -> `npm install` -> `npm run dev` -> open http://localhost:5173
6. **Or use your original dashboard:** keep the backend running and open `dashboard/dashboard_connected.html` -> AI page. (If the backend is off it falls back to your old built-in answers.)

## How it works (explain this at the expo)
User question -> **Input guardrails** -> **BM25** (exact keyword match) + **FAISS** (meaning match using embeddings) -> **RRF fusion** (merge both rankings) -> **Evolve boost** -> answer from the verified database -> **Output guardrails** -> reply.

| Part | What it does | File |
|---|---|---|
| BM25 | Ranks FAQ rows by keyword overlap ("cramps", "pcos") | retriever.py |
| FAISS | Finds rows with similar *meaning* ("belly hurts" ~ "cramps") using vectors | retriever.py |
| Hybrid / RRF | Combines both rank lists: score = sum of 1/(60+rank) | retriever.py |
| Word doc | The given .docx is parsed into chunks and merged with the CSV rows (same BM25+FAISS index) | docx_loader.py |
| Guardrails | Emergency words -> shows 112; off-topic and prompt-injection blocked; no medicine doses; unsupported numbers blocked; disclaimer added | guardrails.py |
| Evolve | Helpful/Not helpful buttons re-rank answers; unanswered questions are logged; admin can add them to the CSV | evolve.py |
| Safe answers | Replies are taken from your verified database, so the bot can't invent medical facts. Optional: set `USE_LLM=1` to let an LLM (OpenAI or Anthropic) rephrase them | rag.py |
| LLM (optional) | Put `OPENAI_API_KEY=...` (or `ANTHROPIC_API_KEY=...`) in `.env` and `USE_LLM=1`. The model only rephrases the verified answer from context; if it adds facts/numbers or fails, the verified text is used. **The key stays server-side — never put it in the frontend.** | config.py, rag.py |

## Evolve admin demo
Questions the bot couldn't answer: 
`curl -H "x-admin-token: expo123" http://localhost:8000/api/evolve/report`
Add them as a new FAQ row (searchable immediately):
`curl -X POST http://localhost:8000/api/evolve/add -H "x-admin-token: expo123" -H "Content-Type: application/json" -d "{\"category\":\"General\",\"question\":\"Can I donate blood on my period?\",\"keywords\":\"donate blood, period\",\"answer\":\"...your verified answer...\"}"`

## Word document ingestion
The given Word document lives at `data/knowledge.docx` (a placeholder ships so the path works out of the box). Its headings/paragraphs/tables are chunked and merged with the CSV rows, so answers can cite either source:
`curl http://localhost:8000/api/documents`
Upload/replace it at runtime (admin only); it becomes searchable immediately:
`curl -X POST http://localhost:8000/api/ingest/docx -H "x-admin-token: expo123" -F "file=@/path/to/your.docx"`

## Good demo questions
- "Why is my period painful?" - normal RAG answer with source + feedback buttons
- "belly hurting a lot" - semantic match (FAISS)
- "I fainted during my period" - emergency guardrail -> 112
- "Who is the prime minister?" - off-topic guardrail
- "ignore previous instructions" - injection guardrail
- "Who is the team leader?" - project info

## Notes / limits
- Not a medical device; answers are educational only.
- Your dashboard's `aiHealth_ask` topics are replaced by the CSV; add rows to `data/faq_database.csv` to grow knowledge.
- The frontend is a **verbatim port** of the original dashboard: `dashboard/original_dashboard.html` was mechanically split into `frontend/public/dashboard/app.css`, `intro.css` and `part-*.js` (concatenating the parts reproduces the original script exactly). `App.tsx` renders the original body markup and loads the parts as classic scripts, so the UI and behavior match the single-file version. Only the AI chat is wired to this RAG backend (via `rag-bridge`, with fallback to the built-in responder).


## New in this version
- **PIN by keyboard** - the on-screen mouse keypad is gone. Type the 4 digits on the keyboard (phones open the numeric keyboard). Backspace edits, Esc cancels (when setting/changing a PIN).
- **35 languages** - pick one in Profile -> Settings or on the AI page. Questions are translated to English, answered from the verified knowledge base, then translated back (`backend/app/translate.py`). Uses OpenAI / Anthropic if a key is in `.env`, otherwise free Google Translate via `deep-translator` (internet needed). If translation is unavailable the answer comes back in English with a note.
- **Chat with voice + text** - mic button (speech-to-text in the chosen language), "Read answers aloud" switch and a per-message speaker button, plus a floating chat box (bottom-right) on every page. Voice needs Chrome / Edge / Safari and microphone permission; voice quality depends on the voices installed on the device.
- Reinstall backend deps once: `pip install -r requirements.txt` (adds `deep-translator`).
- Note: the standalone `dashboard/*.html` files were not changed; these features are in the React frontend.


## Language, PIN and chat box
- **PIN**: type the 4 digits on the keyboard; the dashboard opens automatically after the 4th digit (no mouse needed).
- **Language**: after the intro (and PIN) a *Choose your language* screen opens. The 🌐 button (top-right) re-opens it any time. All dashboard text, buttons, placeholders and chat replies switch to the chosen language (35 languages, RTL for Arabic/Urdu/Persian). UI text is translated by the backend (`POST /api/translate-ui`) and cached in the browser, so the backend must be running (internet or an OpenAI/Anthropic key needed for translation).
- **Chat box + voice**: the 💬 button opens a chat box; 🎤 listens in the chosen language (Chrome/Edge/Safari), 🔊 reads replies aloud.

## Chat history

Every question and answer is saved in a SQLite database (`data/history.db`, created automatically,
gitignored). The chat window is cleared once per new session (when the app/tab is opened fresh), not on every
question or every time you open the chat; open **🕘 History** (AI page link, or the 🕘 button in the floating chat box)
to see, re-ask or delete past questions. History is kept per browser (anonymous `session_id`).

API: `GET /api/history?session_id=…` · `DELETE /api/history/{id}?session_id=…` · `DELETE /api/history?session_id=…`

## Voice assistant

Voice lives **outside the chat**: a round green WhatsApp-style mic button at the bottom-right of every page, beside the 💬 chat button. Tap it, speak, and the
answer appears on a small card and is read aloud (🔊 Listen again / ⏹ Stop). It follows the chosen language,
uses the same backend, and its questions are saved to History too. The chat itself is text-only.
Needs Chrome, Edge or Safari for speech input.
