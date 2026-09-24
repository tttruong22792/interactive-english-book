@echo off
setlocal
cd /d "%~dp0"
title Language Studio
cls
echo ================================================
echo  LANGUAGE STUDIO - ENGLISH + JAPANESE + AI VOICE
echo ================================================
echo.
echo Starting local server...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-ENGLISH-BOOK.ps1"
if errorlevel 1 (
  echo.
  echo Server stopped with an error.
  echo Please take a screenshot of this window if you need help.
  pause
)
endlocal
