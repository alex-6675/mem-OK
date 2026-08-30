# Import-OkExport.ps1 — экспорт картотеки из расширения → data/incoming/ (файл-первый).
# Переименовывает по конвенции, дописывает строку в logs/activity/moves.log,
# считает SHA256 (provenance) и подсказывает коммит.
#Requires -Version 7.0
param(
    [Parameter(Mandatory=$true)][string]$Path
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$src = Resolve-Path -LiteralPath $Path
if (-not (Test-Path -LiteralPath $src)) { Write-Error "Не найден файл: $Path"; exit 1 }

$date = Get-Date -Format 'yyyy-MM-dd'
$destDir  = Join-Path $repoRoot 'data\incoming'
$destName = "$date__ok-kartoteka-export.json"
$dest     = Join-Path $destDir $destName
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

# Не перезаписываем экспорт того же дня — добавляем индекс.
$i = 1
while (Test-Path -LiteralPath $dest) {
    $destName = "$date__ok-kartoteka-export_$i.json"
    $dest     = Join-Path $destDir $destName
    $i++
}
Copy-Item -LiteralPath $src -Destination $dest -Force

# Provenance: SHA256 приземлённого файла.
$hash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash

# Дописываем в журнал (append-only).
$logDir = Join-Path $repoRoot 'logs\activity'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log  = Join-Path $logDir 'moves.log'
$line = "[$date] card | ok | экспорт картотеки из расширения: $destName (sha256 $hash) | файл-первый"
Add-Content -LiteralPath $log -Value $line -Encoding utf8

Write-Host "Приземлено: data/incoming/$destName" -ForegroundColor Green
Write-Host "sha256: $hash" -ForegroundColor DarkGray
Write-Host "Журнал:  logs/activity/moves.log (+1 строка)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Коммит:" -ForegroundColor Cyan
Write-Host "  chore: картотека из расширения -> data/incoming (файл-первый)" -ForegroundColor Yellow
