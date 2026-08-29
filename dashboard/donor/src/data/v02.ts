/* Шаг 2 / v_02 — данные рабочего листа.
 * Листинги — дословные копии реальных файлов из EdgeExtension/ (см. reports/v_02/BUILD.md).
 * Основание: RESULT_v_01.md = PASS (18.08.2026). */

export interface V02File {
  path: string;
  name: string;
  lang: "json" | "js";
  note: string;
  code: string;
}

export const v02Files: V02File[] = [
  {
    path: "EdgeExtension/src/core/messaging.js",
    name: "core/messaging.js",
    lang: "js",
    note: "новый · CTX_BUILD + CTX_MSG (PING/PONG)",
    code: `/* Context VK.RU · core/messaging.js
 * Общие константы сообщений (MV3 message passing).
 *
 * Подключается двумя способами (без ES-модулей и сборщиков):
 *  - в content-скрипты — манифестом, ПЕРЕД content.js
 *    (content_scripts.js: ["src/core/messaging.js", "src/content.js"]);
 *  - в Service Worker — importScripts("./core/messaging.js").
 *
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

/* Единая версия сборки расширения. */
const CTX_BUILD = "v_02";

/* Типы сообщений. Пространство имён "ctx:" исключает пересечения
 * с сообщениями страницы и других расширений. */
const CTX_MSG = Object.freeze({
  PING: "ctx:ping", // content.js -> background.js
  PONG: "ctx:pong", // background.js -> content.js (ответ)
});

/* Классический скрипт: фиксируем в globalThis, чтобы файл одинаково
 * работал и в мире страницы, и в глобальной области SW. */
globalThis.CTX_BUILD = CTX_BUILD;
globalThis.CTX_MSG = CTX_MSG;`,
  },
  {
    path: "EdgeExtension/src/background.js",
    name: "background.js",
    lang: "js",
    note: "обновлён · onMessage: PING → PONG",
    code: `/* Context VK.RU · v_02 · background.js
 * Service Worker (Manifest V3).
 *
 * v_01: жизненный цикл и логирование.
 * v_02: диагностический канал — обработка PING, ответ PONG.
 *
 * Общие типы сообщений — core/messaging.js (importScripts,
 * синхронно на верхнем уровне — требование SW).
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

importScripts("./core/messaging.js");

chrome.runtime.onInstalled.addListener((details) => {
  console.log(
    \`[CTX \${CTX_BUILD}] background installed (reason: \${details.reason})\`
  );
});

/* Service Worker в MV3 засыпает и просыпается — лог старта
 * помогает видеть его жизненный цикл в edge://extensions. */
console.log(\`[CTX \${CTX_BUILD}] service worker started\`);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;

  if (msg.type === CTX_MSG.PING) {
    const tabId = sender.tab ? sender.tab.id : "?";
    const path = msg.payload && msg.payload.path ? msg.payload.path : "?";
    console.log(\`[CTX \${CTX_BUILD}] PING received from tab \${tabId} (path: \${path})\`);

    const reply = {
      type: CTX_MSG.PONG,
      build: CTX_BUILD,
      payload: { tabId, receivedAt: Date.now() },
    };

    console.log(\`[CTX \${CTX_BUILD}] PONG sent to tab \${tabId}\`);
    sendResponse(reply); // ответ отправлен синхронно
    return false;
  }

  return false;
});`,
  },
  {
    path: "EdgeExtension/src/content.js",
    name: "content.js",
    lang: "js",
    note: "обновлён · PING + лог PONG/rtt",
    code: `/* Context VK.RU · v_02 · content.js
 * Точка входа Content Script.
 *
 * v_01: сигнал запуска на https://vk.ru/.
 * v_02: диагностический канал — PING в background, логирование PONG и rtt.
 *
 * CTX_BUILD / CTX_MSG приходят из core/messaging.js (манифест
 * подключает его раньше этого файла).
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

(() => {
  "use strict";

  const EXPECTED_HOST = "vk.ru";

  /* matches в манифесте уже ограничивают инъекцию, это контрольная проверка. */
  if (location.host !== EXPECTED_HOST) {
    return;
  }

  console.log(
    \`[CTX \${CTX_BUILD}] content script active on vk.ru — path: \${location.pathname}\`
  );

  /* --- диагностический канал (v_02) --- */
  const t0 = performance.now();
  console.log(\`[CTX \${CTX_BUILD}] PING sent to background\`);

  chrome.runtime
    .sendMessage({
      type: CTX_MSG.PING,
      payload: { path: location.pathname, sentAt: Date.now() },
    })
    .then((reply) => {
      if (reply && reply.type === CTX_MSG.PONG) {
        const rtt = Math.round(performance.now() - t0);
        console.log(
          \`[CTX \${CTX_BUILD}] PONG received from background (build \${reply.build}, rtt ~\${rtt} ms)\`
        );
      } else {
        console.error(\`[CTX \${CTX_BUILD}] unexpected reply:\`, reply);
      }
    })
    .catch((err) => {
      console.error(
        \`[CTX \${CTX_BUILD}] PING failed — background недоступен: \${err && err.message ? err.message : err}\`
      );
    });
})();`,
  },
  {
    path: "EdgeExtension/manifest.json",
    name: "manifest.json",
    lang: "json",
    note: "обновлён · 0.0.2 · default_locale (замечание RESULT_v_01.md)",
    code: `{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "default_locale": "ru",
  "version": "0.0.2",
  "background": {
    "service_worker": "src/background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://vk.ru/*"],
      "js": ["src/core/messaging.js", "src/content.js"],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": ["https://vk.ru/*"]
}`,
  },
  {
    path: "EdgeExtension/_locales/ru/messages.json",
    name: "_locales/ru/messages.json",
    lang: "json",
    note: "новый · обязателен при default_locale",
    code: `{
  "extName": {
    "message": "Context VK.RU",
    "description": "Название расширения (отображается в edge://extensions)"
  },
  "extDescription": {
    "message": "Точечные заметки и маркеры для сущностей vk.ru. Собственный UI-слой поверх портала, без вмешательства в его логику.",
    "description": "Описание расширения (отображается в edge://extensions и магазине)"
  }
}`,
  },
];

