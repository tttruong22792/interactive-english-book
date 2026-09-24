$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
Set-Location $Root

$AudioDir = Join-Path $Root 'audio\tts'
if (-not (Test-Path $AudioDir)) {
  Write-Host 'No shared audio directory exists yet.' -ForegroundColor Yellow
  Read-Host 'Press Enter to close'
  exit 0
}

$files = @(Get-ChildItem -LiteralPath $AudioDir -Filter '*.mp3' -File -ErrorAction SilentlyContinue)
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($null -eq $totalBytes) { $totalBytes = 0 }
$sizeMb = [Math]::Round($totalBytes / 1MB, 2)

Write-Host ''
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  LANGUAGE STUDIO - PUBLISH SHARED AUDIO CACHE' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ('MP3 files: ' + $files.Count)
Write-Host ('Total size: ' + $sizeMb + ' MB')
Write-Host ''

$changes = git status --porcelain -- audio/tts
if ([string]::IsNullOrWhiteSpace(($changes -join "`n"))) {
  Write-Host 'No new shared audio files need to be published.' -ForegroundColor Green
  Read-Host 'Press Enter to close'
  exit 0
}

Write-Host 'Only audio/tts will be staged. Your .env.local/API key is never included.' -ForegroundColor Yellow
Write-Host ''
$answer = Read-Host 'Publish these cached MP3 files to GitHub now? (Y/N)'
if ($answer -notmatch '^[Yy]$') {
  Write-Host 'Cancelled.' -ForegroundColor Yellow
  exit 0
}

git add -- audio/tts
git diff --cached --quiet -- audio/tts
if ($LASTEXITCODE -eq 0) {
  Write-Host 'Nothing new to commit.' -ForegroundColor Green
  exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
git commit -m "Publish shared AI audio cache $stamp"
if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }

git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'Push failed. Your audio commit is safe locally.' -ForegroundColor Yellow
  Write-Host 'Run git pull --rebase, then git push.' -ForegroundColor Yellow
  Read-Host 'Press Enter to close'
  exit 1
}

Write-Host ''
Write-Host 'Shared audio cache published successfully.' -ForegroundColor Green
Write-Host 'Online deployments can now reuse these MP3 files without another OpenAI call.' -ForegroundColor Green
Read-Host 'Press Enter to close'
