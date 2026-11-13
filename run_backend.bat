@echo off
REM Windows: double-click or run from the project root
python -m uvicorn backend.app.main:app --port 8000 --reload
