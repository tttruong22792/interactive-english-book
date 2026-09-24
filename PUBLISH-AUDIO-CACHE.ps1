$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  LANGUAGE STUDIO - CLOUD AUDIO IS NOW ACTIVE' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PUBLISH-AUDIO-CACHE is no longer needed.' -ForegroundColor Green
Write-Host ''
Write-Host 'Audio is now stored centrally in Supabase Storage:' -ForegroundColor White
Write-Host '  bucket: language-studio-audio' -ForegroundColor White
Write-Host ''
Write-Host 'When a published lesson sentence has no central MP3,' -ForegroundColor White
Write-Host 'the cloud TTS backend creates it once and stores it automatically.' -ForegroundColor White
Write-Host ''
Write-Host 'Do not add MP3 files back to GitHub.' -ForegroundColor Yellow
Write-Host ''
Read-Host 'Press Enter to close'
