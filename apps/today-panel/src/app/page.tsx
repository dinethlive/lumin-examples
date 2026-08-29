"use client";

import { useState } from "react";
import { CityForm } from "@/components/CityForm";
import { Panel } from "@/components/Panel";
import type { TodayResponse } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<TodayResponse | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          Lumin example
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Today panel
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Panchang, choghadiya and hora for any city on earth, computed live. No
          account, no birth details, nothing personal at all: this whole panel is
          built from a place and a date.
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
        <CityForm onResult={setData} />
      </div>

      {data && (
        <div className="mt-8">
          <Panel data={data} />
        </div>
      )}
    </main>
  );
}
