/* Фикс v_03f — данные по report_v_03.md (ветка main-qwen_v_03).
 * Селекторы — verbatim-контракт сборки (BUILD_v_03f.md). */

export interface EvidenceRow {
  sel: string;
  sep: string;
  works: boolean;
  evidence: string;
}

export const evidenceRows: EvidenceRow[] = [
  {
    sel: 'post · post-header · post-header-title',
    sep: "дефис",
    works: true,
    evidence: "POST-сущности найдены на всех страницах, авторы извлечены",
  },
  {
    sel: "postdateblock_preview",
    sep: "подчёркивание",
    works: false,
    evidence: "во всех логах post=- (postUrl не извлёкся)",
  },
  {
    sel: "wall_comment_date · wallcomments_comment_root …",
    sep: "подчёркивание",
    works: false,
    evidence: "0 COMMENT при доказанном наличии date-ссылок (/kursporezbe: ?reply=1014)",
  },
];

export const verbatimSelectors = [
  "wall_comment_date",
  "wallcomments_comment_root",
  "wallcomments_comment_in_thread",
  "postdateblock_preview",
  "comment-owner",
  "comment-text",
  "post",
  "post-header",
  "post-header-title",
];

export const processRules = [
  {
    t: "РЕПО-ГЕЙТ",
    d: "Код передаётся только закоммиченным файлом: после итерации Coder коммитит EdgeExtension/ в ветку; проектировщик верифицирует raw-файл на GitHub ДО теста пользователем.",
  },
  {
    t: "Запрет рендер-вью",
    d: "Не копировать код из чата: markdown съедает одиночные подчёркивания. Копировать только из raw/исходника сообщения или из файла в VS Code.",
  },
  {
    t: "Самодиагностика",
    d: "Вместо внешних DIAG-snippet'ов: content.js сам логирует coverage posts/dates/roots — порча селекторов видна мгновенно.",
  },
];

export const fixFiles = [
  { path: "src/core/messaging.js", note: 'CTX_BUILD = "v_03f"' },
  { path: "manifest.json", note: "version 0.0.4" },
  { path: "src/content.js", note: "+ coverage-лог при изменении счётчиков" },
  { path: "src/adapters/vkru.js", note: "без изменений: verbatim-селекторы уже истинные" },
];

export interface Scenario {
  id: string;
  page: string;
  expect: string[];
}

export const scenarios: Scenario[] = [
  {
    id: "P1",
    page: "/collabis (или /kursporezbe) с раскрытыми комментариями",
    expect: [
      "coverage: dates>0 и roots>0",
      "строки COMMENT с post=wall-228585143_… и reply=…",
      "SW: entities reported включает COMMENT",
    ],
  },
  {
    id: "P2",
    page: "feed?w=wall-234325978_1730",
    expect: ["POST (post=wall-…) + COMMENT"],
  },
  {
    id: "P3",
    page: "/id815989371",
    expect: ["POST PERSON + комментарии"],
  },
  {
    id: "P4",
    page: "example.com",
    expect: ["тишина — нет строк [CTX v_03f]"],
  },
];

export const passCriteria = [
  "coverage dates>0 на P1–P3",
  "COMMENT обнаружены (включая треды), postUrl извлечён (post≠-)",
  "дедуп без повторов; SW получил COMMENT",
  "P4 тишина; карточка без ошибок; PING/PONG жив (регрессия)",
];