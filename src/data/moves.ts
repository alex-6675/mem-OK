// src/data/moves.ts — ДВИЖЕНИЯ одинокого строителя.
// Канон живёт здесь; dashboard/index.html до компиляции дублирует эти записи
// сидом window.MEMOK (после подключения скомпилированных данных сид удалить).

/** Движение — факт изменения в картотеке/журналах. append-only. */
export interface Move {
  /** Сквозной id: m-0001, m-0002, … */
  id: string;
  /** Unix, сек. */
  ts: number;
  /** Тип движения. */
  kind: "card" | "publish" | "merge" | "geo" | "mark" | "system";
  /** Что произошло (коротко, для человека). */
  text: string;
  /** Координата: карточка / файл / отчёт (необязательно). */
  target?: string;
}

export const moves: Move[] = [
  {
    id: "m-0001",
    ts: 1787270400,
    kind: "mark",
    text: "маркировка ОК полетела: 5 карточек, правила v07g живы",
    target: "ok.ru · TASK-0151 PASS",
  },
];
