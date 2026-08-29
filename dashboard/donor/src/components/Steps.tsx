import { useEffect, useState } from "react";
import { steps, stepsPreChecked, taskSheet } from "../data/audit";
import Reveal from "./Reveal";

const LS_KEY = "ctxvkru-start-steps-v1";

function loadDone(): Record<string, boolean> {
  /* предвыполненные шаги процесса — базовый слой */
  const base = Object.fromEntries(stepsPreChecked.map((id) => [id, true]));
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...base, ...(JSON.parse(raw) as Record<string, boolean>) };
  } catch {
    /* приватный режим — работаем с базовым слоем */
  }
  return base;
}

export default function Steps() {
  const [done, setDone] = useState<Record<string, boolean>>(loadDone);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(done));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [done]);

  const doneCount = steps.filter((s) => done[s.id]).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  const toggle = (id: string) =>
    setDone((d) => ({ ...d, [id]: !d[id] }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(taskSheet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = taskSheet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      {/* чек-лист */}
      <Reveal>
        <div className="cornered h-full border border-line bg-panel/80 p-5 sm:p-6">
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              Чек-лист запуска
            </h3>
            <span className="font-mono text-[12px] text-dim">
              {doneCount}/{steps.length}
              <span className="text-faint"> · {pct}%</span>
            </span>
          </div>
          <div className="mb-5 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="progress-fill h-full rounded-full bg-steel"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ol className="space-y-1.5">
            {steps.map((s, i) => {
              const isDone = !!done[s.id];
              return (
                <li key={s.id} className={isDone ? "step-done" : ""}>
                  <button
                    onClick={() => toggle(s.id)}
                    className="group flex w-full cursor-pointer items-start gap-3.5 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-panel2/70"
                  >
                    <span
                      className={`step-check mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${
                        isDone
                          ? "border-pass bg-pass/20"
                          : "border-line2 bg-inset group-hover:border-steel"
                      }`}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6.2L4.8 9L10 3.4"
                          stroke="var(--color-pass)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>
                      <span className="step-label block text-[14px] font-semibold leading-snug text-ink">
                        <span className="mr-2 font-mono text-[11px] font-bold text-steel">
                          Ш-{i + 1}
                        </span>
                        {s.text}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-dim">
                        {s.detail}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>

      {/* шаблон задания */}
      <Reveal delay={120}>
        <div className="cornered flex h-full flex-col border border-line bg-inset/90">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                Шаблон задания · РЕГЛАМЕНТ §7
              </p>
              <p className="mt-0.5 font-display text-[13.5px] font-semibold text-ink">
                Первое задание — M-01 / v_01
              </p>
            </div>
            <button
              onClick={copy}
              className={`cursor-pointer border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                copied
                  ? "border-pass/60 bg-pass/15 text-pass"
                  : "border-line2 bg-panel text-dim hover:border-steel hover:text-ink"
              }`}
            >
              {copied ? "✓ Скопировано" : "Копировать"}
            </button>
          </div>
          <pre className="flex-1 overflow-x-auto whitespace-pre px-5 py-4 font-mono text-[11.5px] leading-[1.75] text-dim">
            {taskSheet}
          </pre>
          <div className="border-t border-line px-5 py-3">
            <p className="text-[12px] leading-relaxed text-faint">
              Каждая итерация оформляется строго по этому шаблону и завершается
              строкой <span className="font-mono text-warn">СТОП.</span> — дальше
              решение принимает Пользователь по RESULT.md.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}