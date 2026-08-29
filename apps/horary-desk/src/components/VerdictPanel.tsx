"use client";

import { useState } from "react";
import type {
  ConfidenceLevel,
  GateVerdict,
  HoraryResponse,
  TypeSpecific,
} from "@/lib/types";
import { TrendFollowUp } from "./TrendFollowUp";

/** UTC in, the viewer's local clock out. Every timestamp the API returns is UTC. */
function localTime(iso: string, offsetMinutes: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  const y = shifted.getUTCFullYear();
  const mo = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d} ${hh}:${mm}`;
}

function localDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 10);
}

const TYPE_LABEL: Record<HoraryResponse["questionType"], string> = {
  general: "General",
  medical: "Health",
  career: "Career",
  lost: "Lost or missing",
  arrival: "Arrival",
};

const GATE_STYLE: Record<GateVerdict, string> = {
  ANSWERED: "bg-emerald-50 ring-emerald-200 text-emerald-900",
  WITHHELD: "bg-amber-50 ring-amber-200 text-amber-900",
};

const CONFIDENCE_STYLE: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-100 text-emerald-900",
  moderate: "bg-amber-100 text-amber-900",
  low: "bg-rose-100 text-rose-900",
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-black/50">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HouseChips({ label, houses, tone }: { label: string; houses: number[]; tone: string }) {
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {houses.length === 0 ? (
          <span className="text-xs text-black/40">none</span>
        ) : (
          houses.map((h) => (
            <span
              key={h}
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
            >
              {h}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function TypeSpecificCard({ ts }: { ts: NonNullable<TypeSpecific> }) {
  if (ts.kind === "lost") {
    return (
      <Card title="Direction and recovery" subtitle="get_lost_or_missing">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-black/50">Direction</dt>
            <dd className="font-medium">{ts.direction}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Distance</dt>
            <dd className="font-medium">{ts.distanceClass}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Where at the place</dt>
            <dd className="font-medium">{ts.inHouseLocation}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Recovery</dt>
            <dd className="font-medium">{ts.recoveryVerdict}</dd>
          </div>
        </dl>
        {ts.thiefDescription && (
          <p className="mt-4 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-black/70 ring-1 ring-black/[0.06]">
            A class description only, never an identification: {ts.thiefDescription}
          </p>
        )}
      </Card>
    );
  }
  if (ts.kind === "arrival") {
    return (
      <Card title="Will they arrive, and when" subtitle="get_arrival_timing">
        <p className="text-sm">
          Subject: <span className="font-medium">{ts.subject}</span>. Verdict:{" "}
          <span className="font-medium">{ts.verdict}</span>.
        </p>
        {ts.scale && (
          <p className="mt-2 text-sm text-black/70">
            Timing scale: <span className="font-medium">{ts.scale}</span>
            {ts.scaleBasis ? ` (${ts.scaleBasis})` : ""}. A scale names which hand of
            the clock to move; it is not a timestamp.
          </p>
        )}
      </Card>
    );
  }
  if (ts.kind === "career") {
    return (
      <Card title="Career horary" subtitle={`get_career_horary, ${ts.queryType}`}>
        <p className="text-sm">
          Verdict: <span className="font-medium">{ts.verdict}</span>
        </p>
        {ts.notes.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-black/70">
            {ts.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </Card>
    );
  }
  return (
    <Card title="Medical horary" subtitle={`get_medical_horary, ${ts.queryType}. Supplementary lens, not diagnostic.`}>
      <p className="text-sm">
        Verdict: <span className="font-medium">{ts.verdict}</span>
      </p>
      {ts.notes.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-black/70">
          {ts.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function VerdictPanel({
  data,
  onReset,
}: {
  data: HoraryResponse;
  onReset: () => void;
}) {
  const [trendOpen, setTrendOpen] = useState(false);
  const offset = data.moment.utcOffsetMinutes;

  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-md bg-black/[0.05] px-2 py-0.5 text-xs font-medium text-black/60">
            {TYPE_LABEL[data.questionType]}
          </span>
          <button
            onClick={onReset}
            className="text-xs font-medium text-black/50 underline underline-offset-2 hover:text-black"
          >
            Ask another question
          </button>
        </div>
        <p className="mt-3 text-lg font-semibold tracking-tight">&ldquo;{data.question}&rdquo;</p>
        <p className="mt-2 text-sm text-black/60">
          Number {data.number}. Chart cast for {localTime(data.moment.datetimeUTC, offset)} local
          time. Checked against &ldquo;{data.event}&rdquo;.
        </p>
      </header>

      {/* The gate is the product: a withheld chart is a first-class, honest
          outcome, never rendered as an error. */}
      <section className={`rounded-xl p-5 ring-1 ${GATE_STYLE[data.gate.verdict]}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide">
            {data.gate.verdict === "ANSWERED" ? "Chart is ready" : "The chart is not ready"}
          </span>
          <span className="text-xs opacity-70">
            Moon {data.gate.moonConnected ? "connected" : "not connected"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{data.gate.reason}</p>
        {data.gate.verdict === "WITHHELD" && (
          <button
            onClick={onReset}
            className="mt-3 rounded-lg bg-black/80 px-4 py-2 text-xs font-medium text-white hover:bg-black"
          >
            Ask again later with a fresh number
          </button>
        )}
      </section>

      {data.gate.verdict === "ANSWERED" && data.verdict && (
        <>
          <Card title="Verdict">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${CONFIDENCE_STYLE[data.verdict.confidence]}`}
              >
                {data.verdict.confidence} confidence
              </span>
            </div>
            <p className="mt-3 text-base">{data.verdict.label}</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <HouseChips
                label="Required houses"
                houses={data.verdict.requiredHouses}
                tone="bg-black/[0.06] text-black/70"
              />
              <HouseChips
                label="Covered"
                houses={data.verdict.covered}
                tone="bg-emerald-100 text-emerald-900"
              />
              <HouseChips
                label="Missing"
                houses={data.verdict.missing}
                tone="bg-rose-100 text-rose-900"
              />
            </div>
          </Card>

          <Card title="Reasoning" subtitle="Every step names the rule and what the chart returned">
            <ol className="space-y-3">
              {data.reasoning.map((r, i) => (
                <li key={i} className="border-l-2 border-black/10 pl-3">
                  <p className="text-sm font-medium">{r.step}</p>
                  <p className="text-xs text-black/50">{r.rule}</p>
                  <p className="mt-0.5 text-sm text-black/70">{r.result}</p>
                </li>
              ))}
            </ol>
          </Card>

          {data.typeSpecific && <TypeSpecificCard ts={data.typeSpecific} />}

          {data.timing.windows.length > 0 && (
            <Card title="Timing" subtitle="Dated windows the tools actually returned">
              <ul className="space-y-2">
                {data.timing.windows.map((w, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-black/[0.03] px-3 py-2 text-sm ring-1 ring-black/[0.06]"
                  >
                    <span className="font-mono text-xs tabular-nums">
                      {localDate(w.fromDate)} to {localDate(w.toDate)}
                    </span>
                    <p className="mt-0.5 text-xs text-black/60">{w.basis}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card
            title="Track this over time"
            subtitle="Optional. Ask the same question again now, with a fresh number, and see the trend"
          >
            {!trendOpen ? (
              <button
                onClick={() => setTrendOpen(true)}
                className="rounded-lg bg-black/[0.05] px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/[0.08]"
              >
                Ask again now
              </button>
            ) : (
              <TrendFollowUp original={data} onClose={() => setTrendOpen(false)} />
            )}
          </Card>
        </>
      )}

      <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-xs text-black/60 ring-1 ring-black/[0.06]">
        {data.disclaimer}
      </p>
    </div>
  );
}
