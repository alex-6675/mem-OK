import { useState } from "react";
import {
  v02Files,
  v02Tree,
  v02LoadSteps,
  v02TestBlock,
  buildResultV02,
} from "../data/v02";
import type { Verdict } from "./V01Sheet";
import CodeView from "./CodeView";
import Reveal from "./Reveal";

/* ---------- sequence-диаграмма PING/PONG ---------- */

function SequenceDiagram() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-line bg-panel2 px-3 py-2 text-center">
          <p className="font-mono text-[11px] font-bold text-ink">content.js</p>
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-faint">страница vk.ru</p>
        </div>
        <div className="border border-line bg-panel2 px-3 py-2 text-center">
          <p className="font-mono text-[11px] font-bold text-ink">background.js</p>
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-faint">service worker</p>
        </div>
      </div>

      <div className="relative mt-1 h-[148px]">
        {/* линии жизни */}
        <div className="absolute left-[25%] top-0 h-full -translate-x-1/2 border-l border-dashed border-line2" />
        <div className="absolute left-[75%] top-0 h-full -translate-x-1/2 border-l border-dashed border-line2" />

        {/* PING */}
        <div className="absolute left-1/2 top-[10px] -translate-x-1/2 text-center">
          <p className="font-mono text-[11.5px] font-bold text-steel">
            PING <span className="text-faint">·</span>{" "}
            <span className="font-normal text-dim">ctx:ping</span>
          </p>
          <p className="font-mono text-[9.5px] text-faint">payload: {"{ path, sentAt }"}</p>
        </div>
        <div className="absolute left-[25%] right-[25%] top-[52px] flex items-center">
          <div className="ping-flow h-[2px] flex-1" />
          <span className="arrow-right" />
        </div>

        {/* PONG */}
        <div className="absolute left-[25%] right-[25%] top-[104px] flex items-center">
          <span className="arrow-left" />
          <div className="pong-flow h-[2px] flex-1" />
        </div>
        <div className="absolute left-1/2 top-[116px] -translate-x-1/2 text-center">
          <p className="font-mono text-[11.5px] font-bold text-pass">
            PONG <span className="text-faint">·</span>{" "}
            <span className="font-normal text-dim">ctx:pong</span>
          </p>
          <p className="font-mono text-[9.5px] text-faint">
            payload: {"{ tabId, receivedAt }"} · rtt ~N ms
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- лист ---------- */

export default function V02Sheet({
  verdict,
  setVerdict,
  locked = false,
}: {
  verdict: Verdict;
  setVerdict: (v: Verdict) => void;
  locked?: boolean;
  active?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  const copyTree = async () => {
    try {
      await navigator.clipboard.writeText(v02Tree);
    } catch {
      /* clipboard недоступен — тихо */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!verdict) return;
    const blob = new Blob([buildResultV02(verdict, note)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RESULT_v_02.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.02fr_1fr]">
        {/* левая колонка: канал + код */}
        <div className="space-y-6">
          <Reveal>
            <div className="cornered border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
                  Диагностический канал · chrome.runtime.sendMessage
                </p>
                <span className="border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                  ctx:ping ⇄ ctx:pong
                </span>
              </div>
              <div className="mt-4">
                <SequenceDiagram />
              </div>
              <p className="mt-2 border-t border-line pt-3 text-[12px] leading-relaxed text-faint">
                Типы сообщений — в <span className="font-mono text-[11px] text-dim">core/messaging.js</span>{" "}
                (единый источник): content-скрипты получают его порядком файлов в манифесте,
                Service Worker — через <span className="font-mono text-[11px] text-dim">importScripts</span>.
                Без ES-модулей и сборщиков (§2.2).
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="cornered border border-line bg-inset/90">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-faint">
                  изменения v_02 · на диске
                </span>
                <button
                  onClick={copyTree}
                  className="filter-btn cursor-pointer border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-dim hover:border-steel hover:text-ink"
                >
                  {copied ? "✓ скопировано" : "копировать"}
                </button>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.8] text-dim">
                {v02Tree}
              </pre>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 border-b border-line">
                {v02Files.map((f, i) => (
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
                path={v02Files[tab].path}
                note={v02Files[tab].note}
                code={v02Files[tab].code}
              />
            </div>
          </Reveal>
        </div>

        {/* правая колонка: загрузка + тест + вердикт */}
        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="border border-line bg-panel/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Как обновить и проверить
                </h3>
                <span className="border border-steel/40 bg-steel/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                  вручную
                </span>
              </div>
              <ol className="mt-4 space-y-4">
                {v02LoadSteps.map((s, i) => (
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
                TEST · критерии (reports/v_02/TEST.md)
              </h3>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Предусловия
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {v02TestBlock.pre.map((p) => (
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
                {v02TestBlock.pass.map((p) => (
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
                {v02TestBlock.fail.map((p) => (
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
                RESULT_v_02.md · фиксация вердикта
              </h3>

              {locked ? (
                <div className="mt-4 border border-pass/40 bg-pass/[0.07] px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="border border-pass/60 bg-pass/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-pass">
                      PASS · зафиксирован
                    </span>
                    <span className="font-mono text-[11px] text-dim">
                      reports/v_02/RESULT_v_02.md · 19.08.2026 · ветка main-qwen_v_02 · «tested OK via tester-tool»
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                    Все пять критериев отмечены: версия 0.0.2 без ошибок, PING/PONG в SW-консоли,
                    тройка строк на vk.ru, повтор после F5, локаль ru. По плану (§6) следующий — Этап 2 /
                    v_03; по AGENTS.md ждём явного задания от проектировщика.
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
                Вердикт сохраняется локально и управляет сводкой. Статус устанавливает только
                Пользователь (§5.6); при FAIL остаёмся внутри v_02 (§5.1).
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Комментарий к RESULT_v_02.md (ошибки, rtt, наблюдения)…"
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
                Скачать RESULT_v_02.md
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
