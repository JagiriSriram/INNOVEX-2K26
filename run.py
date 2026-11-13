#!/usr/bin/env python3
"""Smart Period Relief - one script to run the backend AND the frontend.

Works on Windows, macOS and Linux (plain Python, no bash required).

    python run.py                # set up deps (first run) and start both services
    python run.py --no-install   # skip dependency setup, just start
    python run.py --clean        # delete all installs + build output, then exit
    python run.py --help

What it does:
  1. creates ./venv and installs requirements.txt (only when they change)
  2. runs `npm install` in ./frontend (only when node_modules is missing)
  3. starts FastAPI on http://localhost:8000 (uvicorn --reload)
  4. starts Vite on   http://localhost:5173 (proxies /api -> 8000)
  5. Ctrl+C stops both.

--clean removes: ./venv, frontend/node_modules, frontend/dist, every __pycache__,
.DS_Store files and data/uploads. It does NOT touch your data (faq_database.csv,
knowledge.docx) or any source code. Run `python run.py` afterwards to rebuild.
"""
import hashlib
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / "venv"
FRONTEND = ROOT / "frontend"
IS_WIN = os.name == "nt"
VENV_PY = VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

_procs: list[tuple[str, subprocess.Popen]] = []
_stopped = False


def log(msg: str) -> None:
    print(f"[run] {msg}", flush=True)


def _start(cmd: list[str], cwd: Path) -> subprocess.Popen:
    flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) if IS_WIN else 0
    return subprocess.Popen(
        cmd,
        cwd=str(cwd),
        start_new_session=not IS_WIN,  # own process group so we can kill the whole tree
        creationflags=flags,
    )


def _stop(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    try:
        if IS_WIN:
            # kills the process and its children (npm -> node -> vite)
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                           capture_output=True)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass
    try:
        proc.wait(timeout=10)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def shutdown() -> None:
    global _stopped
    if _stopped:
        return
    _stopped = True
    log("Stopping services...")
    for _, p in _procs:
        _stop(p)


def _on_signal(signum, frame):
    raise KeyboardInterrupt


def ensure_backend_deps() -> None:
    req = ROOT / "requirements.txt"
    marker = VENV / ".deps_hash"
    digest = hashlib.sha256(req.read_bytes()).hexdigest()

    if not VENV_PY.exists():
        log("Creating virtual environment (./venv)...")
        subprocess.run([sys.executable, "-m", "venv", str(VENV)], check=True)

    if marker.exists() and marker.read_text(encoding="utf-8").strip() == digest:
        log("Backend dependencies are up to date.")
        return

    log("Installing backend dependencies (first run can take a while)...")
    subprocess.run([str(VENV_PY), "-m", "pip", "install", "--upgrade", "pip"], check=True)
    subprocess.run([str(VENV_PY), "-m", "pip", "install", "-r", str(req)], check=True)
    marker.write_text(digest, encoding="utf-8")
    log("Backend dependencies installed.")


def ensure_frontend_deps(npm: str) -> None:
    if (FRONTEND / "node_modules").exists():
        log("Frontend dependencies are present.")
        return
    log("Installing frontend dependencies (npm install)...")
    subprocess.run([npm, "install"], cwd=str(FRONTEND), check=True)


def _human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.0f} TB"


def _dir_size(path: Path) -> int:
    total = 0
    for p in path.rglob("*"):
        try:
            if p.is_file():
                total += p.stat().st_size
        except OSError:
            pass
    return total


_SKIP = (VENV, FRONTEND / "node_modules")


def _inside_skip(path: Path) -> bool:
    return any(s == path or s in path.parents for s in _SKIP)


def clean() -> None:
    log("Cleaning installs and build output...")
    freed = 0
    for target in (VENV, FRONTEND / "node_modules", FRONTEND / "dist", ROOT / "data" / "uploads"):
        if not target.exists():
            continue
        freed += _dir_size(target) if target.is_dir() else target.stat().st_size
        shutil.rmtree(target, ignore_errors=True) if target.is_dir() else target.unlink(missing_ok=True)
        log(f"  removed {target.relative_to(ROOT)}/")

    n_pyc = 0
    for pc in ROOT.rglob("__pycache__"):
        if _inside_skip(pc):
            continue
        shutil.rmtree(pc, ignore_errors=True)
        n_pyc += 1
    if n_pyc:
        log(f"  removed {n_pyc} __pycache__ director{'y' if n_pyc == 1 else 'ies'}")

    n_ds = 0
    for ds in ROOT.rglob(".DS_Store"):
        if _inside_skip(ds):
            continue
        try:
            ds.unlink()
            n_ds += 1
        except OSError:
            pass
    if n_ds:
        log(f"  removed {n_ds} .DS_Store file(s)")

    log(f"Clean complete — freed about {_human(freed)}.")
    log("Your data (faq_database.csv, knowledge.docx) and source code were left untouched.")
    log("Run `python run.py` to reinstall and start.")


def main() -> int:
    args = sys.argv[1:]
    if "--help" in args or "-h" in args:
        print(__doc__)
        return 0
    if "--clean" in args:
        clean()
        return 0
    no_install = "--no-install" in args

    if not (ROOT / "backend" / "app" / "main.py").exists():
        log(f"ERROR: run this from the project root (expected {ROOT / 'backend' / 'app' / 'main.py'}).")
        return 1

    npm = shutil.which("npm")
    if not npm:
        log("ERROR: Node.js / npm not found. Install Node 18+ from https://nodejs.org and retry.")
        return 1

    if no_install:
        if not VENV_PY.exists():
            log("ERROR: ./venv is missing. Run `python run.py` (without --no-install) first.")
            return 1
        if not (FRONTEND / "node_modules").exists():
            log("ERROR: frontend deps missing. Run `python run.py` (without --no-install) first.")
            return 1
    else:
        ensure_backend_deps()
        ensure_frontend_deps(npm)

    log("Starting backend (FastAPI)...")
    _procs.append(("backend", _start(
        [str(VENV_PY), "-m", "uvicorn", "backend.app.main:app",
         "--host", "127.0.0.1", "--port", str(BACKEND_PORT), "--reload"],
        ROOT,
    )))

    log("Starting frontend (Vite)...")
    _procs.append(("frontend", _start([npm, "run", "dev"], FRONTEND)))

    print(flush=True)
    print("  Smart Period Relief is starting:", flush=True)
    print(f"    Backend  -> http://localhost:{BACKEND_PORT}      (docs at /docs)", flush=True)
    print(f"    Frontend -> http://localhost:{FRONTEND_PORT}", flush=True)
    print("  Press Ctrl+C to stop both.\n", flush=True)

    signal.signal(signal.SIGINT, _on_signal)
    if not IS_WIN:
        signal.signal(signal.SIGTERM, _on_signal)

    try:
        while True:
            for name, proc in _procs:
                if proc.poll() is not None:
                    log(f"{name} exited with code {proc.returncode}; shutting down.")
                    return proc.returncode or 0
            time.sleep(1)
    except KeyboardInterrupt:
        log("Interrupted.")
        return 0
    finally:
        shutdown()


if __name__ == "__main__":
    sys.exit(main())
