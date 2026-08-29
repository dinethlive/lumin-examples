"use client";

import { useState, type FormEvent } from "react";
import type { BirthInput, CareerFitResponse } from "@/lib/types";

/** Named phases, so a 60 to 160 second wait shows progress instead of a spinner. */
const LOADING_STEPS = [
  "Resolving the birth location",
  "Running the chart-integrity audit",
  "Reading the promise gate for Career / Job Start",
  "Scoring career-category fit and occupation leanings",
  "Running the five job-vs-business rules",
  "Walking promotion, job-change and income windows",
  "Diagnosing blockages from the 10th CSL's missing houses",
  "Reading the Dasamsa as a cross-system reference",
];

type Props = {
  onResult: (data: CareerFitResponse) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
  loading: boolean;
};

export function IntakeForm({ onResult, onLoadingChange, onError, loading }: Props) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1992-03-18");
  const [birthTime, setBirthTime] = useState("09:15");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [locationName, setLocationName] = useState("Pune, India");
  const [horizonYears, setHorizonYears] = useState(10);
  const [step, setStep] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedLocation = locationName.trim();
    if (!trimmedLocation) {
      onError("Please enter the birth city.");
      return;
    }

    const payload: BirthInput = {
      name: name.trim(),
      birthDate,
      birthTime: birthTimeKnown ? birthTime : "12:00",
      birthTimeKnown,
      locationName: trimmedLocation,
      horizonYears,
    };

    onError(null);
    onLoadingChange(true);
    setStep(0);

    const ticker = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      12000,
    );
    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check ok BEFORE parsing. A platform timeout returns HTML, and calling
      // .json() on HTML throws "Unexpected token '<'", which is what a user
      // would otherwise be shown instead of the real failure.
      if (!res.ok) {
        let message = "Could not build the career console.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          message = `Request failed with status ${res.status}.`;
        }
        onError(message);
        return;
      }

      onResult((await res.json()) as CareerFitResponse);
    } catch (err) {
      onError(
        (err as Error).name === "AbortError"
          ? "That took too long. Try again."
          : "Could not reach the server.",
      );
    } finally {
      clearInterval(ticker);
      clearTimeout(timeout);
      onLoadingChange(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Career fit intake form">
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08] sm:p-6">
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black/70">
              Client name (optional)
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call them?"
              disabled={loading}
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-black/70">Birth date</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                disabled={loading}
                className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-black/70">Birth time</span>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                required={birthTimeKnown}
                disabled={!birthTimeKnown || loading}
                className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-black/50">
                <input
                  type="checkbox"
                  checked={!birthTimeKnown}
                  onChange={(e) => setBirthTimeKnown(!e.target.checked)}
                  disabled={loading}
                  className="size-4 rounded"
                />
                Birth time unknown
              </label>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black/70">Birth city</span>
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Colombo, Sri Lanka"
              required
              disabled={loading}
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
            />
            <span className="mt-1.5 block text-xs text-black/50">
              Include the country if possible. Coordinates and historical timezone are
              resolved for you.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black/70">
              Look-ahead horizon, years
            </span>
            <input
              type="number"
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              min={3}
              max={20}
              disabled={loading}
              className="min-h-[44px] w-full max-w-[160px] rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
            />
            <span className="mt-1.5 block text-xs text-black/50">
              How far ahead promotion, job-change and income windows are scanned.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 min-h-[44px] w-full rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? LOADING_STEPS[step] : "Build the career console"}
        </button>

        {loading && (
          <p className="mt-3 text-xs text-black/50">
            Thirteen tools against the live engine, two of them paged. Usually 60 to
            160 seconds.
          </p>
        )}
      </div>
    </form>
  );
}
