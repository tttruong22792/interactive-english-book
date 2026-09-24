param(
  [int]$PreferredPort = 5500,
  [string]$Root = $PSScriptRoot,
  [switch]$Lan
)

$ErrorActionPreference = 'Stop'
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

function Send-Response {
  param(
    $Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType,
    [long]$ContentLength = -1
  )
  if ($ContentLength -lt 0) { $ContentLength = $Body.Length }
  $header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
            "Content-Type: $ContentType`r`n" +
            "Content-Length: $ContentLength`r`n" +
            "Cache-Control: no-cache`r`n" +
            "Connection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

$listener = $null
$Port = $PreferredPort
for ($p = $PreferredPort; $p -le ($PreferredPort + 20); $p++) {
  try {
    $bindAddress = if ($Lan) { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
    $candidate = [System.Net.Sockets.TcpListener]::new($bindAddress, $p)
    $candidate.Start()
    $listener = $candidate
    $Port = $p
    break
  } catch {
    if ($candidate) {
      try { $candidate.Stop() } catch {}
    }
  }
}

if (-not $listener) {
  Write-Host 'Could not open a local port between 5500 and 5520.' -ForegroundColor Red
  Write-Host 'Close other local web servers and try again.' -ForegroundColor Yellow
  exit 1
}

$Url = "http://127.0.0.1:$Port/#home"
$MobileUrl = $null
if ($Lan) {
  try {
    $hostIp = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
      Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and -not $_.ToString().StartsWith('169.254.') } |
      Select-Object -First 1
    if ($hostIp) { $MobileUrl = "http://$($hostIp.ToString()):$Port/#home" }
  } catch {}
}
Clear-Host
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  LANGUAGE STUDIO - LOCAL SERVER V3' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host "Folder: $Root"
Write-Host "PC address: $Url" -ForegroundColor Green
if ($Lan) {
  if ($MobileUrl) { Write-Host "Phone (same Wi-Fi): $MobileUrl" -ForegroundColor Green }
  else { Write-Host 'LAN mode is on. Could not detect the PC IPv4 address automatically.' -ForegroundColor Yellow }
  Write-Host 'If Windows Firewall asks, allow Private networks.' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'KEEP THIS WINDOW OPEN while using the app.' -ForegroundColor Yellow
Write-Host 'Press Ctrl+C to stop the server.' -ForegroundColor Yellow
Write-Host ''

try {
  Start-Process $Url
} catch {
  Write-Host "Open this address manually: $Url" -ForegroundColor Yellow
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $null
    $reader = $null
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Bad Request')
        Send-Response $stream 400 'Bad Request' $body 'text/plain; charset=utf-8'
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        Send-Response $stream 405 'Method Not Allowed' $body 'text/plain; charset=utf-8'
        continue
      }

      $rawPath = $parts[1].Split('?')[0]
      $decoded = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($decoded)) { $decoded = 'index.html' }

      $relative = $decoded.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))

      if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Forbidden')
        Send-Response $stream 403 'Forbidden' $body 'text/plain; charset=utf-8'
        continue
      }

      if ([System.IO.Directory]::Exists($fullPath)) {
        $fullPath = Join-Path $fullPath 'index.html'
      }

      if (-not [System.IO.File]::Exists($fullPath)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        Send-Response $stream 404 'Not Found' $body 'text/plain; charset=utf-8'
        continue
      }

      $fileLength = (Get-Item -LiteralPath $fullPath).Length
      if ($method -eq 'HEAD') {
        $bytes = [byte[]]::new(0)
      } else {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      }
      Send-Response $stream 200 'OK' $bytes (Get-ContentType $fullPath) $fileLength
    } catch {
      if ($stream) {
        try {
          $body = [System.Text.Encoding]::UTF8.GetBytes('Internal Server Error')
          Send-Response $stream 500 'Internal Server Error' $body 'text/plain; charset=utf-8'
        } catch {}
      }
      Write-Host $_.Exception.Message -ForegroundColor DarkYellow
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Close()
    }
  }
} finally {
  if ($listener) { $listener.Stop() }
}
