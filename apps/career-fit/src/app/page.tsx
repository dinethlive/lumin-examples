"use client";

import { useState } from "react";
import { IntakeForm } from "@/components/IntakeForm";
import { FoundationCard } from "@/components/FoundationCard";
import { FitPanel } from "@/components/FitPanel";
import { ModePanel } from "@/components/ModePanel";
import { TimingPanel } from "@/components/TimingPanel";
import { BlockagePanel } from "@/components/BlockagePanel";
import { CrossSystemPanel } from "@/components/CrossSystemPanel";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import type { CareerFitResponse } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<CareerFitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          Lumin example
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Career fit
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          A vocational fit and career timing console for a coaching session. Built
          from thirteen separate KP tools, each answering one question and each
          reported on its own: promise, fit, mode, timing and blockage never
          collapse into a single score.
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
        <IntakeForm
          onResult={setData}
          onLoadingChange={setLoading}
          onError={setError}
          loading={loading}
        />
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <p className="font-medium">Something went wrong.</p>
          <p className="mt-1 text-rose-800/80">{error}</p>
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-6">
          <ResolvedLocationCaption resolved={data.resolvedLocation} />

          <FoundationCard
            audit={data.audit}
            promise={data.promise.career}
            boundaryWarnings={data.confidence.boundaryWarnings}
          />

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">1. Fit</h2>
            <FitPanel fit={data.fit} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">2. Mode</h2>
            <ModePanel jobVsBusiness={data.mode.jobVsBusiness} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">3. Timing</h2>
            <TimingPanel timing={data.timing} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">4. Blockage</h2>
            <BlockagePanel blockage={data.blockage} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Cross-system reference</h2>
            <CrossSystemPanel crossSystem={data.crossSystem} />
          </section>

          <DisclaimerBanner text={data.disclaimer} />
        </div>
      )}

      <Footer />
    </main>
  );
}

function ResolvedLocationCaption({
  resolved,
}: {
  resolved: CareerFitResponse["resolvedLocation"];
}) {
  const lat = formatCoord(resolved.latitude, "N", "S");
  const lng = formatCoord(resolved.longitude, "E", "W");
  const offset = formatOffset(resolved.utcOffsetMinutes);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50">
      <span className="font-medium uppercase tracking-[0.1em] text-black/40">
        Chart cast for
      </span>
      <span className="font-mono">
        {lat}, {lng} &middot; UTC{offset}
      </span>
      {resolved.note && <span className="text-black/40">&middot; {resolved.note}</span>}
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
    <footer className="mt-16 border-t border-black/[0.06] pt-6 text-center text-xs text-black/40">
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
        . Not a hiring, screening or evaluation input.
      </p>
    </footer>
  );
}
