import type {
  Channel,
  ChannelId,
  OutdoorRating,
  WeatherWindow,
} from "@/lib/types";

const CHANNEL_META: Record<
  ChannelId,
  { label: string; color: string; soft: string }
> = {
  temperature: {
    label: "Temperature",
    color: "var(--color-temp)",
    soft: "var(--color-temp-soft)",
  },
  precipitation: {
    label: "Precipitation",
    color: "var(--color-precip)",
    soft: "var(--color-precip-soft)",
  },
  wind: {
    label: "Wind & storm",
    color: "var(--color-wind)",
    soft: "var(--color-wind-soft)",
  },
};

const RATING_META: Record<
  OutdoorRating,
  { label: string; color: string; soft: string }
> = {
  favourable: {
    label: "Favourable",
    color: "var(--color-rating-favourable)",
    soft: "var(--color-rating-favourable-soft)",
  },
  mixed: {
    label: "Mixed",
    color: "var(--color-rating-mixed)",
    soft: "var(--color-rating-mixed-soft)",
  },
  unfavourable: {
    label: "Unsettled",
    color: "var(--color-rating-unfavourable)",
    soft: "var(--color-rating-unfavourable-soft)",
  },
};

const LEVEL_INDEX: Record<Channel["level"], number> = {
  calm: 1,
  mild: 2,
  active: 3,
  intense: 4,
};

export function WindowCard({
  window,
  index,
}: {
  window: WeatherWindow;
  index: number;
}) {
  const rating = RATING_META[window.outdoor_rating];

  return (
    <article
      className="fade-up flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/[0.06] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_16px_32px_-16px_rgba(0,0,0,0.16)]"
      style={{ animationDelay: `${100 + index * 70}ms`, opacity: 0 }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ background: rating.soft }}
      >
        <div>
          <p
            className="text-[10px] font-medium tracking-[0.16em] uppercase"
            style={{ color: rating.color }}
          >
            {window.lunation === "new-moon" ? "New moon window" : "Full moon window"}
          </p>
          <p className="mt-0.5 font-mono text-[13px] font-medium text-foreground">
            {formatRange(window.start, window.end)}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
          style={{ color: rating.color }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: rating.color }}
          />
          {rating.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug tracking-tight text-foreground">
          {window.label}
        </h3>

        <div className="mt-4 space-y-3.5">
          <ChannelRow id="temperature" channel={window.temperature} />
          <ChannelRow id="precipitation" channel={window.precipitation} />
          <ChannelRow id="wind" channel={window.wind} />
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-foreground/85">
          {window.summary}
        </p>

        <div className="mt-auto pt-4">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="mb-1 text-[10px] font-medium tracking-[0.16em] uppercase text-primary">
              4th-cusp CSL verdict
            </p>
            <p className="text-xs leading-relaxed text-foreground">
              {window.csl_verdict}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ChannelRow({ id, channel }: { id: ChannelId; channel: Channel }) {
  const meta = CHANNEL_META[id];
  const filled = LEVEL_INDEX[channel.level];
  const score = Math.max(0, Math.min(100, channel.score));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
          {meta.label}
        </span>
        <span
          className="text-[13px] font-medium capitalize"
          style={{ color: meta.color }}
        >
          {channel.band}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${score}%`, background: meta.color }}
          />
        </div>
        <div className="flex gap-0.5" aria-label={`level: ${channel.level}`}>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className="size-1.5 rounded-[1px]"
              style={{
                background: step <= filled ? meta.color : "rgba(0,0,0,0.1)",
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {channel.note}
      </p>
    </div>
  );
}

function formatRange(start: string, end: string): string {
  return `${formatDay(start)} to ${formatDay(end)}`;
}

const MONTHS = [
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

function formatDay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const month = MONTHS[parseInt(m[2], 10) - 1] ?? m[2];
  return `${month} ${parseInt(m[3], 10)}`;
}
