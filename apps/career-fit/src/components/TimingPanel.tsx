import { Card, Pill } from "./ui";
import { SystemChip } from "./SystemChip";
import type { CareerFitResponse, TimingWindow } from "@/lib/types";

function toTime(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

function overallRange(windows: TimingWindow[]): { start: number; end: number } {
  const now = Date.now();
  if (windows.length === 0) {
    return { start: now, end: now + 365 * 24 * 3600 * 1000 };
  }
  let start = toTime(windows[0].start);
  let end = toTime(windows[0].end);
  for (const w of windows) {
    start = Math.min(start, toTime(w.start));
    end = Math.max(end, toTime(w.end));
  }
  // Never a zero-width ribbon.
  if (end <= start) end = start + 30 * 24 * 3600 * 1000;
  return { start, end };
}

function Ribbon({
  label,
  windows,
  color,
}: {
  label: string;
  windows: TimingWindow[];
  color: string;
}) {
  const { start, end } = overallRange(windows);
  const span = Math.max(1, end - start);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-black/60">{label}</p>
      <div className="relative h-6 rounded-md bg-black/[0.04]">
        {windows.map((w, i) => {
          const left = ((toTime(w.start) - start) / span) * 100;
          const width = Math.max(1.5, ((toTime(w.end) - toTime(w.start)) / span) * 100);
          return (
            <div
              key={i}
              title={`${w.start} to ${w.end}: ${w.reason}`}
              className={`absolute top-0.5 h-5 rounded ${color}`}
              style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
            />
          );
        })}
      </div>
      {windows.length === 0 && (
        <p className="mt-1 text-xs text-black/40">No windows returned in this horizon.</p>
      )}
    </div>
  );
}

function WindowList({ windows }: { windows: TimingWindow[] }) {
  if (windows.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {windows.map((w, i) => (
        <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
          <span className="font-mono tabular-nums text-black/60">
            {w.start} to {w.end}
          </span>
          <span className="text-black/50">{w.reason}</span>
        </li>
      ))}
    </ul>
  );
}

/** Screen 3: a horizon ribbon with promotion, job-change and income windows. */
export function TimingPanel({ timing }: { timing: CareerFitResponse["timing"] }) {
  return (
    <Card
      title="Timing"
      subtitle="Promotion, job-change and income-increment windows across the chosen horizon"
      right={<SystemChip system="kp" />}
    >
      <div className="space-y-5">
        <Ribbon label="Promotion windows" windows={timing.promotion.windows} color="bg-emerald-500" />
        <Ribbon label="Job-change windows" windows={timing.jobChange.windows} color="bg-sky-500" />
        <Ribbon
          label="Income-increment windows"
          windows={timing.earnedIncome.incrementWindows}
          color="bg-amber-500"
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Pill tone={timing.promotion.eligible ? "good" : "bad"}>
              {timing.promotion.eligible ? "Gate open" : "Gate not met"}
            </Pill>
            {timing.promotion.stagnationFlag && <Pill tone="bad">Stagnation</Pill>}
          </div>
          <p className="mt-2 text-xs text-black/60">{timing.promotion.summary}</p>
          <WindowList windows={timing.promotion.windows} />
        </div>
        <div>
          <Pill tone={timing.jobChange.promised ? "good" : "bad"}>
            {timing.jobChange.promised ? "Promised" : "Not promised"}
          </Pill>
          <p className="mt-2 text-xs text-black/60">
            {timing.jobChange.changeAxis}. {timing.jobChange.summary}
          </p>
          <WindowList windows={timing.jobChange.windows} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Pill tone="plain">{timing.earnedIncome.incomeGrade}</Pill>
            {timing.earnedIncome.leakageFlag && <Pill tone="bad">8/12 leakage</Pill>}
          </div>
          <p className="mt-2 text-xs text-black/60">{timing.earnedIncome.summary}</p>
          <WindowList windows={timing.earnedIncome.incrementWindows} />
        </div>
      </div>
    </Card>
  );
}
