@echo off
echo ========================================
echo   Starting Recall Backend (Spring Boot)
echo   Port: http://localhost:8080
echo ========================================
cd /d "%~dp0recall-backend"
..\tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
pause
