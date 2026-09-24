@echo off
setlocal
cd /d "%~dp0"
title Language Studio LAN Server
cls
echo ================================================
echo  LANGUAGE STUDIO - PHONE TEST MODE
echo ================================================
echo.
echo PC and phone must be on the same Wi-Fi.
echo Windows Firewall may ask for Private network access.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-ENGLISH-BOOK.ps1" -Lan
if errorlevel 1 (
  echo.
  echo Server stopped with an error.
  pause
)
endlocal
