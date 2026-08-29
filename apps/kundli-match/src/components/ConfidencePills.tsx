import type { Confidence, ConfidenceBand } from "@/lib/types";

const BAND_STYLE: Record<ConfidenceBand, string> = {
  high: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  moderate: "bg-amber-50 text-amber-900 ring-amber-200",
  low: "bg-rose-50 text-rose-900 ring-rose-200",
};

/** get_boundary_warnings, run for both charts. The cheapest credibility check available. */
export function ConfidencePills({ confidence }: { confidence: Confidence }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(
        [
          ["Person A", confidence.personA],
          ["Person B", confidence.personB],
        ] as const
      ).map(([label, c]) => (
        <div
          key={label}
          className={`rounded-lg px-3 py-2 text-sm ring-1 ${BAND_STYLE[c.band]}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{label} birth-time confidence</span>
            <span className="text-xs font-semibold uppercase tracking-wide">{c.band}</span>
          </div>
          <p className="mt-0.5 text-xs opacity-80">
            {c.criticalCount} critical, {c.cautionCount} caution. {c.note}
          </p>
        </div>
      ))}
    </div>
  );
}
