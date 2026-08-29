#Requires -Version 7.0

<#
.SYNOPSIS
    Сборка расширения «mem-OK» для Edge (распакованное расширение).
.DESCRIPTION
    Копирует исходные файлы расширения из EdgeExtension/ в dist/.
    dist/ — это и есть загружаемый артефакт: в edge://extensions → «Загрузить
    распакованное расширение» указывается папка dist/. ZIP-архив не создаётся.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root    = Split-Path -Parent $PSScriptRoot
$SrcDir  = Join-Path $Root 'EdgeExtension'
$DistDir = Join-Path $Root 'dist'

Write-Host "=== Сборка расширения «mem-OK» ===" -ForegroundColor Cyan

# 1. Контроль исходника
if (-not (Test-Path (Join-Path $SrcDir 'manifest.json'))) {
    Write-Error "manifest.json не найден в $SrcDir"
    exit 1
}

# 2. Очистка dist
if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir
    Write-Host "[OK] dist/ очищена" -ForegroundColor Green
}

# 3. Создание dist
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

# 4. Копирование содержимого EdgeExtension → dist (без вложенной папки EdgeExtension)
Copy-Item "$SrcDir\*" $DistDir -Recurse
Write-Host "[OK] содержимое EdgeExtension/ скопировано в dist/" -ForegroundColor Green

# 5. Удаление ненужных файлов (если есть)
$Exclude = @('*.map', '*.log')
Get-ChildItem $DistDir -Recurse -Include $Exclude | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "=== Сборка завершена ===" -ForegroundColor Cyan
Write-Host "Результат: $DistDir (загрузить в Edge как распакованное расширение)" -ForegroundColor Yellow