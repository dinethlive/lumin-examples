"use client";

import { useState, type FormEvent } from "react";
import type { AnalysisResponseHydrated, BirthInput } from "@/lib/types";

type Props = {
  onResult: (result: AnalysisResponseHydrated) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
  loading: boolean;
};

export function IntakeForm({ onResult, onLoadingChange, onError, loading }: Props) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-04-12");
  const [birthTime, setBirthTime] = useState("06:45");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [location, setLocation] = useState("Colombo, Sri Lanka");
  const [biologicalSex, setBiologicalSex] =
    useState<BirthInput["biological_sex"]>("unspecified");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      onError("Please enter your birth city.");
      return;
    }

    const payload: BirthInput = {
      name: name.trim(),
      birth_date: birthDate,
      birth_time: birthTimeKnown ? birthTime : "12:00",
      birth_time_known: birthTimeKnown,
      location_name: trimmedLocation,
      biological_sex: biologicalSex,
    };

    onError(null);
    onLoadingChange(true);

    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    try {
      const res = await fetch("/api/analyze", {
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

      onResult((await res.json()) as AnalysisResponseHydrated);
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
      aria-label="Health risk analyzer intake form"
    >
      <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] md:p-8">
        <div className="grid gap-5">
          <Field label="Name (optional)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="input"
              autoComplete="given-name"
              disabled={loading}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Birth date">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="input"
                disabled={loading}
              />
            </Field>
            <Field label="Birth time">
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                required={birthTimeKnown}
                disabled={!birthTimeKnown || loading}
                className="input disabled:opacity-50"
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!birthTimeKnown}
                  onChange={(e) => setBirthTimeKnown(!e.target.checked)}
                  disabled={loading}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                I don&rsquo;t know my birth time
              </label>
            </Field>
          </div>

          <Field label="Birth city">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Colombo, Sri Lanka"
              className="input"
              autoComplete="off"
              required
              disabled={loading}
            />
            <span className="mt-1.5 text-xs text-muted-foreground">
              Include the country if possible. We&rsquo;ll resolve the coordinates and
              timezone for you.
            </span>
          </Field>

          <Field label="Biological sex">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(
                [
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "unspecified", label: "Other" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={loading}
                  onClick={() => setBiologicalSex(value)}
                  aria-pressed={biologicalSex === value}
                  className={`segment ${biologicalSex === value ? "segment-on" : "segment-off"} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="mt-1.5 text-xs text-muted-foreground">
              Used to weight reproductive-system risk indicators. Optional.
            </span>
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Reading your chart…" : "Generate health risk profile"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your birth details are sent only to compute the chart and are not stored.
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
        .segment {
          min-height: 44px;
          width: 100%;
          border-radius: 0.5rem;
          padding: 0.5rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: white;
          color: var(--color-foreground);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.15s, color 0.15s, background 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 640px) {
          .segment {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
        }
        .segment-off:hover:not(:disabled) {
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
        }
        .segment-on {
          color: var(--color-primary);
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
