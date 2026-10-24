"use client";

import { useState } from "react";
import { formatUtcOffset } from "@lumin-examples/client/zone";
import { Hero } from "@/components/Hero";
import { PlaceForm } from "@/components/PlaceForm";
import { SeasonBanner } from "@/components/SeasonBanner";
import {
  ChannelRow,
  CslBlock,
  DISPOSITION_META,
  SystemChip,
  WindowCard,
  bandLabel,
  formatDay,
} from "@/components/WindowCard";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import type {
  CurrentConditions as CurrentConditionsType,
  Disposition,
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
  "Resolving the place to coordinates and time zone",
  "Reading the 4th-cusp verdict on the season's ingress chart",
  "Casting a chart for each new and full moon in range",
  "Reading the channels, the 4th-cusp verdict and the Sapta Nadi per window",
  "Reading the present moment, and the monsoon chart where it applies",
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
          Computing the astrometeorology signature through Lumin&rsquo;s engine. Each window is
          read on its own, so a month takes one to two minutes and a wide range takes longer.
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

      <SeasonBanner season={result.season} windows={result.windows} />

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
          Each window spans roughly 14 days, cast from the new or full moon that opens it. Read it
          for the lean, not the exact day. Scores are the engine&rsquo;s raw numbers: temperature
          and precipitation run negative for cold or dry, wind and storm count up from zero.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.windows.map((w, i) => (
            <WindowCard key={`${w.label}-${i}`} window={w} index={i} />
          ))}
        </div>
      </div>

      <DisclaimerBanner
        text={result.disclaimer}
        toolText={result.tool_disclaimer}
        saptaNadiText={result.sapta_nadi_disclaimer}
      />
    </section>
  );
}

function ResolvedLocationCaption({ result }: { result: ForecastResponse }) {
  const { resolved_location: resolved, range } = result;
  const lat = formatCoord(resolved.latitude, "N", "S");
  const lng = formatCoord(resolved.longitude, "E", "W");
  const offset = formatUtcOffset(resolved.utc_offset_minutes);
  const atEnd = resolved.utc_offset_minutes_at_end;
  return (
    <div className="fade-up mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium tracking-[0.16em] uppercase text-primary">
        Signature read for
      </span>
      <span className="font-medium text-foreground">{resolved.label}</span>
      <span className="font-mono">
        {lat}, {lng} · {resolved.time_zone}, UTC{offset}
        {atEnd !== undefined && ` at the start, UTC${formatUtcOffset(atEnd)} at the end`}
      </span>
      <span className="text-muted-foreground/80">
        · {range.start} to {range.end}
      </span>
      {resolved.note && (
        <span className="text-muted-foreground/80">· {resolved.note}</span>
      )}
      {resolved.zone_mismatch && (
        <p
          role="note"
          className="mt-2 w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {resolved.label} keeps {resolved.zone_mismatch.place_time_zone} time, UTC
          {formatUtcOffset(resolved.zone_mismatch.place_offset_minutes)} at the start of the range.
          This plan used {resolved.time_zone}, so its window times are on the wrong clock. Change the
          time zone to {resolved.zone_mismatch.place_time_zone} and plan again.
        </p>
      )}
    </div>
  );
}

function DispositionChip({ disposition }: { disposition: Disposition }) {
  const meta = DISPOSITION_META[disposition];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
      style={{ background: meta.soft, color: meta.color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function CurrentConditions({ current }: { current: CurrentConditionsType }) {
  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          As of today
        </p>
        <span className="flex items-center gap-2">
          <DispositionChip disposition={current.disposition} />
          <span className="font-mono text-[11px] text-muted-foreground">{current.datetime}</span>
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <ChannelRow id="temperature" channel={current.temperature} />
        <ChannelRow id="precipitation" channel={current.precipitation} />
        <ChannelRow id="wind" channel={current.wind} />
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-foreground/85">{current.summary}</p>
      <div className="mt-4">
        <CslBlock csl={current.csl} />
      </div>
    </div>
  );
}

function MonsoonNote({ monsoon }: { monsoon: MonsoonOutlook }) {
  return (
    <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Monsoon chart · {monsoon.year}
        </p>
        <span className="flex items-center gap-2">
          <SystemChip>Ardra Pravesha, classical</SystemChip>
          <DispositionChip disposition={monsoon.disposition} />
        </span>
      </div>
      <p className="mt-3 text-sm text-foreground">
        The Sun enters Ardra on {formatDay(monsoon.ingress_date)}, a {monsoon.ingress_sect}{" "}
        ingress with {monsoon.ascendant_sign} rising.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Onset chart rainfall favourability
          </p>
          <p
            className="mt-1 text-[13px] font-medium capitalize"
            style={{ color: "var(--color-precip)" }}
          >
            {bandLabel(monsoon.rainfall_favourability)}
          </p>
        </div>
        <ChannelRow id="precipitation" channel={monsoon.precipitation} />
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-foreground/85">{monsoon.summary}</p>
      <div className="mt-4">
        <CslBlock csl={monsoon.csl} />
      </div>
    </div>
  );
}

function formatCoord(value: number, pos: string, neg: string): string {
  const dir = value >= 0 ? pos : neg;
  return `${Math.abs(value).toFixed(2)}°${dir}`;
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
