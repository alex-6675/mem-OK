# ============================================================================
#  assemble-mem-ok.ps1 · TASK-0148 · коммит:
#    chore: mem-OK — карказ из доноров (provenance) [TASK-0148]
#
#  Собирает каркас mem-OK из доноров, присутствующих в локали.
#  ПРИНЦИП: существующее НЕ перезаписывается — создаётся только отсутствующее.
#  Копии из доноров идут с SHA256-provenance в отчёте.
#
#  Доноры (в $DonorsRoot): context-vkru (архив) · m3 · mem-ok-s-admin · mem-2026
#
#  Запуск:
#    pwsh scripts/assemble-mem-ok.ps1
#    pwsh scripts/assemble-mem-ok.ps1 -DonorsRoot C:\... -TargetRoot C:\...\mem-OK
# ============================================================================
[CmdletBinding()]
param(
    [string]$DonorsRoot = "C:\Projects\git-isolated-fixed\git-projects",
    [string]$TargetRoot = (Join-Path "C:\Projects\git-isolated-fixed\git-projects" "mem-OK")
)
$ErrorActionPreference = "Stop"

$donors = [ordered]@{
    "context-vkru"   = Join-Path $DonorsRoot "context-vkru"
    "m3"             = Join-Path $DonorsRoot "m3"
    "mem-ok-s-admin" = Join-Path $DonorsRoot "mem-ok-s-admin"
    "mem-2026"       = Join-Path $DonorsRoot "mem-2026"
}

$created = [System.Collections.Generic.List[string]]::new()
$skipped = [System.Collections.Generic.List[string]]::new()
$copied  = [System.Collections.Generic.List[object]]::new()
$checks  = [System.Collections.Generic.List[string]]::new()

