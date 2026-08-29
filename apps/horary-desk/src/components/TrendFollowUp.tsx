"use client";

import { useState } from "react";
import type { HoraryResponse, TrendResponse } from "@/lib/types";

function pickNumber(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] % 249) + 1;
}

const TREND_LABEL: Record<string, string> = {
  OSCILLATING: "Going back and forth",
  RESOLUTION_NEAR: "Moving toward resolution",
  WORSENING: "Slipping",
  STABLE_FAVORABLE: "Steady and favourable",
  STABLE_UNFAVORABLE: "Steady and unfavourable",
};

export function TrendFollowUp({
  original,
  onClose,
}: {
  original: HoraryResponse;
  onClose: () => void;
}) {
  const [number, setNumber] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof number !== "number") {
      setError("Pick a number between 1 and 249 first.");
      return;
    }
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const payload = {
      topic: original.event,
      sessions: [
        {
          question: original.question,
          number: original.number,
          datetimeUTC: original.moment.datetimeUTC,
        },
        {
          question: original.question,
          number,
          datetimeUTC: new Date().toISOString(),
        },
      ],
      latitude: original.moment.latitude,
      longitude: original.moment.longitude,
      utcOffsetMinutes: original.moment.utcOffsetMinutes,
    };

    try {
      const res = await fetch("/api/trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "Could not compute the trend.";
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          message = `Request failed with status ${res.status}.`;
        }
        setError(message);
        return;
      }

      setResult((await res.json()) as TrendResponse);
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "That took too long. Try again."
          : "Could not reach the server.",
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-black/[0.03] px-3 py-2 text-sm font-medium ring-1 ring-black/[0.06]">
          {TREND_LABEL[result.trend] ?? result.trend}
        </p>
        <ol className="space-y-2">
          {result.snapshots.map((s, i) => (
            <li key={i} className="rounded-lg bg-black/[0.03] px-3 py-2 text-sm ring-1 ring-black/[0.06]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{s.label || `Session ${i + 1}`}</span>
                <span className="text-xs text-black/50">{s.coveragePercent}% coverage</span>
              </div>
              <p className="mt-0.5 text-xs text-black/60">
                {s.verdict}
                {s.deltaFromPrevious ? ` · ${s.deltaFromPrevious.toLowerCase()} since last time` : ""}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-black/70">{result.summary}</p>
        <button
          onClick={onClose}
          className="text-xs font-medium text-black/50 underline underline-offset-2 hover:text-black"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-black/60">
        Asking the same question again, right now, with a fresh number. This calls
        get_horary_serial once to compare this session against the first one.
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value === "" ? "" : Number(e.target.value))}
          min={1}
          max={249}
          required
          className="min-h-[44px] w-24 rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          type="button"
          onClick={() => setNumber(pickNumber())}
          className="min-h-[44px] whitespace-nowrap rounded-lg bg-black/[0.05] px-3 text-sm font-medium text-black/70 hover:bg-black/[0.08]"
        >
          Pick one for me
        </button>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] rounded-lg bg-black px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-2 text-xs font-medium text-black/50 underline underline-offset-2 hover:text-black"
        >
          Cancel
        </button>
      </div>
      {loading && (
        <p className="text-xs text-black/50">
          One tool call against the live engine, usually 10 to 20 seconds.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200">
          {error}
        </p>
      )}
    </form>
  );
}
