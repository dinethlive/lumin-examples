import type { RiskLevel, SystemRiskHydrated } from "@/lib/types";

const RISK_TONE: Record<RiskLevel, { color: string; soft: string; label: string }> = {
  low: {
    color: "var(--color-risk-low)",
    soft: "var(--color-risk-low-soft)",
    label: "Low",
  },
  moderate: {
    color: "var(--color-risk-moderate)",
    soft: "var(--color-risk-moderate-soft)",
    label: "Moderate",
  },
  elevated: {
    color: "var(--color-risk-elevated)",
    soft: "var(--color-risk-elevated-soft)",
    label: "Elevated",
  },
  high: {
    color: "var(--color-risk-high)",
    soft: "var(--color-risk-high-soft)",
    label: "High",
  },
};

export function SystemRiskCard({
  risk,
  index,
}: {
  risk: SystemRiskHydrated;
  index: number;
}) {
  const tone = RISK_TONE[risk.risk_level];
  const score = Math.max(0, Math.min(100, risk.severity_score));
  const hue = risk.meta.hue;

  return (
    <article
      className="fade-up group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/[0.06] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_16px_32px_-16px_rgba(0,0,0,0.16)]"
      style={{ animationDelay: `${100 + index * 60}ms`, opacity: 0 }}
    >
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${hue}15 0%, ${hue}40 50%, ${hue}25 100%)`,
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${hue}55, transparent 60%)`,
          }}
        />
        <div
          className="absolute right-3 top-3 size-10 rounded-full opacity-60 mix-blend-multiply"
          style={{ background: hue }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-foreground/60">
            {risk.meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-snug tracking-tight text-foreground">
            {risk.meta.label}
          </h3>
          <RiskBadge tone={tone} />
        </div>

        <div className="mt-3">
          <SeverityBar score={score} color={tone.color} />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>severity</span>
            <span className="font-mono">{score} / 100</span>
          </div>
        </div>

        <section className="mt-4">
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
            Chart indicators
          </p>
          <ul className="mt-2 space-y-1.5">
            {risk.primary_indicators.map((indicator, i) => (
              <li
                key={i}
                className="flex gap-2 text-[13px] leading-relaxed text-foreground"
              >
                <span
                  className="mt-1.5 size-1 shrink-0 rounded-full"
                  style={{ background: tone.color }}
                />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </section>

        {risk.peak_window && (
          <section
            className="mt-4 rounded-lg px-3 py-2.5"
            style={{ background: tone.soft }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.16em] uppercase"
              style={{ color: tone.color }}
            >
              Peak window
            </p>
            <p className="mt-1 font-mono text-[13px] font-medium text-foreground">
              {formatRange(risk.peak_window.start, risk.peak_window.end)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">
              {risk.peak_window.trigger}
            </p>
          </section>
        )}

        <div className="mt-auto pt-4">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="mb-1 text-[10px] font-medium tracking-[0.16em] uppercase text-primary">
              Preventive focus
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {risk.preventive_focus}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function RiskBadge({
  tone,
}: {
  tone: { color: string; soft: string; label: string };
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
      style={{ background: tone.soft, color: tone.color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tone.color }} />
      {tone.label}
    </span>
  );
}

function SeverityBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

function formatRange(start: string, end: string): string {
  return `${formatMonth(start)} to ${formatMonth(end)}`;
}

function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = parseInt(m[2], 10) - 1;
  return `${months[idx] ?? m[2]} ${m[1]}`;
}
