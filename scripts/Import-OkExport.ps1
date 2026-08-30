<#
.SYNOPSIS
    Импорт экспорта картотеки из расширения ОК в data/incoming/ (файл-первый, TASK-0166).
    Файл берётся: кнопка «Экспорт» в картотеке ИЛИ Console SW → Save as;
    Path = путь к этому файлу.

.DESCRIPTION
    Скрипт переименовывает экспорт по конвенции (YYYY-MM-DD__ok-kartoteka-export.json),
    копирует его в data/incoming/ (файл-первый, результаты пишем СЕБЕ по регламенту),
    дописывает строку в logs/activity/moves.log (append-only),
    считает SHA256 (provenance) и подсказывает коммит.

.EXAMPLE
    pwsh scripts/Import-OkExport.ps1 -Path "C:\Users\An\Downloads\ok-export-20260821-1430.json"
#>
#Requires -Version 7.0
param(
    [Parameter(Mandatory = $true)][string]$Path
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# 1) Дата — ДО первого чтения (добавка начальника к TASK-0166).
$date__ok = Get-Date -Format "yyyy-MM-dd"

$repoRoot = Split-Path -Parent $PSScriptRoot

# 2) Валидация Path: обязан быть ФАЙЛОМ .json, не папка и не профиль.
if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    Write-Error "Path — путь к json-файлу экспорта, не папка и не профиль: $Path"
    exit 1
}
if ([System.IO.Path]::GetExtension($Path) -ne '.json') {
    Write-Error "Path — путь к json-файлу экспорта, не папка и не профиль: $Path (нужно расширение .json)"
    exit 1
}

$src = Resolve-Path -LiteralPath $Path

$destDir  = Join-Path $repoRoot 'data\incoming'
$destName = "${date__ok}__ok-kartoteka-export.json"
$dest     = Join-Path $destDir $destName
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

# Не перезаписываем экспорт того же дня — добавляем индекс.
$i = 1
while (Test-Path -LiteralPath $dest) {
    $destName = "${date__ok}__ok-kartoteka-export_$i.json"
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
$line = "[$date__ok] card | ok | экспорт картотеки из расширения: $destName (sha256 $hash) | файл-первый"
Add-Content -LiteralPath $log -Value $line -Encoding utf8

# 4) Отчёт: сделано/осталось.
Write-Host ""
Write-Host "=== Импорт экспорта картотеки ОК ===" -ForegroundColor Cyan
Write-Host "СДЕЛАНО:" -ForegroundColor Green
Write-Host "  источник   : $src" -ForegroundColor DarkGray
Write-Host "  приземлено : data/incoming/$destName" -ForegroundColor DarkGray
Write-Host "  sha256     : $hash" -ForegroundColor DarkGray
Write-Host "  журнал     : logs/activity/moves.log (+1 строка)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "ОСТАЛОСЬ:" -ForegroundColor Yellow
Write-Host "  - слить пять карточек с картотекой ЕУ (merge-cabinets из mem-ok-s-admin ИЛИ починенный импорт)" -ForegroundColor DarkGray
Write-Host "  - движение в дашборд: «экспорт-импорт замкнут, 5 карточек в ЕУ»" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Коммит:" -ForegroundColor Cyan
Write-Host "  chore: картотека из расширения -> data/incoming (файл-первый)" -ForegroundColor Yellow
