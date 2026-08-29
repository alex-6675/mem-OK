/* Context VK.RU · v07g · background.js
 * v03r: ПКМ-изъятие — браузер сам отдаёт linkUrl/pageUrl (Решение №2).
 * v04r: нормализатор — портал, id, тип (из меню), metPost (из page).
 * v05r: запись в базу (chrome.storage.local) по контракту карточки v2.
 * v06r: дедуп по portal+id+replyId.
 * v07f (по RESULT_v07r.md, Решение №5):
 *   - ПКМ по дате комментария: карточка НЕ создаётся (нет мусорных wall-карточек);
 *     автор извлекается контентом и приходит сообщением SAVE_AUTHOR.
 *   - SAVE_AUTHOR: нормализация автора; есть карточка → history += met,
 *     «уже в базе (card cN) + точка встречи»; нет → новая карточка автора,
 *     «автор сохранён (card cN)»; автор не найден → «автор не найден — не сохранено».
 *   - Одно окно на карточку: карта cardId→windowId, focus вместо create.
 *   - NAME_HINT: имя из первого якоря → identity.name и displayName (если пуст).
 * v07f2: удостоверение без мусора — identity.url = cleanUrl(link)
 *   (только reply/thread/w; trackcode/recom и пр. отсекаются);
 *   запись истории {date, action, url, answer} (Решение №7).
 * v07f3: точка встречи = первый комментарий (MET_HINT из wall_comment_date).
 * v07f4: правило единственного писателя — каждый обработчик читает свежую db
 *   перед saveDb (read-modify-write); лог «db записана (total N)» после каждой записи.
 * v07f5: граница персона/сообщество (R16) — при изъятии пишется card.type
 *   PERSON|COMMUNITY; обработчик LOG — «ясные» логи записи в SW-консоли.
 * v07f6: NAME_HINT — displayName пишется ТОЛЬКО если пуст; если уже задан —
 *   НЕ трогается (лог «имя НЕ тронуто: cN (уже задано)»); identity.name —
 *   только если пуст. В db пишем лишь при фактическом изменении.
 * v07g ФИНАЛЬНЫЙ: скальпель — через доступ браузера «при нажатии»
 *   (CTX_TOGGLE убран). Клик по значку → CTX_SYNC во вкладку: полная
 *   перерисовка стекла или локальный скальпель по текстовому выделению.
 *   ИНДИКАТОР — badge трёх состояний (по сообщению BADGE из контента):
 *   серый без текста = стекла нет; жёлтый «…» = поиск координат;
 *   зелёный «N» = стекло внедрено.
 * Vanilla JS, ноль зависимостей (§2.2).
 */
importScripts("./core/messaging.js");
importScripts("./core/normalize.js");
importScripts("./core/storage.js");
console.log("[CTX " + CTX_BUILD + "] service worker started");

/* ИНДИКАТОР: по умолчанию бейджа нет (серый) = стекла нет. */
function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setBadgeBackgroundColor({ color: "#9aa0a6" });
}

chrome.runtime.onInstalled.addListener(() => {
  clearBadge();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "save-person", title: "Сохранить персонажа", contexts: ["link"] });
    chrome.contextMenus.create({ id: "save-community", title: "Сохранить сообщество", contexts: ["link"] });
  });
});

function nextCardId(cards) {
  var n = 0;
  cards.forEach(function (c) {
    var m = /^c(\d+)$/.exec(c.cardId || "");
    if (m) { var v = parseInt(m[1], 10); if (v > n) n = v; }
  });
  return "c" + (n + 1);
}

/* Одно окно на карточку: cardId -> windowId */
const openWindows = new Map();
chrome.windows.onRemoved.addListener((windowId) => {
  for (const [cid, wid] of openWindows) {
    if (wid === windowId) openWindows.delete(cid);
  }
});

