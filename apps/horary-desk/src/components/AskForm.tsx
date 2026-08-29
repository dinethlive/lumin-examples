"use client";

import { useEffect, useState } from "react";
import { QUESTION_TYPES, type HoraryResponse, type QuestionType } from "@/lib/types";

/** Named phases, so a 30 second wait shows progress instead of a spinner. */
const LOADING_STEPS = [
  "Casting the chart for this moment",
  "Checking whether the Moon is connected",
  "Reading the number",
  "Judging the deciding cusp",
];

type Props = {
  onResult: (data: HoraryResponse) => void;
};

/** The browser knows the visitor's offset. Ask the tools with the real one. */
function localOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/**
 * A random 1 to 249, generated in the browser the instant the button is
 * clicked, standing in for the querent closing their eyes and thinking of a
 * number. This never reaches a tool call; it only fills the input, and the
 * querent can still change it before asking.
 */
function pickNumber(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] % 249) + 1;
}

// Colombo, Sri Lanka. A reasonable default if geolocation is denied.
const DEFAULT_LAT = 6.9271;
const DEFAULT_LNG = 79.8612;

export function AskForm({ onResult }: Props) {
  const [question, setQuestion] = useState("");
  const [questionTypeHint, setQuestionTypeHint] = useState<QuestionType | "auto">("auto");
  const [number, setNumber] = useState<number | "">("");
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [offset] = useState(localOffsetMinutes());
  const [locationSource, setLocationSource] = useState<"default" | "detected" | "manual">("default");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocationSource("detected");
      },
      () => {
        // Denied or unavailable. The Colombo default stands, editable below.
      },
      { timeout: 5000 },
    );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof number !== "number") {
      setError("Pick a number between 1 and 249 first.");
      return;
    }
    setLoading(true);
    setError(null);
    setStep(0);

    const ticker = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      6000,
    );
    // Matched to the route's maxDuration, so a hung request cannot spin forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 75_000);

    const payload = {
      question,
      questionTypeHint: questionTypeHint === "auto" ? null : questionTypeHint,
      number,
      latitude,
      longitude,
      utcOffsetMinutes: offset,
    };

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check ok BEFORE parsing. A platform timeout returns HTML, and calling
      // .json() on HTML throws "Unexpected token '<'", which is what a user
      // would otherwise be shown instead of the real failure.
      if (!res.ok) {
        let message = "Could not compute the reading.";
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          message = `Request failed with status ${res.status}.`;
        }
        setError(message);
        return;
      }

      onResult((await res.json()) as HoraryResponse);
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-black/70">
          Your question
        </span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will I get the job I interviewed for?"
          required
          maxLength={600}
          rows={3}
          className="w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">
            Question type
          </span>
          <select
            value={questionTypeHint}
            onChange={(e) => setQuestionTypeHint(e.target.value as QuestionType | "auto")}
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="auto">Let it read the question (auto-detect)</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">
            Your number, 1 to 249
          </span>
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
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-black/60 ring-1 ring-black/[0.06]">
        <span className="font-medium">Place of judgment:</span>
        <span className="font-mono">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
        <span>
          {locationSource === "detected"
            ? "(from your browser)"
            : locationSource === "manual"
              ? "(entered manually)"
              : "(default: Colombo, Sri Lanka)"}
        </span>
        <button
          type="button"
          onClick={() => {
            const lat = window.prompt("Latitude", String(latitude));
            const lng = window.prompt("Longitude", String(longitude));
            if (lat !== null && lng !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
              setLatitude(Number(lat));
              setLongitude(Number(lng));
              setLocationSource("manual");
            }
          }}
          className="ml-auto underline underline-offset-2 hover:text-black"
        >
          Edit
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] rounded-lg bg-black px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? LOADING_STEPS[step] : "Ask"}
      </button>

      {loading && (
        <p className="text-sm text-black/50">
          2 to 3 tool calls against the live engine, usually 15 to 45 seconds.
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
