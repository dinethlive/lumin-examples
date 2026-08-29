"use client";

import { useState } from "react";
import { MatchForm } from "@/components/MatchForm";
import { MatchResult } from "@/components/MatchResult";
import type { MatchResponse } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<MatchResponse | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          Lumin example
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Kundli match
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Three independent compatibility systems for two birth charts, shown side by
          side rather than blended into one score, with the places they disagree named
          and explained.
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
        <MatchForm onResult={setData} />
      </div>

      {data && (
        <div className="mt-8">
          <MatchResult data={data} />
        </div>
      )}
    </main>
  );
}
