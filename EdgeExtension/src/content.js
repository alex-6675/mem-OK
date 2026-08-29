/* mem-OK · src/content.js · ok.ru-адаптация (TASK-0154).
 * Тонкая точка входа для ok.ru. Ядро v07g (messaging, normalize, storage,
 * layer) — от донора context-vkru, НЕ трогать. VK-вариант в доноре — НЕ трогать.
 * ПКМ «Записка: ПЕР/СОО» создаётся в background.js (contextMenus).
 * Единственный писатель — background.js (storage.saveDb).
 */
(() => {
  "use strict";
  // ok.ru: основной домен и поддомены
  if (!(location.host === "ok.ru" || location.host.endsWith(".ok.ru"))) return;

  console.log("[CTX " + CTX_BUILD + "] content started (ok.ru) — path: " + location.pathname);

  // Индекс по картотеке (для стекла/подхватов).
  let INDEX = { byId: new Map() };

  function buildIndex(db) {
    const byId = new Map();
    const cards = Array.isArray(db.cards) ? db.cards : Object.values(db.cards || {});
    cards.forEach((card) => {
      const id = card && card.identities && card.identities.id;
      if (id) byId.set(String(id), card);
    });
    INDEX = { byId: byId };
  }

  // Старт: лог базы + стекло (layer из ядра).
  CTX_STORAGE.loadDb().then((db) => {
    const n = Array.isArray(db.cards) ? db.cards.length : Object.keys(db.cards || {}).length;
    console.log("[CTX " + CTX_BUILD + "] kartoteka: " + n + " cards");
    buildIndex(db);
    if (typeof CTX_LAYER !== "undefined") CTX_LAYER.init();
  }).catch(() => {});

  // CTX_SYNC (клик по значку) — перерисовка стекла / локальный скальпель.
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

  // CAPTURED (изъятие записки) — лог + NAME_HINT (имя из первого якоря).
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== CTX_MSG.CAPTURED) return;
    const p = msg.payload || {};
    console.log("[CTX " + CTX_BUILD + "] zapiska | menu: " + p.menu +
      " | id: " + p.id + " | type: " + p.type +
      " | link: " + p.link + " | db: " + (p.db || ""));

    // NAME_HINT: первый якорь с тем же id и непустым текстом.
    if (p.id) {
      const anchors = document.querySelectorAll("a[href]");
      for (const a of anchors) {
        if (!a.textContent.trim()) continue;
        // подхват: ok-ссылка, нормализованная к тому же id
        const href = a.getAttribute("href");
        if (!href) continue;
        let abs;
        try { abs = new URL(href, location.origin).href; } catch (e) { continue; }
        const id = okIdOf(abs);
        if (id === p.id) {
          chrome.runtime.sendMessage({
            type: CTX_MSG.NAME_HINT,
            payload: { id: p.id, name: a.textContent.trim() },
          }).catch(() => {});
          break;
        }
      }
    }
  });

  // ok-ид из ссылки (ok-специфика; ядро normalize.js НЕ трогать).
  function okIdOf(link) {
    try {
      const u = new URL(link);
      const m = u.pathname.match(/^\/(profile|group)\/(\d+)/);
      if (m) return m[1] + ":" + m[2];
      return u.pathname;
    } catch (e) { return link; }
  }
})();