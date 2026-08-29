/* Шаг: фикс v03f2 (M-03-fix2) — данные рабочего листа.
 * Источник задания: reports/v_03/report_v_03_f_fix.md (ветка main-qwen_v_03). */

export interface Row3C {
  metric: string;
  truth: string;
  coverage: string;
  verdict: string;
  ok: boolean;
}

export const rows3C: Row3C[] = [
  {
    metric: "dates",
    truth: "168",
    coverage: "168",
    verdict: "dates-селектор в проде жив",
    ok: true,
  },
  {
    metric: "roots + inthread",
    truth: "97 + 71 = 168",
    coverage: "0",
    verdict: "roots-селекторы съедены порчей передачи",
    ok: false,
  },
  {
    metric: "owner / text / postdate",
    truth: "168 / 162 / 4",
    coverage: "—",
    verdict: "весь comment-компонент на /feed присутствует",
    ok: true,
  },
];

export const conclusions3C = [
  "Корни комментариев существуют и на ленте — fallback для /feed не нужен. Архитектурное решение 3A (closest по testid) подтверждено полностью.",
  "Единственная причина отсутствия COMMENT — дефект передачи кода (подчёркивания). Лечится конструкцией селекторов через String.fromCharCode(95): в коде физически нет подчёркиваний, портиться нечему.",
  "Посты переводим на data-post-id (CONFIRMED на 100% постов) — ID поста больше не зависит от селектора с подчёркиваниями.",
];

export interface AssemblyLine {
  source: string;
  result: string;
}

export const assemblyLines: AssemblyLine[] = [
  {
    source: "'a[data-testid=\"wall' + U + 'comment' + U + 'date\"]'",
    result: "a[data-testid=\"wall_comment_date\"]",
  },
  {
    source: "'[data-testid=\"wall' + U + 'comments' + U + 'comment' + U + 'root\"]'",
    result: "[data-testid=\"wallcomments_comment_root\"]",
  },
  {
    source: "new RegExp(\"^/wall(-?\\\\d+)\" + U + \"(\\\\d+)$\")",
    result: "/^\\/wall(-?\\d+)_(\\d+)$/",
  },
];

export interface Fix2File {
  path: string;
  change: string;
  kind: "replace" | "edit" | "frozen";
}

export const fix2Files: Fix2File[] = [
  {
    path: "src/adapters/vkru.js",
    change: "полная замена: T_DATE/T_ROOT через U; RE_WALL — new RegExp с U; POST → data-post-id",
    kind: "replace",
  },
  {
    path: "src/content.js",
    change: "полная замена: coverage-гейт posts/dates/roots, селекторы через U",
    kind: "replace",
  },
  {
    path: "src/core/messaging.js",
    change: "CTX_BUILD = \"v03f2\"; константы и типы сообщений без изменений",
    kind: "replace",
  },
  {
    path: "manifest.json",
    change: "ТОЛЬКО строка version → 0.0.5",
    kind: "edit",
  },
  {
    path: "src/background.js",
    change: "НЕ меняется — приём ENTITY_FOUND и PING/PONG как в v_03",
    kind: "frozen",
  },
];

export const gateSteps = [
  {
    t: "ГЕЙТ: coverage posts/dates/roots",
    d: "Фильтр CTX в консоли /feed: строка [CTX v03f2] coverage posts/dates/roots = 4/…/… с roots БОЛЬШЕ 0 (ожидание ≈ 4/168/168). roots=0 → код снова повреждён: СТОП и сообщить.",
  },
  {
    t: "COMMENT с post=wall-… и reply=…",
    d: "Строки [CTX v03f2] COMMENT … — много, это норма для /feed.",
  },
  {
    t: "POST теперь с post=wall-…",
    d: "postUrl извлечён из data-post-id — больше не «-».",
  },
  {
    t: "SW: entities reported включает COMMENT",
    d: "Service Worker получил ENTITY_FOUND; карточка без ошибок. /collabis — опционально, те же критерии.",
  },
];

export const passCriteriaV03F2 = [
  "Гейт roots>0 выполнен",
  "COMMENT и POST обнаружены; postUrl извлечён (post≠-)",
  "SW получил COMMENT; карточка без ошибок",
  "Регрессия v_02: PING/PONG работает",
];

export function buildResultV03Fix2(verdict: "pass" | "fail", note: string): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const box = (on: boolean) => (on ? "[x]" : "[ ]");
  return `# RESULT · v_03 · VK.RU Adapter: обнаружение (статус по fix2 / v03f2)

**СТАТУС:** ${verdict.toUpperCase()}
**ПРОВЕРИЛ:** Пользователь (зафиксировано в рабочем листе)
**ДАТА:** ${date}

## Факт проверки (§5.6) — TEST_v03f2.md

- Версия в карточке 0.0.5, ошибок нет: ${box(true)} да
- ГЕЙТ: coverage posts/dates/roots с roots>0 (≈ 4/168/168): ${box(verdict === "pass")} да
- COMMENT с post=wall-… и reply=…: ${box(verdict === "pass")} да
- POST с post=wall-… (из data-post-id, не «-»): ${box(verdict === "pass")} да
- SW: entities reported включает COMMENT: ${box(verdict === "pass")} да
- Регрессия v_02: PING/PONG работает: ${box(verdict === "pass")} да

## Вердикт

- ${box(verdict === "pass")} **PASS** — v_03 закрывается; проектировщик выдаёт M-04
  (Этап 3 — Navigation Target)
- ${box(verdict === "fail")} **FAIL** — остаёмся в v_03 (итерация внутри v03f2)

## Комментарий

${note || "—"}

---
Сформировано рабочим листом фикса v03f2. LLM статус не присваивала (§5.6):
выбор PASS/FAIL сделан Пользователем вручную.`;
}