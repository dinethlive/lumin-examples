import type { AgreementLevel, Headline, Recommendation } from "@/lib/types";

const AGREEMENT_STYLE: Record<AgreementLevel, { bar: string; label: string; text: string }> = {
  HIGH: { bar: "bg-emerald-500", label: "High agreement", text: "text-emerald-900" },
  MIXED: { bar: "bg-amber-500", label: "Mixed agreement", text: "text-amber-900" },
  LOW: { bar: "bg-rose-500", label: "Low agreement", text: "text-rose-900" },
};

const AGREEMENT_WIDTH: Record<AgreementLevel, string> = {
  HIGH: "90%",
  MIXED: "55%",
  LOW: "20%",
};

const RECOMMENDATION_STYLE: Record<Recommendation, string> = {
  STRONG: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  WORKABLE: "bg-amber-50 text-amber-900 ring-amber-200",
  REVIEW: "bg-rose-50 text-rose-900 ring-rose-200",
};

/**
 * The headline of the whole app: not one blended score, but how much the
 * three independently-scored systems concur. See systems.* for the panels
 * this meter summarises and disagreements[] for the detail.
 */
export function AgreementMeter({ headline }: { headline: Headline }) {
  const agreement = AGREEMENT_STYLE[headline.agreement];

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
            Across three independent systems
          </p>
          <p className={`mt-1 text-lg font-semibold tracking-tight ${agreement.text}`}>
            {agreement.label}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-wide ring-1 ${RECOMMENDATION_STYLE[headline.recommendation]}`}
        >
          {headline.recommendation}
        </span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${agreement.bar}`}
          style={{ width: AGREEMENT_WIDTH[headline.agreement] }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] uppercase tracking-wide text-black/40">
        <span>Low</span>
        <span>Mixed</span>
        <span>High</span>
      </div>

      <p className="mt-4 text-sm text-black/70">{headline.summary}</p>
    </section>
  );
}
