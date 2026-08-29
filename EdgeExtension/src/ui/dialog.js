/* Context VK.RU · ui/dialog.js · v07g
 * Страница карточки коррекции (открывается из SW через chrome.windows.create,
 * url: dialog.html#cardId). Поля: displayName, note, status, тип (R16),
 * цвет (палитра 5), identities — только чтение, «точка встречи и история».
 *
 * v07g: переезд src/dialog.js → src/ui/dialog.js (структура src/ui);
 * ПОВЕДЕНИЕ НЕ МЕНЯЕТСЯ. В dialog.html добавлен messaging.js — без него
 * CTX_BUILD/CTX_MSG были undefined и «ясный» лог бросал TypeError после
 * saveDb (окно не закрывалось).
 * v07f: кнопка «Удалить карточку» (подтверждение) → filter, saveDb, close.
 * v07f2: «ТОЧКА ВСТРЕЧИ И ИСТОРИЯ» (чтение, последние 5) + селект ответа.
 * v07f4: ПРАВИЛО ЕДИНСТВЕННОГО ПИСАТЕЛЯ — каждый saveDb только после свежего
 * loadDb (read-modify-write); селект ответа «ожидание / да / нет».
 * v07f5: селект «тип» (персона/сообщество); «ясные» логи через LOG в SW.
 * «Сохранить» → saveDb → закрыть окно. Поле access не трогается.
 * Vanilla JS, ноль зависимостей (§2.2).
 */