/* ---------- дерево изменений ---------- */

export const v02Tree = `EdgeExtension/
├─ manifest.json            0.0.2 · + default_locale · __MSG_*__ · messaging.js в js[]
├─ _locales/
│  └─ ru/messages.json      extName · extDescription
└─ src/
   ├─ core/
   │  └─ messaging.js       CTX_BUILD · CTX_MSG (PING/PONG)
   ├─ background.js         importScripts + onMessage: PING → PONG
   └─ content.js            PING + лог PONG/rtt

reports/v_02/
├─ BUILD.md · TEST.md · RESULT_v_02.md`;

/* ---------- как собрать и загрузить (обновление) ---------- */

export interface LoadStep {
  t: string;
  d: string;
}

export const v02LoadSteps: LoadStep[] = [
  {
    t: "Замените файлы пакета на диске",
    d: "Скопируйте EdgeExtension/ из репо: core/messaging.js, background.js, content.js, manifest.json, _locales/ru/messages.json.",
  },
  {
    t: "Обновите расширение (↻)",
    d: "edge://extensions → карточка «Context VK.RU» → кнопка обновления. Манифест изменился — без ↻ браузер оставит v_01. Версия в карточке должна стать 0.0.2.",
  },
  {
    t: "Откройте консоль Service Worker",
    d: "В карточке — «Service Worker». Ждите [CTX v_02] service worker started.",
  },
  {
    t: "Откройте или обновите vk.ru",
    d: "Вкладка https://vk.ru/ → F5 (старые вкладки несут v_01-скрипт) → F12 → Console страницы.",
  },
  {
    t: "Сверьте три строки канала",
    d: "content script active → PING sent → PONG received ... rtt ~N ms; в SW-консоли — PING received / PONG sent. Повтор после F5. Контроль: example.com молчит.",
  },
];

/* ---------- TEST / RESULT ---------- */

export const v02TestBlock = {
  pre: [
    "v_01 = PASS (RESULT_v_01.md); расширение уже загружено",
    "Нажата кнопка ↻, версия в карточке 0.0.2, красных ошибок нет",
  ],
  pass: [
    "SW: [CTX v_02] PING received from tab N + PONG sent to tab N",
    "Страница: content script active → PING sent → PONG received (build v_02, rtt ~N ms)",
    "После F5 канал повторяется; на других доменах тишина",
    "Имя в карточке — «Context VK.RU» из локали (замечание v_01 закрыто)",
  ],
  fail: [
    "Ошибка загрузки манифеста / _locales отсутствует",
    "PING failed — background недоступен (не нажата ↻ или старая вкладка)",
    "Нет PONG или unexpected reply; красные ошибки в SW",
  ],
};

/* ---------- скачиваемый RESULT_v_02.md ---------- */

export function buildResultV02(verdict: "pass" | "fail", note: string): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const box = (on: boolean) => (on ? "[x]" : "[ ]");
  return `# RESULT · v_02 · Диагностический канал

**СТАТУС:** ${verdict.toUpperCase()}
**ПРОВЕРИЛ:** Пользователь (зафиксировано в рабочем листе)
**ДАТА:** ${date}

## Факт проверки (§5.6)

- Версия в карточке 0.0.2, ошибок нет: ${box(true)} да
- SW: \`[CTX v_02] PING received from tab N\` + \`PONG sent to tab N\`: ${box(verdict === "pass")} да
- Страница vk.ru: PING sent → PONG received ... rtt ~N ms: ${box(verdict === "pass")} да
- После F5 канал повторяется; на других доменах тишина: ${box(verdict === "pass")} да
- Замечание v_01 (default_locale) закрыто: ${box(verdict === "pass")} да

## Вердикт

- ${box(verdict === "pass")} **PASS** — переход к v_03 «VK.RU Adapter: обнаружение» (со snippet'ами, §5.7)
- ${box(verdict === "fail")} **FAIL** — остаёмся в v_02

## Комментарий

${note || "—"}

---
Сформировано рабочим листом шага 2. LLM статус не присваивала (§5.6):
выбор PASS/FAIL сделан Пользователем вручную.`;
}