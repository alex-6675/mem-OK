import { useState } from "react";
import {
  findings3A,
  v03Files,
  v03Tree,
  v03LoadSteps,
  v03TestBlock,
  buildResultV03,
} from "../data/v03";
import type { Verdict } from "./V01Sheet";
import CodeView from "./CodeView";
import Reveal from "./Reveal";

/* ---------- конвейер обнаружения ---------- */

function Pipeline() {
  const stages = [
    {
      t: "a[wall_comment_date]",
      s: "дата комментария — якорь (testid)",
      c: "text-steel border-steel/40 bg-steel/10",
    },
    {
      t: "closest(COMMENT_ROOT_SEL)",
      s: "проскакивает vkit-обёртки lvl 2–6",
      c: "text-ink border-line2 bg-panel2",
    },
    {
      t: "ENTITY + sourceElement",
      s: "kind · type · identity · context",
      c: "text-warn border-warn/40 bg-warn/10",
    },
    {
      t: "ctx:entity-found → SW",
      s: "entities reported: N",
      c: "text-pass border-pass/40 bg-pass/10",
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-stretch">
      {stages.map((st, i) => (
        <div key={st.t} className="contents">
          <div
            className={`border px-3 py-2.5 transition-transform duration-300 hover:-translate-y-0.5 ${st.c}`}
          >
            <p className="font-mono text-[11px] font-bold leading-snug">{st.t}</p>
            <p className="mt-1 font-mono text-[9.5px] leading-snug text-faint">{st.s}</p>
          </div>
          {i < stages.length - 1 && (
            <div className="hidden items-center px-1 text-faint sm:flex">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h10m0 0L8 1.5M11 5L8 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- лист ---------- */

export default function V03Sheet({
  verdict,
  setVerdict,
  locked = false,
}: {
  verdict: Verdict;
  setVerdict: (v: Verdict) => void;
  locked?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  const copyTree = async () => {
    try {
      await navigator.clipboard.writeText(v03Tree);
    } catch {
      /* clipboard недоступен — тихо */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!verdict) return;
    const blob = new Blob([buildResultV03(verdict, note)], {
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
      {/* 3A: таблица признаков + конвейер */}
      <Reveal>
        <div className="cornered border border-line bg-panel/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              3A ЗАКРЫТ — итоговая таблица признаков
            </h3>
            <span className="border border-pass/50 bg-pass/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-pass">
              диагностика 3A.3
            </span>
            <span className="font-mono text-[10px] text-faint">
              литералы testid — в восстановленном написании (см. BUILD.md)
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line2">
                  <th className="py-2 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                    Признак
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                    Статус
                  </th>
                  <th className="py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                    Роль в архитектуре
                  </th>
                </tr>
              </thead>
              <tbody>
                {findings3A.map((f, i) => {
                  const banned = f.sign.startsWith("vkit");
                  return (
                    <tr
                      key={i}
                      className="group border-b border-line/60 align-top transition-colors last:border-b-0 hover:bg-steel/[0.04]"
                    >
                      <td className="max-w-[300px] py-3 pr-4">
                        <code
                          className={`font-mono text-[11.5px] leading-relaxed ${
                            banned ? "text-fail line-through decoration-fail/60" : "text-ink"
                          }`}
                        >
                          {f.sign}
                        </code>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block whitespace-nowrap border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${
                            banned
                              ? "border-fail/50 bg-fail/10 text-fail"
                              : "border-pass/50 bg-pass/10 text-pass"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 text-[12.5px] leading-relaxed text-dim">{f.role}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
            Конвейер обнаружения (v_03)
          </p>
          <div className="mt-2.5">
            <Pipeline />
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_1fr]">
        {/* левая колонка: код */}
        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 border-b border-line">
                {v03Files.map((f, i) => (
                  <button
                    key={f.path}
                    onClick={() => setTab(i)}
                    className={`tab-btn relative cursor-pointer px-3.5 py-2 font-mono text-[11.5px] font-bold tracking-wide transition-colors ${
                      i === tab ? "tab-active text-ink" : "text-faint hover:text-dim"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <CodeView
                path={v03Files[tab].path}
                note={v03Files[tab].note}
                code={v03Files[tab].code}
              />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="cornered border border-line bg-inset/90">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-faint">
                  изменения пакета v_02 → v_03
                </span>
                <button
                  onClick={copyTree}
                  className="filter-btn cursor-pointer border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-dim hover:border-steel hover:text-ink"
                >
                  {copied ? "✓ скопировано" : "копировать"}
                </button>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.8] text-dim">
                {v03Tree}
              </pre>
            </div>
          </Reveal>
        </div>

        {/* правая колонка: загрузка + тест + вердикт */}
        <div className="space-y-6">
          <Reveal delay={80}>
            <div className="border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Как загрузить в Edge
                </h3>
                <span className="border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                  0.0.3
                </span>
              </div>
              <ol className="mt-4 space-y-4">
                {v03LoadSteps.map((s, i) => (
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
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                TEST · критерии (reports/v_03/TEST.md)
              </h3>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Предусловия
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {v03TestBlock.pre.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                    {p}
                  </li>
                ))}
              </ul>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-pass/80">
                PASS — ожидается
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {v03TestBlock.pass.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-[5px] shrink-0">
                      <path d="M2 6.2L4.8 9L10 3.4" stroke="var(--color-pass)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-fail/80">
                FAIL — признаки
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {v03TestBlock.fail.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-[5px] shrink-0">
                      <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="var(--color-fail)" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="border border-line bg-panel/70 p-5">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                RESULT_v_03.md · фиксация вердикта
              </h3>

              {locked ? (
                <div className="mt-4 border border-pass/40 bg-pass/[0.07] px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="border border-pass/60 bg-pass/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-pass">
                      PASS · зафиксирован
                    </span>
                    <span className="font-mono text-[11px] text-dim">
                      reports/v_03/RESULT_v_03.md
                    </span>
                  </div>
                </div>
              ) : (
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
                    Вердикт сохраняется локально и управляет сводкой. Статус устанавливает только
                    Пользователь (§5.6); при FAIL остаёмся внутри v_03 (§5.1).
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Комментарий к RESULT_v_03.md (testid в живом DOM, id, наблюдения)…"
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
                    Скачать RESULT_v_03.md
                  </button>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}