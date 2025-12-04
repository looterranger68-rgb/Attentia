@echo off
echo Starting Attentia Local Server...
start "" "http://localhost:8000/index.html"
python server.py
pause
