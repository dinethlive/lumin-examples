"use client";

import { useEffect, useState } from "react";
import { formatUtcOffset, isKnownTimeZone, offsetMinutesAt } from "@lumin-examples/client/zone";
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

/**
 * The zone whose name ends in the typed city, such as "Europe/London" for
 * "London, UK". Many cities have no zone of their own (Mumbai is Asia/Kolkata),
 * so a miss keeps the current zone, and the route checks it against the city.
 */
function zoneForCity(city: string, zones: string[]): string | null {
  const name = city.split(",")[0].trim().toLowerCase().replace(/\s+/g, "_");
  if (!name) return null;
  return zones.find((zone) => zone.toLowerCase().split("/").pop() === name) ?? null;
}

/** What clocks read in the zone on the date, so a wrong zone shows itself. */
function zoneHint(timeZone: string, date: string): string {
  if (!isKnownTimeZone(timeZone)) {
    return "Use an IANA name, such as Asia/Colombo, Europe/London or America/New_York.";
  }
  const offset = offsetMinutesAt(timeZone, `${date}T12:00:00`);
  if (offset === null) return "Enter the date to see the offset.";
  return `Clocks there read UTC${formatUtcOffset(offset)} on that date. The day runs sunrise to sunrise, so the zone decides which civil day is meant.`;
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
  const [timeZone, setTimeZone] = useState("");
  const [zoneEdited, setZoneEdited] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filled after mount, because the server and the browser can carry different
  // zone lists. The default is the typed city's zone, else the visitor's own.
  useEffect(() => {
    const list = Intl.supportedValuesOf("timeZone");
    setZones(list);
    setTimeZone((current) => current || zoneForCity(city, list) || Intl.DateTimeFormat().resolvedOptions().timeZone);
    // Runs once, with the first city. Later city edits go through changeCity.
  }, []);

  function changeCity(next: string) {
    setCity(next);
    if (zoneEdited) return;
    const match = zoneForCity(next, zones);
    if (match) setTimeZone(match);
  }

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

    const payload: PlaceInput = { city, date, timeZone };

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
            onChange={(e) => changeCity(e.target.value)}
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
        <span className="mb-1.5 block text-sm font-medium text-black/70">Time zone</span>
        <input
          value={timeZone}
          onChange={(e) => {
            setZoneEdited(true);
            setTimeZone(e.target.value.trim());
          }}
          list="time-zones"
          placeholder="e.g. Asia/Colombo"
          required
          autoComplete="off"
          spellCheck={false}
          className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 sm:max-w-[280px]"
        />
        <datalist id="time-zones">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <span className="mt-1.5 block text-xs text-black/50">{zoneHint(timeZone, date)}</span>
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