function New-Dir([string]$p) {
    if (-not (Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

# Создать файл ТОЛЬКО если его нет (не перезаписывать).
function Write-IfAbsent([string]$rel, [string]$content) {
    $dst = Join-Path $TargetRoot $rel
    if (Test-Path -LiteralPath $dst) { $script:skipped.Add("$rel (уже существует — не тронуто)"); return }
    New-Dir (Split-Path $dst)
    Set-Content -LiteralPath $dst -Value $content -Encoding utf8 -NoNewline
    $script:created.Add($rel)
}

# Скопировать из донора с SHA256-provenance. Донор/файл может отсутствовать.
function Copy-From([string]$donorKey, [string]$srcRel, [string]$dstRel) {
    $donor = $script:donors[$donorKey]
    if (-not (Test-Path -LiteralPath $donor)) { $script:checks.Add("[копия] донор '$donorKey' отсутствует в локали — '$srcRel' пропущен"); return }
    $src = Join-Path $donor $srcRel
    if (-not (Test-Path -LiteralPath $src)) { $script:checks.Add("[копия] у донора '$donorKey' нет '$srcRel' — пропущен"); return }
    $dst = Join-Path $TargetRoot $dstRel
    if (Test-Path -LiteralPath $dst) { $script:skipped.Add("$dstRel (уже существует — не тронуто)"); return }
    New-Dir (Split-Path $dst)
    Copy-Item -LiteralPath $src -Destination $dst -Force
    $script:copied.Add([pscustomobject]@{ File = $dstRel; From = "$donorKey/$srcRel"; SHA256 = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash })
}

Write-Host ""
Write-Host "=== assemble-mem-ok · TASK-0148 ===" -ForegroundColor Cyan
Write-Host "Доноры  : $DonorsRoot"
Write-Host "Цель    : $TargetRoot"
New-Dir $TargetRoot

# ============================================================================
#  1) docs/ — 8 документов (полные тексты, координатная строка v3 в каждом)
# ============================================================================

$ROLES_OK = @'
> **Координата v3:** docs/ROLES_OK.md · v1 · мем-OK · TASK-0148

# ROLES_OK — роли в экосистеме ОК (v1)

Каждая роль работает через **ОТДЕЛЬНОЕ приложение/ключ ОК** и имеет свой контур
прав (матрица — `src/permissions.ts` донора mem-ok-s-admin). Роли — это управляемые
сущности владельца, НЕ посторонние люди.

| Роль       | Публикация | Чтение картотеки | Запись картотеки | Журналы | Контур API |
|------------|:----------:|:----------------:|:----------------:|:-------:|:----------:|
| `s-admin`  | ✅ | ✅ | ✅ | ✅ | свой |
| `admin`    | ✅ | ✅ | ✅ | ✅ | свой |
| `moderator`| ❌ | ✅ | ❌ | ❌ | свой |
| `editor`   | ❌ | ✅ | ❌ | ❌ | свой |

## Правила
1. Изоляция состояний — по уровням доступа: контуры не пересекаются.
2. Секреты роли — только в `.env` (в коммит не попадают, см. `.gitignore`: `*.env`).
3. Волонтёрский приём ведётся через `editor`-контур (секция приёма, RC_REGISTRY).

> Заполнить при подключении: фактические application_key каждой роли.
'@

$CONTACT_PROTOCOL = @'
> **Координата v3:** docs/CONTACT_PROTOCOL.md · v4 · мем-OK · TASK-0148

# CONTACT_PROTOCOL — протокол контакта с волонтёрами (v4)

Контакт — только через модераторов, НЕ в личку от страницы (защита от блокировок).
Источник контактов — `tasks/` (volunteer-page). Журнал — `logs/activity/`.

## Запись v4 (append-only, одна строка на событие)

| Поле            | Что это                                                        |
|-----------------|----------------------------------------------------------------|
| `hub`           | хаб/группа, где найден волонтёр (OK-группа рода и т.п.)        |
| `person`        | имя/ник волонтёра                                              |
| `action`        | действие: `lead` / `contacted` / `promised` / `done` / `lost`  |
| `card_ref`      | ключ карточки (portal+id), к которой относится контакт         |
| `promise`       | что обещал волонтёр (коротко)                                  |
| `cooldown`      | Unix-сек, до которого повторное обращение НЕ допускается       |
| `lead`          | откуда пришёл (хэштег, группа, «земляки»)                      |
| `first_comment` | «виза» — текст первого комментария-брони под карточкой         |

## Правила
1. Повторное обращение до `cooldown` — запрещено (охлаждение).
2. Адрес из похоронки — НЕ публикуется и НЕ передаётся волонтёру (только `#бронь`).
3. Каждая запись — append-only; исправления только новой строкой.
'@

$SEARCH_BOT = @'
> **Координата v3:** docs/SEARCH_BOT.md · v3 · мем-OK · TASK-0148

# SEARCH_BOT — поисковый бот (v3)

## Источники (в порядке приоритета)
1. **OK-группы рода** — хэштеги и обсуждения в группах однофамильцев/земляков.
2. **polkrf** («Полк РФ») — сводные записи, уточнения захоронений.
3. **Генеалогия** — генеалогические форумы/базы (связка «боец → живой родственник»).
4. **Военкоматы** — ответы на письма (скан донесения + УПК, см. TEMPLATES).

## Очередь и батчи
- Стартовая очередь: **600+** записей; целевая — **2000+**.
- Обработка — **батчами** (не по одной): размер батча — настраиваемый.
- Каждый батч логируется в `logs/activity/` (источник, диапазон, результат).

## Метод «поиск через земляков»
Вопрос волонтёру НЕ «где родился», а: «На каком мемориале вы отметили этого
земляка? Проверьте на странице — это он?» (см. VERIFICATION донора).

> Заполнить при запуске: размер батча, темп-лимиты по каждому источнику.
'@

$PHOTO_PROTOCOL = @'
> **Координата v3:** docs/PHOTO_PROTOCOL.md · v1 · мем-OK · TASK-0148

# PHOTO_PROTOCOL — фото (v1)

## Единственное правило: фото — ТОЛЬКО вручную.
Автоматическая выгрузка/подстановка фото **запрещена** (риск чужого лица на камне).

1. Карточка «просит» фото из ЦАМО: флаг `meta.hasPhoto` (карточка офицера, скан
   книги выбытия) — это сигнал, что фото СУЩЕСТВУЕТ в первоисточнике.
2. Фото добавляет человек, сверив его с записью ЦАМО (ФИО, год, часть).
3. Загрузка в ОК — двухэтапная (URL загрузки → PUT → привязать ID к посту);
   публичную ссылку сразу в `media.topic.post` НЕ отдавать (см. PUBLISH донора).
4. Несовпадение фото и записи = отклонить, тег `#сверка` в аннотацию.
'@

$TEMPLATES = @'
> **Координата v3:** docs/TEMPLATES.md · v2 · мем-OK · TASK-0148

# TEMPLATES — шаблоны обращений (v2)

Шаблоны писем/сообщений. Основание в каждом — номер донесения + ID obd-memorial +
ссылка на захоронение ВМЦ. Вложения: скан донесения о гибели + скан УПК.

| Код          | Куда                     | Цель                                        | Пункты |
|--------------|--------------------------|---------------------------------------------|:------:|
| `T-ЛОКАЦИЯ`  | администрация поселения  | подтверждение/уточнение захоронения          | 10–11  |
| `T-ДОМ`      | военкомат                | Увековечивание, алфавитные книги перезахор.  | 12     |
| `T-СЕМЬЯ`    | родственник (через модератора) | связка «боец → семья», передача копии   | 11–12  |
| `T-УЧР`      | учреждение (школа/библиотека) | мемориальная доска, «земляки»           | 13     |

> Пункты 10–13 — нумерация абзацев сводного регламента писем.
> Заполнить: полные тексты шаблонов (перенести из рабочей переписки).
'@

$SCHEMA_MAP = @'
> **Координата v3:** docs/SCHEMA_MAP.md · v1 · мем-OK · TASK-0148

# SCHEMA_MAP — донесение → карточка (v1)

Маппинг колонок сырого CSV (ЦАМО, `data/raw/…/`) на поля карточки.
Карточка = неизменяемая копия донесения; служебное — в `meta` (см. types донора).

| Колонка CSV             | Поле карточки                        | Слой        |
|-------------------------|--------------------------------------|-------------|
| фамилия/имя/отчество    | `identities.{surname,name,patronymic}`| ЦАМО (RO)   |
| `document_id` / `url`   | ключ `cards[portal+id]`, `external_id`| ключ        |
| `place_birth`           | `meta.volunteerKeys.placeBirth`      | служебный   |
| `conscription_location` | `meta.volunteerKeys.conscriptionLocation` | служебный |
| `primary_burial`        | `meta.volunteerKeys.primaryBurial`   | служебный   |
| `current_burial`        | `meta.volunteerKeys.currentBurial`   | служебный   |
| `notes`                 | технический сигнал парсера (НЕ публикуется) | парсер |
| obd-memorial URL        | `meta.primaryUrl`                    | служебный   |
| «Дата» (сканирование)   | ОТСЕКАЕТСЯ (не публикуется)          | —           |

Повторы по ключу при загрузке ИСКЛЮЧАЮТСЯ (лог — `reports/ingest-log.md` донора).
'@

$TRACK_D = @'
> **Координата v3:** docs/TRACK_D.md · v1 · мем-OK · TASK-0148

# TRACK_D — трек D: синяя галка → Госуслуги → смета (v1)

Дорожная карта легализации/официального контура.

## Вехи
1. **Синяя галка** — верификация страницы/сообщества в ОК (доверие площадки).
2. **Госуслуги** — официальное обращение/заявка на увековечивание через гос. канал.
3. **Смета** — расчёт стоимости мемориальных работ (плита, гравировка, установка).

## Вилка имени: дочь / владелец
Субъект официального обращения — **вилка**: дочь павшего (родственник) ИЛИ владелец
страницы (опекун контура). Юридически приоритет у родственника; владелец действует
как технический исполнитель. Фиксируется в карточке аннотацией `#субъект`.

> Заполнить: фактический статус каждой вехи по мере движения.
'@

$RC_REGISTRY = @'
> **Координата v3:** docs/RC_REGISTRY.md · v1 · мем-OK · TASK-0148

# RC_REGISTRY — семья RC (v1)

Реестр инструментов/контуров семьи RC. RC-OK — создаваемый инструмент (этот репо);
у него отдельная **секция приёма волонтёров** (`tasks/`).

| Код        | Что это                                    | Статус            |
|------------|--------------------------------------------|-------------------|
| `RC-2020`  | исходный контур 2020                       | архив             |
| `RC-Astro` | `mem-2026` (астро/генеалогическое ядро)    | донор             |
| `RC-VK2`   | контур VK (второй)                         | —                 |
| `RC-OK2`   | контур OK (второй)                         | —                 |
| `RC-Дзен`  | контур Дзен                                | —                 |
| `RC-SC`    | контур SC                                  | —                 |
| `RC-OK`    | **создаваемый инструмент (мем-OK)**        | сборка TASK-0148  |

## Секция приёма волонтёров (RC-OK)
- Вход: `tasks/` (volunteer-page) → журнал `logs/activity/` (запись v4, CONTACT_PROTOCOL).
- Приём ведёт `editor`-контур (ROLES_OK).
'@

Write-IfAbsent "docs/ROLES_OK.md"           $ROLES_OK
Write-IfAbsent "docs/CONTACT_PROTOCOL.md"   $CONTACT_PROTOCOL
Write-IfAbsent "docs/SEARCH_BOT.md"         $SEARCH_BOT
Write-IfAbsent "docs/PHOTO_PROTOCOL.md"     $PHOTO_PROTOCOL
Write-IfAbsent "docs/TEMPLATES.md"          $TEMPLATES
Write-IfAbsent "docs/SCHEMA_MAP.md"         $SCHEMA_MAP
Write-IfAbsent "docs/TRACK_D.md"            $TRACK_D
Write-IfAbsent "docs/RC_REGISTRY.md"        $RC_REGISTRY

# ============================================================================
#  2) dashboard/index.html — продолжение с точки эпикфейла VK (одинокий строитель)
# ============================================================================

$DASHBOARD = @'
<!DOCTYPE html>
<!-- ======================================================================
  мем-OK · эксплуатационный журнал ОДИНОКОГО СТРОИТЕЛЯ · TASK-0148
  Продолжение строительства с точки эпикфейла VK.
  Светлая тема по умолчанию + переключатель. Статика, ноль зависимостей.
  Владельцу: секции ДВИЖЕНИЯ/РЕШЕНИЯ/ОТЛАДКА наполняются из logs/activity/.
  Эксплуатационный дашборд — ЗАГЛУШКА: прикручивается после строительства
  и прогона одиноким заказчиком.
====================================================================== -->
<html lang="ru" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>мем-OK · журнал одинокого строителя</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
:root{--bg:#f2f4f1;--s:#ffffff;--s2:#f7f9f6;--ink:#1b2320;--mut:#63716b;--line:#dbe3dd;--own:#0e6b52;--own-soft:#e2efe9;--acc:#9a5b00;--mono:#4a5852;--ok:#1c8a5f;--err:#b3372c;--sh:0 1px 2px rgba(27,35,32,.05),0 14px 34px -18px rgba(27,35,32,.16)}
[data-theme=dark]{--bg:#101513;--s:#171e1b;--s2:#1d2622;--ink:#e6ede9;--mut:#8ba098;--line:#2a352f;--own:#3cc79b;--own-soft:#123429;--acc:#e2a13d;--mono:#9db2aa;--ok:#3cc79b;--err:#e06a5e;--sh:0 1px 2px rgba(0,0,0,.4),0 18px 44px -18px rgba(0,0,0,.55)}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Golos Text",system-ui,sans-serif;font-size:15px;line-height:1.55;transition:background .35s,color .35s}
code,.mono{font-family:"JetBrains Mono",monospace}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
header{padding:42px 0 0;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.kicker{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--own);font-weight:700;margin:0 0 10px}
h1{font-family:Unbounded,sans-serif;font-weight:900;font-size:clamp(1.9rem,4.6vw,3rem);line-height:1.05;margin:0}
h1 .t{font-weight:500;color:var(--mut)}
.lede{margin:14px 0 0;max-width:58ch;color:var(--mut)}
.tbtn{display:inline-flex;align-items:center;gap:8px;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:600;color:var(--ink);background:var(--s);border:1px solid var(--line);border-radius:999px;padding:9px 16px;cursor:pointer;box-shadow:var(--sh)}
[data-theme=light] .ic-sun{display:none}[data-theme=dark] .ic-moon{display:none}
.timeline{margin:36px 0 8px;border-left:3px solid var(--line);padding-left:26px;display:flex;flex-direction:column;gap:22px}
.ep{position:relative}
.ep::before{content:"";position:absolute;left:-33px;top:4px;width:13px;height:13px;border-radius:50%;background:var(--s);border:3px solid var(--own)}
.ep.fail::before{border-color:var(--err)}
.ep.now::before{background:var(--own);box-shadow:0 0 0 5px var(--own-soft);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 3px var(--own-soft)}70%{box-shadow:0 0 0 9px transparent}100%{box-shadow:0 0 0 3px transparent}}
.ep h3{font-family:Unbounded,sans-serif;font-weight:700;font-size:.98rem;margin:0}
.ep .d{color:var(--mut);font-size:13.5px;margin:4px 0 0}
.badge{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--mut);margin-left:8px;vertical-align:2px}
.badge.fail{color:var(--err);border-color:var(--err)}.badge.ok{color:var(--ok);border-color:var(--ok)}.badge.now{color:var(--own);border-color:var(--own);background:var(--own-soft)}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:34px 0}
@media(max-width:920px){.cols{grid-template-columns:1fr}}
.sec{background:var(--s);border:1px solid var(--line);border-radius:12px;box-shadow:var(--sh);overflow:hidden}
.sec-h{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);background:var(--s2)}
.sec-h .i{font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:700;color:var(--own)}
.sec-h h4{font-family:Unbounded,sans-serif;font-size:.85rem;font-weight:700;margin:0}
.sec-b{padding:18px 16px;color:var(--mut);font-size:13px}
.stub{border:1.5px dashed var(--line);border-radius:10px;padding:22px 18px;text-align:center;margin:30px 0 40px}
.stub .t{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);border:1px solid var(--acc);border-radius:999px;padding:3px 12px;display:inline-block;margin-bottom:10px}
footer{border-top:1px solid var(--line);margin-top:10px;padding:18px 0 40px;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--mut);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
.rv{opacity:0;transform:translateY(16px);transition:opacity .6s,transform .6s cubic-bezier(.22,.61,.36,1)}
.rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.rv{opacity:1;transform:none}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <p class="kicker">мем-OK · TASK-0148 · одинокий строитель</p>
      <h1>Журнал<br /><span class="t">строительства</span></h1>
      <p class="lede">Продолжение с точки эпикфейла VK. Тощий контур: публикация + картотека + <code>logs/outgoing</code> + принятие комментариев под карточками.</p>
    </div>
    <button class="tbtn" id="tt" type="button">
      <svg class="ic-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
      <svg class="ic-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <span id="tl">тёмная</span>
    </button>
  </header>

  <!-- Вехи строительства -->
  <div class="timeline">
    <div class="ep fail rv"><h3>context-vkru <span class="badge fail">эпикфейл верстки</span></h3><p class="d">Ядро ушло в архив — верстка не сложилась. Донор структур и регламентов.</p></div>
    <div class="ep rv"><h3>m3 <span class="badge ok">каркас</span></h3><p class="d">Каркас переноса: provenance-копии, затычки, dashboard «прошлое–настоящее–будущее».</p></div>
    <div class="ep rv"><h3>mem-2026 <span class="badge">RC-Astro</span></h3><p class="d">Астро/генеалогическое ядро семьи RC. Донор REGULATIONS и координат.</p></div>
    <div class="ep rv"><h3>mem-ok-s-admin <span class="badge ok">тощий</span></h3><p class="d">Публикация + картотека ЦАМО + <code>logs/outgoing</code> + принятие комментариев под карточками.</p></div>
    <div class="ep now rv"><h3>mem-OK <span class="badge now">сборка · TASK-0148</span></h3><p class="d">Каркас из доноров: роли, протоколы, поисковый бот, шаблоны, RC-реестр.</p></div>
    <div class="ep rv"><h3>далее <span class="badge">план</span></h3><p class="d">Тест маркировки → приём волонтёров (секция RC-OK).</p></div>
  </div>

  <!-- Секции одинокого строителя -->
  <div class="cols">
    <div class="sec rv"><div class="sec-h"><span class="i">01</span><h4>Движения</h4></div><div class="sec-b">Записи v4 из <code>logs/activity/</code>. Появятся после первого прогона.</div></div>
    <div class="sec rv"><div class="sec-h"><span class="i">02</span><h4>Решения</h4></div><div class="sec-b">Решения владельца: трек D, вилка имени, фото-ручное. Пока пусты.</div></div>
    <div class="sec rv"><div class="sec-h"><span class="i">03</span><h4>Отладка</h4></div><div class="sec-b">События парсера/ингеста/публикации. Пока пусты.</div></div>
  </div>

  <!-- Заглушка эксплуатационного дашборда -->
  <div class="stub rv">
    <span class="t">эксплуатационный дашборд</span>
    <p style="margin:0;color:var(--mut);font-size:13.5px">прикручивается после строительства и прогона одиноким заказчиком</p>
  </div>

  <footer>
    <span>repo: <span style="color:var(--own)">mem-OK</span> · доноры: context-vkru · m3 · mem-2026 · mem-ok-s-admin</span>
    <span>chore: mem-OK — карказ из доноров [TASK-0148]</span>
  </footer>
