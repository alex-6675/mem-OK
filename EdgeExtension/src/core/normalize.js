/* Context VK.RU · core/normalize.js · v07f2
 * Нормализатор и опознание портала.
 * v04r: portalOf / normalize / metPostOf.
 * v05r: короткие id БЕЗ ведущего слэша; metPostOf: значение w= матчится
 * regex без "^/" (через U, по А1).
 * v06r: + replyOf(url) — id ответа комментария из "reply=".
 * v07f2: + cleanUrl(url) — удостоверение без мусора: оставляем ТОЛЬКО
 *        reply/thread/w, отсекаем trackcode/recom и пр. (путь + оставшиеся параметры).
 * v07f3: cleanUrl применяется ко ВСЕМ сохраняемым строкам
 *        (identity.url, identity.metUrl, history.url); старые записи не мигрируются.
 * Regex с подчёркиванием собраны через U = String.fromCharCode(95).
 * Vanilla JS, ноль зависимостей (§2.2).
 */
(function () {
  "use strict";
  var U = String.fromCharCode(95);
  var RE_ID = /^\/id(\d+)$/;
  var RE_CLUB = /^\/club(\d+)$/;
  var RE_WALL = new RegExp("^/wall(-?\\d+)" + U + "(\\d+)$");
  var RE_WALL_BARE = new RegExp("^wall(-?\\d+)" + U + "(\\d+)$");

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ""; }
  }

  /* Опознание портала — только по адресу. */
  function portalOf(url) {
    var host = hostOf(url);
    if (host === "vk.ru" || host.endsWith(".vk.ru")) return "vk";
    if (host === "ok.ru" || host.endsWith(".ok.ru")) return "ok";
    if (host === "dzen.ru" || host.endsWith(".dzen.ru")) return "dzen";
    return "generic";
  }

  /* Нормализация id из ссылки. Тип — из пункта меню. id — без ведущего "/". */
  function normalize(link, menu) {
    var portal = portalOf(link);
    var path = "";
    try { path = new URL(link).pathname; } catch (e) { path = link || ""; }
    var id = path;
    if (portal === "vk") {
      var m;
      if ((m = path.match(RE_ID))) id = "id" + m[1];
      else if ((m = path.match(RE_CLUB))) id = "club" + m[1];
      else if ((m = path.match(RE_WALL))) id = "wall" + m[1] + U + m[2];
    }
    if (id && id.charAt(0) === "/") id = id.slice(1);
    var type = menu === "save-community" ? "COMMUNITY" : "PERSON";
    return { portal: portal, id: id, type: type, url: link };
  }

  /* Адрес встречи: wall-пост из пути pageUrl или из значения w= (без "/"). */
  function metPostOf(page) {
    try {
      var u = new URL(page);
      var m = u.pathname.match(RE_WALL);
      if (!m) m = (u.searchParams.get("w") || "").match(RE_WALL_BARE);
      if (m) return "wall" + m[1] + U + m[2];
      return u.pathname;
    } catch (e) { return page || ""; }
  }

  /* Id ответа комментария из ссылки (параметр "reply"). */
  function replyOf(url) {
    try { return new URL(url).searchParams.get("reply") || ""; }
    catch (e) { return ""; }
  }

  /* Удостоверение без мусора: путь + ТОЛЬКО reply/thread/w;
   * trackcode/recom и прочие параметры отсекаются. */
  function cleanUrl(raw) {
    var KEEP = ["reply", "thread", "w"];
    try {
      var u = new URL(raw);
      var keep = [];
      u.searchParams.forEach(function (v, k) {
        if (KEEP.indexOf(k) !== -1) keep.push(k + "=" + encodeURIComponent(v));
      });
      return u.origin + u.pathname + (keep.length ? "?" + keep.join("&") : "");
    } catch (e) { return raw; }
  }

  globalThis.CTX_NORMALIZE = Object.freeze({
    portalOf: portalOf,
    normalize: normalize,
    metPostOf: metPostOf,
    replyOf: replyOf,
    cleanUrl: cleanUrl,
  });
})();
