# Run-editor.ps1 — обёртка: чистый Edge c CDP, сущность editor, порт 9225.
# Делегирует RunEdgeCdp.ps1 (профиль ВСЕГДА вне репо, чистота по доказанному v03).
& "$PSScriptRoot\RunEdgeCdp.ps1" -Profile editor
