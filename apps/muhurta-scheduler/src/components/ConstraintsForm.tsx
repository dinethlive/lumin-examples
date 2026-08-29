"use client";

import { useState, type FormEvent } from "react";
import type {
  CatalogEvent,
  ElectInput,
  ElectResponse,
  RankInput,
  RankResponse,
} from "@/lib/types";
import { ProvenanceChip } from "@/components/ProvenanceChip";

type Mode = "elect" | "rank";

type Props = {
  event: CatalogEvent;
  onElectResult: (data: ElectResponse) => void;
  onRankResult: (data: RankResponse) => void;
  onBack: () => void;
};

const LOADING_STEPS_ELECT = [
  "Resolving the birth and event locations",
  "Casting the chart and running the four-layer election",
  "Cross-checking with the older triangulation method",
  "Reading the panchang and choghadiya for the elected day",
  "Checking sub lord boundaries for the confidence pill",
];

const LOADING_STEPS_RANK = [
  "Resolving the birth and event locations",
  "Casting the chart",
  "Testing each date against the four-layer election",
  "Checking sub lord boundaries for the confidence pill",
];

/** Same clamp the engine applies: 365 for day, 90 for hour, 30 for minute. */
function maxScanDaysFor(granularity: CatalogEvent["defaultGranularity"]): number {
  if (granularity === "day") return 365;
  if (granularity === "hour") return 90;
  return 30;
}

