import type { ChartSignal, Personality, PersonalityTrait } from "@/lib/types";

const TRAIT_DESCRIPTIONS: Record<PersonalityTrait, string> = {
  warm: "Family-oriented, comfort-seeking, expressive",
  intellectual: "Curious, mind-driven, gadget-loving",
  luxurious: "Premium, status-conscious, indulgent",
  traditional: "Classical, respectful of heritage",
  homebody: "Private, comfort-loving, prefers home",
  elegant: "Refined, beauty-seeking, polished",
  practical: "Utility-driven, low-ornament, no-fuss",
  celebratory: "Festive, social, party-ready",
  nurturing: "Caring, family-first, generous",
  playful: "Light-hearted, fun-loving, youthful",
};

export function PersonalityCard({
  personality,
  disclaimer,
}: {
  personality: Personality;
  disclaimer: string;
}) {
  const primaryTrait = personality.traits[0] ?? "warm";
  const accentColor = `var(--color-trait-${primaryTrait})`;

  return (
    <div
      className="fade-up relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-8"
      style={{
        background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 60%), white`,
      }}
    >
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
        Your style
      </p>
      <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-5xl">
        {personality.label}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {personality.traits.map((trait) => (
          <TraitPill key={trait} trait={trait} />
        ))}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-base">
        {personality.summary}
      </p>

      <div className="mt-6 grid gap-3 border-t border-black/[0.06] pt-6 text-sm md:grid-cols-3">
        {personality.traits.slice(0, 3).map((trait) => (
          <div key={trait}>
            <p className="font-medium capitalize">{trait}</p>
            <p className="mt-1 text-muted-foreground">
              {TRAIT_DESCRIPTIONS[trait]}
            </p>
          </div>
        ))}
      </div>

      {personality.signals.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-6">
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
            Chart signals
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Named readings behind the style: how the chart projects in public, what it
            craves at the core, which planet carries the most weight, and how it leans
            on spending.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {personality.signals.map((signal, i) => (
              <SignalCard
                key={`${signal.label}-${i}`}
                signal={signal}
                accent={accentColor}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-black/[0.06] pt-4 text-[11px] leading-relaxed text-muted-foreground">
        {disclaimer}
      </p>
    </div>
  );
}

function SignalCard({ signal, accent }: { signal: ChartSignal; accent: string }) {
  return (
    <div className="rounded-lg bg-white/65 p-3 ring-1 ring-black/[0.04]">
      <p
        className="text-[10px] font-medium tracking-[0.16em] uppercase"
        style={{ color: accent }}
      >
        {signal.label}
      </p>
      <p className="mt-1 font-serif text-base leading-snug tracking-tight text-foreground">
        {signal.value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {signal.detail}
      </p>
    </div>
  );
}

function TraitPill({ trait }: { trait: PersonalityTrait }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-black/[0.05]"
      style={{
        background: `var(--color-trait-${trait})12`,
        color: `var(--color-trait-${trait})`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: `var(--color-trait-${trait})` }}
      />
      {trait}
    </span>
  );
}
