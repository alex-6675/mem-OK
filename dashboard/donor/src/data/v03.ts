/* Шаг 3 / v_03 — данные рабочего листа.
 * Листинги — дословные копии реальных файлов из EdgeExtension/ (см. reports/v_03/BUILD.md).
 * Основание: RESULT_v_02.md = PASS (19.08.2026) + задание docs/3A.md. */

export interface V03File {
  path: string;
  name: string;
  lang: "json" | "js";
  note: string;
  code: string;
}

/* ---------- итоговая таблица признаков 3A ---------- */

export interface Finding3A {
  sign: string;
  status: string;
  role: string;
}

export const findings3A: Finding3A[] = [
  {
    sign: 'data-testid="wallcomments_comment_root" / wallcomments_comment_in_thread',
    status: "CONFIRMED · 3/3 комментария, единая цепь lvl 7",
    role: "Точка привязки комментария. Промежуточные vkit-дивы (lvl 2–6) игнорируются — closest() по testid проскакивает их насквозь.",
  },
  {
    sign: "comment-owner · comment-avatar · comment-text · wall_comment_date · comment-reply/like/share",
    status: "CONFIRMED · словарь 11/11/11/11/11",
    role: "Семантические якоря внутренних элементов комментария.",
  },
  {
    sign: "post · post-header · post-header-title · post-header-avatar · postdateblock_preview · post-content-container",
    status: "CONFIRMED · 9/9",
    role: "Семантические якоря поста.",
  },
  {
    sign: "wallcomments_layout_thread · wallcomments_comment_in_thread · comment-expand · comment-reply-parent",
    status: "CONFIRMED",
    role: "Тредовая структура: ответы в треде имеют собственный контейнер comment_in_thread — сканируем оба testid.",
  },
  {
    sign: "href = /idNNN · /clubNNN · /wall±NNN_MMM · ?reply=&thread=",
    status: "CONFIRMED",
    role: "Первичный идентификационный ключ и источник контекста.",
  },
  {
    sign: "vkit-*",
    status: "CONFIRMED · нестабильны",
    role: "Не используются никоим образом.",
  },
];

/* ---------- листинги пакета (дословно из репо) ---------- */

