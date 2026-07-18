@echo off
echo ========================================
echo   AI Career Twin - Application Starter
echo ========================================
echo.

:: Load local environment variables from .env if present
if exist .env (
    echo [System] Loading environment variables from .env...
    for /f "usebackq tokens=1* delims==" %%i in (".env") do (
        set %%i=%%j
    )
)
echo.


echo [1/2] Starting Spring Boot Backend...
echo       Port: 5001
echo       URL: http://localhost:5001
echo.

start cmd /k "title Spring Boot Backend (Port 5001) && mvn spring-boot:run"

echo Waiting 10 seconds for backend to initialize...
timeout /t 10 /nobreak > nul
echo.

echo [2/2] Starting React Frontend...
echo       Port: 3000
echo       URL: http://localhost:3000
echo.

start cmd /k "title React Frontend (Port 3000) && cd ../frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
echo (Servers will continue running in other windows)
pause > nul
