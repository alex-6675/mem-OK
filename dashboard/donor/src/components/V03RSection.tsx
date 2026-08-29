import { useState } from "react";
import {
  reversalBefore,
  reversalAfter,
  captureFlow,
  fateList,
  newOrder,
  cardContractV2,
  contractRules,
  implRows,
  v03rFiles,
  testActions,
  passCriteriaV03r,
  buildResultV03r,
} from "../data/v03r";
import type { Verdict } from "./V01Sheet";
import Reveal from "./Reveal";

const KIND_BADGE: Record<string, { t: string; c: string }> = {
  edit: { t: "правка", c: "border-steel/50 bg-steel/10 text-steel" },
  replace: { t: "замена", c: "border-warn/50 bg-warn/10 text-warn" },
  frozen: { t: "заморожен", c: "border-line2 bg-panel2 text-faint" },
};

export default function V03RSection({
  verdict,
  setVerdict,
}: {
  verdict: Verdict;
  setVerdict: (v: Verdict) => void;
  active?: boolean;
  locked?: boolean;
}) {
  const [note, setNote] = useState("");

  const download = () => {
    if (!verdict) return;
    const blob = new Blob([buildResultV03r(verdict, note)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RESULT_v03r.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* переворот архитектуры №2 */}
      <Reveal>
        <div className="cornered border border-line bg-panel/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              Архитектурное решение №2 — переворот
            </h3>
            <span className="border border-steel/50 bg-steel/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-steel">
              M03r.md
            </span>
            <span className="font-mono text-[10px] text-faint">
              изъятие в момент фиксации вместо массового сканирования
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="border border-fail/30 bg-fail/[0.05] p-4 transition-colors hover:border-fail/60">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-fail">
                было · v_03…v03f2
              </p>
              <ul className="mt-2.5 space-y-2">
                {reversalBefore.map((r) => (
                  <li key={r} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-[5px] shrink-0">
                      <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="var(--color-fail)" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="text-steel">
                <circle cx="17" cy="17" r="15.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 4" />
                <path d="M11 17h11m0 0l-4.5-4.5M22 17l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="border border-pass/30 bg-pass/[0.05] p-4 transition-colors hover:border-pass/60">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-pass">
                стало · v03r
              </p>
              <ul className="mt-2.5 space-y-2">
                {reversalAfter.map((r) => (
                  <li key={r} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-[5px] shrink-0">
                      <path d="M2 6.2L4.8 9L10 3.4" stroke="var(--color-pass)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
            Конвейер фиксации (пунктиром — следующие сборки r-серии)
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {captureFlow.map((st, i) => {
              const isNext = st.s.includes("v_04r") || st.s.includes("v_05r");
              return (
                <div
                  key={st.t}
                  className={`relative border px-3 py-2.5 transition-transform duration-300 hover:-translate-y-0.5 ${
                    i === 0
                      ? "border-steel/60 bg-steel/10"
                      : isNext
                        ? "border-dashed border-line2 bg-panel"
                        : "border-line bg-panel"
                  }`}
                >
                  <p className={`font-mono text-[11px] font-bold leading-snug ${i === 0 ? "text-steel" : "text-ink"}`}>
                    {st.t}
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] leading-snug text-faint">{st.s}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* левая колонка */}
        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Что с уже сделанным
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {fateList.map((f) => (
                  <li
                    key={f.what}
                    className={`group border px-4 py-3 transition-all hover:translate-x-0.5 ${
                      f.keep
                        ? "border-pass/25 bg-pass/[0.04] hover:border-pass/60"
                        : "border-fail/25 bg-fail/[0.04] hover:border-fail/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-mono text-[12px] font-bold text-ink">{f.what}</p>
                      <span
                        className={`ml-auto border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                          f.keep
                            ? "border-pass/50 bg-pass/10 text-pass"
                            : "border-fail/50 bg-fail/10 text-fail"
                        }`}
                      >
                        {f.keep ? "остаётся" : "снято"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-dim">{f.fate}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Тест — три действия (TEST_v03r.md)
                </h3>
                <span className="border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                  0.0.6
                </span>
              </div>
              <ol className="mt-3.5 space-y-4">
                {testActions.map((s, i) => (
                  <li key={s.t} className="flex gap-3.5">
                    <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center border border-steel/50 bg-steel/10 font-mono text-[11px] font-bold text-steel">
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
                {passCriteriaV03r.map((p) => (
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

          <Reveal delay={130}>
            <div className="cornered border border-line bg-inset/90 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Изменённые файлы · v03r
              </h3>
              <ul className="mt-3.5 space-y-2">
                {v03rFiles.map((f) => {
                  const b = KIND_BADGE[f.kind];
                  return (
                    <li
                      key={f.path}
                      className="group border border-line/70 bg-panel/40 px-3.5 py-2.5 transition-colors hover:border-line2 hover:bg-panel/70"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-mono text-[12px] font-bold text-ink">{f.path}</p>
                        <span className={`ml-auto border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${b.c}`}>
                          {b.t}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10.5px] text-faint">{f.change}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* правая колонка */}
        <div className="space-y-6">
          <Reveal delay={80}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Новый порядок шагов · r-серия
              </h3>
              <div className="mt-3.5">
                {newOrder.map((st, i) => (
                  <div key={st.v}>
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-px flex h-9 w-[54px] shrink-0 items-center justify-center border font-mono text-[11px] font-bold ${
                          st.current
                            ? "blink-soft border-steel/60 bg-steel/15 text-steel"
                            : "border-line2 bg-panel text-faint"
                        }`}
                      >
                        {st.v}
                      </span>
                      <p className={`pt-1.5 text-[12.5px] leading-relaxed ${st.current ? "text-ink" : "text-dim"}`}>
                        {st.t}
                      </p>
                    </div>
                    {i < newOrder.length - 1 && (
                      <div className="ml-[26px] h-3.5 border-l border-dashed border-line2" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
                OK / DZEN / форумы подключаются после того, как VK-ядро докажет работу —
                но контракт изъятия уже общий для всех порталов.
              </p>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="cornered border border-line bg-inset/90">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-faint">
                  КАРТОЧКА БАЗЫ — КОНТРАКТ v2 · дополнение №3
                </span>
                <span className="border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-warn">
                  в силу с v_05r
                </span>
              </div>
              <pre className="max-h-[340px] overflow-auto px-4 py-3.5 font-mono text-[11px] leading-[1.75] text-dim">
                {cardContractV2}
              </pre>
              <div className="border-t border-line px-4 py-3">
                <ul className="space-y-1.5">
                  {contractRules.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[11.5px] leading-relaxed text-dim">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-warn" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Когда что реализуется
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line2">
                      <th className="py-1.5 pr-3 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-faint">Решение</th>
                      <th className="py-1.5 pr-3 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-faint">Сейчас</th>
                      <th className="py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-faint">Реализация</th>
                    </tr>
                  </thead>
                  <tbody>
                    {implRows.map((r) => (
                      <tr key={r.decision} className="border-b border-line/60 last:border-b-0 hover:bg-steel/[0.04]">
                        <td className="py-2 pr-3 text-[11.5px] leading-snug text-dim">{r.decision}</td>
                        <td className="py-2 pr-3 font-mono text-[10.5px] text-warn">{r.now}</td>
                        <td className="py-2 font-mono text-[10.5px] text-steel">{r.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                RESULT_v03r.md · фиксация вердикта
              </h3>
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
                Вердикт сохраняется локально и управляет сводкой. Статус устанавливает только
                Пользователь (§5.6); при FAIL итерируем внутри v03r (§5.1).
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Комментарий к RESULT_v03r.md (link, page, наблюдения)…"
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
                Скачать RESULT_v03r.md
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
