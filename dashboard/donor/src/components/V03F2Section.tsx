import { useState } from "react";
import {
  rows3C,
  conclusions3C,
  assemblyLines,
  fix2Files,
  gateSteps,
  passCriteriaV03F2,
  buildResultV03Fix2,
} from "../data/v03f2";
import type { Verdict } from "./V01Sheet";
import Reveal from "./Reveal";

const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  replace: { label: "замена", cls: "border-steel/50 bg-steel/10 text-steel" },
  edit: { label: "точечно", cls: "border-warn/50 bg-warn/10 text-warn" },
  frozen: { label: "не тронут", cls: "border-pass/50 bg-pass/10 text-pass" },
};

export default function V03F2Section({
  verdict,
  setVerdict,
  active = true,
}: {
  verdict: Verdict;
  setVerdict: (v: Verdict) => void;
  active?: boolean;
  locked?: boolean;
}) {
  const [note, setNote] = useState("");

  const download = () => {
    if (!verdict) return;
    const blob = new Blob([buildResultV03Fix2(verdict, note)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RESULT_v_03.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* левая колонка */}
        <div className="space-y-6">
          <Reveal>
            <div className="cornered border border-line bg-panel/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  3C · прод повреждён, архитектура здорова
                </h3>
                <span className="border border-warn/50 bg-warn/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-warn">
                  /feed · ground truth
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line2">
                      <th className="py-2 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                        Показатель
                      </th>
                      <th className="py-2 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                        Ground truth
                      </th>
                      <th className="py-2 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                        Coverage
                      </th>
                      <th className="py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                        Вывод
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows3C.map((r) => (
                      <tr
                        key={r.metric}
                        className="group border-b border-line/60 align-top transition-colors last:border-b-0 hover:bg-steel/[0.04]"
                      >
                        <td className="py-3 pr-4 font-mono text-[11.5px] font-bold text-ink">
                          {r.metric}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[12px] text-dim">{r.truth}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`font-mono text-[13px] font-bold ${
                              r.ok ? "text-pass" : "text-fail"
                            }`}
                          >
                            {r.coverage}
                          </span>
                        </td>
                        <td className="py-3 text-[12px] leading-relaxed text-dim">{r.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-2">
                {conclusions3C.map((c) => (
                  <li key={c} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-steel" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="cornered border border-steel/40 bg-inset/90 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Порче-невозможность · §25
                </h3>
                <span className="border border-steel/50 bg-steel/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-steel">
                  U = String.fromCharCode(95)
                </span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-dim">
                В строковом содержимом селекторов и regex нет литеральных подчёркиваний —
                они собираются в runtime. Канал передачи физически не может съесть то,
                чего в исходнике нет.
              </p>
              <div className="mt-4 space-y-2.5">
                {assemblyLines.map((l) => (
                  <div
                    key={l.source}
                    className="group border border-line/70 bg-panel/60 px-4 py-3 transition-all hover:border-steel/50 hover:bg-panel"
                  >
                    <p className="overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-dim">
                      <span className="text-steel">U</span>
                      <span className="text-faint"> := </span>
                      <span className="text-warn">String.fromCharCode(95)</span>
                      <span className="text-faint"> = </span>
                      <span className="text-ink">"_"</span>
                    </p>
                    <p className="mt-1.5 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-dim">
                      {l.source}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap font-mono text-[12px] font-bold text-pass">
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="shrink-0">
                        <path d="M1 5h8m0 0L6 1.8M9 5L6 8.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {l.result}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Файлы сборки · 0.0.5
                </h3>
                <span className="font-mono text-[10px] text-faint">BUILD_v03f2.md</span>
              </div>
              <ul className="mt-3.5 space-y-2">
                {fix2Files.map((f) => {
                  const b = KIND_BADGE[f.kind];
                  return (
                    <li
                      key={f.path}
                      className="group border border-line/70 bg-inset/60 px-3.5 py-2.5 transition-colors hover:border-line2 hover:bg-inset"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-mono text-[12px] font-bold text-ink">{f.path}</p>
                        <span
                          className={`ml-auto border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-dim">{f.change}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* правая колонка */}
        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="cornered border border-warn/50 bg-warn/[0.06] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-[16px] font-bold text-warn">
                  Приёмочный гейт · coverage
                </h3>
                <span className="blink-soft border border-warn/50 bg-warn/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-warn">
                  roots&gt;0
                </span>
              </div>
              <div className="mt-4 border border-line/70 bg-inset/80 px-4 py-3.5">
                <p className="font-mono text-[12px] leading-relaxed text-dim">
                  <span className="text-steel">[CTX v03f2]</span> coverage posts/dates/roots ={" "}
                  <span className="text-ink">4/168/168</span>
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-faint">
                  ожидание на /feed · roots=0 → код повреждён → СТОП
                </p>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-dim">
                coverage-строка логируется при каждом изменении счётчиков: пользователь сам
                видит целостность селекторов после перезагрузки.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Порядок проверки (TEST_v03f2.md)
              </h3>
              <ol className="mt-4 space-y-4">
                {gateSteps.map((s, i) => (
                  <li key={s.t} className="flex gap-3.5">
                    <span
                      className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[11px] font-bold ${
                        i === 0
                          ? "border-warn/60 bg-warn/10 text-warn"
                          : "border-steel/50 bg-steel/10 text-steel"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold leading-snug text-ink">{s.t}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-pass/80">
                PASS-критерии
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {passCriteriaV03F2.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-[5px] shrink-0">
                      <path d="M2 6.2L4.8 9L10 3.4" stroke="var(--color-pass)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                RESULT_v_03.md · статус по fix2
              </h3>

              {active ? (
              <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setVerdict(verdict === "pass" ? null : "pass")}
                  className={`verdict-btn cursor-pointer border px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-widest transition-all ${
                    verdict === "pass"
                      ? "border-pass bg-pass/15 text-pass shadow-[0_0_24px_-6px_rgba(56,180,126,0.5)]"
                      : "border-line bg-panel text-dim hover:border-pass/60 hover:text-pass"
                  }`}
                >
                  PASS
                </button>
                <button
                  onClick={() => setVerdict(verdict === "fail" ? null : "fail")}
                  className={`verdict-btn cursor-pointer border px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-widest transition-all ${
                    verdict === "fail"
                      ? "border-fail bg-fail/15 text-fail shadow-[0_0_24px_-6px_rgba(224,90,82,0.5)]"
                      : "border-line bg-panel text-dim hover:border-fail/60 hover:text-fail"
                  }`}
                >
                  FAIL
                </button>
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-faint">
                Итоговый вердикт v_03 (по последнему фиксу). Сохраняется локально; статус
                устанавливает только Пользователь (§5.6). После PASS проектировщик выдаёт M-04.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Комментарий к RESULT_v_03.md (coverage, наблюдения)…"
                className="mt-3 h-20 w-full resize-none border border-line bg-inset px-3 py-2.5 font-mono text-[12px] text-ink placeholder:text-faint focus:border-steel focus:outline-none"
              />
              <button
                onClick={download}
                disabled={!verdict}
                className={`mt-3 w-full cursor-pointer border px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-widest transition-all ${
                  verdict
                    ? "border-steel/70 bg-steel/15 text-ink hover:bg-steel/25"
                    : "cursor-not-allowed border-line bg-panel text-faint"
                }`}
              >
                Скачать RESULT_v_03.md (fix2)
              </button>
              </>
              ) : (
                <div className="mt-4 border border-warn/40 bg-warn/[0.06] px-4 py-3.5">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-warn">
                    снят с обязанности — решение №2 (M03r.md)
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">
                    Переворот архитектуры: вместо массового сканирования — изъятие в момент
                    фиксации (ПКМ). Массовый сканер и MutationObserver были избыточны;
                    наработки по href-схеме и data-testid идут в нормализатор (v_04r) и
                    маркировку после F5 (v_06r). Итоговый вердикт v_03 — в листе v03r.
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