</div>
<script>
function applyTheme(n){document.documentElement.setAttribute("data-theme",n);document.getElementById("tl").textContent=n==="light"?"тёмная":"светлая";try{localStorage.setItem("memok-theme",n)}catch(e){}}
(function(){var s=null;try{s=localStorage.getItem("memok-theme")}catch(e){}applyTheme(s==="dark"?"dark":"light")})(); /* по умолчанию светлая */
document.getElementById("tt").addEventListener("click",function(){applyTheme(document.documentElement.getAttribute("data-theme")==="light"?"dark":"light")});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}})},{threshold:.12});
document.querySelectorAll(".rv").forEach(function(el){io.observe(el)});
</script>
</body>
</html>
'@

Write-IfAbsent "dashboard/index.html" $DASHBOARD

# ============================================================================
#  3) logs/activity/ — эксплуатационные записи (append-only, provenance, затычки)
# ============================================================================

$LOGS_README = @'
# logs/activity/ — эксплуатационные записи (append-only)

Два потока (запись v4, см. docs/CONTACT_PROTOCOL.md + комент-события):
- `moves.log`     — движения (карточка/публикация/merge/geo/system), запись v4.
- `comments.log`  — комент-события под карточками (принятие, виза first_comment).

Правила: append-only; исправление — только новой строкой; каждая строка —
самодостаточна (ts · source · fields). Файлы создаются пустыми (затычки).
'@

