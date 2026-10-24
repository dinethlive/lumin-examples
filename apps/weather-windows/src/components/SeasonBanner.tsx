import type { SeasonOutlook, WeatherWindow } from "@/lib/types";
import { CslBlock, formatDay } from "@/components/WindowCard";

/**
 * The season covering the range, read from its cardinal ingress chart by the
 * 4th-cusp step tool, and the windows the engine itself called settled. No
 * ranking: a window is listed only when its disposition is SETTLED.
 */
export function SeasonBanner({
  season,
  windows,
}: {
  season: SeasonOutlook;
  windows: WeatherWindow[];
}) {
  const settled = windows.filter((w) => w.disposition === "SETTLED");
  return (
    <div
      className="fade-up relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-8"
      style={{
        background: "linear-gradient(135deg, var(--color-primary)12 0%, transparent 55%), white",
      }}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Season chart
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground capitalize md:text-4xl">
            {season.season} {season.year}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">
            Read from the cardinal ingress of {formatDay(season.ingress_date)} {season.year} (
            {season.frame} frame), the chart that opens the season covering this range.
          </p>
        </div>
        <CslBlock csl={season.csl} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-5">
        <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
          Windows the engine calls settled
        </span>
        {settled.length === 0 ? (
          <span className="text-xs text-muted-foreground">None in this range</span>
        ) : (
          settled.map((w) => (
            <span
              key={w.label}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-black/[0.05]"
              style={{
                background: "var(--color-rating-favourable-soft)",
                color: "var(--color-rating-favourable)",
              }}
            >
              <span className="size-1.5 rounded-full" style={{ background: "var(--color-rating-favourable)" }} />
              {w.label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
