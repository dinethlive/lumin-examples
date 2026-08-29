"use client";

import { useState } from "react";
import type { PlaceInput, TodayResponse } from "@/lib/types";

/** Named phases, so a 30 second wait shows progress instead of a spinner. */
const LOADING_STEPS = [
  "Resolving the city",
  "Computing sunrise and the five limbs",
  "Dividing the day into bands",
  "Reading the Moon",
];

type Props = {
  onResult: (data: TodayResponse) => void;
};

/** The browser knows the visitor's offset. Ask the tools with the real one. */
function localOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CityForm({ onResult }: Props) {
  const [city, setCity] = useState("Colombo, Sri Lanka");
  const [date, setDate] = useState(todayLocalISO());
  const [offset, setOffset] = useState(localOffsetMinutes());
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
      7000,
    );
    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const payload: PlaceInput = { city, date, utcOffsetMinutes: offset };

    try {
      const res = await fetch("/api/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check ok BEFORE parsing. A platform timeout returns HTML, and calling
      // .json() on HTML throws "Unexpected token '<'", which is what a user
      // would otherwise be shown instead of the real failure.
      if (!res.ok) {
        let message = "Could not build the panel.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          message = `Request failed with status ${res.status}.`;
        }
        setError(message);
        return;
      }

      onResult((await res.json()) as TodayResponse);
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
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Colombo, Sri Lanka"
            required
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-black/70">
          UTC offset in minutes
        </span>
        <input
          type="number"
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
          min={-720}
          max={840}
          required
          className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 sm:max-w-[220px]"
        />
        <span className="mt-1.5 block text-xs text-black/50">
          The day runs sunrise to sunrise, so the offset decides which civil day is
          meant. Prefilled from your browser.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] rounded-lg bg-black px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? LOADING_STEPS[step] : "Build the panel"}
      </button>

      {loading && (
        <p className="text-sm text-black/50">
          Five tool calls against the live engine, usually 15 to 40 seconds.
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
