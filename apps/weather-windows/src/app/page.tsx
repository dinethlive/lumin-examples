"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { PlaceForm } from "@/components/PlaceForm";
import { SeasonBanner } from "@/components/SeasonBanner";
import { WindowCard } from "@/components/WindowCard";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import type {
  Channel,
  CurrentConditions as CurrentConditionsType,
  ForecastResponse,
  MonsoonOutlook,
} from "@/lib/types";

export default function Page() {
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main>
      <Hero />

      <PlaceForm
        onResult={setResult}
        onLoadingChange={setLoading}
        onError={setError}
        loading={loading}
      />

      {error && (
        <section className="mx-auto max-w-2xl px-6 pb-10">
          <div className="rounded-xl bg-[var(--color-rating-unfavourable-soft)] px-4 py-3 text-sm text-foreground ring-1 ring-black/[0.05]">
            <p className="font-medium">Something went wrong.</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </section>
      )}

      {loading && <LoadingState />}

      {result && <ResultsSection result={result} />}

      <Footer />
    </main>
  );
}

const LOADING_STEPS = [
  "Resolving the place to coordinates and timezone",
  "Casting the cardinal ingress charts for the season",
  "Casting a chart for each new and full moon in range",
  "Scoring temperature, precipitation, and wind channels",
  "Reading the 4th-cusp sub-lord verdict per window",
];

function LoadingState() {
  return (
    <section className="mx-auto max-w-2xl px-6 pb-16">
      <div className="rounded-2xl bg-card p-8 ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="thinking-dot size-2 rounded-full bg-primary" />
          <span className="thinking-dot size-2 rounded-full bg-primary" />
          <span className="thinking-dot size-2 rounded-full bg-primary" />
        </div>
        <p className="mt-4 font-serif text-2xl tracking-tight text-foreground">
          Reading the sky
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Computing the KP astrometeorology signature through Lumin&rsquo;s engine. This
          typically takes 40 to 90 seconds. Claude is calling the seasonal-outlook,
          weather-windows, current-snapshot, and (for monsoon regions) monsoon-onset
          tools, then scoring each lunation window.
        </p>
        <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
          {LOADING_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-primary/60" />
              <span style={{ opacity: 1 - i * 0.13 }}>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ResultsSection({ result }: { result: ForecastResponse }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <ResolvedLocationCaption result={result} />

      <SeasonBanner season={result.season} bestWindow={result.best_window} />

      {(result.current || result.monsoon) && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {result.current && <CurrentConditions current={result.current} />}
          {result.monsoon && <MonsoonNote monsoon={result.monsoon} />}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
          Weather windows
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each window spans roughly 14 days, cast from the new or full moon that opens
          it. Read it for the lean, not the exact day.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.windows.map((w, i) => (
            <WindowCard key={`${w.label}-${i}`} window={w} index={i} />
          ))}
        </div>
      </div>

      <DisclaimerBanner text={result.disclaimer} />
    </section>
  );
}

function ResolvedLocationCaption({ result }: { result: ForecastResponse }) {
  const { resolved_location: resolved, range } = result;
  const lat = formatCoord(resolved.latitude, "N", "S");
  const lng = formatCoord(resolved.longitude, "E", "W");
  const offset = formatOffset(resolved.utc_offset_minutes);
  return (
    <div className="fade-up mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium tracking-[0.16em] uppercase text-primary">
        Signature read for
      </span>
      <span className="font-medium text-foreground">{resolved.label}</span>
      <span className="font-mono">
        {lat}, {lng} · UTC{offset}
      </span>
      <span className="text-muted-foreground/80">
        · {range.start} to {range.end}
      </span>
      {resolved.note && (
        <span className="text-muted-foreground/80">· {resolved.note}</span>
      )}
    </div>
  );
}

const MINI_CHANNEL: Record<
  "temperature" | "precipitation" | "wind",
  { label: string; color: string }
> = {
  temperature: { label: "Temperature", color: "var(--color-temp)" },
  precipitation: { label: "Precipitation", color: "var(--color-precip)" },
  wind: { label: "Wind & storm", color: "var(--color-wind)" },
};

function MiniChannel({
  id,
  channel,
}: {
  id: keyof typeof MINI_CHANNEL;
  channel: Channel;
}) {
  const meta = MINI_CHANNEL[id];
  const score = Math.max(0, Math.min(100, channel.score));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
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
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${score}%`, background: meta.color }}
        />
      </div>
    </div>
  );
}

function CurrentConditions({ current }: { current: CurrentConditionsType }) {
  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          As of today
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">
          {current.datetime}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniChannel id="temperature" channel={current.temperature} />
        <MiniChannel id="precipitation" channel={current.precipitation} />
        <MiniChannel id="wind" channel={current.wind} />
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-foreground/85">
        {current.summary}
      </p>
    </div>
  );
}

function MonsoonNote({ monsoon }: { monsoon: MonsoonOutlook }) {
  const score = Math.max(0, Math.min(100, monsoon.precipitation.score));
  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Monsoon onset · {monsoon.year}
        </p>
        <span
          className="font-mono text-[12px] capitalize"
          style={{ color: "var(--color-precip)" }}
        >
          {monsoon.precipitation.band}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{monsoon.onset}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${score}%`, background: "var(--color-precip)" }}
        />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-foreground/85">
        {monsoon.summary}
      </p>
    </div>
  );
}

function formatCoord(value: number, pos: string, neg: string): string {
  const dir = value >= 0 ? pos : neg;
  return `${Math.abs(value).toFixed(2)}°${dir}`;
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

function Footer() {
  return (
    <footer className="border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground">
      <p>
        A demo of{" "}
        <a
          href="https://lumin.guru"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          Lumin MCP
        </a>
        . Weather signature powered by{" "}
        <a
          href="https://mcp.lumin.guru"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          mcp.lumin.guru
        </a>
        . Open-source on{" "}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  );
}
