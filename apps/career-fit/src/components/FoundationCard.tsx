import { Card, Pill } from "./ui";
import { SystemChip } from "./SystemChip";
import type { BoundaryWarning, CareerPromise, PreVerdictAudit } from "@/lib/types";

const BAND_TONE: Record<PreVerdictAudit["band"], "good" | "neutral" | "bad"> = {
  HIGH: "good",
  MODERATE: "neutral",
  LOW: "bad",
};

const VERDICT_TONE: Record<CareerPromise["verdict"], "good" | "neutral" | "bad"> = {
  ACTIVE: "good",
  MIXED_ACTIVE: "neutral",
  PARTIALLY_ACTIVE: "neutral",
  DENIED: "bad",
};

const VERDICT_LABEL: Record<CareerPromise["verdict"], string> = {
  ACTIVE: "Promised",
  MIXED_ACTIVE: "Mixed, sequential",
  PARTIALLY_ACTIVE: "Partially active",
  DENIED: "Denied",
};

/**
 * The gate every other panel sits behind: run_pre_verdict_audit's confidence
 * band, get_boundary_warnings' proximity flags, and analyze_natal_promise's
 * Career / Job Start row. Rendered above the four screens because nothing
 * below it may be read as a verdict before this has.
 */
export function FoundationCard({
  audit,
  promise,
  boundaryWarnings,
}: {
  audit: PreVerdictAudit;
  promise: CareerPromise;
  boundaryWarnings: BoundaryWarning[];
}) {
  return (
    <Card
      title="Foundation and promise gate"
      subtitle="Chart-integrity audit, then whether a career is promised at all"
      right={<SystemChip system="kp" />}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Pill tone={BAND_TONE[audit.band]}>{audit.band} confidence</Pill>
            <span className="font-mono text-xs text-black/50">
              modifier {audit.confidenceModifier > 0 ? "+" : ""}
              {audit.confidenceModifier}
            </span>
          </div>
          <p className="mt-2 text-sm text-black/70">{audit.summary}</p>
          {boundaryWarnings.length > 0 && (
            <ul className="mt-3 space-y-1">
              {boundaryWarnings.map((w, i) => (
                <li
                  key={`${w.target}-${i}`}
                  className="flex items-center justify-between gap-2 text-xs text-black/60"
                >
                  <span>{w.target}</span>
                  <span
                    className={
                      w.severity === "CRITICAL" ? "font-medium text-rose-700" : "text-amber-700"
                    }
                  >
                    {w.severity}, {w.arcMinutes.toFixed(1)}&prime;
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Pill tone={VERDICT_TONE[promise.verdict]}>{VERDICT_LABEL[promise.verdict]}</Pill>
            <span className="text-xs text-black/50">
              {promise.event}, house {promise.house}, CSL {promise.csl}
            </span>
          </div>
          <p className="mt-2 text-sm text-black/70">{promise.reasoning}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/50">
            <span>Covered: {promise.covered.join(", ") || "none"}</span>
            <span>Missing: {promise.missing.join(", ") || "none"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
