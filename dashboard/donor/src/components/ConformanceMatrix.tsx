import { useState } from "react";
import { reqGroups, counts, type Status } from "../data/audit";
import Reveal from "./Reveal";

type Filter = "all" | Status;

const CHIP: Record<Status, { label: string; cls: string; dot: string }> = {
  fail: {
    label: "FAIL",
    cls: "text-fail border-fail/40 bg-fail/10",
    dot: "bg-fail",
  },
  warn: {
    label: "WARN",
    cls: "text-warn border-warn/40 bg-warn/10",
    dot: "bg-warn",
  },
  pass: {
    label: "PASS",
    cls: "text-pass border-pass/40 bg-pass/10",
    dot: "bg-pass",
  },
};

const FILTERS: { key: Filter; label: string; count: number }[] = [
  { key: "all", label: "Все", count: counts.total },
  { key: "fail", label: "FAIL", count: counts.fail },
  { key: "warn", label: "WARN", count: counts.warn },
  { key: "pass", label: "PASS", count: counts.pass },
];

export default function ConformanceMatrix() {
  const [filter, setFilter] = useState<Filter>("all");
  let n = 0;

  return (
    <div>
      {/* фильтры */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn cursor-pointer rounded-sm border px-3.5 py-1.5 font-mono text-[11.5px] uppercase tracking-wider ${
              filter === f.key
                ? "border-steel/70 bg-steel/15 text-ink"
                : "border-line bg-panel text-dim hover:border-line2 hover:text-ink"
            }`}
          >
            {f.label}
            <span className={`ml-2 ${filter === f.key ? "text-steel" : "text-faint"}`}>
              {f.count}
            </span>
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[11px] text-faint sm:block">
          наведите на строку — ссылка на пункт документа
        </span>
      </div>

      <div className="space-y-8">
        {reqGroups.map((group, gi) => {
          const items = group.items.filter(
            (i) => filter === "all" || i.status === filter,
          );
          if (items.length === 0) return null;
          return (
            <Reveal key={group.section} delay={gi * 60}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-mono text-[11px] font-bold tracking-widest text-steel">
                  {group.section}
                </span>
                <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-dim">
                  {group.title}
                </h3>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="overflow-hidden border border-line bg-panel/70">
                {items.map((item) => {
                  n += 1;
                  const chip = CHIP[item.status];
                  return (
                    <div
                      key={item.id}
                      data-status={item.status}
                      className="req-row group grid grid-cols-1 gap-x-5 gap-y-2 border-b border-line/60 px-4 py-4 last:border-b-0 sm:grid-cols-[auto_150px_1fr] sm:px-5"
                    >
                      <span className="font-mono text-[11px] leading-6 text-faint">
                        {String(n).padStart(2, "0")}
                      </span>

                      <div className="flex items-start gap-3 sm:block">
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-widest ${chip.cls}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                          {chip.label}
                        </span>
                        {item.since && (
                          <span className="hidden rounded-sm border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-steel sm:inline-flex">
                            файл · {item.since}
                          </span>
                        )}
                        <span className="mt-1 hidden font-mono text-[10.5px] text-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block">
                          {item.doc}
                        </span>
                      </div>

                      <div>
                        <p className="text-[14.5px] font-semibold leading-snug text-ink">
                          {item.req}
                        </p>
                        <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-dim">
                          {item.note}
                        </p>
                        <p className="mt-1.5 font-mono text-[10.5px] text-faint sm:hidden">
                          {item.doc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}