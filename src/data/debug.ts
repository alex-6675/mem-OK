// src/data/debug.ts — ОТЛАДКА одинокого строителя.
// Канон живёт здесь; dashboard/index.html до компиляции дублирует сидом window.MEMOK.

/** Строка отладочного журнала. */
export interface DebugLine {
  /** Unix, сек. */
  ts: number;
  /** Уровень. */
  level: "info" | "warn" | "error";
  /** Источник: mark | ingest | volunteer | bot | … */
  source: string;
  /** Текст сообщения. */
  text: string;
}

export const debug: DebugLine[] = [
  {
    ts: 1787270400,
    level: "info",
    source: "mark",
    text: "TASK-0151 PASS: 5 карточек (1 СОО «Лента» + 4 ПЕРСОН), дедуп живой, NAME_HINT живой, граница PERSON/COMMUNITY держит",
  },
];
