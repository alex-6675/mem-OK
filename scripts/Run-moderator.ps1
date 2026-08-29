# Run-moderator.ps1 — обёртка: чистый Edge c CDP, сущность moderator, порт 9224.
# Делегирует RunEdgeCdp.ps1 (профиль ВСЕГДА вне репо, чистота по доказанному v03).
& "$PSScriptRoot\RunEdgeCdp.ps1" -Profile moderator
