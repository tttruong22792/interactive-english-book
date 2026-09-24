@echo off
setlocal
cd /d "%~dp0"
title Language Studio - Publish Shared Audio Cache
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0PUBLISH-AUDIO-CACHE.ps1"
endlocal
