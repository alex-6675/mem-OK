import { useState } from "react";
import {
  v01Files,
  v01Tree,
  loadSteps,
  testBlock,
  flowNodes,
  buildResultMd,
} from "../data/v01";
import CodeView from "./CodeView";
import Reveal from "./Reveal";

export type Verdict = "pass" | "fail" | null;

const FLOW_ICON: Record<string, JSX.Element> = {
  create: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 13.5v-9h7l4 4v5h-11z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 4.5V8h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  load: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 14h5M8 11.5V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.7 8.2L7.3 9.8L10.5 6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  verdict: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  stop: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6" y="6" width="4" height="4" fill="currentColor" />
    </svg>
  ),
};

export default function V01Sheet({
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
      await navigator.clipboard.writeText(v01Tree);
    } catch {
      /* clipboard недоступен — тихо */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!verdict) return;
    const blob = new Blob([buildResultMd(verdict, note)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RESULT.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.02fr_1fr]">
        {/* левая колонка: поток + код */}
        <div className="space-y-6">
          <Reveal>
            <div className="border border-line bg-panel/70 p-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
                Поток шага 1 (по регламенту, часть 6)
              </p>
              <div className="mt-4">
                {flowNodes.map((n, i) => {
                  const done = i < 4;
                  const isStop = n.id === "stop";
                  return (
                    <div key={n.id}>
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                            done
                              ? "border-pass/50 bg-pass/10 text-pass"
                              : isStop
                                ? "border-warn/50 bg-warn/10 text-warn"
                                : "border-line2 bg-panel text-dim"
                          }`}
                        >
                          {FLOW_ICON[n.id]}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`font-display text-[14px] font-semibold leading-tight ${
                              done ? "text-ink" : "text-dim"
                            }`}
                          >
                            {n.label}
                          </p>
                          <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-faint">
                            {n.sub}
                          </p>
                        </div>
                        {done && !isStop && (
                          <span className="ml-auto shrink-0 border border-pass/50 bg-pass/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-pass">
                            сделано
                          </span>
                        )}
                        {isStop && (
                          <span className="blink-soft ml-auto shrink-0 border border-warn/50 bg-warn/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-warn">
                            здесь
                          </span>
                        )}
                      </div>
                      {i < flowNodes.length - 1 && (
                        <div className="ml-[17px] h-5 border-l border-dashed border-line2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="cornered border border-line bg-inset/90">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-faint">
                  пакет расширения · на диске
                </span>
                <button
                  onClick={copyTree}
                  className="filter-btn cursor-pointer border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-dim hover:border-steel hover:text-ink"
                >
                  {copied ? "✓ скопировано" : "копировать"}
                </button>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.8] text-dim">
                {v01Tree}
              </pre>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 border-b border-line">
                {v01Files.map((f, i) => (
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
                path={v01Files[tab].path}
                note={v01Files[tab].note}
                code={v01Files[tab].code}
              />
            </div>
          </Reveal>
        </div>

        {/* правая колонка: загрузка + тест */}
        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Как собрать и загрузить
                </h3>
                <span className="border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                  вручную
                </span>
              </div>
              <ol className="mt-4 space-y-4">
                {loadSteps.map((s, i) => (
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
                TEST · критерии (reports/v_01/TEST.md)
              </h3>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Предусловия
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {testBlock.pre.map((p) => (
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
                {testBlock.pass.map((p) => (
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
                {testBlock.fail.map((p) => (
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
                RESULT_v_01.md · фиксация вердикта
              </h3>

              {locked ? (
                <div className="mt-4 border border-pass/40 bg-pass/[0.07] px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="border border-pass/60 bg-pass/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-pass">
                      PASS · зафиксирован
                    </span>
                    <span className="font-mono text-[11px] text-dim">
                      reports/v_01/RESULT_v_01.md · 18.08.2026 · проверено Пользователем (§5.6)
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                    Замечание из RESULT — отсутствие{" "}
                    <span className="font-mono text-[11.5px] text-ink">default_locale: "ru"</span>{" "}
                    в манифесте — закрыто в сборке v_02 (шаг 2).
                  </p>
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
                    Вердикт сохраняется локально и управляет сводкой. По регламенту статус
                    устанавливает только Пользователь (§5.6).
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Комментарий к RESULT.md (ошибка, наблюдения)…"
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
                    Скачать RESULT.md
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