/* Context VK.RU · core/storage.js · v05r
 * Персистентная база (chrome.storage.local), ключ "ctxdb".
 * DB = { version: 1, cards: [] } — карточки по контракту v2 (Дополнение №3).
 * Подключение: Service Worker — importScripts("./core/storage.js");
 * content-скрипты — манифестом, ПЕРЕД content.js.
 * Vanilla JS, ноль зависимостей (§2.2).
 */
(function () {
  "use strict";
  var KEY = "ctxdb";

  function defaultDb() {
    return { version: 1, cards: [] };
  }

  function loadDb() {
    return chrome.storage.local.get(KEY).then(function (res) {
      var db = res ? res[KEY] : null;
      if (!db || typeof db !== "object" || !Array.isArray(db.cards)) return defaultDb();
      return db;
    });
  }

  function saveDb(db) {
    var obj = {};
    obj[KEY] = db;
    return chrome.storage.local.set(obj);
  }

  globalThis.CTX_STORAGE = Object.freeze({
    KEY: KEY,
    loadDb: loadDb,
    saveDb: saveDb,
  });
})();