export const v03Files: V03File[] = [
  {
    path: "EdgeExtension/src/adapters/vkru.js",
    name: "adapters/vkru.js",
    lang: "js",
    note: "НОВЫЙ · scan(doc) · normalizeHref · classify → CTX_VKRU",
    code: `/* Context VK.RU · adapters/vkru.js · v_03 — обнаружение. Vanilla JS. */
(function () {
  "use strict";

  const COMMENT_ROOT_SEL =
    '[data-testid="wallcomments_comment_root"],' +
    '[data-testid="wallcomments_comment_in_thread"]';

  const RE_PERSON = /^\\/id(\\d+)$/;
  const RE_CLUB = /^\\/club(\\d+)$/;
  const RE_WALL = /^\\/wall(-?\\d+)_(\\d+)$/;

  function normalizeHref(raw) {
    if (!raw) return "";
    let u;
    try { u = new URL(raw, "https://vk.ru"); } catch (e) { return raw; }
    if (u.hostname !== "vk.ru" && !u.hostname.endsWith(".vk.ru")) return raw;
    const keep = [];
    u.searchParams.forEach((v, k) => {
      if (k === "reply" || k === "thread") keep.push(k + "=" + v);
    });
    return u.pathname + (keep.length ? "?" + keep.join("&") : "");
  }

  function classify(pathname) {
    let m;
    if ((m = pathname.match(RE_PERSON))) return { type: "PERSON", id: "id" + m[1] };
    if ((m = pathname.match(RE_CLUB))) return { type: "COMMUNITY", id: "club" + m[1] };
    if ((m = pathname.match(RE_WALL)))
      return { type: m[1][0] === "-" ? "COMMUNITY_POST" : "PERSON_POST",
               id: "wall" + m[1] + "_" + m[2] };
    return { type: "OTHER", id: pathname };
  }

  function anchorOf(el) {
    if (!el) return null;
    if (el.tagName === "A" && el.getAttribute("href")) return el;
    return el.querySelector('a[href^="/"], a[href*="vk.ru/"]');
  }

  function trim(s, n) {
    s = (s || "").replace(/\\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  function extractComment(dateAnchor) {
    const root = dateAnchor.closest(COMMENT_ROOT_SEL);
    if (!root) return null;
    const ownerA = anchorOf(root.querySelector('[data-testid="comment-owner"]'));
    const textEl = root.querySelector('[data-testid="comment-text"]');
    const authorHref = ownerA ? normalizeHref(ownerA.getAttribute("href")) : "";
    const cls = authorHref
      ? classify(new URL(authorHref, "https://vk.ru").pathname)
      : { type: "UNKNOWN", id: "" };
    let postId = "", replyId = "", threadId = "";
    try {
      const u = new URL(normalizeHref(dateAnchor.getAttribute("href")), "https://vk.ru");
      const wm = u.pathname.match(RE_WALL);
      if (wm) postId = "wall" + wm[1] + "_" + wm[2];
      replyId = u.searchParams.get("reply") || "";
      threadId = u.searchParams.get("thread") || "";
    } catch (e) { /* noop */ }
    return {
      entity: {
        kind: "COMMENT",
        type: cls.type,
        identity: { id: cls.id, url: authorHref },
        authorName: trim(ownerA ? ownerA.textContent : "", 60),
        text: trim(textEl ? textEl.textContent : "", 80),
        navigationTarget: dateAnchor.getAttribute("href") || "",
        context: { source: root.getAttribute("data-testid"),
                   postUrl: postId, replyId: replyId, threadId: threadId },
      },
      sourceElement: root,
    };
  }

  function extractPost(postRoot) {
    const header = postRoot.querySelector('[data-testid="post-header"]');
    const ownerA =
      anchorOf(header ? header.querySelector('[data-testid="post-header-title"]') : null) ||
      (header ? header.querySelector('a[href^="/id"], a[href^="/club"]') : null);
    if (!ownerA) return null;
    const authorHref = normalizeHref(ownerA.getAttribute("href"));
    const cls = classify(new URL(authorHref, "https://vk.ru").pathname);
    const dateA = anchorOf(postRoot.querySelector('[data-testid="postdateblock_preview"]'));
    let postUrl = "";
    if (dateA) {
      const wm = normalizeHref(dateA.getAttribute("href")).match(RE_WALL);
      if (wm) postUrl = "wall" + wm[1] + "_" + wm[2];
    }
    return {
      entity: {
        kind: "POST",
        type: cls.type,
        identity: { id: cls.id, url: authorHref },
        authorName: trim(ownerA.textContent, 60),
        text: "",
        navigationTarget: ownerA.getAttribute("href") || "",
        context: { source: "post", postUrl: postUrl, replyId: "", threadId: "" },
      },
      sourceElement: postRoot,
    };
  }

  function scan(doc) {
    const out = [];
    Array.from(doc.querySelectorAll('a[data-testid="wall_comment_date"]'))
      .forEach((d) => { const e = extractComment(d); if (e) out.push(e); });
    Array.from(doc.querySelectorAll('[data-testid="post"]'))
      .forEach((p) => { const e = extractPost(p); if (e) out.push(e); });
    return out;
  }

  globalThis.CTX_VKRU = Object.freeze(
    { scan: scan, normalizeHref: normalizeHref, classify: classify });
})();`,
  },
  {
    path: "EdgeExtension/src/content.js",
    name: "content.js",
    lang: "js",
    note: "скан + MutationObserver (600 мс) + дедупликация + отчёт",
    code: `/* Context VK.RU · v_03 · content.js
 * v_01: сигнал запуска. v_02: PING/PONG (регрессия).
 * v_03: скан + debounced MutationObserver (600 мс) + дедупликация + отчёт.
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */
(() => {
  "use strict";
  if (location.host !== "vk.ru") return;
  console.log(\`[CTX \${CTX_BUILD}] content started — path: \${location.pathname}\`);

  /* v_02 регрессия: PING/PONG */
  const t0 = performance.now();
  chrome.runtime.sendMessage({ type: CTX_MSG.PING,
    payload: { path: location.pathname } })
    .then((r) => { if (r && r.type === CTX_MSG.PONG)
      console.log(\`[CTX \${CTX_BUILD}] PONG (rtt ~\${Math.round(performance.now() - t0)} ms)\`); })
    .catch(() => {});

  /* v_03: обнаружение */
  const seen = new Set();
  let timer = 0;

  function keyOf(e) {
    if (e.kind === "COMMENT")
      return "C:" + e.context.postUrl + "#" + (e.context.replyId || e.navigationTarget);
    return "P:" + (e.context.postUrl || e.identity.url);
  }

  function report(fresh) {
    if (!fresh.length) return;
    console.log(\`[CTX \${CTX_BUILD}] ENTITY FOUND: \${fresh.length} new\`);
    fresh.forEach((it) => {
      const e = it.entity;
      console.log(\`[CTX \${CTX_BUILD}] \${e.kind} \${e.type} | author="\${e.authorName}"\` +
        \` | id=\${e.identity.id} | post=\${e.context.postUrl || "-"}\` +
        \` | reply=\${e.context.replyId || "-"}\` +
        \` | nav=\${e.navigationTarget} | sourceElement:\`, it.sourceElement);
    });
    chrome.runtime.sendMessage({ type: CTX_MSG.ENTITY_FOUND,
      payload: { count: fresh.length, entities: fresh.map((i) => i.entity) } })
      .catch(() => {});
  }

  function rescan() {
    if (!globalThis.CTX_VKRU) return;
    const fresh = [];
    CTX_VKRU.scan(document).forEach((it) => {
      const k = keyOf(it.entity);
      if (!seen.has(k)) { seen.add(k); fresh.push(it); }
    });
    report(fresh);
  }

  rescan();
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(rescan, 600);
  }).observe(document.body, { childList: true, subtree: true });
})();`,
  },
  {
    path: "EdgeExtension/src/background.js",
    name: "background.js",
    lang: "js",
    note: "+ приём ENTITY_FOUND · лог сводки в SW",
    code: `/* Context VK.RU · v_03 · background.js
 * v_01: жизненный цикл. v_02: PING/PONG.
 * v_03: + приём ENTITY_FOUND, лог сводки в консоль SW.
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */
importScripts("./core/messaging.js");
console.log(\`[CTX \${CTX_BUILD}] service worker started\`);
chrome.runtime.onInstalled.addListener((d) =>
  console.log(\`[CTX \${CTX_BUILD}] installed (\${d.reason})\`));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;
  if (msg.type === CTX_MSG.PING) {
    const tabId = sender.tab ? sender.tab.id : "?";
    console.log(\`[CTX \${CTX_BUILD}] PING from tab \${tabId}\`);
    sendResponse({ type: CTX_MSG.PONG, build: CTX_BUILD,
      payload: { tabId, receivedAt: Date.now() } });
    return false;
  }
  if (msg.type === CTX_MSG.ENTITY_FOUND) {
    const p = msg.payload || {};
    console.log(\`[CTX \${CTX_BUILD}] entities reported: \${p.count} (tab \${sender.tab ? sender.tab.id : "?"})\`);
    (p.entities || []).forEach((e) =>
      console.log(\`[CTX \${CTX_BUILD}]   \${e.kind} \${e.type} \${e.identity.id} \` +
        \`"\${e.authorName}" post=\${e.context.postUrl || "-"} reply=\${e.context.replyId || "-"}\`));
    sendResponse({ ok: true });
    return false;
  }
  return false;
});`,
  },
  {
    path: "EdgeExtension/src/core/messaging.js",
    name: "core/messaging.js",
    lang: "js",
    note: "CTX_BUILD = v_03 · + ENTITY_FOUND",
    code: `/* Context VK.RU · core/messaging.js · v_03
 * Общие константы сообщений (MV3 message passing).
 *
 * v_02: PING/PONG.
 * v_03: + ENTITY_FOUND (content.js -> background.js).
 *
 * Подключение: в content-скрипты — манифестом, ПЕРЕД остальными файлами;
 * в Service Worker — importScripts("./core/messaging.js").
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

const CTX_BUILD = "v_03";

const CTX_MSG = Object.freeze({
  PING: "ctx:ping",
  PONG: "ctx:pong",
  ENTITY_FOUND: "ctx:entity-found",
});

globalThis.CTX_BUILD = CTX_BUILD;
globalThis.CTX_MSG = CTX_MSG;`,
  },
  {
    path: "EdgeExtension/manifest.json",
    name: "manifest.json",
    lang: "json",
    note: "0.0.3 · + adapters/vkru.js в js[]",
    code: `{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "default_locale": "ru",
  "version": "0.0.3",
  "background": { "service_worker": "src/background.js" },
  "content_scripts": [
    {
      "matches": ["https://vk.ru/*"],
      "js": [
        "src/core/messaging.js",
        "src/adapters/vkru.js",
        "src/content.js"
      ],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": ["https://vk.ru/*"]
}`,
  },
];

