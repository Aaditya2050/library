@echo off
echo ========================================
echo   Launching Recall Application Locally
echo ========================================
echo Starting Backend in a new window...
start "Recall Backend (Spring Boot)" cmd /k "cd /d ""%~dp0recall-backend"" && ..\tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

echo Starting Frontend in a new window...
start "Recall Frontend (Vite)" cmd /k "cd /d ""%~dp0recall-frontend"" && npm run dev"

echo.
echo ===================================================
echo Backend running at:  http://localhost:8080
echo Frontend running at: http://localhost:5173
echo ===================================================
