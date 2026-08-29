"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ProductForm } from "@/components/ProductForm";
import { PersonalityCard } from "@/components/PersonalityCard";
import { ProductCard } from "@/components/ProductCard";
import type { MatchResponse } from "@/lib/types";

export default function Page() {
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main>
      <Hero />

      <ProductForm
        onResult={setResult}
        onLoadingChange={setLoading}
        onError={setError}
        loading={loading}
      />

      {error && (
        <section className="mx-auto max-w-2xl px-6 pb-10">
          <div className="rounded-xl bg-[var(--color-trait-warm)]/15 px-4 py-3 text-sm text-foreground ring-1 ring-black/[0.05]">
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
  "Reading your birth chart…",
  "Computing planetary positions…",
  "Mapping placements to your style…",
  "Picking products from the catalog…",
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
          One moment
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Computing your chart through Lumin&rsquo;s KP engine. This typically takes 30 to 100
          seconds. Eleven tool calls map your planetary placements to a consumer personality.
        </p>
        <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
          {LOADING_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-primary/60" />
              <span style={{ opacity: 1 - i * 0.15 }}>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ResultsSection({ result }: { result: MatchResponse }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <ResolvedLocationCaption resolved={result.resolved_location} />
      <PersonalityCard personality={result.personality} disclaimer={result.disclaimer} />

      <div className="mt-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
          Your matches
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Five products picked from our catalog to fit your style.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {result.matches.map((m, i) => (
            <ProductCard key={m.id} product={m} reason={m.reason} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResolvedLocationCaption({
  resolved,
}: {
  resolved: MatchResponse["resolved_location"];
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
        .
      </p>
    </footer>
  );
}
