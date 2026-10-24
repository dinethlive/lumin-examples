import type { ParadigmPanel, ParadigmReading } from "@/lib/types";

/** The KP lineage defines a promise procedure; the others are read beside it. */
const LINEAGE: Record<string, string> = {
  kp: "KP",
  kcil: "KP-extended",
  "four-step": "KP-extended",
  bosmia: "KP-extended",
  "vedic-parashari": "Vedic Parashari",
  jaimini: "Jaimini",
  tajik: "Tajik",
};

const VERDICT_LABEL: Record<string, string> = {
  PROMISED: "Promised",
  MIXED: "Mixed",
  DENIED: "Denied",
  INCONCLUSIVE: "Inconclusive",
  NO_VERDICT_PROCEDURE: "No verdict procedure",
  SILENT: "Silent",
};

const DISAGREEMENT_LABEL: Record<string, string> = {
  CONCORDANT: "Schools agree",
  CONCORDANT_ON_DIFFERENT_GROUNDS: "Agree on different grounds",
  SPLIT_VERDICT: "Schools split",
  TIMING_DIVERGENCE: "Dates part",
  SINGLE_VOICE: "One voice",
  NO_VERDICT_TO_COMPARE: "Nothing to compare",
};

function toneFor(verdict: string): { color: string; soft: string } {
  if (verdict === "PROMISED") {
    return { color: "var(--color-risk-elevated)", soft: "var(--color-risk-elevated-soft)" };
  }
  if (verdict === "MIXED") {
    return { color: "var(--color-risk-moderate)", soft: "var(--color-risk-moderate-soft)" };
  }
  if (verdict === "DENIED") {
    return { color: "var(--color-risk-low)", soft: "var(--color-risk-low-soft)" };
  }
  return { color: "var(--color-muted-foreground)", soft: "rgba(0,0,0,0.04)" };
}

export function ParadigmPanelCard({ panel }: { panel: ParadigmPanel }) {
  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Chronic illness, school by school
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Each system read on its own terms. There is no score and no vote: where
            they disagree, both readings stand.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground">
          {DISAGREEMENT_LABEL[panel.disagreement_type] ?? panel.disagreement_type}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{panel.detail}</p>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {panel.readings.map((reading, i) => (
          <ReadingRow key={`${reading.system}-${i}`} reading={reading} />
        ))}
      </ul>
    </div>
  );
}

function ReadingRow({ reading }: { reading: ParadigmReading }) {
  const tone = toneFor(reading.verdict);
  const lineage = LINEAGE[reading.system];
  return (
    <li className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.014)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {reading.school}
          {lineage && (
            <span className="ml-2 text-[10px] font-normal tracking-wide uppercase text-muted-foreground">
              {lineage}
            </span>
          )}
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: tone.soft, color: tone.color }}
        >
          {VERDICT_LABEL[reading.verdict] ?? reading.verdict}
        </span>
      </div>
      {reading.stated_as && reading.stated_as !== reading.verdict && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          stated as {reading.stated_as}
        </p>
      )}
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{reading.note}</p>
    </li>
  );
}
