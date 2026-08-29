# RunEdgeCdp.ps1 — запуск Microsoft Edge с DevTools Protocol (CDP) для автоматизированных проверок.
# TASK-0002 · TASK-0100 (m3)
#
# Запуск:
#   pwsh scripts/RunEdgeCdp.ps1                     # vk.ru на порту 9222
#   pwsh scripts/RunEdgeCdp.ps1 -Port 9333          # другой порт
#   pwsh scripts/RunEdgeCdp.ps1 -Url https://ok.ru  # другой URL
#
# Изолированный профиль (.edge-cdp-profile) не затрагивает основной профиль пользователя.
# После старта CDP доступен на http://localhost:<Port> (проверка: /json/version).

[CmdletBinding()]
param(
    [int]$Port = 9222,
    [string]$Url = "https://vk.ru/",
    [string]$ProfileDir = (Join-Path $PSScriptRoot ".." ".edge-cdp-profile")
)

$ErrorActionPreference = "Stop"

# --- поиск исполняемого файла Edge ---
$candidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
)
$edge = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
    Write-Error "msedge.exe не найден. Проверьте установку Microsoft Edge."
    exit 1
}

# --- изолированный профиль ---
$ProfileDir = (Resolve-Path -LiteralPath (New-Item -ItemType Directory -Force -Path $ProfileDir)).Path

Write-Host "Edge:   $edge"
Write-Host "CDP:    http://localhost:$Port"
Write-Host "Профиль: $ProfileDir"
Write-Host "URL:    $Url"
Write-Host ""

$args = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--no-default-browser-check",
    $Url
)

Start-Process -FilePath $edge -ArgumentList $args

Write-Host ""
Write-Host "Edge запущен с CDP на порту $Port."
Write-Host "Проверка: Invoke-RestMethod http://localhost:$Port/json/version"
