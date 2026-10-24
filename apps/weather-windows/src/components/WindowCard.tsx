import type {
  Channel,
  ChannelBand,
  ChannelId,
  CslFourth,
  Disposition,
  SaptaNadi,
  WeatherWindow,
} from "@/lib/types";

export const CHANNEL_META: Record<ChannelId, { label: string; color: string }> = {
  temperature: { label: "Temperature", color: "var(--color-temp)" },
  precipitation: { label: "Precipitation", color: "var(--color-precip)" },
  wind: { label: "Wind & storm", color: "var(--color-wind)" },
};

/**
 * The engine's own disposition words, with a colour each. Settled is the
 * quiet one; every other word names what pulled the chart hard.
 */
export const DISPOSITION_META: Record<Disposition, { label: string; color: string; soft: string }> = {
  SETTLED: {
    label: "Settled",
    color: "var(--color-rating-favourable)",
    soft: "var(--color-rating-favourable-soft)",
  },
  MIXED: {
    label: "Mixed",
    color: "var(--color-rating-mixed)",
    soft: "var(--color-rating-mixed-soft)",
  },
  WET: { label: "Wet", color: "var(--color-precip)", soft: "var(--color-precip-soft)" },
  DRY: { label: "Dry", color: "var(--color-temp)", soft: "var(--color-temp-soft)" },
  HOT: { label: "Hot", color: "var(--color-temp)", soft: "var(--color-temp-soft)" },
  STORMY: {
    label: "Stormy",
    color: "var(--color-rating-unfavourable)",
    soft: "var(--color-rating-unfavourable-soft)",
  },
};

/** The engine's five bands, in order. The meter shows where a channel's band sits. */
const BAND_STEPS: ChannelBand[] = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"];

export function bandLabel(band: string): string {
  return band.toLowerCase().replace(/_/g, " ");
}

/** A small tag naming the tradition a block comes from. */
export function SystemChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground ring-1 ring-black/[0.08]">
      {children}
    </span>
  );
}

export function WindowCard({ window, index }: { window: WeatherWindow; index: number }) {
  const disposition = DISPOSITION_META[window.disposition];

  return (
    <article
      className="fade-up flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/[0.06] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_16px_32px_-16px_rgba(0,0,0,0.16)]"
      style={{ animationDelay: `${100 + index * 70}ms`, opacity: 0 }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ background: disposition.soft }}
      >
        <div>
          <p
            className="text-[10px] font-medium tracking-[0.16em] uppercase"
            style={{ color: disposition.color }}
          >
            {window.lunation === "new" ? "New moon window" : "Full moon window"}
          </p>
          <p className="mt-0.5 font-mono text-[13px] font-medium text-foreground">
            {formatRange(window.start, window.end)}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
          style={{ color: disposition.color }}
          title="The engine's overall disposition for this lunation chart"
        >
          <span className="size-1.5 rounded-full" style={{ background: disposition.color }} />
          {disposition.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug tracking-tight text-foreground">
          {window.label}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <SystemChip>Channels: Western rulerships, folds included</SystemChip>
        </div>

        <div className="mt-3 space-y-3.5">
          <ChannelRow id="temperature" channel={window.temperature} />
          <ChannelRow id="precipitation" channel={window.precipitation} />
          <ChannelRow id="wind" channel={window.wind} />
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-foreground/85">{window.summary}</p>

        <div className="mt-auto space-y-3 pt-4">
          <CslBlock csl={window.csl} />
          <SaptaNadiBlock nadi={window.sapta_nadi} />
        </div>
      </div>
    </article>
  );
}

export function ChannelRow({ id, channel }: { id: ChannelId; channel: Channel }) {
  const meta = CHANNEL_META[id];
  const filled = BAND_STEPS.indexOf(channel.band) + 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
          {meta.label}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-medium capitalize" style={{ color: meta.color }}>
            {bandLabel(channel.band)}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground" title="The engine's raw score">
            {formatScore(channel.score)}
          </span>
        </span>
      </div>

      <div className="mt-1.5 flex gap-1" aria-label={`band: ${bandLabel(channel.band)}`}>
        {BAND_STEPS.map((step, i) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < filled ? meta.color : "rgba(0,0,0,0.08)" }}
          />
        ))}
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{channel.signal}</p>
      {channel.signatures.length > 0 && (
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/80">
          {channel.signatures.join(" · ")}
        </p>
      )}
    </div>
  );
}

export function CslBlock({ csl }: { csl: CslFourth }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-primary">
          4th-cusp sub lord verdict
        </p>
        <SystemChip>KP-extended</SystemChip>
      </div>
      <p className="text-sm font-medium text-foreground">{csl.verdict}</p>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
        Sub lord {csl.sub_lord}, star lord {csl.star_lord}, houses{" "}
        {csl.signified_houses.join(", ")}
      </p>
      <details className="mt-1.5">
        <summary className="cursor-pointer text-[11px] text-muted-foreground">Reasoning</summary>
        <p className="mt-1 text-xs leading-relaxed text-foreground">{csl.reasoning}</p>
      </details>
    </div>
  );
}

function SaptaNadiBlock({ nadi }: { nadi: SaptaNadi }) {
  const flags = [nadi.storm_flag && "Storm flag", nadi.drought_flag && "Drought flag"].filter(
    Boolean,
  ) as string[];
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-primary">
          Sapta Nadi Chakra
        </p>
        <SystemChip>Classical, not KP</SystemChip>
      </div>
      <p className="text-xs text-foreground">
        Precipitation <span className="font-medium capitalize">{bandLabel(nadi.precipitation_band)}</span>{" "}
        <span className="font-mono text-muted-foreground">(score {formatScore(nadi.precipitation_score)})</span>,
        rain duration <span className="font-medium lowercase">{nadi.rain_duration}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Moon in {nadi.moon_nadi} ({nadi.moon_group.toLowerCase()})
        {nadi.moon_intensifies_rain ? ", which intensifies rain" : ""}. Planets in rain, dry and
        transitional nadis: {nadi.group_counts.RAIN}, {nadi.group_counts.DRY},{" "}
        {nadi.group_counts.TRANSITIONAL}.
      </p>
      {flags.length > 0 && (
        <p className="mt-1 text-[11px] font-medium text-[var(--color-rating-unfavourable)]">
          {flags.join(", ")}
        </p>
      )}
    </div>
  );
}

export function formatScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

function formatRange(start: string, end: string): string {
  return `${formatDay(start)} to ${formatDay(end)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const month = MONTHS[parseInt(m[2], 10) - 1] ?? m[2];
  return `${month} ${parseInt(m[3], 10)}`;
}
