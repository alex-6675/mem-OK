export type Status = "pass" | "warn" | "fail";

export interface ReqItem {
  id: string;
  req: string;
  status: Status;
  note: string;
  doc: string;
  /** Пометка: артефакт появился в сборке v_XX (файл создан, полная функция — позже) */
  since?: string;
}

export interface ReqGroup {
  section: string;
  title: string;
  items: ReqItem[];
}

export const reqGroups: ReqGroup[] = [
  {
    section: "§B · §2.2",
    title: "Границы и технологический стек",
    items: [
      {
        id: "stack",
        req: "Vanilla JS (ES6+), без фреймворков и npm-зависимостей",
        status: "warn",
        note: "Локальный репо — React 18 + Vite 6 + TypeScript + Tailwind 4 (плюс recharts, framer-motion, supabase-js). Регламент §2.2 и §5.3 прямо запрещают внешние библиотеки в расширении.",
        doc: "РЕГЛАМЕНТ §2.2",
      },
      {
        id: "mv3",
        req: "Manifest V3, Service Worker, chrome.* API",
        status: "fail",
        note: "Ни manifest.json, ни одного вызова chrome.* в репозитории нет. Целевая среда — только desktop Edge и только vk.ru (§B, §2.1).",
        doc: "architecture.md §B",
      },
    ],
  },
  {
    section: "§D",
    title: "Компоненты расширения",
    items: [
      {
        id: "background",
        req: "background.js — Service Worker (contextMenus, storage, маршрутизация)",
        status: "fail",
        note: "v_01: жизненный цикл. v_02: PING→PONG. v_03: приём ENTITY_FOUND + сводка в консоли SW. contextMenus/storage — по плану с v_10/v_12.",
        doc: "architecture.md §D.3",
        since: "v_01",
      },
      {
        id: "content",
        req: "content.js — точка входа Content Script (MutationObserver, делегирование адаптеру, инъекция UI-слоя)",
        status: "fail",
        note: "v_01: сигнал запуска. v_03: скан + debounced MutationObserver (600 мс) + дедупликация + отчёт ENTITY_FOUND. Инъекция UI-слоя — с v_07 по плану.",
        doc: "architecture.md §D.1",
        since: "v_01",
      },
      {
        id: "adapter",
        req: "adapters/vkru.js — обнаружение сущностей и нормализация в ENTITY",
        status: "fail",
        note: "Создан в v_03 по данным 3A: scan() только по data-testid, ключ — href. v_03: FAIL (частичный) — дефект передачи. v_03f: verbatim + coverage (0.0.4). v03f2: селекторы через fromCharCode(95), data-post-id (0.0.5, §25). Решение №2 (M03r): снят с инжекции — остаётся в репо для нормализатора (v_04r) и маркировки (v_06r).",
        doc: "architecture.md §D.2, РЕГЛАМЕНТ §5.7",
        since: "v_03",
      },
      {
        id: "storage",
        req: "core/storage.js — абстракция над chrome.storage.local (плоское KV)",
        status: "fail",
        note: "Отсутствует. Модель — Map<IdentityURL, EntityRecord>, без реляционной структуры legacy (§K).",
        doc: "architecture.md §D, §K",
      },
      {
        id: "messaging",
        req: "core/messaging.js — маршрутизация сообщений MV3",
        status: "fail",
        note: "v_02: CTX_MSG (PING/PONG), канал проверен. v_03: + ENTITY_FOUND (content → SW). Полная маршрутизация команд — с этапами 8–9.",
        doc: "architecture.md §D, РЕГЛАМЕНТ ч.6",
        since: "v_02",
      },
      {
        id: "ui",
        req: "ui/dialog.js + popup.js — диалог записи сущности и popup",
        status: "fail",
        note: "Отсутствуют, как и dialog.html / popup.html. Появляются на этапах 8–9 (v_09–v_10).",
        doc: "architecture.md §D.4",
      },
      {
        id: "layer",
        req: "ui/layer.js — отрисовка маркеров (▲, цвет) в DOM",
        status: "fail",
        note: "Отсутствует. Принцип «собственного слоя»: соседние DOM-узлы, не модификация внутренностей VK (§H.1).",
        doc: "architecture.md §D, §H",
      },
      {
        id: "styles",
        req: "styles.css — изолированные стили собственного слоя",
        status: "fail",
        note: "В репо есть только Tailwind-сборка шаблона. Нужны жёсткие селекторы вида .ctx-marker-*, иначе покрасится весь VK (§H, прим. 3 к регламенту).",
        doc: "architecture.md §D.5",
      },
    ],
  },
  {
    section: "§E · §F–I",
    title: "Контракт данных и идентификация",
    items: [
      {
        id: "entity",
        req: "ENTITY-контракт зафиксирован в коде (type / identity / context / sourceElement / capabilities)",
        status: "fail",
        note: "Нигде не объявлен. Контракт заморожен в части 3 регламента и не может меняться без согласования.",
        doc: "РЕГЛАМЕНТ ч.3",
      },
      {
        id: "navtarget",
        req: "Идентификация по navigation target (href) — первичный ключ",
        status: "fail",
        note: "Не реализована. CSS-классы VK (vkit-*, Post__author) — только OBSERVED, ключами быть не могут (§G). data-* атрибуты — HYPOTHESIS, ждут проверки на живом DOM.",
        doc: "architecture.md §F–I",
      },
      {
        id: "ctxmenu",
        req: "Сценарий ПКМ / выделение через chrome.contextMenus + selectionchange",
        status: "fail",
        note: "Не реализован. Этап 9 (v_10) — после появления диалога.",
        doc: "architecture.md §J",
      },
    ],
  },
  {
    section: "§K",
    title: "Отказ от Legacy",
    items: [
      {
        id: "legacy",
        req: "Старая логика НЕ перенесена: Handlers Map, ranks/histatuses, 6 доменов, массовый сбор",
        status: "pass",
        note: "Выполнено — тривиально: переносить в пустом репозитории пока нечего. Важно не нарушить при старте: из старого кода берутся только идеи.",
        doc: "architecture.md §K, РЕГЛАМЕНТ §1.2.3",
      },
    ],
  },
  {
    section: "§L · §2.3",
    title: "Структура каталогов",
    items: [
      {
        id: "root",
        req: "EdgeExtension/ — корень расширения (загружается в Edge в режиме разработчика)",
        status: "fail",
        note: "Создан в шаге 1: manifest.json + src/. Vite-шаблон вынесен за пределы пакета, в Edge загружается только EdgeExtension/.",
        doc: "architecture.md §L",
        since: "v_01",
      },
      {
        id: "manifest-files",
        req: "manifest.json, popup.html, dialog.html, icons/ (16, 48, 128)",
        status: "fail",
        note: "manifest.json создан (MV3, 0.0.1). popup.html / dialog.html — этапы 8–9; фирменные иконки 16/48/128 — косметика после PASS (сейчас штатная).",
        doc: "architecture.md §L",
        since: "v_01",
      },
      {
        id: "scripts",
        req: "scripts/ — Build.ps1, Clean.ps1, Test.ps1 (PowerShell)",
        status: "fail",
        note: "Созданы Build.ps1 / Clean.ps1 / Test.ps1 (состав v_01). Целевая ОС — Windows 10/11 (§2.1).",
        doc: "architecture.md §L",
        since: "v_01",
      },
      {
        id: "reports",
        req: "reports/ — артефакты сборок: v_XX/{BUILD.md, TEST.md, RESULT.md}",
        status: "fail",
        note: "Создана: reports/v_01/{BUILD.md, TEST.md, RESULT.md}. Вердикт RESULT.md — только от Пользователя (§5.6).",
        doc: "РЕГЛАМЕНТ ч.4",
        since: "v_01",
      },
      {
        id: "docs",
        req: "docs/ — локальные копии architecture.md и РЕГЛАМЕНТ_РАБОТ v2.0",
        status: "fail",
        note: "Документы есть в удалённом репозитории, но в локальном рабочем репо их нет — источник истины должен лежать рядом с кодом.",
        doc: "architecture.md §L",
      },
    ],
  },
];

