"use client";

import { useState } from "react";
import { AskForm } from "@/components/AskForm";
import { VerdictPanel } from "@/components/VerdictPanel";
import type { HoraryResponse } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<HoraryResponse | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          Lumin example
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Horary desk
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Ask one question, pick a number between 1 and 249, get a reasoned
          verdict computed live. No birth date, no signup, no account: the
          chart is cast from the number and the moment you ask, nothing else.
        </p>
      </div>

      {!data ? (
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
          <AskForm onResult={setData} />
        </div>
      ) : (
        <VerdictPanel data={data} onReset={() => setData(null)} />
      )}
    </main>
  );
}
