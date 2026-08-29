# carry-donors.ps1 — перенос папок доноров в локали:
# Кодер не в локали — папки несёт скрипт, тексты несёт Кодер.
param(
  [string]$Root = "C:\Projects\git-isolated-fixed\git-projects",
  [string]$Donor = "context-vkru"
)
$src = Join-Path $Root $Donor
$dst = Join-Path $Root "mem-OK"
$prov = @("# provenance-carry · " + (Get-Date -Format "yyyy-MM-dd"))

function Carry([string]$from, [string]$to) {
  $t = Join-Path $dst $to
  if (Test-Path $t) { Write-Host "SKIP (есть): $to"; return }
  New-Item -ItemType Directory -Force -Path (Split-Path $t) | Out-Null
  Copy-Item -Recurse -Force $from $t
  Get-ChildItem -Recurse -File $t | ForEach-Object {
    $prov += ($_.FullName.Substring($dst.Length + 1) + "  " +
      (Get-FileHash $_.FullName -Algorithm SHA256).Hash)
  }
  Write-Host "CARRY: $to"
}

# 1) дашборд-донор (React-шаблон) -> dashboard/donor/
Carry (Join-Path $src "dashboard") "dashboard\donor"
# 2) расширение -> EdgeExtension/
Carry (Join-Path $src "EdgeExtension") "EdgeExtension"
# 3) RunEdgeCdp.ps1 -> scripts/RunEdgeCdp.ps1
$rd = Get-ChildItem -Recurse -File -Filter "RunEdgeCdp.ps1" -Path $src |
      Select-Object -First 1
if ($rd) { Carry $rd.FullName "scripts\RunEdgeCdp.ps1" }
else     { Write-Host "NOT FOUND: RunEdgeCdp.ps1 у донора" }

$prov | Out-File -Encoding UTF8 (Join-Path $dst "reports\provenance-carry.md")
Write-Host "DONE -> reports/provenance-carry.md"