export const allItems = reqGroups.flatMap((g) => g.items);
export const counts = {
  pass: allItems.filter((i) => i.status === "pass").length,
  warn: allItems.filter((i) => i.status === "warn").length,
  fail: allItems.filter((i) => i.status === "fail").length,
  total: allItems.length,
};
export const scorePct = Math.round((counts.pass / counts.total) * 100);

/* ---------- дорожная карта v_01 — v_15 ---------- */

export interface Stage {
  v: string;
  num: number;
  title: string;
  goal: string;
  pass: string;
  tag?: "диагностика" | "адаптер" | "UI-слой" | "данные";
  state?: "done" | "current";
}

export const stages: Stage[] = [
  {
    v: "v_01",
    num: 0,
    title: "Контрольный каркас",
    goal: "Минимальный MV3-манифест, загрузка распакованного расширения в Edge, запуск content.js на https://vk.ru/.",
    pass: "Расширение видимо в edge://extensions без ошибок; на vk.ru в консоли страницы появляется маркер запуска content.js.",
    state: "done",
  },
  {
    v: "v_02",
    num: 1,
    title: "Диагностический канал",
    goal: "Обмен сообщениями PING/PONG между content.js и background.js (Service Worker) через chrome.runtime.",
    pass: "PING из content-скрипта достигает SW и возвращается PONG; оба события логируются.",
    state: "done",
  },
  {
    v: "v_03",
    num: 2,
    title: "VK.RU Adapter: обнаружение",
    goal: "Поиск sourceElement в DOM. Обязательно сопровождается snippet'ом для консоли DevTools — проверка гипотез на живой странице.",
    pass: "Пользователь подтвердил вывод диагностики; адаптер находит контейнер сущности по семантическим признакам (href, role, data-*).",
    tag: "диагностика",
    state: "current",
  },
  {
    v: "v_04",
    num: 3,
    title: "Navigation Target",
    goal: "Извлечение href ближайшей релевантной ссылки, нормализация URL: отбрасывание GET-параметров (reply, thread, from) и трекеров.",
    pass: "Для /id123, /club456, /wall-123_456 извлекается устойчивое семантическое ядро URL.",
    tag: "адаптер",
  },
  {
    v: "v_05",
    num: 4,
    title: "Нормализатор ENTITY",
    goal: "Формирование объекта ENTITY строго по контракту части 3 регламента.",
    pass: "Объект содержит все обязательные поля; sourceElement не сериализуется при передаче в background.",
    tag: "адаптер",
  },
  {
    v: "v_06",
    num: 5,
    title: "Контекст",
    goal: "Привязка сущности к родителю: context.source (comment / post / sidebar), parentPostId, threadId.",
    pass: "Автор комментария получает корректные parentPostId и threadId.",
    tag: "адаптер",
  },
  {
    v: "v_07",
    num: 6,
    title: "Собственный визуальный слой",
    goal: "Инъекция диагностического маркера [ENTITY] через styles.css. Проверка изоляции: стили VK не задеты, классы — только .ctx-*.",
    pass: "Маркер виден у найденных сущностей; верстка vk.ru не изменилась.",
    tag: "UI-слой",
  },
  {
    v: "v_08",
    num: 7,
    title: "Треугольник ▲",
    goal: "Замена маркера на ▲. MutationObserver следит за SPA-навигацией и подгрузкой комментариев, маркеры перепривязываются.",
    pass: "После SPA-перехода и подгрузки новых комментариев маркеры появляются без перезагрузки страницы.",
    tag: "UI-слой",
  },
  {
    v: "v_09",
    num: 8,
    title: "Действие по треугольнику",
    goal: "Клик по маркеру открывает dialog.html с предзаполненными ENTITY-данными.",
    pass: "Диалог открывается с корректными type / id / контекстом.",
    tag: "UI-слой",
  },
  {
    v: "v_10",
    num: 9,
    title: "ПКМ / выделение",
    goal: "Интеграция chrome.contextMenus + selectionchange: пункт «Context: Записать сущность» по выделенному нику.",
    pass: "Выделение ника → ПКМ → пункт меню запрашивает активный ENTITY у content.js и открывает диалог.",
  },
  {
    v: "v_11",
    num: 10,
    title: "Сохранение",
    goal: "Запись EntityRecord в chrome.storage.local, ключ — нормализованный identity.url.",
    pass: "Запись переживает перезагрузку страницы и перезапуск браузера; маркер отрисовывается из хранилища.",
    tag: "данные",
  },
  {
    v: "v_12",
    num: 11,
    title: "Маркеры: тип и цвет",
    goal: "Назначение маркера (треугольник, цвет) из диалога, мгновенная перерисовка слоя.",
    pass: "Смена цвета/типа сохраняется и отрисовывается без перезагрузки.",
    tag: "данные",
  },
  {
    v: "v_13",
    num: 12,
    title: "Примечания",
    goal: "Текстовые заметки к сущности, редактирование, отображение в popup.",
    pass: "Заметка сохраняется и доступна из popup по ключу identity.url.",
    tag: "данные",
  },
  {
    v: "v_14",
    num: 13,
    title: "Календарь / даты",
    goal: "Даты в записях сущностей, фильтрация в popup по свежести.",
    pass: "Даты фиксируются при сохранении и корректно отображаются.",
    tag: "данные",
  },
  {
    v: "v_15",
    num: 14,
    title: "Финальная интеграция",
    goal: "Сборка всех модулей, чистка, scripts/Build.ps1, итоговые отчёты, подготовка к повседневному использованию.",
    pass: "Полный сценарий «нашёл → пометил → заметил → нашёл снова» работает на vk.ru от начала до конца.",
  },
];

