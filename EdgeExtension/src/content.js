/* Context VK.RU · src/content.js · v07g ФИНАЛЬНЫЙ
 * ТОНКАЯ ТОЧКА ВХОДА. Отрисовка — на стекле (src/ui/layer.js), ВНЕ DOM VK.
 * СКАЛЬПЕЛЬ — через доступ браузера «Разрешить только при нажатии»:
 * нет доступа = контент не запущен = стекла нет, тишина.
 *
 * Обязанности: старт, лог db, приём CAPTURED и CTX_SYNC, изъятие
 * (SAVE_AUTHOR / NAME_HINT / MET_HINT) — работает ВСЕГДА при данном доступе.
 * CTX_TOGGLE убран (скальпель = доступ браузера).
 * Vanilla JS, ноль зависимостей (§2.2).
 */
(() => {
  "use strict";
  if (location.host !== "vk.ru") return;

  console.log("[CTX " + CTX_BUILD + "] content started — path: " + location.pathname);

  const U = String.fromCharCode(95);
  /* Корни комментариев (testid с подчёркиваниями собраны через U, по А1/§25). */
  const COMMENT_ROOT_SEL =
    '[data-testid="wall' + U + 'comments' + U + 'comment' + U + 'root"],' +
    '[data-testid="wall' + U + 'comments' + U + 'comment' + U + 'in' + U + 'thread"]';
  /* Дата комментария — ссылка wall…?reply=… (точка встречи). */
  const COMMENT_DATE_SEL = 'a[data-testid="wall' + U + 'comment' + U + 'date"]';

  /* ---------- стекло и индекс (layer.js) ---------- */
  let INDEX = { byId: new Map() };

  function buildIndex(db) {
    const byId = new Map(); /* id -> карточка (▲) */
    (db.cards || []).forEach((card) => {
      (card.identities || []).forEach((it) => {
        if (!it || !it.id) return;
        if (!it.replyId) byId.set(it.id, card); /* метим только персоны/сообщества */
      });
    });
    INDEX = { byId: byId };
  }

  /* ---------- старт: лог db + стекло ---------- */
  CTX_STORAGE.loadDb().then((db) => {
    const list = db.cards.map((c) => {
      const first = (c.identities && c.identities[0]) || {};
      return c.cardId + (first.id ? " (" + first.id + ")" : "");
    }).join(", ");
    console.log("[CTX " + CTX_BUILD + "] db: " + db.cards.length + " cards" + (list ? ": " + list : ""));
    buildIndex(db);
    if (typeof CTX_LAYER !== "undefined") CTX_LAYER.init();
  }).catch(() => {});

  /* ---------- CTX_SYNC: клик по значку расширения ----------
   * нет выделения → полная перерисовка («искать новые координаты»);
   * есть текстовое выделение → ЛОКАЛЬНЫЙ СКАЛЬПЕЛЬ: маркеры только
   * внутри ближайшего контейнера, содержащего выделение. */
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== CTX_MSG.CTX_SYNC) return;
    let scope = null;
    const sel = typeof window.getSelection === "function" ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = node && node.nodeType === 1 ? node : node && node.parentElement;
      if (el) scope = el;
    }
    if (typeof CTX_LAYER !== "undefined") CTX_LAYER.init(scope);
  });

  /* ---------- ПКМ по дате комментария → изъятие автора (SAVE_AUTHOR) ---------- */
  document.addEventListener("contextmenu", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    let abs;
    try { abs = new URL(href, location.origin).href; } catch (err) { return; }
    if (!CTX_NORMALIZE.replyOf(abs)) return; /* это не дата комментария */

    const root = a.closest(COMMENT_ROOT_SEL);
    if (!root) return;
    const ownerA = root.querySelector('a[data-testid="comment-owner"]');
    const authorHref = ownerA ? ownerA.getAttribute("href") : "";
    if (!authorHref) return; /* автор не найден — не сохраняем */

    chrome.runtime.sendMessage({
      type: CTX_MSG.SAVE_AUTHOR,
      payload: { authorHref: authorHref, metUrl: abs, page: location.href },
    }).catch(() => {});
  });

  /* ---------- приём CAPTURED (лог изъятия + NAME_HINT + MET_HINT) ---------- */
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== CTX_MSG.CAPTURED) return;
    const p = msg.payload || {};
    console.log("[CTX " + CTX_BUILD + "] captured | menu: " + p.menu +
      " | portal: " + p.portal + " | id: " + p.id + " | type: " + p.type +
      " | metPost: " + p.metPost +
      " | link: " + p.link + " | page: " + p.page + " | db: " + (p.db || ""));

    /* NAME_HINT: первый якорь с тем же id и непустым текстом */
    if (p.id) {
      const anchors = document.querySelectorAll("a[href]");
      for (const a of anchors) {
        if (!a.textContent.trim()) continue;
        const href = a.getAttribute("href");
        if (!href) continue;
        let abs;
        try { abs = new URL(href, location.origin).href; } catch (e) { continue; }
        const norm = CTX_NORMALIZE.normalize(abs, "save-person");
        if (norm.id === p.id) {
          chrome.runtime.sendMessage({
            type: CTX_MSG.NAME_HINT,
            payload: { id: p.id, name: a.textContent.trim() },
          }).catch(() => {});

          /* ТОЧКА ВСТРЕЧИ = ПЕРВОЕ ОБЩЕНИЕ: если якорь внутри комментария —
           * берём его дату (wall…?reply=…) как commentUrl. */
          const commentRoot = a.closest(COMMENT_ROOT_SEL) || a.closest("li");
          if (commentRoot) {
            const dateA = commentRoot.querySelector(COMMENT_DATE_SEL);
            if (dateA && dateA.href) {
              chrome.runtime.sendMessage({
                type: CTX_MSG.MET_HINT,
                payload: { id: p.id, commentUrl: dateA.href },
              }).catch(() => {});
            }
          }
          break;
        }
      }
    }
  });
})();
