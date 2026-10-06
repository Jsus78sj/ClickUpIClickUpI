@echo off
cd /d "%~dp0"
call npm install
if errorlevel 1 goto :fail
call npm run dist
if errorlevel 1 goto :fail
echo.
echo تم. الملفات في: %~dp0release
explorer "%~dp0release"
pause
exit /b 0
:fail
echo فشل البناء
pause
exit /b 1