/* ---------- шаги запуска ---------- */

export interface Step {
  id: string;
  text: string;
  detail: string;
}

export const steps: Step[] = [
  {
    id: "s1",
    text: "Зафиксировать устав проекта локально",
    detail:
      "Скопировать docs/architecture.md и РЕГЛАМЕНТ_РАБОТ_v2_0.md в локальный каталог docs/. Оба документа — единственный источник истины; любая новая LLM-сессия начинает с них.",
  },
  {
    id: "s2",
    text: "Развести корни: EdgeExtension/ и шаблон",
    detail:
      "Создать структуру по §L: EdgeExtension/, scripts/, reports/, docs/, .vscode/. Vite/React-шаблон не должен попадать в корень, загружаемый в Edge: либо архивировать, либо оставить отдельным инструментом (например, этим дашбордом).",
  },
  {
    id: "s3",
    text: "Подготовить артефакты v_01",
    detail:
      "manifest.json (MV3: name, version 0.0.1, host_permissions: https://vk.ru/*, background.service_worker, content_scripts), заглушки background.js и content.js, иконки 16/48/128 px.",
  },
  {
    id: "s4",
    text: "Оформить отчётную папку reports/v_01/",
    detail:
      "BUILD.md (что собрано) и TEST.md по шаблону: предусловия → действия → PASS-критерии. Инструкцию по загрузке писать для «распакованного расширения» в Edge.",
  },
  {
    id: "s5",
    text: "Прогнать Этап 0 руками в Edge",
    detail:
      "edge://extensions → «Режим разработчика» → «Загрузить распакованное расширение» → папка EdgeExtension/ → открыть https://vk.ru/ и проверить консоль страницы.",
  },
  {
    id: "s6",
    text: "Записать RESULT.md и дождаться PASS",
    detail:
      "Статус устанавливает только Пользователь (§5.6). При FAIL/BLOCKED — работаем внутри v_01, перескакивать запрещено (§4, §5.1). Только после PASS открываем v_02 (PING/PONG).",
  },
  {
    id: "s7",
    text: "Заготовить диагностику для vkru.js",
    detail:
      "До Этапа 2 (v_03) подготовить snippet для консоли DevTools vk.ru: проверка HYPOTHESIS о data-* атрибутах и структуре ссылок (§5.7, §F). Адаптер пишется только по подтверждённым данным.",
  },
];

