import { Card, Pill } from "./ui";
import { SystemChip } from "./SystemChip";
import type { CareerFitResponse } from "@/lib/types";

/** Screen 4: the 10th CSL's missing houses, turned into named diagnoses. */
export function BlockagePanel({ blockage }: { blockage: CareerFitResponse["blockage"] }) {
  return (
    <Card
      title="Blockage diagnosis"
      subtitle="What the 10th cuspal sub lord does not signify, named and dated. Every pattern is period-bound, never permanent"
      right={<SystemChip system="kp" />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/50">
        <span>10th CSL: {blockage.tenthCsl}</span>
        <span>Missing houses: {blockage.missingHouses.join(", ") || "none"}</span>
      </div>
      <p className="mb-4 text-sm text-black/70">{blockage.summary}</p>

      {blockage.diagnoses.length === 0 ? (
        <p className="text-sm text-black/50">No blockage pattern fired for this chart.</p>
      ) : (
        <div className="space-y-3">
          {blockage.diagnoses.map((d, i) => (
            <div key={`${d.name}-${i}`} className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{d.name}</span>
                {blockage.primaryBlockage === d.name && <Pill tone="bad">Primary</Pill>}
              </div>
              <p className="mt-1 text-sm text-black/70">{d.explanation}</p>
              {d.missingHouses.length > 0 && (
                <p className="mt-1 text-xs text-black/45">
                  Missing houses: {d.missingHouses.join(", ")}
                </p>
              )}
              {d.resolutionWindows.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {d.resolutionWindows.map((w, j) => (
                    <li key={j} className="flex flex-wrap justify-between gap-x-3 text-xs">
                      <span className="font-mono tabular-nums text-black/60">
                        {w.start} to {w.end}
                      </span>
                      <span className="text-black/50">{w.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
