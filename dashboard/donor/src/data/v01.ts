/* Шаг 1 / v_01 — данные рабочего листа.
 * Листинги — дословные копии реальных файлов из EdgeExtension/ (см. BUILD.md). */

export interface V01File {
  path: string;
  name: string;
  lang: "json" | "js";
  note: string;
  code: string;
}

export const v01Files: V01File[] = [
  {
    path: "EdgeExtension/manifest.json",
    name: "manifest.json",
    lang: "json",
    note: "MV3 · SW · content script только на https://vk.ru/*",
    code: `{
  "manifest_version": 3,
  "name": "Context VK.RU",
  "version": "0.0.1",
  "description": "Точечные заметки и маркеры для сущностей vk.ru. Собственный UI-слой поверх портала, без вмешательства в его логику.",
  "background": {
    "service_worker": "src/background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://vk.ru/*"],
      "js": ["src/content.js"],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": ["https://vk.ru/*"]
}`,
  },
  {
    path: "EdgeExtension/src/background.js",
    name: "background.js",
    lang: "js",
    note: "Service Worker: жизненный цикл + лог старта",
    code: `/* Context VK.RU · v_01 · background.js
 * Service Worker (Manifest V3).
 *
 * Этап 0 «Контрольный каркас»: только жизненный цикл и логирование.
 * chrome.contextMenus, chrome.storage и маршрутизация сообщений
 * появляются начиная с v_02 (РЕГЛАМЕНТ_РАБОТ v2.0, часть 6).
 *
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

const BUILD = "v_01";

chrome.runtime.onInstalled.addListener((details) => {
  console.log(\`[CTX \${BUILD}] background installed (reason: \${details.reason})\`);
});

/* Service Worker в MV3 засыпает и просыпается — лог старта
 * помогает видеть его жизненный цикл в edge://extensions. */
console.log(\`[CTX \${BUILD}] service worker started\`);`,
  },
  {
    path: "EdgeExtension/src/content.js",
    name: "content.js",
    lang: "js",
    note: "Content Script: PASS-строка в консоли vk.ru",
    code: `/* Context VK.RU · v_01 · content.js
 * Точка входа Content Script.
 *
 * Этап 0 «Контрольный каркас»: единственный сигнал запуска на https://vk.ru/.
 * Обнаружение сущностей (adapters/vkru.js), MutationObserver и собственный
 * UI-слой появляются с v_03 (РЕГЛАМЕНТ_РАБОТ v2.0, часть 6).
 *
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

(() => {
  "use strict";

  const BUILD = "v_01";
  const EXPECTED_HOST = "vk.ru";

  /* matches в манифесте уже ограничивают инъекцию, это контрольная проверка. */
  if (location.host !== EXPECTED_HOST) {
    return;
  }

  /* PASS-строка из reports/v_01/TEST.md:
   * [CTX v_01] content script active on vk.ru */
  console.log(
    \`[CTX \${BUILD}] content script active on vk.ru — path: \${location.pathname}\`
  );
})();`,
  },
];

/* ---------- дерево пакета ---------- */

export const v01Tree = `EdgeExtension/               ← корень, загружаемый в Edge
├─ manifest.json             MV3, версия 0.0.1
└─ src/
   ├─ background.js          Service Worker
   └─ content.js             Content Script

reports/v_01/
├─ BUILD.md                  состав и решения
├─ TEST.md                   ручная проверка, PASS-критерии
└─ RESULT.md                 вердикт (заполняет Пользователь)

scripts/
├─ Build.ps1                 упаковка в zip
├─ Clean.ps1                 очистка dist/
└─ Test.ps1                  проверка состава сборки`;

/* ---------- как собрать и загрузить ---------- */

export interface LoadStep {
  t: string;
  d: string;
}

export const loadSteps: LoadStep[] = [
  {
    t: "Откройте edge://extensions",
    d: "Адресная строка Edge → edge://extensions. Включите тумблер «Режим разработчика» (левый нижний угол).",
  },
  {
    t: "Загрузите распакованное расширение",
    d: "Кнопка «Загрузить распакованное расширение» → выберите папку EdgeExtension/ (именно её, не репозиторий целиком).",
  },
  {
    t: "Проверьте Service Worker",
    d: "В карточке «Context VK.RU 0.0.1» кликните «Service Worker» — в его консоли ждите строку [CTX v_01] service worker started.",
  },
  {
    t: "Откройте https://vk.ru/",
    d: "Новая вкладка → vk.ru → F12 → Console (контекст страницы). Ищите строку [CTX v_01] content script active on vk.ru.",
  },
  {
    t: "Обновите страницу (F5)",
    d: "Строка должна появиться снова. Контроль: на example.com такой строки нет.",
  },
];

/* ---------- TEST / RESULT ---------- */

export const testBlock = {
  pre: [
    "Edge Desktop, Windows 10/11; «Режим разработчика» включён",
    "Расширение «Context VK.RU 0.0.1» в списке, красных ошибок нет",
  ],
  pass: [
    "SW-консоль: [CTX v_01] service worker started",
    "Консоль vk.ru: [CTX v_01] content script active on vk.ru — path: /…",
    "После F5 строка появляется снова",
    "На других доменах строки нет; вёрстка vk.ru не изменилась",
  ],
  fail: [
    "Ошибка загрузки манифеста / расширения нет в списке",
    "Красные ошибки в консоли Service Worker",
    "На vk.ru нет строки [CTX v_01] …",
  ],
};

/* ---------- поток шага (диаграмма) ---------- */

export interface FlowNode {
  id: string;
  label: string;
  sub: string;
}

export const flowNodes: FlowNode[] = [
  {
    id: "create",
    label: "Создать минимальный EdgeExtension/",
    sub: "manifest.json · background.js · content.js",
  },
  {
    id: "load",
    label: "Загрузить в Edge",
    sub: "edge://extensions → распакованное расширение",
  },
  {
    id: "check",
    label: "Проверить запуск",
    sub: "консоль vk.ru: [CTX v_01] content script active",
  },
  {
    id: "verdict",
    label: "PASS / FAIL",
    sub: "вердикт фиксирует только Пользователь (§5.6)",
  },
  {
    id: "stop",
    label: "СТОП",
    sub: "ожидание RESULT.md — дальше только после PASS",
  },
];

/* ---------- скачиваемый RESULT.md ---------- */

export function buildResultMd(verdict: "pass" | "fail", note: string): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const box = (on: boolean) => (on ? "[x]" : "[ ]");
  return `# RESULT · v_01 · Контрольный каркас

**СТАТУС:** ${verdict.toUpperCase()}
**ПРОВЕРИЛ:** Пользователь (зафиксировано в рабочем листе)
**ДАТА:** ${date}

## Факт проверки (§5.6)

- Расширение видно в списке edge://extensions: ${box(true)} да
- Ошибки Service Worker: ${box(verdict === "pass")} нет
- В консоли vk.ru строка \`[CTX v_01] content script active on vk.ru\`: ${box(verdict === "pass")} да
- На других доменах строки нет: ${box(verdict === "pass")} да

## Вердикт

- ${box(verdict === "pass")} **PASS** — переход к v_02 «Диагностический канал» (PING/PONG)
- ${box(verdict === "fail")} **FAIL** — остаёмся в v_01

## Комментарий

${note || "—"}

---
Сформировано рабочим листом шага 1. LLM статус не присваивала (§5.6):
выбор PASS/FAIL сделан Пользователем вручную.`;
}