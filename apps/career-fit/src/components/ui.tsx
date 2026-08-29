import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-black/50">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const PILL_TONE: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  neutral: "bg-amber-50 text-amber-800 ring-amber-200",
  bad: "bg-rose-50 text-rose-800 ring-rose-200",
  plain: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function Pill({
  tone,
  children,
}: {
  tone: "good" | "neutral" | "bad" | "plain";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide ring-1 ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function ScoreBar({ label, score, hint }: { label: string; score: number; hint?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums text-black/50">{clamped}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-black/[0.06]">
        <div
          className="h-2 rounded-full bg-slate-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-black/50">{hint}</p>}
    </div>
  );
}

export function windowSpan(windows: { start: string; end: string }[]): {
  min: string;
  max: string;
} | null {
  if (windows.length === 0) return null;
  let min = windows[0].start;
  let max = windows[0].end;
  for (const w of windows) {
    if (w.start < min) min = w.start;
    if (w.end > max) max = w.end;
  }
  return { min, max };
}
