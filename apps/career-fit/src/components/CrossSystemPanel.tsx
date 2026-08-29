import { Card } from "./ui";
import { SystemChip } from "./SystemChip";
import type { CareerFitResponse } from "@/lib/types";

/**
 * The Dasamsa (D10), a different tradition's own career chart. Shown beside
 * the KP verdict, never merged into it: its chip is a different color on
 * purpose, and nothing on this card is cited by any KP panel above it.
 */
export function CrossSystemPanel({ crossSystem }: { crossSystem: CareerFitResponse["crossSystem"] }) {
  const { d10, note } = crossSystem;
  return (
    <Card
      title="Dasamsa (D10)"
      subtitle="The classical Vedic career chart. A second system's independent read, not a KP finding"
      right={<SystemChip system="cross-system" />}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        {[
          ["D10 ascendant", d10.ascendant],
          ["10th house lord", d10.tenthLord],
          ["Planets in 10th", d10.planetsInTenth.join(", ") || "none"],
          ["Strongest career planet", d10.strongestCareerPlanet],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-black/50">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
        {note}
      </p>
    </Card>
  );
}