/* ---------- ПКМ «Сохранить персонажа/сообщество» ---------- */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const link = info.linkUrl || "";
  const page = info.pageUrl || "";
  const reply = CTX_NORMALIZE.replyOf(link);

  /* Дата комментария: карточку не создаём — автор извлекается при ПКМ (SAVE_AUTHOR). */
  if (reply) {
    console.log("[CTX " + CTX_BUILD + "] дата комментария — карточка не создаётся (автор извлекается при ПКМ)");
    return;
  }

  const norm = CTX_NORMALIZE.normalize(link, info.menuItemId);
  const metPost = CTX_NORMALIZE.metPostOf(page);
  const date = new Date().toISOString().slice(0, 10);

  const db = await CTX_STORAGE.loadDb();
  let logLine;

  /* Дедуп: person/community — portal+id при отсутствии replyId у identity. */
  const existing = db.cards.find(function (c) {
    return (c.identities || []).some(function (it) {
      return it.portal === norm.portal && it.id === norm.id && !it.replyId;
    });
  });

  if (existing) {
    existing.lastSeen = date;
    existing.history = (existing.history || []).concat([
      { date: date, action: "captured", portal: norm.portal, url: CTX_NORMALIZE.cleanUrl(link), answer: "" },
    ]);
    logLine = "уже в базе (card " + existing.cardId + ")";
  } else {
    const cardId = nextCardId(db.cards);
    db.cards.push({
      cardId: cardId,
      created: date,
      displayName: "",
      note: "",
      type: norm.type, /* v07f5 (R16): PERSON | COMMUNITY — из пункта меню */
      status: "saved",
      visual: { faded: false },
      identities: [{
        portal: norm.portal, id: norm.id, url: CTX_NORMALIZE.cleanUrl(link),
        name: "", metAt: date, metUrl: CTX_NORMALIZE.cleanUrl(metPost),
      }],
      access: { ownerOnly: false, staffContact: "allowed" },
      history: [{ date: date, action: "captured", portal: norm.portal, url: CTX_NORMALIZE.cleanUrl(link), answer: "" }],
    });
    logLine = "saved card " + cardId + " (total " + db.cards.length + ")";
  }
  await CTX_STORAGE.saveDb(db);
  console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");

  const captured = {
    menu: info.menuItemId, link: link, page: page,
    portal: norm.portal, id: norm.id, type: norm.type, metPost: metPost,
    db: logLine, ts: Date.now(),
  };
  console.log("[CTX " + CTX_BUILD + "] captured:", captured);
  console.log("[CTX " + CTX_BUILD + "] " + logLine);
  if (tab && tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { type: CTX_MSG.CAPTURED, payload: captured }).catch(() => {});
  }
});

/* ---------- SAVE_AUTHOR: автор из комментария ---------- */
async function handleSaveAuthor(payload) {
  const authorHref = payload.authorHref || "";
  const metUrl = payload.metUrl || "";
  const date = new Date().toISOString().slice(0, 10);

  if (!authorHref) {
    console.log("[CTX " + CTX_BUILD + "] автор не найден — не сохранено");
    return;
  }
  const norm = CTX_NORMALIZE.normalize(authorHref, "save-person");
  if (!norm.id) {
    console.log("[CTX " + CTX_BUILD + "] автор не найден — не сохранено");
    return;
  }

  const db = await CTX_STORAGE.loadDb();
  const existing = db.cards.find(function (c) {
    return (c.identities || []).some(function (it) {
      return it.portal === norm.portal && it.id === norm.id && !it.replyId;
    });
  });

  if (existing) {
    existing.lastSeen = date;
    existing.history = (existing.history || []).concat([
      { date: date, action: "met", url: CTX_NORMALIZE.cleanUrl(metUrl), answer: "" },
    ]);
    console.log("[CTX " + CTX_BUILD + "] уже в базе (card " + existing.cardId + ") + точка встречи");
  } else {
    const cardId = nextCardId(db.cards);
    db.cards.push({
      cardId: cardId,
      created: date,
      displayName: "",
      note: "",
      type: "PERSON", /* v07f5 (R16): автор комментария — всегда персона */
      status: "saved",
      visual: { faded: false },
      identities: [{
        portal: norm.portal, id: norm.id, url: CTX_NORMALIZE.cleanUrl(authorHref),
        name: "", metAt: date, metUrl: CTX_NORMALIZE.cleanUrl(metUrl),
      }],
      access: { ownerOnly: false, staffContact: "allowed" },
      history: [{ date: date, action: "met", url: metUrl, answer: "" }],
    });
    console.log("[CTX " + CTX_BUILD + "] автор сохранён (card " + cardId + ")");
  }
  await CTX_STORAGE.saveDb(db);
  console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
}

