"use client";

import { useState } from "react";
import { PersonFields, defaultPerson } from "./PersonFields";
import type { MatchInput, MatchResponse } from "@/lib/types";

/** Named phases, so a 50 to 150 second wait shows progress instead of a spinner. */
const LOADING_STEPS = [
  "Reading birth-time confidence for both charts",
  "Casting the 36-point Ashta Koota Milan",
  "Scoring the KP 7-factor compatibility read",
  "Running the rigorous 6-cuspal-sub-lord read",
  "Checking Manglik, Kalsarpa and the KP dissent",
  "Describing the spouse each chart implies",
  "Finding where the three systems disagree",
];

type Props = {
  onResult: (data: MatchResponse) => void;
};

export function MatchForm({ onResult }: Props) {
  const [personA, setPersonA] = useState(defaultPerson("Person A"));
  const [personB, setPersonB] = useState(defaultPerson("Person B"));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStep(0);

    const ticker = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      13000,
    );
    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    const payload: MatchInput = { personA, personB };

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check ok BEFORE parsing. A platform timeout returns HTML, and calling
      // .json() on HTML throws "Unexpected token '<'", which is what a user
      // would otherwise be shown instead of the real failure.
      if (!res.ok) {
        let message = "Could not compute the match.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          message = `Request failed with status ${res.status}.`;
        }
        setError(message);
        return;
      }

      onResult((await res.json()) as MatchResponse);
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "That took too long. Try again."
          : "Could not reach the server.",
      );
    } finally {
      clearInterval(ticker);
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <PersonFields
          label="Person A"
          value={personA}
          onChange={setPersonA}
          disabled={loading}
        />
        <PersonFields
          label="Person B"
          value={personB}
          onChange={setPersonB}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] rounded-lg bg-black px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? LOADING_STEPS[step] : "Compare the two charts"}
      </button>

      {loading && (
        <p className="text-sm text-black/50">
          Eleven tool calls across the two charts, usually 50 to 150 seconds.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}
    </form>
  );
}
