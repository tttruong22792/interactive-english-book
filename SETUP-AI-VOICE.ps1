$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Target = Join-Path $Root '.env.local'

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host '  LANGUAGE STUDIO - OPENAI AI VOICE SETUP' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Your API key will be saved only in .env.local on this PC.' -ForegroundColor Yellow
Write-Host 'The file is ignored by Git and must never be committed.' -ForegroundColor Yellow
Write-Host ''

$secure = Read-Host 'Paste OPENAI_API_KEY' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host 'No API key was entered.' -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

if (-not ($key.StartsWith('sk-'))) {
  Write-Host 'Warning: the value does not look like a standard OpenAI API key.' -ForegroundColor Yellow
}

$content = "OPENAI_API_KEY=$key`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($Target, $content, $utf8NoBom)

Write-Host ''
Write-Host 'Saved successfully:' -ForegroundColor Green
Write-Host $Target -ForegroundColor Green
Write-Host ''
Write-Host 'Close any running Language Studio server and run RUN-WINDOWS.bat again.' -ForegroundColor Cyan
Write-Host 'The website will automatically use AI Voice when the key is valid.' -ForegroundColor Cyan
Write-Host ''
Read-Host 'Press Enter to close'