Write-IfAbsent "logs/activity/README.md"      $LOGS_README
Write-IfAbsent "logs/activity/moves.log"      ""
Write-IfAbsent "logs/activity/comments.log"   ""

# ============================================================================
#  4) tasks/ — приём волонтёров (volunteer-page, затычки)
# ============================================================================

$TASKS_README = @'
# tasks/ — приём волонтёров (volunteer-page)

Секция приёма волонтёров RC-OK (см. docs/RC_REGISTRY.md, docs/CONTACT_PROTOCOL.md).
Публичные задания формируются из `meta.volunteerKeys` картотеки.

- `volunteer-page.md` — витрина приёма (что предлагаем / что просим / как войти).
- Конкретные задания — отдельными файлами `t-NNN.md` (пока затычка).

Журнал приёма — `logs/activity/comments.log` (запись v4, поле lead).
'@

$VOLUNTEER_PAGE = @'
# Приём волонтёров (volunteer-page) — мем-OK

> RC-OK · секция приёма · контакт только через модераторов (не в личку от страницы).

## Что предлагаем
- Готовые карточки павших (копии ЦАМО) с ключами поиска.
- Шаблоны обращений (docs/TEMPLATES.md) и методику «поиск через земляков».

## Что просим
- Проверка записи по ОБД / «Память народа» / «Подвиг народа».
- Связка «боец → живой родственник/земляк».

