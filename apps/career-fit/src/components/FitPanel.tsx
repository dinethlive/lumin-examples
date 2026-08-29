import { Card, Pill, ScoreBar } from "./ui";
import { SystemChip } from "./SystemChip";
import type { CareerFitResponse } from "@/lib/types";

const BALANCE_TONE: Record<
  CareerFitResponse["fit"]["careerBalance"]["band"],
  "good" | "neutral" | "bad"
> = {
  STRONG: "good",
  FAVOURABLE: "good",
  MIXED: "neutral",
  OBSTRUCTED: "bad",
  HEAVILY_OBSTRUCTED: "bad",
};

const PROVENANCE_LABEL: Record<string, string> = {
  BOOK_SOURCED: "Book sourced",
  ANCESTOR_DERIVED: "Ancestor derived",
  PRINCIPLE_DERIVED: "Principle derived",
};

const PROVENANCE_TONE: Record<string, "good" | "neutral" | "plain"> = {
  BOOK_SOURCED: "good",
  ANCESTOR_DERIVED: "neutral",
  PRINCIPLE_DERIVED: "plain",
};

/** Screen 1: category fit, occupation leanings with their receipts, profession type. */
export function FitPanel({ fit }: { fit: CareerFitResponse["fit"] }) {
  return (
    <div className="space-y-5">
      <Card
        title="Career-category fit"
        subtitle="Eight named categories, each scored against the chart independently"
        right={<SystemChip system="kp" />}
      >
        <div className="mb-4 flex items-center gap-2">
          <Pill tone={BALANCE_TONE[fit.careerBalance.band]}>
            {fit.careerBalance.band.replace(/_/g, " ")}
          </Pill>
          <span className="font-mono text-xs text-black/50">
            balance index {fit.careerBalance.index}
          </span>
        </div>
        <p className="mb-4 text-sm text-black/70">{fit.careerBalance.summary}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {fit.categories.map((c) => (
            <ScoreBar
              key={c.name}
              label={c.name}
              score={c.score}
              hint={c.hits.slice(0, 2).join("; ") || undefined}
            />
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/[0.06] pt-4 text-sm sm:grid-cols-5">
          {[
            ["Sector", fit.axes.sectorClass],
            ["Mode", fit.axes.employmentMode],
            ["Leadership", `${fit.axes.leadershipScore}`],
            ["Technical", `${fit.axes.technicalScore}`],
            ["Creative", `${fit.axes.creativeScore}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-black/50">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title="Profession type"
        subtitle="Industry, sector and employment mode from the 10th CSL's star lord, not timing"
        right={<SystemChip system="kp" />}
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          {[
            ["Primary industry", fit.profession.primaryIndustry],
            ["Secondary industry", fit.profession.secondaryIndustry],
            ["Sector", fit.profession.sector],
            ["Employment mode", fit.profession.employmentMode],
            ["Work type", fit.profession.workType],
            ["Salary band", fit.profession.salaryBand],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-black/50">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title="Occupation leanings"
        subtitle="The weakest-confidence tool in the career suite, by its own description. Read as inclinations, never a shortlist"
        right={<SystemChip system="kp" />}
      >
        {fit.noSettledOccupationFlag && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 ring-1 ring-rose-200">
            No settled occupation flag is set: the career balance is heavily obstructed
            or the 10th CSL signifies none of 6, 7 or 10. Read the matches below as
            inclinations rather than a career.
          </p>
        )}
        {fit.topFamilies.length > 0 && (
          <p className="mb-4 text-sm text-black/70">
            Leading families: {fit.topFamilies.join(", ")}
          </p>
        )}
        <ul className="space-y-3">
          {fit.occupations.map((o, i) => (
            <li key={`${o.title}-${i}`} className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{o.title}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-black/50">{o.score}</span>
                  <Pill tone={PROVENANCE_TONE[o.provenance] ?? "plain"}>
                    {PROVENANCE_LABEL[o.provenance] ?? o.provenance}
                  </Pill>
                </div>
              </div>
              <p className="mt-1 text-xs text-black/50">{o.family}</p>
              {o.sourceQuote && (
                <blockquote className="mt-2 border-l-2 border-black/10 pl-3 text-xs italic text-black/60">
                  {o.sourceQuote}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
