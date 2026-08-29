import type { ElectResponse } from "@/lib/types";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import { ConfidencePill } from "@/components/ConfidencePill";
import { DisclaimerNote } from "@/components/DisclaimerNote";
import { formatLocalDateTime, formatLocalTime } from "@/lib/format";

type Props = {
  data: ElectResponse;
  onRestart: () => void;
  onNewConstraints: () => void;
};

const LAYER_LABEL: Record<number, string> = {
  1: "significators only",
  2: "+ dasha lord",
  3: "+ Moon star and sub",
  4: "+ Ascendant sign, star and sub",
};

export function ResultView({ data, onRestart, onNewConstraints }: Props) {
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
          {data.event.excludedHouses.length > 0 && (
            <>, excludes {data.event.excludedHouses.join("-")}</>
          )}
          {data.event.citation && <> &middot; {data.event.citation}</>}
        </p>
        <p className="mt-3 text-sm text-foreground/90">{data.summary}</p>
      </header>

      {data.moments.length === 0 ? (
        <div className="rounded-xl bg-card p-5 ring-1 ring-black/[0.08]">
          <p className="text-sm text-foreground/90">
            No moment inside the window you gave passes even two layers of the test. That is a
            real answer, not a failure: try a longer window, or hours the chart's significators
            can actually reach.
          </p>
        </div>
      ) : (
        <div>
          {data.tie && (
            <p className="mb-2.5 text-xs font-medium text-muted-foreground">
              The selection tests could not separate {data.moments.length} moments. All are shown,
              none is ranked above the others by a score, there is none in KP.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.moments.map((m) => (
              <div
                key={`${m.rank}-${m.startLocal}`}
                className={`rounded-xl p-4 ring-1 ${
                  m.rank === 1
                    ? "bg-elected-soft ring-elected/30"
                    : "bg-card ring-black/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      m.rank === 1 ? "text-elected" : "text-muted-foreground"
                    }`}
                  >
                    {m.rank === 1 ? "Elected moment" : `Tied moment ${m.rank}`}
                  </span>
                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-[0.65rem] font-medium text-foreground/70 ring-1 ring-black/[0.06]">
                    {m.layersSatisfied}/4 layers
                  </span>
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {formatLocalDateTime(m.startLocal)}
                </p>
                <p className="text-sm text-muted-foreground">
                  to {formatLocalTime(m.endLocal)} &middot; {m.durationMinutes} min
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {LAYER_LABEL[m.layersSatisfied] ?? ""}, fixed at the{" "}
                  {m.resolvingLayer.replace(/-/g, " ")} level
                </p>
                {m.reason && <p className="mt-2 text-sm text-foreground/90">{m.reason}</p>}
                {m.matchedConditions.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {m.matchedConditions.slice(0, 4).map((c, i) => (
                      <li
                        key={i}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem] text-foreground/70 ring-1 ring-black/[0.06]"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.crossCheck && data.crossCheck.moments.length > 0 && (
        <section className="rounded-xl bg-card p-5 ring-1 ring-black/[0.08]">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Second opinion: older triangulation (T40)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{data.crossCheck.note}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.crossCheck.moments.slice(0, 4).map((m, i) => (
              <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-black/[0.05]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{formatLocalDateTime(m.datetime)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.conditionsMet}/3
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.isFullTriangulation ? "Full triangulation" : "Workable, not full agreement"}
                  {" "}&middot; {m.durationMinutes} min
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(data.dayContext.panchang || data.dayContext.choghadiyaAtMoment) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {data.dayContext.panchang && (
            <div className="rounded-xl bg-card p-5 ring-1 ring-black/[0.08]">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Panchang for the elected day
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ["Tithi", data.dayContext.panchang.tithi],
                  ["Nakshatra", data.dayContext.panchang.nakshatra],
                  ["Yoga", data.dayContext.panchang.yoga],
                  ["Karana", data.dayContext.panchang.karana],
                  ["Weekday", data.dayContext.panchang.weekday],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Sunrise {formatLocalTime(data.dayContext.panchang.sunriseLocal)}, sunset{" "}
                {formatLocalTime(data.dayContext.panchang.sunsetLocal)}
              </p>
            </div>
          )}
          {data.dayContext.choghadiyaAtMoment && (
            <div className="rounded-xl bg-card p-5 ring-1 ring-black/[0.08]">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Choghadiya at that moment
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vedic muhurta, not Krishnamurti Paddhati
              </p>
              <p className="mt-3 font-medium text-foreground">
                {data.dayContext.choghadiyaAtMoment.name} &middot;{" "}
                {data.dayContext.choghadiyaAtMoment.lord}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatLocalTime(data.dayContext.choghadiyaAtMoment.startLocal)} to{" "}
                {formatLocalTime(data.dayContext.choghadiyaAtMoment.endLocal)} &middot;{" "}
                {data.dayContext.choghadiyaAtMoment.quality}
              </p>
              <p className="mt-2 text-sm text-foreground/90">
                {data.dayContext.choghadiyaAtMoment.interpretation}
              </p>
            </div>
          )}
        </section>
      )}

      <ConfidencePill confidence={data.confidence} />

      <DisclaimerNote text={data.disclaimer} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onNewConstraints}
          className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-medium text-foreground ring-1 ring-black/[0.08] hover:bg-muted/60"
        >
          Adjust the window or hours
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