## Как войти
Оставьте отклик в группе — модератор добавит вас в журнал (`logs/activity/`,
запись v4) и выдаст первое задание с охлаждением (`cooldown`).

> Затычка: конкретные задания появятся в `tasks/t-NNN.md`.
'@

Write-IfAbsent "tasks/README.md"           $TASKS_README
Write-IfAbsent "tasks/volunteer-page.md"   $VOLUNTEER_PAGE

# ============================================================================
#  5) nodes/_TEMPLATE и 6) reports/merge-log.md — КОПИИ из mem-ok-s-admin
# ============================================================================

Copy-From "mem-ok-s-admin" "nodes/_TEMPLATE/README.md" "nodes/_TEMPLATE/README.md"
Copy-From "mem-ok-s-admin" "reports/merge-log.md"      "reports/merge-log.md"

# ============================================================================
#  7) data/incoming/archive/ + data/runtime/
# ============================================================================

New-Dir (Join-Path $TargetRoot "data/incoming/archive")
New-Dir (Join-Path $TargetRoot "data/runtime")
Write-IfAbsent "data/runtime/.gitkeep" ""
Write-IfAbsent "data/incoming/archive/README.md" "# data/incoming/archive/`n`nАрхив обработанных входящих (перенесены из data/incoming после разбора)."

