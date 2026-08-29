/* M-03r (v03r) — данные рабочего листа.
 * Источник задания: reports/v_03/M03r.md (ветка main-qwen_v_03). */

export const reversalBefore = [
  "расширение постоянно сканирует страницу",
  "находит всех (массовый «охват») и логирует",
  "борьба с полигоном VK: сотни чужих элементов, которые VK меняет когда захочет",
];

export const reversalAfter = [
  "расширение молчит, пока пользователь не скажет «вот этот»",
  "браузер сам отдаёт linkUrl/pageUrl в момент ПКМ",
  "не зависит от vkit-* и верстки вообще; контракт изъятия общий для vk / ok / dzen / форумов",
];

export interface FlowStep {
  t: string;
  s: string;
}

export const captureFlow: FlowStep[] = [
  { t: "ПКМ на ссылке", s: "момент фиксации — действие пользователя" },
  { t: "опознание портала", s: "vk / ok / dzen / generic · v_04r" },
  { t: "нормализация id", s: "из ссылки, которую дал браузер · v_04r" },
  { t: "тип", s: "персонаж / сообщество — пункт меню" },
  { t: "дата + адрес встречи", s: "страница, где вы сейчас · v_05r" },
  { t: "контекст", s: "комментарий/пост — только по запросу" },
  { t: "запись в базу", s: "карточка + удостоверение · v_05r" },
];

export interface FateItem {
  what: string;
  fate: string;
  keep: boolean;
}

export const fateList: FateItem[] = [
  {
    what: "массовый сканер и MutationObserver",
    fate: "снимаются с обязанности — избыточны",
    keep: false,
  },
  {
    what: "coverage-гейт, ENTITY_FOUND, PING/PONG",
    fate: "сняты — фундамент перестроен",
    keep: false,
  },
  {
    what: "наработки по href-схеме и data-testid",
    fate: "идут в нормализатор (v_04r) и маркировку после F5 (v_06r)",
    keep: true,
  },
  {
    what: "adapters/vkru.js",
    fate: "не инжектится, остаётся в репо на будущее",
    keep: true,
  },
  {
    what: "маркировка после F5",
    fate: "направленная: «есть ли на странице МОИ сохранённые» — по ссылкам из своей базы",
    keep: true,
  },
];

export interface RStep {
  v: string;
  t: string;
  current?: boolean;
}

export const newOrder: RStep[] = [
  {
    v: "v_03r",
    t: "ПКМ на ссылке → «Сохранить персонажа / сообщество» → изъятие ссылки и страницы → лог. Фундамент.",
    current: true,
  },
  { v: "v_04r", t: "опознание портала + нормализация id + авто-тип" },
  { v: "v_05r", t: "запись в базу (id, портал, дата, адрес встречи); контракт карточки v2 вступает в силу" },
  { v: "v_06r", t: "после F5 маркировка сохранённых (направленный поиск по своим ссылкам)" },
  { v: "v_07r", t: "клик по метке → меню коррекции (примечание, тип)" },
];

export const cardContractV2 = `{
  cardId:      "c-0001",
  created:     "2026-08-20",
  displayName: "имя, выбранное пользователем",
  note:        "примечание",

  status:  "saved" | "dirt" | "partner" | "vip" | "custom",
  visual:  { faded: true/false },        // dirt => faded

  identities: [                           // СЛИЯНИЕ
    {
      portal: "vk" | "ok" | "dzen" | "forum" | "generic",
      id:     "id123 / club123 / ник",
      url:    "ссылка на него",
      name:   "ник как встретился",
      metAt:  "дата встречи",             // точка начала
      metUrl: "ссылка на место встречи (пост/комментарий)"
    },
    ...                                   // несколько на одну карточку
  ],

  access: {                               // закладывается СЕЙЧАС
    ownerOnly:    true/false,             // true = персонал не видит
    staffContact: "allowed" | "forbidden-no-reason"
  },

  history: [ {date, action, portal, url} ]
}`;