/* ---------- терминал ---------- */

export interface TermLine {
  type: "cmd" | "fail" | "warn" | "pass" | "info" | "arrow";
  text: string;
}

export const termLines: TermLine[] = [
  { type: "cmd", text: "context-vkru — сверка локального репо с docs/" },
  { type: "info", text: "источник: architecture.md (шаг 1) + РЕГЛАМЕНТ_РАБОТ v2.0" },
  { type: "fail", text: "EdgeExtension/ .................... отсутствует" },
  { type: "fail", text: "manifest.json (MV3) ............... отсутствует" },
  { type: "fail", text: "background.js / content.js ........ отсутствует" },
  { type: "fail", text: "adapters/vkru.js .................. отсутствует (§E не реализован)" },
  { type: "fail", text: "core/ · ui/ · styles.css .......... отсутствует" },
  { type: "fail", text: "scripts/ · reports/ · docs/ ....... отсутствует (§L)" },
  { type: "warn", text: "стек: React+Vite+TS+Tailwind ↔ Vanilla JS (§2.2)" },
  { type: "pass", text: "§K: legacy-логика не перенесена .... тривиально PASS" },
  { type: "arrow", text: "итог: 1 PASS · 1 WARN · 15 FAIL → соответствие 6%" },
  { type: "arrow", text: "режим: готов к Этапу 0 — сборка v_01 «Контрольный каркас»" },
  { type: "pass", text: "шаг 1: EdgeExtension/ создан — manifest · background · content" },
  { type: "pass", text: "шаг 1: reports/v_01/ + scripts/ на месте (BUILD · TEST · RESULT)" },
  { type: "pass", text: "RESULT_v_01.md: PASS от Пользователя (18.08.2026) — v_01 закрыт" },
  { type: "pass", text: "шаг 2: v_02 — core/messaging.js · PING/PONG · default_locale: ru" },
  { type: "pass", text: "RESULT_v_02.md: PASS от Пользователя (19.08.2026) — v_02 закрыт" },
  { type: "pass", text: "3A ЗАКРЫТ: data-testid CONFIRMED · href — ключ · vkit-* не используются" },
  { type: "pass", text: "шаг 3: v_03 — adapters/vkru.js · ENTITY_FOUND · MutationObserver 600 мс" },
  { type: "fail", text: "RESULT v_03: FAIL (частичный) — markdown съел подчёркивания при передаче" },
  { type: "pass", text: "фикс v_03f (0.0.4): verbatim-селекторы · coverage posts/dates/roots · РЕПО-ГЕЙТ" },
  { type: "fail", text: "3C: прод повреждён — dates=168 / roots=0 · verbatim-передачи недостаточно" },
  { type: "pass", text: "v03f2 (0.0.5): селекторы через fromCharCode(95) · посты по data-post-id" },
  { type: "arrow", text: "РЕШЕНИЕ №2 (M03r.md): переворот — изъятие в момент фиксации вместо сканирования" },
  { type: "pass", text: "v03r (0.0.6): contextMenus · ctx:captured · сканеры и MutationObserver сняты" },
  { type: "pass", text: "группа заданий заполнена: TASK-0001…0005 · conventional commits [TASK-XXXX]" },
  { type: "arrow", text: "TASK-0001 feat(ext) M-03r · 0002 infra · 0003 AGENTS Доп.А · 0004 Gmail-стиль · 0005 .vscode" },
  { type: "pass", text: "RESULT_v03r.md: PASS от Пользователя (2026-08-20) — TASK-0001 DONE" },
  { type: "pass", text: "TASK-0003: AGENTS.md — Дополнения А (А1–А6) + Б (Б1–Б4) · DONE · a4b6ec9" },
  { type: "pass", text: "TASK-0006: v04r нормализатор (fromCharCode 95 · тип из меню · metPost) · DONE · PASS · 9c104be" },
  { type: "warn", text: "TASK-0007: ремонт дашборда — ЧАСТИЧНО (4c307da): файлы в репо отсутствуют (404), ждёт хэш" },
  { type: "pass", text: "TASK-0009 (v05r): база, карточка v2, дедуп · DONE · 2e01d91" },
  { type: "pass", text: "TASK-0010 (v06r): маркировка сохранённых, фикс дедупа комментариев · DONE · dce4ca7" },
  { type: "warn", text: "TASK-0011: v07r…v07d — итерации → v07g ФИНАЛЬНЫЙ (0.0.18): стекло по координатам, скальпель = доступ «при нажатии», индикатор 3 состояний, локальный скальпель по выделению" },
  { type: "pass", text: "TASK-0002: запуск Edge c --remote-debugging-port=9222 (scripts/RunEdgeCdp.ps1) · DONE" },
  { type: "pass", text: "TASK-0005: .vscode/launch.json под Edge (+ settings/extensions) · DONE" },
  { type: "warn", text: "TASK-0100 (m3): приведение территории + каркас переноса — scripts/migrate-to-m3.ps1, provenance, заглушки, docs, dashboard «прошлое–настоящее–будущее»" },
  { type: "arrow", text: "Б5: факт = репо пользователя · DONE только после хэша · содержимое выдано код-блоками" },
  { type: "cmd", text: "ожидание хэша коммита chore: m3 — каркас и перенос [TASK-0100]_" },
];

