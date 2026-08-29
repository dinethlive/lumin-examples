import type { RankResponse } from "@/lib/types";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import { ConfidencePill } from "@/components/ConfidencePill";
import { DisclaimerNote } from "@/components/DisclaimerNote";
import { formatLocalDate } from "@/lib/format";

type Props = {
  data: RankResponse;
  onRestart: () => void;
  onNewConstraints: () => void;
};

export function RankResultView({ data, onRestart, onNewConstraints }: Props) {
  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-card p-5 ring-1 ring-black/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {data.event.label}
          </h1>
          <ProvenanceChip provenance={data.event.provenance} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Elects on houses {data.event.electedHouses.join("-")}
        </p>
        <p className="mt-3 text-sm text-foreground/90">{data.summary}</p>
      </header>

      <ol className="space-y-2.5">
        {data.rankedDates.map((r) => (
          <li
            key={r.dateLocal}
            className={`rounded-xl p-4 ring-1 ${
              r.rank === 1 ? "bg-elected-soft ring-elected/30" : "bg-card ring-black/[0.08]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    r.rank === 1
                      ? "bg-elected text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.rank}
                </span>
                <span className="font-medium text-foreground">{formatLocalDate(r.dateLocal)}</span>
              </div>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[0.65rem] font-medium text-foreground/70 ring-1 ring-black/[0.06]">
                {r.layersSatisfied}/4 layers
              </span>
            </div>
            {r.bestWindowLocal && (
              <p className="mt-1.5 text-sm text-muted-foreground">{r.bestWindowLocal}</p>
            )}
            <p className="mt-1.5 text-sm text-foreground/90">{r.reason}</p>
          </li>
        ))}
      </ol>

      <ConfidencePill confidence={data.confidence} />

      <DisclaimerNote text={data.disclaimer} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onNewConstraints}
          className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-medium text-foreground ring-1 ring-black/[0.08] hover:bg-muted/60"
        >
          Try different dates
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-medium text-foreground ring-1 ring-black/[0.08] hover:bg-muted/60"
        >
          Choose a different event
        </button>
      </div>
    </div>
  );
}
