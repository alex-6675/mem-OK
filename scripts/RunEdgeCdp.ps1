# RunEdgeCdp.ps1 — чистый Edge c CDP для тестов ok.ru (TASK-0160).
# Профиль — ВСЕГДА вне репо. Чистота — по доказанному v03.
#Requires -Version 7.0

param(
    [ValidateSet("s_admin","admin","moderator","editor","user_01")]
    [string]$Profile = "user_01"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'



$ports = @{ s_admin=9222; admin=9223; moderator=9224; editor=9225; user_01=9226 }
$Port = $ports[$Profile]

$EdgePath   = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$ProfileDir = "C:\Users\An\serv6675\Edge_test_ok\$Profile\"
$DistDir    = Join-Path $PSScriptRoot ".." "dist"
$repoRoot   = Split-Path -Parent $PSScriptRoot

# Страховка: профиль внутри репо — физически невозможен.
if ($ProfileDir -like "$repoRoot*") {
    Write-Error "Профиль внутри репо запрещён"; exit 1
}
if (-not (Test-Path $EdgePath)) { Write-Error "Не найден Edge: $EdgePath"; exit 1 }
if (-not (Test-Path (Join-Path $DistDir "manifest.json"))) {
    Write-Error "dist/ без расширения: сначала pwsh scripts/Build.ps1"; exit 1
}
if (-not (Test-Path $ProfileDir)) {
    Write-Host "Создаю профиль: $ProfileDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}

# Чистка (безопасно): только кэши. НЕ ТРОГАТЬ:
# Local Extension Settings (БАЗА КАРТОЧЕК!), Local Storage, Preferences.
foreach ($p in @("$ProfileDir\Default\Cache","$ProfileDir\Default\Code Cache",
    "$ProfileDir\Default\GPUCache","$ProfileDir\Default\ShaderCache",
    "$ProfileDir\Default\Service Worker\CacheStorage")) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Вычищено: $p" -ForegroundColor DarkGray
    }
}

$edgeArgs = @(
    "--user-data-dir=$ProfileDir", '--no-first-run',
    '--no-default-browser-check', '--disable-component-update',
    '--start-maximized', '--disk-cache-size=1', '--media-cache-size=1',
    '--aggressive-cache-discard', '--disable-features=BackForwardCache',
    '--disable-session-crashed-bubble', "--remote-debugging-port=$Port",
    "--disable-extensions-except=$DistDir", "--load-extension=$DistDir"
)

Write-Host "Сущность: $Profile · порт: $Port" -ForegroundColor Cyan
Start-Process -FilePath $EdgePath -ArgumentList $edgeArgs
Write-Host "Edge чист: наше расширение из dist, CDP localhost:$Port" -ForegroundColor Green
Write-Host 'ВАЖНО: после Reload расширения — F5 на вкладках ok.ru.' -ForegroundColor Yellow