/* ---------- конфликт стека ---------- */

export const stackLocal = [
  "React 18 + react-dom + react-router",
  "Vite 6 + TypeScript 5",
  "Tailwind CSS 4",
  "recharts · framer-motion · dnd-kit",
  "supabase-js · uuid · date-fns",
];

export const stackTarget = [
  "Vanilla JS (ES6+), 0 зависимостей",
  "Manifest V3 · Service Worker",
  "chrome.storage.local · contextMenus · runtime",
  "MutationObserver + нативный DOM",
  "Native HTML/CSS/JS, PowerShell-скрипты",
];

/* ---------- контракт ENTITY ---------- */

export const entityContract = `// ENTITY CONTRACT  (РЕГЛАМЕНТ, часть 3 — заморожен)
{
    type: "PERSON" | "COMMUNITY" | "COMMENT_AUTHOR" | "POST_AUTHOR",
    identity: {
        id: "string",    // устойчивый ID из URL: "id123", "club456", "wall-123_456"
        url: "string",   // нормализованный Navigation Target (без GET-параметров)
    },
    context: {
        source: "comment" | "post" | "sidebar",
        parentPostId: "string | null",
        threadId: "string | null"
    },
    sourceElement: HTMLElement,  // только для content.js — НЕ сериализуется
    capabilities: { canTag: true, canNote: true }
}`;

