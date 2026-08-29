import type {
  ChartConfidence,
  ConfidenceBand,
  ConstitutionalBasis,
  VitalityIndex,
} from "@/lib/types";

const LABEL_VAR: Record<VitalityIndex["label"], string> = {
  robust: "var(--color-vitality-robust)",
  balanced: "var(--color-vitality-balanced)",
  fragile: "var(--color-vitality-fragile)",
};

const LABEL_DESCRIPTION: Record<VitalityIndex["label"], string> = {
  robust: "Strong baseline reserves. Maintenance focus, periodic check-ins.",
  balanced: "Workable reserves with specific weak points to monitor.",
  fragile: "Lower reserves. Proactive screening and lifestyle support warranted.",
};

const CONFIDENCE_TONE: Record<
  ConfidenceBand,
  { color: string; soft: string; label: string }
> = {
  high: {
    color: "var(--color-risk-low)",
    soft: "var(--color-risk-low-soft)",
    label: "High",
  },
  moderate: {
    color: "var(--color-risk-moderate)",
    soft: "var(--color-risk-moderate-soft)",
    label: "Moderate",
  },
  low: {
    color: "var(--color-risk-elevated)",
    soft: "var(--color-risk-elevated-soft)",
    label: "Low",
  },
};

export function VitalityCard({
  vitality,
  confidence,
  basis,
}: {
  vitality: VitalityIndex;
  confidence: ChartConfidence;
  basis: ConstitutionalBasis;
}) {
  const accent = LABEL_VAR[vitality.label];

  return (
    <div
      className="fade-up relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-8"
      style={{
        background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%), white`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Your vitality
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight capitalize text-foreground md:text-5xl">
            {vitality.label}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScorePill score={vitality.score} accent={accent} />
          <ConfidencePill confidence={confidence} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill label={`Asc ${basis.ascendant}`} accent={accent} />
        <Pill label={`Moon ${basis.moon_sign}`} accent={accent} />
        <Pill label={basis.moon_nakshatra} accent={accent} />
        <Pill label={`Dasha ${basis.active_dasha}`} accent={accent} />
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-base">
        {vitality.summary}
      </p>

      <div className="mt-6 grid gap-3 border-t border-black/[0.06] pt-6 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-medium capitalize">Constitution</p>
          <p className="mt-1 text-muted-foreground">
            {LABEL_DESCRIPTION[vitality.label]}
          </p>
        </div>
        <div>
          <p className="font-medium">Lagna lord</p>
          <p className="mt-1 text-muted-foreground">
            {basis.ascendant_lord} at strength {basis.ascendant_lord_strength}/100.
          </p>
        </div>
        <div>
          <p className="font-medium">Chart confidence</p>
          <p className="mt-1 text-muted-foreground">{confidence.summary}</p>
        </div>
        <div>
          <p className="font-medium">Reading note</p>
          <p className="mt-1 text-muted-foreground">{basis.notes}</p>
        </div>
      </div>
    </div>
  );
}

function ScorePill({ score, accent }: { score: number; accent: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div
      className="inline-flex shrink-0 items-baseline gap-1 rounded-full bg-white/70 px-4 py-2 ring-1 ring-black/[0.05]"
      style={{ color: accent }}
    >
      <span className="font-serif text-2xl tracking-tight">{clamped}</span>
      <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-muted-foreground">
        / 100
      </span>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: ChartConfidence }) {
  const tone = CONFIDENCE_TONE[confidence.band];
  const mod = confidence.modifier;
  const modText = `${mod >= 0 ? "+" : ""}${mod}`;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
      style={{ background: tone.soft, color: tone.color }}
      title="Pre-verdict audit: boundary, combustion, planetary war, vargottama"
    >
      <span className="size-1.5 rounded-full" style={{ background: tone.color }} />
      Confidence {tone.label}
      <span className="font-mono normal-case opacity-80">{modText}</span>
    </span>
  );
}

function Pill({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
      style={{
        background: `${accent}12`,
        color: accent,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: accent }} />
      {label}
    </span>
  );
}
