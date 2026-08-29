// src/data/debug.ts — ОТЛАДКА одинокого строителя. TASK-0155: затычка, пусто.
// Сюда пишут инструменты (разметка, ingest, приём волонтёров): уровень + источник + текст.
// После наполнения и компиляции выставьте window.MEMOK.debug — дашборд подхватит.

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

export const debug: DebugLine[] = [];
