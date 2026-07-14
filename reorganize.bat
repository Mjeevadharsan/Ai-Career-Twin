@echo off
echo =======================================================
echo   Separating backend files into a dedicated folder...
echo =======================================================

if not exist backend (
    mkdir backend
)

move src backend\
move pom.xml backend\
move target backend\
move data backend\
move database.db backend\
move start-app.bat backend\
move start-app.sh backend\
move Dockerfile backend\
move .env backend\

echo.
echo =======================================================
echo   Done! Your backend is now in the backend/ folder.
echo   Your frontend is still in the frontend/ folder.
echo =======================================================
echo.
pause
