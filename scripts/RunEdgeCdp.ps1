# RunEdgeCdp.ps1 — запуск Edge c --remote-debugging-port для тестов ok.ru (TASK-0154).
# Ок-профили: .edge_test_s_admin | admin | moderator | editor | user_01, порты 9222-9226.
# Происхождение: m3 (TASK-0100) <- context-vkru (TASK-0002). Provenance — в отчёте.
#
# Запуск:
#   pwsh scripts/RunEdgeCdp.ps1                    # по умолчанию: user_01, порт 9226
#   pwsh scripts/RunEdgeCdp.ps1 -Profile s_admin   # порт 9222
#
param(
    [ValidateSet("s_admin","admin","moderator","editor","user_01")]
    [string]$Profile = "user_01"
)

$ports = @{
    "s_admin"   = 9222
    "admin"     = 9223
    "moderator" = 9224
    "editor"    = 9225
    "user_01"   = 9226
}
$port = $ports[$Profile]
$profDir = Join-Path $PSScriptRoot ".edge_test_$Profile"

$edge = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edge) { Write-Error "Edge не найден"; exit 1 }

if (-not (Test-Path $profDir)) { New-Item -ItemType Directory -Force -Path $profDir | Out-Null }

Write-Host "Edge + CDP: профиль .$Profile -> порт $port" -ForegroundColor Cyan
Start-Process $edge -ArgumentList @(
    "--remote-debugging-port=$port",
    "--user-data-dir=$profDir",
    "https://ok.ru"
)
Write-Host "CDP: http://127.0.0.1:$port  (профиль: $profDir)" -ForegroundColor Green