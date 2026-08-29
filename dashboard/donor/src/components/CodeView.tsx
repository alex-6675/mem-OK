import { useState, type ReactNode } from "react";

/* ---------- минимальная подсветка (json / vanilla js) ---------- */

const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*")|(=>|const|let|return|new|if|typeof|function|await|async|import|export|from|of|in|for|while|try|catch|finally|throw|switch|case|break|continue|default|else|do|this|class|extends|super|yield|delete|instanceof|void|true|false|null|undefined|chrome|globalThis|Object|performance|console|location|Date|Math|JSON|importScripts|sendResponse)\b|(\b\d+(?:\.\d+)?\b)/g;

export function tokenize(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="tok-com">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="tok-str">{m[2]}</span>);
    else if (m[3])
      out.push(
        <span
          key={k++}
          className={
            m[3] === "true" || m[3] === "false" || m[3] === "null" || m[3] === "undefined"
              ? "tok-lit"
              : "tok-kw"
          }
        >
          {m[3]}
        </span>,
      );
    else out.push(<span key={k++} className="tok-num">{m[4]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/* ---------- блок кода с вкладкой файла ---------- */

export default function CodeView({
  path,
  note,
  code,
}: {
  path: string;
  note: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const lines = code.split("\n");

  return (
    <div className="cornered border border-line bg-inset/90">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-steel">
          <path
            d="M3 1.5h5L11 4.5v8H3v-11z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[12px] font-bold text-ink">{path}</span>
        <span className="font-mono text-[10.5px] text-faint">{note}</span>
        <button
          onClick={copy}
          className="filter-btn ml-auto cursor-pointer border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-dim hover:border-steel hover:text-ink"
        >
          {copied ? "✓ скопировано" : "копировать"}
        </button>
      </div>
      <pre className="code-scroll max-h-[380px] overflow-auto px-4 py-3.5 font-mono text-[12px] leading-[1.75] text-dim">
        {lines.map((ln, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 select-none pr-3 text-right text-[10.5px] leading-[1.9] text-faint/60">
              {i + 1}
            </span>
            <span className="whitespace-pre">{tokenize(ln)}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}