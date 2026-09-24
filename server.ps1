param(
  [int]$PreferredPort = 5500,
  [string]$Root = $PSScriptRoot,
  [switch]$Lan
)

$ErrorActionPreference = 'Stop'
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Net.Http

$Root = [System.IO.Path]::GetFullPath($Root)
if (-not $Root.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
  $Root += [System.IO.Path]::DirectorySeparatorChar
}

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.htm'  { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'text/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
    '.svg'  { return 'image/svg+xml' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.gif'  { return 'image/gif' }
    '.ico'  { return 'image/x-icon' }
    '.wav'  { return 'audio/wav' }
    '.mp3'  { return 'audio/mpeg' }
    default { return 'application/octet-stream' }
  }
}

function Get-RuntimeIndexBytes {
  $indexPath = Join-Path $Root 'index.html'
  $html = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

  $version = '20260924-ai-fix2'

  $cssPath = Join-Path $Root 'styles.css'
  if ([System.IO.File]::Exists($cssPath)) {
    $css = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)
    $cssTag = '<link rel="stylesheet" href="styles.css?v=' + $version + '" />'
    $styleInline = '<style>' + [Environment]::NewLine + $css + [Environment]::NewLine + '</style>'
    $html = $html.Replace($cssTag, $styleInline)
  }

  $inlineMap = @(
    @{ Tag = '<script src="data/content-index.js?v=' + $version + '"></script>'; Path = 'data\content-index.js' },
    @{ Tag = '<script src="data/content-loader.js?v=' + $version + '"></script>'; Path = 'data\content-loader.js' },
    @{ Tag = '<script src="platform-data.js?v=' + $version + '"></script>'; Path = 'platform-data.js' },
    @{ Tag = '<script src="catalog.js?v=' + $version + '"></script>'; Path = 'catalog.js' },
    @{ Tag = '<script src="ai-tts.js?v=' + $version + '"></script>'; Path = 'ai-tts.js' }
  )

  foreach ($item in $inlineMap) {
    $sourcePath = Join-Path $Root $item.Path
    if (-not [System.IO.File]::Exists($sourcePath)) {
      throw ('Runtime inline source missing: ' + $item.Path)
    }
    $source = [System.IO.File]::ReadAllText($sourcePath, [System.Text.Encoding]::UTF8)
    $inline = '<script>' + [Environment]::NewLine +
              '// Runtime-inline: ' + $item.Path + [Environment]::NewLine +
              $source + [Environment]::NewLine +
              '</script>'
    $html = $html.Replace($item.Tag, $inline)
  }

  $preloadPaths = @(
    'data\english\patterns\001.js',
    'data\english\patterns\002.js',
    'data\english\patterns\003.js',
    'data\japanese\daily-life\001.js'
  )

  $preload = ''
  foreach ($relative in $preloadPaths) {
    $sourcePath = Join-Path $Root $relative
    if ([System.IO.File]::Exists($sourcePath)) {
      $source = [System.IO.File]::ReadAllText($sourcePath, [System.Text.Encoding]::UTF8)
      $preload += '<script>' + [Environment]::NewLine +
                  '// Runtime-preload: ' + $relative + [Environment]::NewLine +
                  $source + [Environment]::NewLine +
                  '</script>' + [Environment]::NewLine
    }
  }

  $appTag = '<script src="app.js?v=' + $version + '"></script>'
  $appPath = Join-Path $Root 'app.js'
  if (-not [System.IO.File]::Exists($appPath)) { throw 'Runtime inline source missing: app.js' }
  $appSource = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)
  $appInline = $preload +
               '<script>' + [Environment]::NewLine +
               '// Runtime-inline: app.js' + [Environment]::NewLine +
               $appSource + [Environment]::NewLine +
               '</script>'
  $html = $html.Replace($appTag, $appInline)

  return [System.Text.Encoding]::UTF8.GetBytes($html)
}