# ============================================================================
#  8) .gitignore += runtime/, *.env, .edge_test_*
# ============================================================================

$giPath = Join-Path $TargetRoot ".gitignore"
$giLines = @("runtime/", "*.env", ".edge_test_*")
if (Test-Path -LiteralPath $giPath) {
    $cur = Get-Content -LiteralPath $giPath -Raw
    $add = @()
    foreach ($l in $giLines) { if ($cur -notmatch [regex]::Escape($l)) { $add += $l } }
    if ($add.Count -gt 0) {
        Add-Content -LiteralPath $giPath -Value ("`n# TASK-0148`n" + ($add -join "`n") + "`n") -Encoding utf8
        $script:created.Add(".gitignore (+= " + ($add -join ", ") + ")")
    } else { $script:skipped.Add(".gitignore (строки уже присутствуют)") }
} else {
    Set-Content -LiteralPath $giPath -Value ("# TASK-0148`n" + ($giLines -join "`n") + "`n") -Encoding utf8
    $script:created.Add(".gitignore (создан)")
}

# ============================================================================
#  9) проверка REGULATIONS — координатная строка v3 + реестр координат
# ============================================================================

$regFound = $false
foreach ($k in $donors.Keys) {
    $d = $donors[$k]
    if (-not (Test-Path -LiteralPath $d)) { continue }
    $cand = @( (Join-Path $d "REGULATIONS.md"), (Join-Path $d "docs/REGULATIONS.md") )
    foreach ($c in $cand) {
        if (Test-Path -LiteralPath $c) {
            $regFound = $true
            $hasV3 = (Get-Content -LiteralPath $c -Raw) -match "v3|координат"
            $script:checks.Add("[REGULATIONS] найден у донора '$k': $c · координатная строка v3: $(if($hasV3){'ЕСТЬ'}else{'НЕТ (доложить)'})")
        }
    }
}
$targetReg = Join-Path $TargetRoot "REGULATIONS.md"
if (Test-Path -LiteralPath $targetReg) {
    $hasV3t = (Get-Content -LiteralPath $targetReg -Raw) -match "v3|координат"
    $script:checks.Add("[REGULATIONS] в цели: $targetReg · координатная строка v3: $(if($hasV3t){'ЕСТЬ'}else{'НЕТ (доложить)'})")
} elseif (-not $regFound) {
    $script:checks.Add("[REGULATIONS] не найден ни у доноров, ни в цели — ДОЛОЖИТЬ владельцу (координатная строка v3 и реестр координат не проверены)")
}

