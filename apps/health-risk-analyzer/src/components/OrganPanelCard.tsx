import type { OrganPanel, OrganRegion } from "@/lib/types";

function toneFor(score: number): { color: string; soft: string; label: string } {
  if (score >= 75) {
    return {
      color: "var(--color-risk-high)",
      soft: "var(--color-risk-high-soft)",
      label: "High",
    };
  }
  if (score >= 55) {
    return {
      color: "var(--color-risk-elevated)",
      soft: "var(--color-risk-elevated-soft)",
      label: "Elevated",
    };
  }
  if (score >= 30) {
    return {
      color: "var(--color-risk-moderate)",
      soft: "var(--color-risk-moderate-soft)",
      label: "Moderate",
    };
  }
  return {
    color: "var(--color-risk-low)",
    soft: "var(--color-risk-low-soft)",
    label: "Low",
  };
}

export function OrganPanelCard({ panel }: { panel: OrganPanel }) {
  const topScore = panel.regions[0]?.score ?? 0;
  const headlineTone = toneFor(topScore);

  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Body region panel
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The sign-to-body-region affliction map (Kaalpurusha), scored by the engine
            from malefics in each sign and sign-lord weakness.
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.05]"
          style={{ background: headlineTone.soft, color: headlineTone.color }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: headlineTone.color }}
          />
          Most exposed: {panel.highest_risk_region}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{panel.summary}</p>

      <ul className="mt-5 space-y-2.5">
        {panel.regions.map((region, i) => (
          <RegionRow key={`${region.region}-${i}`} region={region} />
        ))}
      </ul>
    </div>
  );
}

function RegionRow({ region }: { region: OrganRegion }) {
  const tone = toneFor(region.score);
  const score = Math.max(0, Math.min(100, region.score));

  return (
    <li className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.014)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          {region.region}
          <span className="ml-2 text-[11px] font-normal tracking-wide uppercase text-muted-foreground">
            {region.sign}
          </span>
        </p>
        <span className="font-mono text-[12px]" style={{ color: tone.color }}>
          {score}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${score}%`, background: tone.color }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {region.note}
      </p>
    </li>
  );
}
