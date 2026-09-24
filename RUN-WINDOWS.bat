@echo off
setlocal
cd /d "%~dp0"
title English Book Launcher
cls
echo ================================================
echo  80 MAU CAU TIENG ANH - INTERACTIVE BOOK V2.2
echo ================================================
echo.
echo Starting local server...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-ENGLISH-BOOK.ps1"
if errorlevel 1 (
  echo.
  echo Server stopped with an error.
  echo Please take a screenshot of this window and send it to ChatGPT.
  pause
)
endlocal