/* ---------- дерево изменений ---------- */

export const v03Tree = `EdgeExtension/
├─ manifest.json            0.0.3 · + src/adapters/vkru.js в js[]
└─ src/
   ├─ adapters/
   │  └─ vkru.js            НОВЫЙ · scan / normalizeHref / classify
   ├─ core/messaging.js     CTX_BUILD v_03 · + ENTITY_FOUND
   ├─ content.js            скан + MutationObserver(600) + дедупликация
   └─ background.js         + приём ENTITY_FOUND

reports/v_03/
├─ BUILD.md · TEST.md · RESULT_v_03.md`;

/* ---------- как загрузить ---------- */

export interface LoadStep {
  t: string;
  d: string;
}

export const v03LoadSteps: LoadStep[] = [
  {
    t: "Сборки нет — plain MV3",
    d: "Файлы сохранены в UTF-8 прямо в EdgeExtension/. Никакого npm/сборщика — пакет и есть артефакт.",
  },
  {
    t: "Reload (⟳) на карточке",
    d: "edge://extensions → кнопка обновления у «Context VK.RU». Версия должна стать 0.0.3, Errors — пусто.",
  },
  {
    t: "Откройте две консоли",
    d: "Консоль страницы (F12 на vk.ru) и консоль Service Worker (inspect в карточке расширения).",
  },
  {
    t: "Перезагрузите вкладку vk.ru",
    d: "Тестовая страница — сообщество со стеной и комментариями (та же, что в диагностике 3A.3).",
  },
  {
    t: "Пройдите TEST.md по пунктам",
    d: "ENTITY FOUND, подсветка sourceElement, сверка id со статус-строкой, тред без дублей, POST в feed, тишина на example.com, PING/PONG.",
  },
];

