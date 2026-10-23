@echo off
echo ========================================
echo   Starting Recall Frontend (Vite)
echo   Port: http://localhost:5173
echo ========================================
cd /d "%~dp0recall-frontend"
npm run dev
pause
