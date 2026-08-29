"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { IntakeForm } from "@/components/IntakeForm";
import { VitalityCard } from "@/components/VitalityCard";
import { SystemRiskCard } from "@/components/SystemRiskCard";
import { OrganPanelCard } from "@/components/OrganPanelCard";
import { TimelineCard } from "@/components/TimelineCard";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import type { AnalysisResponseHydrated } from "@/lib/types";

export default function Page() {
  const [result, setResult] = useState<AnalysisResponseHydrated | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main>
      <Hero />

      <IntakeForm
        onResult={setResult}
        onLoadingChange={setLoading}
        onError={setError}
        loading={loading}
      />

      {error && (
        <section className="mx-auto max-w-2xl px-6 pb-10">
          <div className="rounded-xl bg-[var(--color-risk-elevated-soft)] px-4 py-3 text-sm text-foreground ring-1 ring-black/[0.05]">
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
  "Resolving birth coordinates and historical timezone",
  "Casting the KP chart and running the pre-verdict integrity audit",
  "Analyzing 6th, 8th, and 12th cusp sub-lords plus bhadhakasthana",
  "Scoring 8 chronic-disease signatures and the body-region panel",
  "Classifying accident windows, lifespan band, and Saturn cycle",
  "Mapping vulnerabilities across eight body systems",
  "Aligning peak windows with Vimshottari dasha and transits",
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
          Reading your chart
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A full constitutional health analysis runs through a 7-step KP protocol,
          typically 50 to 130 seconds. Claude is calling around 25 Lumin tools to map
          planetary placements to body systems, watch-decade disease panels, the
          body-region affliction panel, accident windows, the Saturn cycle, and a
          qualitative lifespan band.
        </p>
        <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
          {LOADING_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-primary/60" />
              <span style={{ opacity: 1 - i * 0.12 }}>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ResultsSection({ result }: { result: AnalysisResponseHydrated }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <ResolvedLocationCaption resolved={result.resolved_location} />

      <VitalityCard
        vitality={result.vitality_index}
        confidence={result.chart_confidence}
        basis={result.constitutional_basis}
      />

      <div className="mt-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
          System risk profile
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Eight body systems scored against your chart&rsquo;s aggravators and protective
          placements. Read in physiological order, not severity order.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {result.system_risks.map((risk, i) => (
            <SystemRiskCard key={risk.system} risk={risk} index={i} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
          Body region panel
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Kaalpurusha map, each zodiac sign to a body region, scored by the
          get_health_organ_panel engine. A second lens on where the chart is exposed.
        </p>

        <div className="mt-6">
          <OrganPanelCard panel={result.organ_panel} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
          Timing & calendar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Surgical windows, recovery periods, and a screening calendar derived from the
          Vimshottari dasha and transit hierarchy.
        </p>

        <div className="mt-6">
          <TimelineCard
            chronicity={result.chronicity_profile}
            saturn={result.saturn_cycle}
            surgery={result.surgery_windows}
            recovery={result.recovery_periods}
            screening={result.screening_calendar}
          />
        </div>
      </div>

      <DisclaimerBanner text={result.disclaimer} />
    </section>
  );
}

function ResolvedLocationCaption({
  resolved,
}: {
  resolved: AnalysisResponseHydrated["resolved_location"];
}) {
  const lat = formatCoord(resolved.latitude, "N", "S");
  const lng = formatCoord(resolved.longitude, "E", "W");
  const offset = formatOffset(resolved.utc_offset_minutes);
  return (
    <div className="fade-up mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium tracking-[0.16em] uppercase text-primary">
        Chart cast for
      </span>
      <span className="font-mono">
        {lat}, {lng} · UTC{offset}
      </span>
      {resolved.note && (
        <span className="text-muted-foreground/80">· {resolved.note}</span>
      )}
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
        . Birth chart powered by{" "}
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
