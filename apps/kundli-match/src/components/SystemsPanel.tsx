import type { Systems } from "@/lib/types";

function SystemCard({
  title,
  systemTag,
  headline,
  headlineTone,
  rows,
  footnote,
}: {
  title: string;
  systemTag: "KP" | "Vedic Parashari";
  headline: string;
  headlineTone: "good" | "mixed" | "poor";
  rows: { name: string; detail: string; note: string }[];
  footnote?: string;
}) {
  const tone = {
    good: "text-emerald-900",
    mixed: "text-amber-900",
    poor: "text-rose-900",
  }[headlineTone];

  return (
    <article className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ring-1 ${
            systemTag === "KP"
              ? "bg-black/[0.04] text-black/60 ring-black/[0.08]"
              : "bg-violet-50 text-violet-800 ring-violet-200"
          }`}
        >
          {systemTag}
        </span>
      </div>
      <p className={`mt-1.5 text-lg font-semibold ${tone}`}>{headline}</p>

      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className="border-t border-black/[0.06] pt-2 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{r.name}</span>
              <span className="font-mono text-xs text-black/60">{r.detail}</span>
            </div>
            {r.note && <p className="mt-0.5 text-xs text-black/50">{r.note}</p>}
          </li>
        ))}
      </ul>

      {footnote && <p className="mt-4 text-xs text-black/50">{footnote}</p>}
    </article>
  );
}

function bandTone(band: string): "good" | "mixed" | "poor" {
  if (band === "EXCELLENT" || band === "GOOD") return "good";
  if (band === "AVERAGE") return "mixed";
  return "poor";
}

/**
 * The core of the app: three independently scored compatibility systems,
 * shown as three cards rather than blended into one number. See
 * AgreementMeter for how they are summarised and DisagreementDrawer for why
 * they differ.
 */
export function SystemsPanel({ systems }: { systems: Systems }) {
  const { ashtaKoota, kpSevenFactor, kpCuspal } = systems;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <SystemCard
        title="Ashta Koota Milan"
        systemTag="Vedic Parashari"
        headline={`${ashtaKoota.total} / ${ashtaKoota.outOf} (${ashtaKoota.band})`}
        headlineTone={bandTone(ashtaKoota.band)}
        rows={ashtaKoota.kootas.map((k) => ({
          name: k.name,
          detail: `${k.score} / ${k.max}`,
          note: k.note,
        }))}
        footnote={
          ashtaKoota.nadiDosha || ashtaKoota.bhakootDosha
            ? `Flags: ${[ashtaKoota.nadiDosha && "Nadi Dosha", ashtaKoota.bhakootDosha && "Bhakoot Dosha"].filter(Boolean).join(", ")}`
            : "No Nadi or Bhakoot Dosha flagged."
        }
      />

      <SystemCard
        title="KP seven-factor score"
        systemTag="KP"
        headline={`${kpSevenFactor.overallScore} / 100 (${kpSevenFactor.verdict})`}
        headlineTone={bandTone(kpSevenFactor.verdict)}
        rows={kpSevenFactor.factors.map((f) => ({
          name: f.name,
          detail: `${f.score} (w. ${f.weight})`,
          note: f.note,
        }))}
      />

      <SystemCard
        title="KP cuspal-sub-lord read"
        systemTag="KP"
        headline={kpCuspal.verdict.replace("_", " ")}
        headlineTone={bandTone(kpCuspal.verdict)}
        rows={kpCuspal.factors.map((f) => ({
          name: f.name,
          detail: f.verdict,
          note: f.chain,
        }))}
        footnote={kpCuspal.porouthamRejectionNote}
      />
    </div>
  );
}
