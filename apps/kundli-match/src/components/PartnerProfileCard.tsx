import type { PartnerProfile, SpouseProfile } from "@/lib/types";

const FACETS: [keyof SpouseProfile, string][] = [
  ["workArchetype", "Work"],
  ["relativeAge", "Age"],
  ["background", "Background"],
  ["wealth", "Wealth"],
  ["personality", "Personality"],
  ["physical", "Physical"],
];

function ProfileHalf({ label, sub, profile }: { label: string; sub: string; profile: SpouseProfile }) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>
      <p className="text-[0.7rem] text-black/40">{sub}</p>
      <dl className="mt-2 space-y-1.5">
        {FACETS.map(([key, name]) => (
          <div key={key} className="flex gap-2 text-sm">
            <dt className="w-24 shrink-0 text-black/50">{name}</dt>
            <dd>{profile[key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** get_spouse_characteristics, called on each chart, so each direction gets its own facets. */
export function PartnerProfileCard({ partnerProfile }: { partnerProfile: PartnerProfile }) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Spouse characteristics</h3>
        <span className="shrink-0 rounded-full bg-black/[0.04] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-black/60 ring-1 ring-black/[0.08]">
          KP
        </span>
      </div>
      <p className="mt-1 text-xs text-black/50">
        From the 7th cuspal sub lord&apos;s star lord in each chart, read independently in
        both directions.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ProfileHalf
          label="Person A's chart implies"
          sub="an archetype for Person B"
          profile={partnerProfile.forPersonA}
        />
        <ProfileHalf
          label="Person B's chart implies"
          sub="an archetype for Person A"
          profile={partnerProfile.forPersonB}
        />
      </div>
    </section>
  );
}
