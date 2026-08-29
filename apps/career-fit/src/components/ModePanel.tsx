import { Card, Pill } from "./ui";
import { SystemChip } from "./SystemChip";
import type { CareerFitResponse, JobVsBusinessResult } from "@/lib/types";

const RESULT_TONE: Record<JobVsBusinessResult, "good" | "neutral" | "bad" | "plain"> = {
  service: "good",
  business: "neutral",
  mixed: "neutral",
  inconclusive: "plain",
};

const RESULT_LABEL: Record<JobVsBusinessResult, string> = {
  service: "Points to service",
  business: "Points to business",
  mixed: "Mixed",
  inconclusive: "Inconclusive",
};

const AGREEMENT_TONE: Record<string, "good" | "neutral" | "bad"> = {
  STRONG: "good",
  PARTIAL: "neutral",
  DIVERGENT: "bad",
};

/**
 * Screen 2. Five independent rules, rendered as five rows with the
 * rule named, never blended into one score. This is the direct visual
 * argument against black-box scoring: when the rules disagree, the
 * disagreement is shown, not resolved silently.
 */
export function ModePanel({ jobVsBusiness }: { jobVsBusiness: CareerFitResponse["mode"]["jobVsBusiness"] }) {
  return (
    <Card
      title="Service against business"
      subtitle="Five KP rules, reported side by side, never merged into one score"
      right={<SystemChip system="kp" />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill tone={AGREEMENT_TONE[jobVsBusiness.agreement] ?? "plain"}>
          {jobVsBusiness.agreement} agreement
        </Pill>
        <Pill tone={RESULT_TONE[jobVsBusiness.consensus]}>
          Consensus: {RESULT_LABEL[jobVsBusiness.consensus]}
        </Pill>
        {jobVsBusiness.denialGate && <Pill tone="bad">Denial gate active</Pill>}
      </div>
      <p className="mb-4 text-sm text-black/70">{jobVsBusiness.summary}</p>

      <div className="space-y-2">
        {jobVsBusiness.rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-col gap-1 rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.05] sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                {rule.id}
              </span>
              <div>
                <p className="text-sm">{rule.explanation}</p>
                <p className="mt-1 text-xs text-black/45">{rule.tests}</p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-3">
              <Pill tone={RESULT_TONE[rule.result]}>{RESULT_LABEL[rule.result]}</Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
