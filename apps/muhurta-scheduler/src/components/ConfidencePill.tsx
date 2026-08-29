import type { Confidence } from "@/lib/types";

const BAND_STYLE: Record<Confidence["band"], string> = {
  stable: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  watch: "bg-amber-50 text-amber-900 ring-amber-200",
  sensitive: "bg-rose-50 text-rose-900 ring-rose-200",
};

const BAND_LABEL: Record<Confidence["band"], string> = {
  stable: "Stable",
  watch: "Watch",
  sensitive: "Sensitive",
};

/**
 * The birth-time confidence pill. A flagged chart means a small ayanamsa or
 * birth-time correction could flip a sub lord and change which planets
 * qualify for the election, per get_boundary_warnings.
 */
export function ConfidencePill({ confidence }: { confidence: Confidence }) {
  return (
    <div className={`rounded-xl p-4 ring-1 ${BAND_STYLE[confidence.band]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Birth-time confidence: {BAND_LABEL[confidence.band]}</span>
        <span className="font-mono text-xs opacity-70">
          {confidence.criticalCount} critical, {confidence.cautionCount} caution
        </span>
      </div>
      <p className="mt-1.5 text-sm opacity-90">{confidence.note}</p>
      {confidence.flags.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {confidence.flags.slice(0, 6).map((f, i) => (
            <li key={`${f.target}-${i}`} className="flex justify-between gap-2 opacity-80">
              <span>{f.target.replace("_", " ")}</span>
              <span className="font-mono">
                {f.severity} &middot; {f.distanceArcmin.toFixed(1)}&prime;
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