/* ---------- NAME_HINT: имя из первого якоря ---------- */
async function handleNameHint(payload) {
  const id = payload.id || "";
  const name = payload.name || "";
  if (!id || !name) return;

  const db = await CTX_STORAGE.loadDb();
  const card = db.cards.find(function (c) {
    return (c.identities || []).some(function (it) { return it.id === id; });
  });
  if (!card) return;

  /* v07f6: имя — только если пусто. Если displayName уже задан
   * (пользователем или ранее) — НЕ трогаем и явно логируем. */
  const it = card.identities.find(function (x) { return x.id === id; });
  let identityUpdated = false;
  if (it && !it.name) { it.name = name; identityUpdated = true; }

  if (!card.displayName) {
    /* displayName пуст — записываем имя */
    card.displayName = name;
    await CTX_STORAGE.saveDb(db);
    console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
    console.log("[CTX " + CTX_BUILD + "] имя сохранено: " + card.cardId + " → " + name);
  } else if (identityUpdated) {
    /* displayName уже задан — его не трогаем, но identity.name обновили */
    await CTX_STORAGE.saveDb(db);
    console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
    console.log("[CTX " + CTX_BUILD + "] имя НЕ тронуто: " + card.cardId + " (уже задано)");
  } else {
    /* менять нечего — не пишем */
    console.log("[CTX " + CTX_BUILD + "] имя НЕ тронуто: " + card.cardId + " (уже задано)");
  }
}

/* ---------- MET_HINT: точка встречи = первый комментарий (v07f3) ---------- */
async function handleMetHint(payload) {
  const id = payload.id || "";
  const commentUrl = CTX_NORMALIZE.cleanUrl(payload.commentUrl || "");
  if (!id || !commentUrl) return;

  const db = await CTX_STORAGE.loadDb();
  const card = db.cards.find(function (c) {
    return (c.identities || []).some(function (it) { return it.id === id; });
  });
  if (!card) return;

  /* identity.metUrl = commentUrl; url последней записи history — тоже commentUrl. */
  const it = card.identities.find(function (x) { return x.id === id; });
  if (it) it.metUrl = commentUrl;
  const last = (card.history || []).slice(-1)[0];
  if (last) last.url = commentUrl;
  await CTX_STORAGE.saveDb(db);
  console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
  console.log("[CTX " + CTX_BUILD + "] точка встречи: " + card.cardId + " → " + commentUrl);
}

/* ---------- приём сообщений ---------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return false;

  if (msg.type === CTX_MSG.OPEN_CARD) {
    const cardId = (msg.payload && msg.payload.cardId) || "";
    if (openWindows.has(cardId)) {
      chrome.windows.update(openWindows.get(cardId), { focused: true }).catch(() => {});
    } else {
      chrome.windows.create({
        url: chrome.runtime.getURL("dialog.html") + "#" + encodeURIComponent(cardId),
        type: "popup", width: 480, height: 640, focused: true,
      }).then((w) => { openWindows.set(cardId, w.id); }).catch(() => {});
    }
    return false;
  }
  if (msg.type === CTX_MSG.SAVE_AUTHOR) { handleSaveAuthor(msg.payload || {}); return false; }
  if (msg.type === CTX_MSG.NAME_HINT) { handleNameHint(msg.payload || {}); return false; }
  if (msg.type === CTX_MSG.MET_HINT) { handleMetHint(msg.payload || {}); return false; }
  /* v07f5: «ясные» логи записи из диалога в SW-консоли */
  if (msg.type === CTX_MSG.LOG) {
    console.log("[CTX " + CTX_BUILD + "] " + ((msg.payload && msg.payload.text) || ""));
    return false;
  }
  /* v07g: ИНДИКАТОР — badge трёх состояний (ставится для вкладки-отправителя).
   * search → жёлтый «…» (идёт поиск координат); ready → зелёный «N». */
  if (msg.type === CTX_MSG.BADGE) {
    const p = msg.payload || {};
    const tabId = sender.tab ? sender.tab.id : undefined;
    if (p.state === "search") {
      chrome.action.setBadgeText({ text: "…", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#e8b931", tabId: tabId });
    } else if (p.state === "ready") {
      chrome.action.setBadgeText({ text: String(p.count || 0), tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#3a7d44", tabId: tabId });
    }
    return false;
  }
  return false;
});

/* ---------- v07g: КЛИК ПО ЗНАЧКУ → CTX_SYNC во вкладку ----------
 * Контент сам решает: нет выделения → полная перерисовка стекла
 * («искать новые координаты», лечит «стекло разбито»);
 * есть текстовое выделение → локальный скальпель (маркеры только
 * внутри ближайшего контейнера с выделением). */
chrome.action.onClicked.addListener((tab) => {
  if (!tab || tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: CTX_MSG.CTX_SYNC }).catch(() => {
    /* вкладка без контент-скрипта (нет доступа «при нажатии» или не vk.ru) */
  });
});