# ============================================================================
#  ОТЧЁТ (создано / пропущено / скопировано-provenance / проверки)
# ============================================================================

$report = New-Object System.Text.StringBuilder
[void]$report.AppendLine("# ОТЧЁТ сборки каркаса мем-OK · TASK-0148")
[void]$report.AppendLine("")
[void]$report.AppendLine("Дата: $(Get-Date -Format 'yyyy-MM-dd HH:mm')  ·  Цель: ``$TargetRoot``")
[void]$report.AppendLine("")
[void]$report.AppendLine("## Создано ($($created.Count))")
[void]$report.AppendLine("")
foreach ($c in $created) { [void]$report.AppendLine("- ``$c``") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## Пропущено (уже существовало — не перезаписано) ($($skipped.Count))")
[void]$report.AppendLine("")
foreach ($s in $skipped) { [void]$report.AppendLine("- $s") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## Скопировано из доноров — provenance SHA256 ($($copied.Count))")
[void]$report.AppendLine("")
[void]$report.AppendLine("| Файл | Откуда | SHA256 |")
[void]$report.AppendLine("|------|--------|--------|")
foreach ($p in $copied) { [void]$report.AppendLine("| ``$($p.File)`` | $($p.From) | ``$($p.SHA256)`` |") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## Проверки")
[void]$report.AppendLine("")
foreach ($k in $checks) { [void]$report.AppendLine("- $k") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## НЕ включено (по заданию)")
[void]$report.AppendLine("")
[void]$report.AppendLine("- журналы-копии строительства из mem-префикса")
[void]$report.AppendLine("- контур джунов")
[void]$report.AppendLine("- GRANT")
[void]$report.AppendLine("- эксплуатационный дашборд (заглушка)")

New-Dir (Join-Path $TargetRoot "reports")
$repPath = Join-Path $TargetRoot "reports/assemble-mem-ok.md"
Set-Content -LiteralPath $repPath -Value $report.ToString() -Encoding utf8

Write-Host ""
Write-Host ($report.ToString())
Write-Host "Отчёт: $repPath" -ForegroundColor Green
Write-Host "Каркас mem-OK собран: $TargetRoot" -ForegroundColor Green
