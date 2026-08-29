import { useEffect, useMemo, useState } from "react";
import { termLines, type TermLine } from "../data/audit";

const PREFIX: Record<TermLine["type"], { sym: string; cls: string }> = {
  cmd: { sym: "$", cls: "text-ink" },
  fail: { sym: "FAIL", cls: "text-fail" },
  warn: { sym: "WARN", cls: "text-warn" },
  pass: { sym: "PASS", cls: "text-pass" },
  info: { sym: "·", cls: "text-dim" },
  arrow: { sym: "→", cls: "text-steel" },
};

export default function Terminal() {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [li, setLi] = useState(reduced ? termLines.length : 0);
  const [ch, setCh] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (li >= termLines.length) return;
    const line = termLines[li];
    const isCmd = line.type === "cmd";
    const speed = isCmd ? 26 : 6;

    if (ch < line.text.length) {
      const t = setTimeout(() => setCh((c) => c + (isCmd ? 1 : 3)), speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setLi((l) => l + 1);
        setCh(0);
      },
      isCmd ? 420 : 150,
    );
    return () => clearTimeout(t);
  }, [li, ch, reduced]);

  const done = li >= termLines.length;

  return (
    <div className="cornered border border-line bg-inset/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      {/* шапка окна */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="term-dot bg-fail/80" />
        <span className="term-dot bg-warn/80" />
        <span className="term-dot bg-pass/80" />
        <span className="ml-3 font-mono text-[11px] tracking-wider text-faint">
          audit — edge-devtools — 92×24
        </span>
      </div>

      <div className="min-h-[300px] px-4 py-4 font-mono text-[12.5px] leading-[1.85]">
        {termLines.slice(0, Math.min(li + 1, termLines.length)).map((line, i) => {
          const full = i < li;
          const text = full ? line.text : line.text.slice(0, ch);
          const p = PREFIX[line.type];
          const isLast = i === li;
          return (
            <div key={i} className="flex gap-3 whitespace-pre-wrap break-words">
              <span
                className={`mt-px w-9 shrink-0 text-right text-[10.5px] font-bold leading-[1.85rem] tracking-tight ${
                  line.type === "cmd" ? "text-pass" : p.cls
                }`}
              >
                {line.type === "cmd" ? "$" : `[${p.sym}]`}
              </span>
              <span className={p.cls}>
                {text}
                {isLast && !done && <span className="term-cursor" />}
              </span>
            </div>
          );
        })}
        {done && (
          <div className="mt-1 flex gap-3">
            <span className="w-9 shrink-0 text-right text-pass">$</span>
            <span className="text-ink">
              <span className="term-cursor" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}