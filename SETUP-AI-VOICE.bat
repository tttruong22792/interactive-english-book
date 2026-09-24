@echo off
setlocal
cd /d "%~dp0"
title Language Studio - OpenAI AI Voice Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP-AI-VOICE.ps1"
endlocal
