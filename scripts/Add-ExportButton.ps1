<#
.SYNOPSIS
    TASK-0166: кнопка «Экспорт» в картотеке (chrome.downloads.download) + "downloads" в manifest.

.DESCRIPTION
    Безопасный патч: НЕ перезаписывает файлы, а добавляет недостающее (идемпотентно,
    по маркеру TASK-0166). Запускать из корня mem-OK:
        pwsh scripts/Add-ExportButton.ps1
#>
#Requires -Version 7.0
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$ext      = Join-Path $repoRoot 'EdgeExtension'
$html     = Join-Path $ext 'ui\kartoteka.html'
$js       = Join-Path $ext 'ui\kartoteka.js'
$manifest = Join-Path $ext 'manifest.json'
$marker   = 'TASK-0166'

foreach ($f in @($html, $js, $manifest)) {
    if (-not (Test-Path -LiteralPath $f)) { Write-Error "Не найден: $f"; exit 1 }
}

# --- 1) kartoteka.html: кнопка «Экспорт» перед </body> ---
$htmlText = Get-Content -LiteralPath $html -Raw -Encoding utf8
if ($htmlText -notmatch [regex]::Escape($marker)) {
    $btn = @"

<!-- $marker: кнопка экспорта картотеки -->
<button id="btnExport" type="button" style="margin:8px 0;padding:8px 14px;cursor:pointer;">Экспорт</button>
"@
    $htmlText = $htmlText -replace '</body>', ($btn + "`n</body>")
    Set-Content -LiteralPath $html -Value $htmlText -Encoding utf8
    Write-Host "kartoteka.html: кнопка «Экспорт» добавлена" -ForegroundColor Green
} else {
    Write-Host "kartoteka.html: кнопка уже есть (пропуск)" -ForegroundColor DarkGray
}

# --- 2) kartoteka.js: обработчик экспорта в конец файла ---
$jsText = Get-Content -LiteralPath $js -Raw -Encoding utf8
if ($jsText -notmatch [regex]::Escape($marker)) {
    $handler = @"

/* $marker: экспорт картотеки через chrome.downloads.download */
(function () {
  "use strict";
  function bindExport() {
    var btn = document.getElementById("btnExport");
    if (!btn) return;
    btn.addEventListener("click", function () {
      CTX_STORAGE.loadDb().then(function (db) {
        var json = JSON.stringify(db, null, 2);
        var url = "data:application/json;charset=utf-8," + encodeURIComponent(json);
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, "0"); };
        var name = "ok-export-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate())
          + "-" + p(d.getHours()) + p(d.getMinutes()) + ".json";
        chrome.downloads.download({ url: url, filename: name, saveAs: false }, function () {
          console.log("[CTX " + CTX_BUILD + "] экспорт картотеки: " + name);
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindExport);
  } else {
    bindExport();
  }
})();
"@
    $jsText = $jsText + "`n" + $handler + "`n"
    Set-Content -LiteralPath $js -Value $jsText -Encoding utf8
    Write-Host "kartoteka.js: обработчик экспорта добавлен" -ForegroundColor Green
} else {
    Write-Host "kartoteka.js: обработчик уже есть (пропуск)" -ForegroundColor DarkGray
}

# --- 3) manifest.json: "downloads" в permissions ---
$mf = Get-Content -LiteralPath $manifest -Raw -Encoding utf8 | ConvertFrom-Json
if ($mf.permissions -notcontains 'downloads') {
    $mf.permissions = @($mf.permissions) + 'downloads'
    $mf | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifest -Encoding utf8
    Write-Host "manifest.json: добавлено `"downloads`"" -ForegroundColor Green
} else {
    Write-Host "manifest.json: `"downloads`" уже есть (пропуск)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Готово (TASK-0166). После Reload расширения — кнопка «Экспорт» в картотеке." -ForegroundColor Cyan