function Send-Response {
  param(
    $Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType,
    [long]$ContentLength = -1
  )
  if ($null -eq $Body) { $Body = [byte[]]::new(0) }
  if ($ContentLength -lt 0) { $ContentLength = $Body.Length }
  $crlf = [string][char]13 + [char]10
  $header = 'HTTP/1.1 ' + $StatusCode + ' ' + $StatusText + $crlf +
            'Content-Type: ' + $ContentType + $crlf +
            'Content-Length: ' + $ContentLength + $crlf +
            'Cache-Control: no-store' + $crlf +
            'Connection: close' + $crlf + $crlf
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
  $Stream.Flush()
}

function Send-Json {
  param($Stream, [int]$StatusCode, [string]$StatusText, $Object)
  $json = $Object | ConvertTo-Json -Depth 8 -Compress
  $body = [System.Text.Encoding]::UTF8.GetBytes($json)
  Send-Response $Stream $StatusCode $StatusText $body 'application/json; charset=utf-8'
}

function Find-HeaderEnd([byte[]]$Bytes) {
  if ($Bytes.Length -lt 4) { return -1 }
  for ($i = 0; $i -le $Bytes.Length - 4; $i++) {
    if ($Bytes[$i] -eq 13 -and $Bytes[$i+1] -eq 10 -and $Bytes[$i+2] -eq 13 -and $Bytes[$i+3] -eq 10) {
      return $i
    }
  }
  return -1
}

function Read-HttpRequest($Stream) {
  $buffer = New-Object byte[] 8192
  $memory = New-Object System.IO.MemoryStream
  $headerEnd = -1

  while ($headerEnd -lt 0) {
    $read = $Stream.Read($buffer, 0, $buffer.Length)
    if ($read -le 0) { break }
    $memory.Write($buffer, 0, $read)
    if ($memory.Length -gt 1048576) { throw 'Request headers are too large.' }
    $headerEnd = Find-HeaderEnd ($memory.ToArray())
  }

  if ($headerEnd -lt 0) { throw 'Invalid HTTP request.' }
  $all = $memory.ToArray()
  $headerText = [System.Text.Encoding]::ASCII.GetString($all, 0, $headerEnd)
  $headerLines = $headerText -split "\r?\n"
  if ($headerLines.Count -lt 1) { throw 'Missing request line.' }

  $requestParts = $headerLines[0].Split(' ')
  if ($requestParts.Length -lt 2) { throw 'Invalid request line.' }

  $headers = @{}
  for ($i = 1; $i -lt $headerLines.Count; $i++) {
    $line = $headerLines[$i]
    $colon = $line.IndexOf(':')
    if ($colon -gt 0) {
      $name = $line.Substring(0, $colon).Trim()
      $value = $line.Substring($colon + 1).Trim()
      $headers[$name] = $value
    }
  }

  $contentLength = 0
  if ($headers.ContainsKey('Content-Length')) {
    [void][int]::TryParse([string]$headers['Content-Length'], [ref]$contentLength)
  }
  if ($contentLength -gt 1048576) { throw 'Request body is too large.' }

  $bodyStart = $headerEnd + 4
  $availableBody = [Math]::Max(0, $all.Length - $bodyStart)
  while ($availableBody -lt $contentLength) {
    $read = $Stream.Read($buffer, 0, $buffer.Length)
    if ($read -le 0) { break }
    $memory.Write($buffer, 0, $read)
    $availableBody += $read
  }

  $all = $memory.ToArray()
  $body = [byte[]]::new($contentLength)
  if ($contentLength -gt 0) {
    [System.Array]::Copy($all, $bodyStart, $body, 0, [Math]::Min($contentLength, $all.Length - $bodyStart))
  }

  return @{
    Method = $requestParts[0].ToUpperInvariant()
    Target = $requestParts[1]
    Headers = $headers
    Body = $body
  }
}

