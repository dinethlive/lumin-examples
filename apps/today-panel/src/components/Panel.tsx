import type {
  BandQuality,
  ChoghadiyaPeriod,
  HoraHour,
  TodayResponse,
} from "@/lib/types";

/** UTC in, the viewer's local clock out. Every timestamp the API returns is UTC. */
function localTime(iso: string, offsetMinutes: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(
    shifted.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

const QUALITY_STYLE: Record<BandQuality, string> = {
  auspicious: "bg-emerald-50 ring-emerald-200 text-emerald-900",
  neutral: "bg-amber-50 ring-amber-200 text-amber-900",
  inauspicious: "bg-rose-50 ring-rose-200 text-rose-900",
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-black/50">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Band({
  label,
  sub,
  quality,
  start,
  end,
  isCurrent,
  offset,
}: {
  label: string;
  sub: string;
  quality: BandQuality;
  start: string;
  end: string;
  isCurrent: boolean;
  offset: number;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ring-1 ${QUALITY_STYLE[quality]} ${
        isCurrent ? "ring-2 ring-black/40" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums opacity-70">
          {localTime(start, offset)} to {localTime(end, offset)}
        </span>
      </div>
      <p className="mt-0.5 text-xs opacity-80">{sub}</p>
      {isCurrent && (
        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide">
          Running now
        </p>
      )}
    </div>
  );
}

export function Panel({ data }: { data: TodayResponse }) {
  const offset = data.place.utcOffsetMinutes;
  const day = data.choghadiya.slice(0, 8);
  const night = data.choghadiya.slice(8);

  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
        <h1 className="text-lg font-semibold tracking-tight">{data.place.label}</h1>
        <p className="mt-0.5 text-sm text-black/60">
          {data.panchang.weekday}, {data.date}. Sunrise{" "}
          {localTime(data.panchang.sunriseUTC, offset)}, sunset{" "}
          {localTime(data.panchang.sunsetUTC, offset)}.
        </p>
        <p className="mt-3 text-sm text-black/80">{data.summary}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Panchang" subtitle="The five limbs, plus the three avoided bands">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Tithi", data.panchang.tithi],
              ["Nakshatra", data.panchang.nakshatra],
              ["Yoga", data.panchang.yoga],
              ["Karana", data.panchang.karana],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-black/50">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 space-y-1.5">
            {(
              [
                ["Rahu kaal", data.panchang.rahuKaal],
                ["Yamaganda", data.panchang.yamagandaKaal],
                ["Gulikai", data.panchang.gulikaiKaal],
              ] as const
            ).map(([label, band]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-1.5 text-sm ring-1 ring-rose-200"
              >
                <span className="text-rose-900">{label}</span>
                <span className="font-mono text-xs tabular-nums text-rose-900/80">
                  {localTime(band.startUTC, offset)} to {localTime(band.endUTC, offset)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="The Moon right now"
          subtitle="The fastest hand on the clock, it moves sub lord every 2 to 3 hours"
        >
          <p className="text-sm">
            <span className="font-medium">{data.moon.sign}</span>, star lord{" "}
            <span className="font-medium">{data.moon.starLord}</span>, sub lord{" "}
            <span className="font-medium">{data.moon.subLord}</span>.
          </p>
          <p className="mt-1 text-sm text-black/60">
            {data.moon.minutesRemainingInSub} minutes left in this sub, then{" "}
            {data.moon.nextSubLord}.
          </p>
          {data.nextChanges.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {data.nextChanges.slice(0, 5).map((c) => (
                <li key={c.planet} className="flex justify-between gap-2">
                  <span className="text-black/70">{c.planet}</span>
                  <span className="text-black/50">
                    {c.currentSubLord} to {c.nextSubLord} in{" "}
                    {Math.round(c.hoursUntilChange)}h
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Choghadiya"
        subtitle="Vedic muhurta, not Krishnamurti Paddhati. Eight day and eight night periods"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
              Day
            </h3>
            <div className="space-y-1.5">
              {day.map((p: ChoghadiyaPeriod, i) => (
                <Band
                  key={`${p.name}-${i}`}
                  label={p.name}
                  sub={`${p.lord}. ${p.interpretation}`}
                  quality={p.quality}
                  start={p.startUTC}
                  end={p.endUTC}
                  isCurrent={p.isCurrent}
                  offset={offset}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
              Night
            </h3>
            <div className="space-y-1.5">
              {night.map((p: ChoghadiyaPeriod, i) => (
                <Band
                  key={`${p.name}-night-${i}`}
                  label={p.name}
                  sub={`${p.lord}. ${p.interpretation}`}
                  quality={p.quality}
                  start={p.startUTC}
                  end={p.endUTC}
                  isCurrent={p.isCurrent}
                  offset={offset}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Hora"
        subtitle="Vedic muhurta, not Krishnamurti Paddhati. 24 planetary hours from sunrise"
      >
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.hora.map((h: HoraHour, i) => (
            <Band
              key={`${h.lord}-${i}`}
              label={h.lord}
              sub={h.interpretation}
              quality={h.quality}
              start={h.startUTC}
              end={h.endUTC}
              isCurrent={h.isCurrent}
              offset={offset}
            />
          ))}
        </div>
      </Card>

      <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-xs text-black/60 ring-1 ring-black/[0.06]">
        {data.disclaimer}
      </p>
    </div>
  );
}
