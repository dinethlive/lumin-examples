import type { SeasonOutlook } from "@/lib/types";

export function SeasonBanner({
  season,
  bestWindow,
}: {
  season: SeasonOutlook;
  bestWindow: string;
}) {
  return (
    <div
      className="fade-up relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-8"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary)12 0%, transparent 55%), white",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Season outlook
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            {season.season}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85 md:text-base">
            {season.theme}
          </p>
        </div>
      </div>

      {bestWindow && (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-5">
          <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
            Calmest window in range
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-black/[0.05]"
            style={{
              background: "var(--color-rating-favourable-soft)",
              color: "var(--color-rating-favourable)",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: "var(--color-rating-favourable)" }}
            />
            {bestWindow}
          </span>
        </div>
      )}
    </div>
  );
}
