import { useState } from "react";
import { stages } from "../data/audit";
import Reveal from "./Reveal";

const TAG_CLS: Record<string, string> = {
  диагностика: "text-warn border-warn/40 bg-warn/10",
  адаптер: "text-steel border-steel/40 bg-steel/10",
  "UI-слой": "text-ink border-line2 bg-panel2",
  данные: "text-pass border-pass/40 bg-pass/10",
};

export default function Roadmap() {
  const [open, setOpen] = useState<string>("v_03");

  return (
    <div className="relative">
      {/* вертикальная ось */}
      <div className="absolute bottom-4 left-[7px] top-4 w-px bg-line sm:left-[115px]" />

      <div className="space-y-2">
        {stages.map((s, i) => {
          const isCurrent = s.state === "current";
          const isDone = s.state === "done";
          const isOpen = open === s.v;
          return (
            <Reveal key={s.v} delay={Math.min(i * 40, 240)}>
              <div className="relative flex gap-4 sm:gap-6">
                {/* метка сборки слева (desktop) */}
                <div className="hidden w-[88px] shrink-0 items-center justify-end pt-3 sm:flex">
                  <span
                    className={`font-mono text-[12px] font-bold tracking-wide ${
                      isCurrent ? "text-steel" : isDone ? "text-pass" : "text-faint"
                    }`}
                  >
                    {s.v}
                  </span>
                </div>

                {/* узел */}
                <div className="relative z-10 flex shrink-0 pt-3.5">
                  <span
                    className={`stage-node h-[15px] w-[15px] rounded-full border-2 ${
                      isDone
                        ? "border-pass bg-pass"
                        : isCurrent
                          ? "pulse-now border-steel bg-steel/30"
                          : "border-line2 bg-panel"
                    }`}
                  />
                </div>

                {/* карточка */}
                <button
                  onClick={() => setOpen(isOpen ? "" : s.v)}
                  className={`stage-btn group mb-1 flex-1 cursor-pointer border px-4 py-3 text-left transition-all duration-300 sm:px-5 ${
                    isOpen
                      ? "border-steel/50 bg-panel2 shadow-[0_16px_44px_-20px_rgba(0,0,0,0.7)]"
                      : "border-line bg-panel/60 hover:border-line2 hover:bg-panel"
                  } ${isDone ? "border-l-2 border-l-pass/60" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span
                      className={`font-mono text-[11px] font-bold sm:hidden ${
                        isDone ? "text-pass" : "text-steel"
                      }`}
                    >
                      {s.v}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-faint">
                      Этап {s.num}
                    </span>
                    <span
                      className={`font-display text-[14px] font-semibold transition-colors ${
                        isDone ? "text-dim" : "text-ink group-hover:text-steel"
                      }`}
                    >
                      {s.title}
                    </span>
                    {s.tag && (
                      <span
                        className={`rounded-sm border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider ${TAG_CLS[s.tag]}`}
                      >
                        {s.tag}
                      </span>
                    )}
                    {isDone && (
                      <span className="rounded-sm border border-pass/60 bg-pass/15 px-1.5 py-px font-mono text-[9.5px] font-bold uppercase tracking-wider text-pass">
                        PASS · RESULT_{s.v}.md
                      </span>
                    )}
                    {isCurrent && (
                      <span className="blink-soft rounded-sm border border-steel/60 bg-steel/15 px-1.5 py-px font-mono text-[9.5px] font-bold uppercase tracking-wider text-steel">
                        следующий
                      </span>
                    )}
                    <svg
                      className={`ml-auto h-3.5 w-3.5 text-faint transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 6l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className={`stage-detail ${isOpen ? "open" : ""}`}>
                    <div>
                      <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                            Цель
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-dim">
                            {s.goal}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pass/80">
                            PASS-критерий (устанавливает Пользователь)
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-dim">
                            {s.pass}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}