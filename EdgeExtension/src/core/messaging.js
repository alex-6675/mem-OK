/* Context VK.RU · core/messaging.js · v07g
 * Общие константы сообщений (MV3 message passing).
 *
 * v03r: CAPTURED (background -> content).
 * v07r: + OPEN_CARD (content -> background: открыть карточку коррекции).
 * v07f: + SAVE_AUTHOR (content -> background: автор из комментария по ПКМ на дате)
 *       и NAME_HINT (content -> background: имя из первого якоря).
 * v07f3: + MET_HINT (content -> background: точка встречи = первый комментарий,
 *        wall…?reply=… из a[data-testid="wall_comment_date"]).
 * v07f5: + LOG (dialog/content -> background: «ясные» логи записи в SW-консоли).
 * v07g ФИНАЛЬНЫЙ: + CTX_SYNC (background -> content: клик по значку — полная
 *   перерисовка стекла или локальный скальпель по выделению) и BADGE
 *   (content -> background: индикатор трёх состояний на значке).
 *   CTX_TOGGLE УБРАН — скальпель = доступ браузера «при нажатии».
 *
 * Подключение: в content-скрипты — манифестом, ПЕРЕД content.js;
 * в Service Worker — importScripts("./core/messaging.js").
 * Vanilla JS, ноль зависимостей (РЕГЛАМЕНТ §2.2).
 */

const CTX_BUILD = "v07g";

const CTX_MSG = Object.freeze({
  CAPTURED: "ctx:captured",
  OPEN_CARD: "ctx:open-card",
  SAVE_AUTHOR: "ctx:save-author",
  NAME_HINT: "ctx:name-hint",
  MET_HINT: "ctx:met-hint",
  LOG: "ctx:log",
  CTX_SYNC: "ctx:sync",
  BADGE: "ctx:badge",
});

globalThis.CTX_BUILD = CTX_BUILD;
globalThis.CTX_MSG = CTX_MSG;
