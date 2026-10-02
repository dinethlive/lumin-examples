"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatUtcOffset, isKnownTimeZone, offsetMinutesAt } from "@lumin-examples/client/zone";
import type { ForecastInput, ForecastResponse } from "@/lib/types";

/**
 * The zone whose name ends in the typed place, such as "Europe/Lisbon" for
 * "Lisbon, Portugal". Many places have no zone of their own (Chennai is
 * Asia/Kolkata), so a miss keeps the current zone, and the route checks it.
 */
function zoneForPlace(place: string, zones: string[]): string | null {
  const name = place.split(",")[0].trim().toLowerCase().replace(/\s+/g, "_");
  if (!name) return null;
  return zones.find((zone) => zone.toLowerCase().split("/").pop() === name) ?? null;
}

/** What clocks read in the zone across the range, so a wrong zone shows itself. */
function zoneHint(timeZone: string, startDate: string, endDate: string): string {
  if (!isKnownTimeZone(timeZone)) {
    return "Use an IANA name, such as Asia/Colombo, Europe/Lisbon or America/Denver.";
  }
  const start = offsetMinutesAt(timeZone, `${startDate}T12:00:00`);
  const end = offsetMinutesAt(timeZone, `${endDate}T12:00:00`);
  if (start === null) return "Enter the range to see the offset.";
  if (end !== null && Math.round(end) !== Math.round(start)) {
    return `Clocks there read UTC${formatUtcOffset(start)} at the start and UTC${formatUtcOffset(end)} at the end. The tools use the start offset.`;
  }
  return `Clocks there read UTC${formatUtcOffset(start)} across the range.`;
}

type Props = {
  onResult: (result: ForecastResponse) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
  loading: boolean;
};

export function PlaceForm({ onResult, onLoadingChange, onError, loading }: Props) {
  const [location, setLocation] = useState("Colombo, Sri Lanka");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-08-15");
  const [timeZone, setTimeZone] = useState("");
  const [zoneEdited, setZoneEdited] = useState(false);
  const [zones, setZones] = useState<string[]>([]);

  // Filled after mount, because the server and the browser can carry different
  // zone lists. The default is the typed place's zone, else the visitor's own.
  useEffect(() => {
    const list = Intl.supportedValuesOf("timeZone");
    setZones(list);
    setTimeZone((current) => current || zoneForPlace(location, list) || Intl.DateTimeFormat().resolvedOptions().timeZone);
    // Runs once, with the first place. Later place edits go through changeLocation.
  }, []);

  function changeLocation(next: string) {
    setLocation(next);
    if (zoneEdited) return;
    const match = zoneForPlace(next, zones);
    if (match) setTimeZone(match);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      onError("Please enter a place.");
      return;
    }
    if (endDate <= startDate) {
      onError("The end date must be after the start date.");
      return;
    }

    const payload: ForecastInput = {
      location_name: trimmedLocation,
      start_date: startDate,
      end_date: endDate,
      time_zone: timeZone,
    };

    onError(null);
    onLoadingChange(true);

    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check ok BEFORE parsing. A platform timeout returns HTML, and calling
      // .json() on HTML throws "Unexpected token '<'", which is what a user
      // would otherwise be shown instead of the real failure.
      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Body was not JSON, most likely a platform error page. Keep the
          // status-based message above.
        }
        onError(message);
        return;
      }

      onResult((await res.json()) as ForecastResponse);
    } catch (err) {
      onError(
        (err as Error).name === "AbortError"
          ? "That took too long. Try again."
          : (err as Error).message,
      );
    } finally {
      clearTimeout(timeout);
      onLoadingChange(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl px-6 pb-16"
      aria-label="Weather window planner form"
    >
      <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] md:p-8">
        <div className="grid gap-5">
          <Field label="Place">
            <input
              type="text"
              value={location}
              onChange={(e) => changeLocation(e.target.value)}
              placeholder="e.g. Colombo, Sri Lanka"
              className="input"
              autoComplete="off"
              required
              disabled={loading}
            />
            <span className="mt-1.5 text-xs text-muted-foreground">
              Include the country or region if possible. We&rsquo;ll resolve the
              coordinates for you.
            </span>
          </Field>

          <Field label="Time zone">
            <input
              type="text"
              value={timeZone}
              onChange={(e) => {
                setZoneEdited(true);
                setTimeZone(e.target.value.trim());
              }}
              list="time-zones"
              placeholder="e.g. Asia/Colombo"
              className="input"
              autoComplete="off"
              spellCheck={false}
              required
              disabled={loading}
            />
            <datalist id="time-zones">
              {zones.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
            <span className="mt-1.5 text-xs text-muted-foreground">
              {zoneHint(timeZone, startDate, endDate)}
            </span>
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Range start">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="input"
                disabled={loading}
              />
            </Field>
            <Field label="Range end">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="input"
                disabled={loading}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Each window spans roughly 14 days, cast from the new or full moon that opens
            it. A two to three month range gives a useful sequence.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Reading the sky…" : "Plan my windows"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          The place and dates are sent only to compute the weather signature and are not
          stored.
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: white;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.95rem;
          color: var(--color-foreground);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.15s;
        }
        .input:focus {
          outline: none;
          box-shadow: inset 0 0 0 1.5px var(--color-primary);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
