"use client";

import { useState } from "react";
import { EventPicker } from "@/components/EventPicker";
import { ConstraintsForm } from "@/components/ConstraintsForm";
import { ResultView } from "@/components/ResultView";
import { RankResultView } from "@/components/RankResultView";
import type { CatalogEvent, ElectResponse, RankResponse } from "@/lib/types";

type Screen = "picker" | "constraints" | "result" | "rankResult";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("picker");
  const [event, setEvent] = useState<CatalogEvent | null>(null);
  const [electResult, setElectResult] = useState<ElectResponse | null>(null);
  const [rankResult, setRankResult] = useState<RankResponse | null>(null);

  function reset() {
    setEvent(null);
    setElectResult(null);
    setRankResult(null);
    setScreen("picker");
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Lumin example
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Muhurta scheduler
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Say what you are planning, give the window you can work within and the hours you can
          actually use, and get one elected moment with the reason stated. No score, no ranked
          list of guesses.
        </p>
      </div>

      <div className="max-w-2xl">
        {screen === "picker" && (
          <EventPicker
            onSelect={(e) => {
              setEvent(e);
              setScreen("constraints");
            }}
          />
        )}

        {screen === "constraints" && event && (
          <ConstraintsForm
            event={event}
            onBack={() => setScreen("picker")}
            onElectResult={(data) => {
              setElectResult(data);
              setScreen("result");
            }}
            onRankResult={(data) => {
              setRankResult(data);
              setScreen("rankResult");
            }}
          />
        )}
      </div>

      {screen === "result" && electResult && (
        <div className="mt-2 max-w-4xl">
          <ResultView
            data={electResult}
            onRestart={reset}
            onNewConstraints={() => setScreen("constraints")}
          />
        </div>
      )}

      {screen === "rankResult" && rankResult && (
        <div className="mt-2 max-w-2xl">
          <RankResultView
            data={rankResult}
            onRestart={reset}
            onNewConstraints={() => setScreen("constraints")}
          />
        </div>
      )}
    </main>
  );
}
