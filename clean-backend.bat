@echo off
title Cleaning Frontend Files from Backend
color 0C
echo ==============================================
echo   Cleaning Frontend Files from Backend Folder
echo ==============================================
echo.

set "PROJECT_ROOT=%~dp0"

echo [1/3] Removing FallbackController.java...
if exist "%PROJECT_ROOT%backend\src\main\java\com\career\twin\controller\FallbackController.java" (
    del /f /q "%PROJECT_ROOT%backend\src\main\java\com\career\twin\controller\FallbackController.java"
    echo [OK] FallbackController.java removed.
) else (
    echo [Info] FallbackController.java already removed or does not exist.
)

echo.
echo [2/3] Removing static assets...
if exist "%PROJECT_ROOT%backend\src\main\resources\static" (
    rmdir /s /q "%PROJECT_ROOT%backend\src\main\resources\static"
    echo [OK] static folder removed.
) else (
    echo [Info] static folder already removed or does not exist.
)

echo.
echo [3/3] Cleaning target build folder...
if exist "%PROJECT_ROOT%backend\target" (
    rmdir /s /q "%PROJECT_ROOT%backend\target"
    echo [OK] Target build folder cleaned.
) else (
    echo [Info] Target build folder already clean.
)

echo.
echo ==============================================
echo   Done! Backend has been cleaned successfully.
echo   Restart your backend using start-app.bat
echo ==============================================
echo.
pause