export const entityNotes = [
  {
    field: "identity.url",
    rule: "Первичный ключ (Primary Key) в chrome.storage.local. Извлекается из href, трекеры и параметры reply/thread/from отбрасываются.",
    doc: "§I",
  },
  {
    field: "CSS-классы VK",
    rule: "vkit-*, Post__author, ui_wall_post — только OBSERVED. Использовать как ключи ЗАПРЕЩЕНО: хрупкие, минифицируются.",
    doc: "§G",
  },
  {
    field: "data-* атрибуты",
    rule: "Диагностика 3A закрыла вопрос: идентификация — только по нормализованному href (/idNNN, /clubNNN, /wall±NNN_MMM, ?reply=&thread=). data-* для ключей не используются, vkit-* запрещены.",
    doc: "§F, §5.7 · 3A CLOSED",
  },
  {
    field: "sourceElement",
    rule: "Живая ссылка на DOM-узел для отрисовки слоя. В background не передаётся — сообщение должно быть сериализуемым.",
    doc: "§E",
  },
];

/* ---------- шаблон задания v_01 (§7) ---------- */

export const taskSheet = `МОДУЛЬ: M-01 · Контрольный каркас
СБОРКА: v_01
ЦЕЛЬ: Минимальный MV3-манифест, загрузка в Edge, запуск content.js на vk.ru

ИЗМЕНЯЕМЫЕ ФАЙЛЫ:
- EdgeExtension/manifest.json
- EdgeExtension/src/background.js
- EdgeExtension/src/content.js
- EdgeExtension/icons/icon-16.png, icon-48.png, icon-128.png
- reports/v_01/BUILD.md
- reports/v_01/TEST.md

АРХИТЕКТУРНЫЕ РЕШЕНИЯ:
- Только Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2)
- Собственный слой пока не рисуем: content.js лишь сигнализирует о запуске
- Идентификация НЕ реализуется — до подтверждения гипотез на живом DOM (§5.7)
- host_permissions ограничен https://vk.ru/* (§B)

КАК СОБРАТЬ И ЗАГРУЗИТЬ:
1. edge://extensions → включить «Режим разработчика»
2. «Загрузить распакованное расширение» → выбрать папку EdgeExtension/
3. Открыть https://vk.ru/ → DevTools (F12) → вкладка Console

ТЕСТ (TEST.md):
1. Предусловия: расширение видно в списке, в Service Worker нет ошибок
2. Действия: открыть vk.ru, затем обновить страницу (F5)
3. Ожидаемый результат (PASS): в консоли страницы строка
   [CTX v_01] content script active on vk.ru

СТОП. (Ожидание RESULT.md от Пользователя)`;

/* ---------- фактические файлы шаблона ---------- */

export const templateFiles = [
  "index.html",
  "package.json",
  "vite.config.js",
  "tsconfig.json",
  "src/main.tsx",
  "src/App.tsx",
  "src/index.css",
];

/** Шаги чек-листа, уже выполненные самим процессом:
 *  s3/s4 — артефакты v_01 созданы в шаге 1;
 *  s5/s6 — ручной прогон в Edge и RESULT_v_01.md: PASS (18.08.2026). */
export const stepsPreChecked = ["s3", "s4", "s5", "s6"];