export const contractRules = [
  "ПКМ «сохранить» создаёт УДОСТОВЕРЕНИЕ; оно идёт в новую карточку или приклеивается к существующей (слияние).",
  "«dirt»: блеклость на странице + барьер общения; снятие — только из карточки.",
  "Белый список (partner/vip): ownerOnly=true, staffContact=forbidden-no-reason; персонал видит запрет БЕЗ объяснения причин.",
  "Значения по умолчанию при сохранении: status=saved, ownerOnly=false, staffContact=allowed.",
];

export interface ImplRow {
  decision: string;
  now: string;
  when: string;
}

export const implRows: ImplRow[] = [
  { decision: "Поля status / access / identities в контракте", now: "закладываются", when: "—" },
  { decision: "Сохранение с этими полями (дефолты)", now: "—", when: "v_05r" },
  { decision: "Блеклость «грязи» на странице", now: "—", when: "v_06r (маркировка)" },
  { decision: "Карточка: смена статуса, примечание", now: "—", when: "v_07r" },
  { decision: "Слияние (приклеить удостоверение)", now: "—", when: "v_08r" },
  { decision: "Экспорт/импорт файла базы", now: "—", when: "v_09r" },
  { decision: "Роли «владелец/персонал»", now: "поле есть", when: "когда появится персонал" },
];

export interface V03rFile {
  path: string;
  change: string;
  kind: "edit" | "replace" | "frozen";
}

export const v03rFiles: V03rFile[] = [
  {
    path: "manifest.json",
    change: "+ permissions: [\"contextMenus\"] · version 0.0.6 · убран adapters/vkru.js из js",
    kind: "edit",
  },
  {
    path: "src/core/messaging.js",
    change: "замена · CTX_BUILD=\"v03r\" · единственный тип CAPTURED",
    kind: "replace",
  },
  {
    path: "src/background.js",
    change: "замена · contextMenus (link) · изъятие {menu, link, page, ts} → CAPTURED",
    kind: "replace",
  },
  {
    path: "src/content.js",
    change: "замена · приём CAPTURED · строка captured | menu | link | page",
    kind: "replace",
  },
  {
    path: "src/adapters/vkru.js",
    change: "НЕ меняется и НЕ инжектится — остаётся в репо на будущее",
    kind: "frozen",
  },
];

export const testActions = [
  {
    t: "ПКМ на имени автора поста",
    d: "В контекстном меню видны «Сохранить персонажа» и «Сохранить сообщество».",
  },
  {
    t: "Клик «Сохранить персонажа» (link в статус-строке)",
    d: "Консоль F12, фильтр CTX: [CTX v03r] captured | menu: save-person | link: … | page: … — link совпадает со статус-строкой внизу слева.",
  },
  {
    t: "ПКМ по пустому месту страницы",
    d: "Наших пунктов НЕТ.",
  },
];

export const passCriteriaV03r = [
  "пункты есть только на ссылках",
  "изъятая link совпадает со статус-строкой",
  "page = текущая страница",
  "карточка расширения без ошибок",
];

export function buildResultV03r(verdict: "pass" | "fail", note: string): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const box = (on: boolean) => (on ? "[x]" : "[ ]");
  return `# RESULT · v03r · M-03r (новый фундамент: изъятие в момент фиксации)

**СТАТУС:** ${verdict.toUpperCase()}
**ПРОВЕРИЛ:** Пользователь (зафиксировано в рабочем листе)
**ДАТА:** ${date}

## Факт проверки (§5.6) — TEST_v03r.md

- Версия в карточке 0.0.6, ошибок нет: ${box(true)} да
- ПКМ на имени автора: пункты «Сохранить персонажа/сообщество» видны: ${box(verdict === "pass")} да
- captured | menu: save-person | link: … | page: …, link = статус-строка: ${box(verdict === "pass")} да
- ПКМ по пустому месту: наших пунктов нет: ${box(verdict === "pass")} да

## Вердикт

- ${box(verdict === "pass")} **PASS** — фундамент закрыт; далее v_04r
  (опознание портала + нормализация id + авто-тип)
- ${box(verdict === "fail")} **FAIL** — итерация внутри v03r

## Комментарий

${note || "—"}

---
Сформировано рабочим листом v03r. LLM статус не присваивала (§5.6):
выбор PASS/FAIL сделан Пользователем вручную.`;
}