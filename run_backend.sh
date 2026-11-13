#!/usr/bin/env bash
# Mac/Linux: run from the project root
python3 -m uvicorn backend.app.main:app --port 8000 --reload
