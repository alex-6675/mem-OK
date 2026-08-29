/* Context VK.RU · adapters/vkru.js · v03f2. Vanilla JS, ноль зависимостей.
   Все testid и regex с символом подчёркивания собраны через U —
   в исходнике литеральных подчёркиваний нет (§25 регламента:
   порче-невозможная передача кода). */
(function () {
  "use strict";
  var U = String.fromCharCode(95);
  var T_DATE = 'a[data-testid="wall' + U + 'comment' + U + 'date"]';
  var T_ROOT = '[data-testid="wall' + U + 'comments' + U + 'comment' + U + 'root"],' +
               '[data-testid="wall' + U + 'comments' + U + 'comment' + U + 'in' + U + 'thread"]';
  var T_OWNER = '[data-testid="comment-owner"]';
  var T_TEXT = '[data-testid="comment-text"]';
  var T_POST = '[data-testid="post"]';
  var TPOSTHEADER = '[data-testid="post-header"]';
  var TPOSTTITLE = '[data-testid="post-header-title"]';
  var RE_PERSON = /^\/id(\d+)$/;
  var RE_CLUB = /^\/club(\d+)$/;
  var RE_WALL = new RegExp("^/wall(-?\\d+)" + U + "(\\d+)$");

  function normalizeHref(raw) {
    if (!raw) return "";
    var u;
    try { u = new URL(raw, "https://vk.ru"); } catch (e) { return raw; }
    if (u.hostname !== "vk.ru" && !u.hostname.endsWith(".vk.ru")) return raw;
    var keep = [];
    u.searchParams.forEach(function (v, k) {
      if (k === "reply" || k === "thread") keep.push(k + "=" + v);
    });
    return u.pathname + (keep.length ? "?" + keep.join("&") : "");
  }
  function classify(pathname) {
    var m;
    if ((m = pathname.match(RE_PERSON))) return { type: "PERSON", id: "id" + m[1] };
    if ((m = pathname.match(RE_CLUB))) return { type: "COMMUNITY", id: "club" + m[1] };
    if ((m = pathname.match(RE_WALL)))
      return { type: m[1][0] === "-" ? "COMMUNITYPOST" : "PERSONPOST",
               id: "wall" + m[1] + U + m[2] };
    return { type: "OTHER", id: pathname };
  }
  function anchorOf(el) {
    if (!el) return null;
    if (el.tagName === "A" && el.getAttribute("href")) return el;
    return el.querySelector('a[href^="/"], a[href*="vk.ru/"]');
  }
  function trim(s, n) {
    s = (s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }
  function extractComment(dateAnchor) {
    var root = dateAnchor.closest(T_ROOT);
    if (!root) return null;
    var ownerA = anchorOf(root.querySelector(T_OWNER));
    var textEl = root.querySelector(T_TEXT);
    var authorHref = ownerA ? normalizeHref(ownerA.getAttribute("href")) : "";
    var cls = authorHref
      ? classify(new URL(authorHref, "https://vk.ru").pathname)
      : { type: "UNKNOWN", id: "" };
    var postId = "", replyId = "", threadId = "";
    try {
      var u = new URL(normalizeHref(dateAnchor.getAttribute("href")), "https://vk.ru");
      var wm = u.pathname.match(RE_WALL);
      if (wm) postId = "wall" + wm[1] + U + wm[2];
      replyId = u.searchParams.get("reply") || "";
      threadId = u.searchParams.get("thread") || "";
    } catch (e) {}
    return {
      entity: {
        kind: "COMMENT", type: cls.type,
        identity: { id: cls.id, url: authorHref },
        authorName: trim(ownerA ? ownerA.textContent : "", 60),
        text: trim(textEl ? textEl.textContent : "", 80),
        navigationTarget: dateAnchor.getAttribute("href") || "",
        context: { source: root.getAttribute("data-testid"),
                   postUrl: postId, replyId: replyId, threadId: threadId }
      },
      sourceElement: root
    };
  }
  function extractPost(postRoot) {
    var header = postRoot.querySelector(TPOSTHEADER);
    var ownerA =
      anchorOf(header ? header.querySelector(TPOSTTITLE) : null) ||
      (header ? header.querySelector('a[href^="/id"], a[href^="/club"]') : null);
    if (!ownerA) return null;
    var authorHref = normalizeHref(ownerA.getAttribute("href"));
    var cls = classify(new URL(authorHref, "https://vk.ru").pathname);
    var pid = postRoot.getAttribute("data-post-id") || "";
    return {
      entity: {
        kind: "POST", type: cls.type,
        identity: { id: cls.id, url: authorHref },
        authorName: trim(ownerA.textContent, 60),
        text: "",
        navigationTarget: ownerA.getAttribute("href") || "",
        context: { source: "post", postUrl: pid ? "wall" + pid : "",
                   replyId: "", threadId: "" }
      },
      sourceElement: postRoot
    };
  }
  function scan(doc) {
    var out = [];
    doc.querySelectorAll(T_DATE).forEach(function (d) {
      var e = extractComment(d); if (e) out.push(e);
    });
    doc.querySelectorAll(T_POST).forEach(function (p) {
      var e = extractPost(p); if (e) out.push(e);
    });
    return out;
  }
  globalThis.CTX_VKRU = Object.freeze(
    { scan: scan, normalizeHref: normalizeHref, classify: classify });
})();