function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ConstraintsForm({ event, onElectResult, onRankResult, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("elect");

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-04-12");
  const [birthTime, setBirthTime] = useState("06:45");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthLocation, setBirthLocation] = useState("Colombo, Sri Lanka");
  const [eventLocation, setEventLocation] = useState("");

  const [hoursStart, setHoursStart] = useState("09:00");
  const [hoursEnd, setHoursEnd] = useState("17:00");
  const [hoursLabel, setHoursLabel] = useState("");

  const maxDays = maxScanDaysFor(event.defaultGranularity);
  const [scanStart, setScanStart] = useState(todayLocalISO());
  const [scanDays, setScanDays] = useState(Math.min(14, maxDays));

  const [candidateDates, setCandidateDates] = useState<string[]>(["", ""]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function updateCandidate(i: number, value: string) {
    setCandidateDates((prev) => prev.map((d, idx) => (idx === i ? value : d)));
  }
  function addCandidate() {
    setCandidateDates((prev) => (prev.length < 10 ? [...prev, ""] : prev));
  }
  function removeCandidate(i: number) {
    setCandidateDates((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!birthLocation.trim()) {
      setError("Please enter the birth place.");
      return;
    }

    const birth = {
      name: name.trim(),
      birthDate,
      birthTime: birthTimeKnown ? birthTime : "12:00",
      birthTimeKnown,
      birthLocation: birthLocation.trim(),
    };
    const preferredHours = { start: hoursStart, end: hoursEnd, label: hoursLabel.trim() };

    setLoading(true);
    setStep(0);
    const steps = mode === "elect" ? LOADING_STEPS_ELECT : LOADING_STEPS_RANK;
    const ticker = setInterval(
      () => setStep((s) => Math.min(s + 1, steps.length - 1)),
      9000,
    );
    const maxDuration = mode === "elect" ? 120_000 : 90_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), maxDuration);

    try {
      if (mode === "elect") {
        const payload: ElectInput = {
          eventKey: event.key,
          eventLabel: event.label,
          eventElectedHouses: event.electedHouses,
          eventExcludedHouses: event.avoidHouses,
          eventProvenance: event.provenance,
          eventCitation: event.citation,
          eventDefaultGranularity: event.defaultGranularity,
          birth,
          eventLocation: eventLocation.trim(),
          scanStart,
          scanDays,
          granularity: event.defaultGranularity,
          preferredHours,
        };
        const res = await fetch("/api/elect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          setError(await readError(res));
          return;
        }
        onElectResult((await res.json()) as ElectResponse);
      } else {
        const cleaned = candidateDates.map((d) => d.trim()).filter(Boolean);
        if (cleaned.length < 2) {
          setError("Give at least two dates you can actually do.");
          return;
        }
        const payload: RankInput = {
          eventKey: event.key,
          eventLabel: event.label,
          eventElectedHouses: event.electedHouses,
          eventProvenance: event.provenance,
          birth,
          eventLocation: eventLocation.trim(),
          candidateDates: cleaned,
          granularity: event.defaultGranularity,
          preferredHours,
        };
        const res = await fetch("/api/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          setError(await readError(res));
          return;
        }
        onRankResult((await res.json()) as RankResponse);
      }
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "That took too long. Try a shorter window or try again."
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
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        &larr; Change event
      </button>

      <div className="rounded-xl bg-card p-4 ring-1 ring-black/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-foreground">{event.label}</h2>
          <ProvenanceChip provenance={event.provenance} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Elects on houses {event.electedHouses.join("-")}
          {event.avoidHouses.length > 0 && <>, excludes {event.avoidHouses.join("-")}</>}
          {event.citation && <> &middot; {event.citation}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(
          [
            ["elect", "Elect a moment"],
            ["rank", "I have dates in mind"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`min-h-[40px] rounded-lg text-sm font-medium transition ${
              mode === value
                ? "bg-white text-foreground shadow-sm ring-1 ring-black/[0.06]"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <fieldset className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.08]">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Whose chart
        </legend>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground/80">
            Name (optional)
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call them?"
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground/80">Birth date</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground/80">Birth time</span>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              required={birthTimeKnown}
              disabled={!birthTimeKnown}
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!birthTimeKnown}
                onChange={(e) => setBirthTimeKnown(!e.target.checked)}
                className="size-4 rounded"
              />
              I do not know the exact birth time
            </label>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground/80">Birth place</span>
          <input
            value={birthLocation}
            onChange={(e) => setBirthLocation(e.target.value)}
            placeholder="e.g. Colombo, Sri Lanka"
            required
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground/80">
            Where this happens (optional)
          </span>
          <input
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Leave blank to use the birth place"
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            KP computes the Ascendant for the place of the action, not the place of birth.
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.08]">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hours you can actually use
        </legend>
        <p className="text-xs text-muted-foreground">
          This is applied before anything else is compared, so hours outside it are never counted
          or returned. It is usually the single biggest improvement to the answer.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground/80">From</span>
            <input
              type="time"
              value={hoursStart}
              onChange={(e) => setHoursStart(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground/80">To</span>
            <input
              type="time"
              value={hoursEnd}
              onChange={(e) => setHoursEnd(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground/80">
            What this window is (optional)
          </span>
          <input
            value={hoursLabel}
            onChange={(e) => setHoursLabel(e.target.value)}
            placeholder="e.g. office hours, before the registrar closes"
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
      </fieldset>

      {mode === "elect" ? (
        <fieldset className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.08]">
          <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            The window to search
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground/80">
                Earliest date
              </span>
              <input
                type="date"
                value={scanStart}
                onChange={(e) => setScanStart(e.target.value)}
                required
                className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground/80">
                Days to search (max {maxDays})
              </span>
              <input
                type="number"
                min={1}
                max={maxDays}
                value={scanDays}
                onChange={(e) =>
                  setScanDays(Math.max(1, Math.min(maxDays, Number(e.target.value) || 1)))
                }
                required
                className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            This event resolves at {event.defaultGranularity} precision by default, which is why
            the search is capped at {maxDays} days.
          </p>
        </fieldset>
      ) : (
        <fieldset className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-black/[0.08]">
          <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dates you can actually do (2 to 10)
          </legend>
          <div className="space-y-2">
            {candidateDates.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="date"
                  value={d}
                  onChange={(e) => updateCandidate(i, e.target.value)}
                  className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
                />
                {candidateDates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(i)}
                    aria-label="Remove this date"
                    className="min-h-[44px] rounded-lg px-3 text-sm text-muted-foreground ring-1 ring-black/[0.08] hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {candidateDates.length < 10 && (
            <button
              type="button"
              onClick={addCandidate}
              className="min-h-[40px] rounded-lg px-3 text-sm font-medium text-primary ring-1 ring-primary/20 hover:bg-primary/5"
            >
              Add another date
            </button>
          )}
        </fieldset>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] w-full rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? (mode === "elect" ? LOADING_STEPS_ELECT : LOADING_STEPS_RANK)[step]
          : mode === "elect"
            ? "Elect a moment"
            : "Rank these dates"}
      </button>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">
          {mode === "elect"
            ? "Up to five tool calls against the live engine, usually 20 to 70 seconds."
            : "Two tool calls against the live engine, usually 15 to 45 seconds."}
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

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Request failed with status ${res.status}.`;
  } catch {
    return `Request failed with status ${res.status}.`;
  }
}