function Get-OpenAIKey {
  if (-not [string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) { return $env:OPENAI_API_KEY.Trim() }
  $envFile = Join-Path $Root '.env.local'
  if (-not [System.IO.File]::Exists($envFile)) { return $null }
  foreach ($lineRaw in [System.IO.File]::ReadAllLines($envFile, [System.Text.Encoding]::UTF8)) {
    $line = $lineRaw.Trim().TrimStart([char]0xFEFF)
    if ($line.StartsWith('#') -or [string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.StartsWith('OPENAI_API_KEY=')) {
      return $line.Substring('OPENAI_API_KEY='.Length).Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Get-Sha256([string]$Text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    $hash = $sha.ComputeHash($bytes)
    return ([System.BitConverter]::ToString($hash)).Replace('-', '').ToLowerInvariant()
  } finally { $sha.Dispose() }
}

function Get-TtsInstructions([string]$Language, [string]$Pace) {
  if ($Language.StartsWith('ja')) {
    $paceText = if ($Pace -eq 'slow') { 'Speak slowly and clearly for a beginner, while keeping natural Japanese rhythm.' } elseif ($Pace -eq 'natural') { 'Speak at a natural conversational pace.' } else { 'Speak at a clear, comfortable learning pace.' }
    return 'Speak exactly the provided text in natural standard Japanese. Use warm, clear intonation like a patient native teacher. ' + $paceText + ' Do not add, remove, translate, or explain any words.'
  }
  $paceText = if ($Pace -eq 'slow') { 'Speak slowly enough for a beginner to imitate, but keep natural connected speech.' } elseif ($Pace -eq 'natural') { 'Speak at a natural conversational pace with natural linking and contractions.' } else { 'Speak at a clear, comfortable learning pace with natural connected speech.' }
  return 'Speak exactly the provided text in natural conversational American English. Sound warm, clear, relaxed, and human-like, like a patient native English teacher. ' + $paceText + ' Do not sound robotic or overly dramatic. Do not add, remove, spell out, translate, or explain any words.'
}

$OpenAIKey = Get-OpenAIKey
$TtsModel = 'gpt-4o-mini-tts'
$TtsCacheDir = Join-Path $Root '.cache\tts'
if (-not [System.IO.Directory]::Exists($TtsCacheDir)) { [void][System.IO.Directory]::CreateDirectory($TtsCacheDir) }
$HttpClient = [System.Net.Http.HttpClient]::new()
$HttpClient.Timeout = [TimeSpan]::FromSeconds(45)

function Get-AiSpeechBytes([string]$InputText, [string]$Language, [string]$Voice, [string]$Pace) {
  if ([string]::IsNullOrWhiteSpace($OpenAIKey)) { throw 'OPENAI_API_KEY is not configured.' }
  $allowedVoices = @('alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar')
  if ($allowedVoices -notcontains $Voice) { $Voice = if ($Language.StartsWith('ja')) { 'cedar' } else { 'marin' } }
  if (@('slow','medium','natural') -notcontains $Pace) { $Pace = 'medium' }

  $instructions = Get-TtsInstructions $Language $Pace
  $cacheKey = Get-Sha256 ($TtsModel + '|' + $Voice + '|' + $Language + '|' + $Pace + '|' + $InputText)
  $cacheFile = Join-Path $TtsCacheDir ($cacheKey + '.mp3')
  if ([System.IO.File]::Exists($cacheFile)) { return [System.IO.File]::ReadAllBytes($cacheFile) }

  $payload = @{
    model = $TtsModel
    input = $InputText
    voice = $Voice
    instructions = $instructions
    response_format = 'mp3'
  } | ConvertTo-Json -Depth 6 -Compress

  $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, [System.Uri]'https://api.openai.com/v1/audio/speech')
  $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $OpenAIKey)
  $request.Content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')

  try {
    $response = $HttpClient.SendAsync($request).GetAwaiter().GetResult()
    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      $errorText = [System.Text.Encoding]::UTF8.GetString($bytes)
      throw ('OpenAI TTS error ' + [int]$response.StatusCode + ': ' + $errorText)
    }
    [System.IO.File]::WriteAllBytes($cacheFile, $bytes)
    return $bytes
  } finally {
    $request.Dispose()
    if ($response) { $response.Dispose() }
  }
}

$listener = $null
$Port = $PreferredPort
for ($p = $PreferredPort; $p -le ($PreferredPort + 20); $p++) {
  $candidate = $null
  try {
    $bindAddress = if ($Lan) { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
    $candidate = [System.Net.Sockets.TcpListener]::new($bindAddress, $p)
    $candidate.Start()
    $listener = $candidate
    $Port = $p
    break
  } catch {
    if ($candidate) { try { $candidate.Stop() } catch {} }
  }
}

if (-not $listener) {
  Write-Host 'Could not open a local port between 5500 and 5520.' -ForegroundColor Red
  Write-Host 'Close other local web servers and try again.' -ForegroundColor Yellow
  exit 1
}

$Url = 'http://127.0.0.1:' + $Port + '/#home'
$MobileUrl = $null
if ($Lan) {
  try {
    $hostIp = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
      Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and -not $_.ToString().StartsWith('169.254.') } |
      Select-Object -First 1
    if ($hostIp) { $MobileUrl = 'http://' + $hostIp.ToString() + ':' + $Port + '/#home' }
  } catch {}
}

Clear-Host
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  LANGUAGE STUDIO - SAFE BOOT + AI VOICE' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ('Folder: ' + $Root)
Write-Host ('PC address: ' + $Url) -ForegroundColor Green
Write-Host 'Safe Boot: ON - HTML, CSS and JavaScript are embedded into the first response.' -ForegroundColor Green
if ([string]::IsNullOrWhiteSpace($OpenAIKey)) {
  Write-Host 'AI Voice: NOT CONFIGURED - browser voice fallback is active.' -ForegroundColor Yellow
  Write-Host 'Run SETUP-AI-VOICE.bat once to enable OpenAI TTS.' -ForegroundColor Yellow
} else {
  Write-Host ('AI Voice: ENABLED - ' + $TtsModel + ' / English voice: marin') -ForegroundColor Green
}
if ($Lan) {
  if ($MobileUrl) { Write-Host ('Phone (same Wi-Fi): ' + $MobileUrl) -ForegroundColor Green }
  else { Write-Host 'LAN mode is on. Could not detect the PC IPv4 address automatically.' -ForegroundColor Yellow }
  Write-Host 'If Windows Firewall asks, allow Private networks.' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'KEEP THIS WINDOW OPEN while using the app.' -ForegroundColor Yellow
Write-Host 'Press Ctrl+C to stop the server.' -ForegroundColor Yellow
Write-Host ''

try { Start-Process $Url } catch { Write-Host ('Open this address manually: ' + $Url) -ForegroundColor Yellow }

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $null
    try {
      $stream = $client.GetStream()

      # Chrome may open speculative TCP connections that never send an HTTP request.
      # Do not let one empty connection block this single-threaded local server.
      $waitMs = if ($Lan) { 1500 } else { 500 }
      $waited = 0
      while (-not $stream.DataAvailable -and $waited -lt $waitMs) {
        Start-Sleep -Milliseconds 10
        $waited += 10
      }
      if (-not $stream.DataAvailable) {
        continue
      }

      $request = Read-HttpRequest $stream
      $method = $request.Method
      $rawTarget = [string]$request.Target
      $rawPath = $rawTarget.Split('?')[0]

      if ($rawPath -eq '/api/tts/status' -and $method -eq 'GET') {
        Send-Json $stream 200 'OK' @{
          enabled = -not [string]::IsNullOrWhiteSpace($OpenAIKey)
          provider = if ([string]::IsNullOrWhiteSpace($OpenAIKey)) { 'browser' } else { 'openai' }
          model = $TtsModel
          englishVoice = 'marin'
          japaneseVoice = 'cedar'
          aiGenerated = $true
        }
        continue
      }

      if ($rawPath -eq '/api/tts' -and $method -eq 'POST') {
        if ([string]::IsNullOrWhiteSpace($OpenAIKey)) {
          Send-Json $stream 503 'Service Unavailable' @{ error = 'AI Voice is not configured. Run SETUP-AI-VOICE.bat on the PC.' }
          continue
        }

        try {
          $bodyText = [System.Text.Encoding]::UTF8.GetString($request.Body)
          $data = $bodyText | ConvertFrom-Json
          $inputText = [string]$data.input
          $language = if ([string]::IsNullOrWhiteSpace([string]$data.language)) { 'en-US' } else { [string]$data.language }
          $voice = if ([string]::IsNullOrWhiteSpace([string]$data.voice)) { if ($language.StartsWith('ja')) { 'cedar' } else { 'marin' } } else { [string]$data.voice }
          $pace = if ([string]::IsNullOrWhiteSpace([string]$data.pace)) { 'medium' } else { [string]$data.pace }

          if ([string]::IsNullOrWhiteSpace($inputText)) {
            Send-Json $stream 400 'Bad Request' @{ error = 'input is required' }
            continue
          }
          if ($inputText.Length -gt 1200) {
            Send-Json $stream 413 'Payload Too Large' @{ error = 'Text is too long for one learning-audio request.' }
            continue
          }

          $audioBytes = Get-AiSpeechBytes $inputText $language $voice $pace
          Send-Response $stream 200 'OK' $audioBytes 'audio/mpeg'
        } catch {
          Write-Host ('AI Voice error: ' + $_.Exception.Message) -ForegroundColor DarkYellow
          Send-Json $stream 502 'Bad Gateway' @{ error = 'AI Voice failed. Browser voice will be used as fallback.' }
        }
        continue
      }

      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        Send-Response $stream 405 'Method Not Allowed' $body 'text/plain; charset=utf-8'
        continue
      }

      $decoded = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($decoded)) { $decoded = 'index.html' }
      $relative = $decoded.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))

      if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Forbidden')
        Send-Response $stream 403 'Forbidden' $body 'text/plain; charset=utf-8'
        continue
      }
      if ([System.IO.Directory]::Exists($fullPath)) { $fullPath = Join-Path $fullPath 'index.html' }
      if (-not [System.IO.File]::Exists($fullPath)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        Send-Response $stream 404 'Not Found' $body 'text/plain; charset=utf-8'
        continue
      }

      if ($decoded -eq 'index.html' -and $method -eq 'GET') {
        $bytes = Get-RuntimeIndexBytes
        Send-Response $stream 200 'OK' $bytes 'text/html; charset=utf-8'
        continue
      }

      $fileLength = (Get-Item -LiteralPath $fullPath).Length
      $bytes = if ($method -eq 'HEAD') { [byte[]]::new(0) } else { [System.IO.File]::ReadAllBytes($fullPath) }
      Send-Response $stream 200 'OK' $bytes (Get-ContentType $fullPath) $fileLength
    } catch {
      if ($stream) {
        try {
          $body = [System.Text.Encoding]::UTF8.GetBytes('Internal Server Error')
          Send-Response $stream 500 'Internal Server Error' $body 'text/plain; charset=utf-8'
        } catch {}
      }
      $msg = $_.Exception.Message
      if ($msg -notmatch 'transport connection|timed out|failed to respond') {
        Write-Host $msg -ForegroundColor DarkYellow
      }
    } finally {
      if ($stream) { $stream.Dispose() }
      $client.Close()
    }
  }
} finally {
  if ($HttpClient) { $HttpClient.Dispose() }
  if ($listener) { $listener.Stop() }
}
