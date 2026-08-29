/* Context VK.RU · src/ui/layer.js · v07g ФИНАЛЬНЫЙ
 * СТЕКЛО: собственный слой отрисовки по координатам, ВНЕ DOM VK.
 * (Диагноз v07d: marked 11 / wrappers in DOM 0 — React VK стирает
 * внедрённые узлы. Инъекция в чужой DOM ОСУЖДЕНА и не переносится.)
 *
 * - div#ctx-glass на document.body (fixed, pointer-events:none, z-index max);
 *   дети .ctx-g-hl / .ctx-g-mark — position:absolute.
 * - draw(scope): replaceChildren; по сохранённым текстовым якорям
 *   (href → normalize → INDEX.byId; если задан scope — только внутри него):
 *   getBoundingClientRect (width==0 → пропуск); .ctx-g-hl поверх ника
 *   (цвет карточки ~25%, dirt → grayscale+opacity); .ctx-g-mark «▲» у
 *   r.right+2 (pointer-events:auto; title «CTX: cN · имя»; click → OPEN_CARD).
 * - Триггеры: draw при старте, SPA-навигация, observer (600 мс), resize,
 *   scroll (rAF), интервал 2 с, storage.onChanged, CTX_SYNC (из content.js).
 * - ИНДИКАТОР — три состояния (бейдж ставит SW по сообщению BADGE):
 *   нет бейджа (серый) = стекла нет; жёлтый «…» = идёт поиск координат;
 *   зелёный «N» = стекло внедрено (N маркеров).
 *
 * Экспорт: CTX_LAYER { init, rescan, draw }.
 * Индексы INDEX / buildIndex — из content.js (общий мир страницы).
 * Vanilla JS, ноль зависимостей (§2.2).
 */
(() => {
  "use strict";

  let glass = null;
  let started = false;
  let observer = null;
  let obsTimer = 0;
  let redrawTimer = 0;
  let tickTimer = 0;
  let scrollRaf = 0;
  let lastUrl = location.href;

  function ensureGlass() {
    if (glass && document.body.contains(glass)) return;
    glass = document.createElement("div");
    glass.id = "ctx-glass";
    document.body.appendChild(glass);
  }

  /* Индикатор: «search» → жёлтый «…», «ready» → зелёный «N». */
  function badge(state, count) {
    chrome.runtime
      .sendMessage({ type: CTX_MSG.BADGE, payload: { state: state, count: count } })
      .catch(() => {});
  }

  /* Цвет карточки → заливка ~25% (hex + "40"). */
  function fillOf(card) {
    const hex = card.color || "#2b6fb3";
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    return hex + "40";
  }

  /* Отрисовка: scope=null — вся страница; элемент — только внутри него
   * (ЛОКАЛЬНЫЙ СКАЛЬПЕЛЬ: операция с секцией страницы по выделению). */
  function draw(scope) {
    ensureGlass();
    badge("search");
    glass.replaceChildren();

    const root = scope || document;
    let n = 0;
    root.querySelectorAll("a[href]").forEach((a) => {
      if (!a.textContent.trim()) return; /* якоря без текста не метим */
      const href = a.getAttribute("href");
      if (!href) return;
      let abs;
      try { abs = new URL(href, location.origin).href; } catch (e) { return; }
      const norm = CTX_NORMALIZE.normalize(abs, "save-person");
      if (!norm.id) return;
      const card = INDEX.byId.get(norm.id);
      if (!card) return;

      const r = a.getBoundingClientRect();
      if (r.width === 0) return; /* невидимый — пропуск */

      const hl = document.createElement("div");
      hl.className = "ctx-g-hl" + (card.status === "dirt" ? " ctx-g-faded" : "");
      hl.style.left = r.left + "px";
      hl.style.top = r.top + "px";
      hl.style.width = r.width + "px";
      hl.style.height = r.height + "px";
      hl.style.background = fillOf(card);
      glass.appendChild(hl);

      const mark = document.createElement("div");
      mark.className = "ctx-g-mark";
      mark.textContent = "▲";
      mark.style.left = r.right + 2 + "px";
      mark.style.top = r.top + "px";
      mark.title = "CTX: " + card.cardId +
        (card.displayName ? " · " + card.displayName : "");
      mark.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime
          .sendMessage({ type: CTX_MSG.OPEN_CARD, payload: { cardId: card.cardId } })
          .catch(() => {});
      });
      glass.appendChild(mark);
      n++;
    });

    console.log("[CTX " + CTX_BUILD + "] glass: " + n + " markers");
    badge("ready", n);
  }

  /* Триггеры подключаются один раз (контент запущен = доступ дан). */
  function startTriggers() {
    if (started) return;
    started = true;

    /* SPA-навигация и подгрузка ленты */
    observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        draw();
      }
      clearTimeout(obsTimer);
      obsTimer = setTimeout(draw, 600);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", () => {
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(draw, 120);
    });

    /* координаты плывут при скролле — перерисовка по rAF */
    window.addEventListener("scroll", () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        draw();
      });
    }, { passive: true });

    /* спокойный интервал — страховка от незамеченных изменений */
    tickTimer = setInterval(draw, 2000);

    /* живая база: цвет / dirt / новые карточки → перерисовка */
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[CTX_STORAGE.KEY]) return;
      const next = changes[CTX_STORAGE.KEY].newValue || { cards: [] };
      buildIndex(next);
      draw();
    });
  }

  /* init(scope): старт триггеров (один раз) + отрисовка.
   * scope — ближайший контейнер выделения (пришёл из CTX_SYNC) или null. */
  function init(scope) {
    startTriggers();
    draw(scope || null);
  }

  globalThis.CTX_LAYER = Object.freeze({
    init: init,
    rescan: function () { draw(); },
    draw: draw,
  });
})();