(function () {
  "use strict";

  var PALETTE = ["#2b6fb3", "#3a7d44", "#a63d40", "#8a6d1f", "#6b5b95"];
  var cardId = decodeURIComponent(location.hash.slice(1));
  var chosenColor = PALETTE[0];

  /* v07f4: селект — только «ожидание / да / нет».
   * Маппинг при чтении старых записей:
   * нет ответа→ожидание; ответила|согласилась→да; отказ→нет. */
  function normalizeAnswer(a) {
    if (a === "да" || a === "ответила" || a === "согласилась") return "да";
    if (a === "нет" || a === "отказ") return "нет";
    return "ожидание"; /* "" / "нет ответа" / неизвестное */
  }

  CTX_STORAGE.loadDb().then(function (db) {
    var card = null;
    for (var i = 0; i < db.cards.length; i++) {
      if (db.cards[i].cardId === cardId) { card = db.cards[i]; break; }
    }
    if (!card) {
      document.getElementById("card-id").textContent = cardId || "?";
      var ids = document.getElementById("f-identities");
      var li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Карточка не найдена в базе.";
      ids.appendChild(li);
      document.getElementById("btn-save").disabled = true;
      document.getElementById("btn-delete").disabled = true;
      return;
    }
    fill(card);
    wire(card);
  }).catch(function () {
    document.getElementById("card-id").textContent = "ошибка чтения базы";
  });

  function fill(card) {
    document.getElementById("card-id").textContent = card.cardId;
    document.getElementById("f-name").value = card.displayName || "";
    document.getElementById("f-note").value = card.note || "";
    document.getElementById("f-status").value = card.status || "saved";
    /* v07f5 (R16): тип персона/сообщество; старые карточки без type — персона */
    document.getElementById("f-type").value = card.type === "COMMUNITY" ? "COMMUNITY" : "PERSON";
    chosenColor = card.color || PALETTE[0];

    var pal = document.getElementById("f-palette");
    PALETTE.forEach(function (c) {
      var sw = document.createElement("button");
      sw.type = "button";
      sw.className = "swatch" + (c === chosenColor ? " sel" : "");
      sw.style.background = c;
      sw.dataset.color = c;
      sw.title = c;
      sw.addEventListener("click", function () {
        chosenColor = c;
        var all = pal.querySelectorAll(".swatch");
        for (var j = 0; j < all.length; j++) {
          all[j].className = "swatch" + (all[j].dataset.color === chosenColor ? " sel" : "");
        }
      });
      pal.appendChild(sw);
    });

    var ul = document.getElementById("f-identities");
    var list = card.identities || [];
    if (!list.length) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "нет удостоверений";
      ul.appendChild(empty);
    } else {
      list.forEach(function (it) {
        var li = document.createElement("li");
        li.textContent = it.portal + " · " + it.id +
          (it.replyId ? "#" + it.replyId : "") + " — " + it.url;
        ul.appendChild(li);
      });
    }

    /* Точка встречи и история (чтение, последние 5) */
    renderMeet(card);
  }

  /* «дата · кто · точка встречи (url) · ответ» + селект ответа */
  function renderMeet(card) {
    var meet = document.getElementById("f-meet");
    meet.innerHTML = "";
    var who = card.displayName ||
      ((card.identities && card.identities[0] && card.identities[0].id) || card.cardId);
    var last5 = (card.history || []).slice(-5).reverse();
    if (!last5.length) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "встреч пока нет";
      meet.appendChild(empty);
    } else {
      last5.forEach(function (h) {
        var li = document.createElement("li");
        li.textContent = (h.date || "") + " · " + who + " · " + (h.url || "") +
          " · " + normalizeAnswer(h.answer);
        meet.appendChild(li);
      });
    }
    var sel = document.getElementById("f-answer");
    var last = (card.history || []).slice(-1)[0];
    sel.disabled = !last;
    sel.value = last ? normalizeAnswer(last.answer) : "ожидание";
  }

  /* v07f4: ПРАВИЛО ЕДИНСТВЕННОГО ПИСАТЕЛЯ (устраняет D18 — воскрешение/стирание).
   * Каждый saveDb — ТОЛЬКО после свежего loadDb в том же обработчике
   * (read-modify-write); никаких «долгоживущих» объектов db для записи.
   * db, загруженная при открытии окна, для записи НЕ используется. */
  function wire(card) {
    /* «Сохранить» — свежая db, правим найденную карточку, пишем, закрываем */
    document.getElementById("btn-save").addEventListener("click", async function () {
      var db = await CTX_STORAGE.loadDb();
      var fresh = db.cards.find(function (c) { return c.cardId === cardId; });
      if (!fresh) { window.close(); return; }
      fresh.displayName = document.getElementById("f-name").value;
      fresh.note = document.getElementById("f-note").value;
      fresh.status = document.getElementById("f-status").value;
      fresh.type = document.getElementById("f-type").value; /* v07f5 (R16) */
      fresh.color = chosenColor;
      fresh.visual = fresh.visual || {};
      fresh.visual.faded = fresh.status === "dirt"; /* «грязь» → блеклость */
      await CTX_STORAGE.saveDb(db);
      console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
      /* v07f5: «ясный» лог записи в SW-консоли */
      chrome.runtime.sendMessage({ type: CTX_MSG.LOG,
        payload: { text: "card " + cardId + " saved" } }).catch(function () {});
      window.close();
    });

    /* «Ответ последнего контакта» → answer в последнюю запись истории */
    document.getElementById("f-answer").addEventListener("change", async function () {
      var db = await CTX_STORAGE.loadDb();
      var fresh = db.cards.find(function (c) { return c.cardId === cardId; });
      if (!fresh) return;
      var last = (fresh.history || []).slice(-1)[0];
      if (!last) return;
      last.answer = document.getElementById("f-answer").value;
      await CTX_STORAGE.saveDb(db);
      console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
      renderMeet(fresh);
    });

    /* УДАЛЕНИЕ ДОЛЖНО УДАЛЯТЬ — свежая db, filter, saveDb, close.
     * Стекло (ui/layer.js) по storage.onChanged само снимет метки. */
    var btnDelete = document.getElementById("btn-delete");
    btnDelete.disabled = false;
    btnDelete.addEventListener("click", async function () {
      if (!window.confirm("Удалить карточку " + cardId + "? Это действие нельзя отменить.")) return;
      var db = await CTX_STORAGE.loadDb();
      db.cards = db.cards.filter(function (c) { return c.cardId !== cardId; });
      await CTX_STORAGE.saveDb(db);
      console.log("[CTX " + CTX_BUILD + "] card " + cardId + " удалена");
      console.log("[CTX " + CTX_BUILD + "] db записана (total " + db.cards.length + ")");
      /* v07f5: «ясный» лог удаления в SW-консоли */
      chrome.runtime.sendMessage({ type: CTX_MSG.LOG,
        payload: { text: "card " + cardId + " удалена" } }).catch(function () {});
      window.close();
    });

    document.getElementById("btn-close").addEventListener("click", function () {
      window.close();
    });
  }
})();