/* ---------- TEST ---------- */

export const v03TestBlock = {
  pre: [
    "v_02 = PASS; расширение обновлено (⟳) до 0.0.3 без Errors",
    "Две консоли: страница (F12) + Service Worker (inspect)",
    "Страница сообщества со стеной и комментариями (та же, что в 3A.3)",
  ],
  pass: [
    "ENTITY FOUND: N new; строки COMMENT … с id=/id… или /club…, post=wall-…",
    "sourceElement в консоли подсвечивает именно блок комментария",
    "id автора совпадает с URL в статус-строке браузера",
    "SW: entities reported: N + список; ENTITY_FOUND дошёл",
    "Тред: дологгируются только новые ответы, 10–15 с без повторов; F5 без дублей",
    "feed?w=wall-234325978_1730: строки POST и COMMENT; example.com молчит; PING/PONG жив",
  ],
  fail: [
    "Нет ENTITY FOUND при живых комментариях (data-testid vs живой DOM — правка внутри v_03)",
    "sourceElement подсвечивает не тот блок; id не совпадает со статус-строкой",
    "Дубликаты после F5 / при раскрытии треда; красные ошибки в консолях",
    "Сломана регрессия v_02 (PING/PONG)",
  ],
};

/* ---------- RESULT_v_03.md ---------- */

export function buildResultV03(verdict: "pass" | "fail", note: string): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const box = (on: boolean) => (on ? "[x]" : "[ ]");
  return `# RESULT · v_03 · VK.RU Adapter: обнаружение

**СТАТУС:** ${verdict.toUpperCase()}
**ПРОВЕРИЛ:** Пользователь (зафиксировано в рабочем листе)
**ДАТА:** ${date}

## Факт проверки (§5.6)

- Версия 0.0.3, ошибок нет: ${box(true)} да
- Комментарии (включая треды) обнаружены: ${box(verdict === "pass")} да
- Посты обнаружены (feed?w=wall-…): ${box(verdict === "pass")} да
- sourceElement подсвечивает корректный блок: ${box(verdict === "pass")} да
- id совпадает с navigation target в статус-строке: ${box(verdict === "pass")} да
- Дедупликация (F5, тред, 10–15 с): ${box(verdict === "pass")} да
- SW получил ENTITY_FOUND: ${box(verdict === "pass")} да
- Регрессия v_02 (PING/PONG): ${box(verdict === "pass")} да

## Вердикт

- ${box(verdict === "pass")} **PASS** — переход к M-04 (Navigation Target; выдаётся проектировщиком)
- ${box(verdict === "fail")} **FAIL** — остаёмся в v_03

## Комментарий

${note || "—"}

---
Сформировано рабочим листом шага 3. LLM статус не присваивала (§5.6):
выбор PASS/FAIL сделан Пользователем вручную.`;
}