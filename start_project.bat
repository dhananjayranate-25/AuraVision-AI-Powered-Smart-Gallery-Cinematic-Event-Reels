@echo off
echo ===================================================
echo Starting Generative AI Smart Event Gallery...
echo ===================================================

echo Starting Backend Server...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Please wait a few seconds, then open:
echo Frontend (Admin/Guest): http://localhost:5173
echo.
pause
