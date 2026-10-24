import type { DiscordAgent, DiscordRead, KpMarriage, PunarphooParty } from "@/lib/types";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-black/[0.04] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-black/60 ring-1 ring-black/[0.08]">
      {children}
    </span>
  );
}

function PunarphooHalf({ label, party }: { label: string; party: PunarphooParty }) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.06]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>
        <span className={`text-sm font-medium ${party.present ? "text-amber-800" : "text-emerald-800"}`}>
          {party.present ? `Present, ${party.strength}` : "Not present"}
        </span>
      </div>
      {party.present && (
        <p className="mt-1 text-xs text-black/60">
          Reads as {party.severity}
          {party.cancelled ? ", with a Sun cancellation reported (not applied)" : ""}.
        </p>
      )}
      {party.reasons.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-black/60">
          {party.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-black/50">{party.note}</p>
    </div>
  );
}

function AgentRow({ a }: { a: DiscordAgent }) {
  return (
    <li className="text-xs">
      <span className="font-medium">{a.planet}</span>
      <span className="text-black/60">
        {" "}
        in the sub of {a.subLord}, signifies {a.discordHouses.join(", ")}
        {a.unionHouses.length > 0 ? `, also ${a.unionHouses.join(", ")}` : ""}
        {a.temporary ? ", short-lived" : ""}
        {a.manner ? `. ${a.manner}` : ""}
      </span>
    </li>
  );
}

function DiscordHalf({ label, read }: { label: string; read: DiscordRead }) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>
      <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-black/40">
        Critical, no 2, 7 or 11 link
      </p>
      {read.criticalAgents.length === 0 ? (
        <p className="mt-0.5 text-xs text-black/50">None.</p>
      ) : (
        <ul className="mt-0.5 space-y-1">
          {read.criticalAgents.map((a) => (
            <AgentRow key={`c-${a.planet}`} a={a} />
          ))}
        </ul>
      )}
      <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-black/40">
        Narrowed by the Ruling Planets
      </p>
      {read.fruitfulAgents.length === 0 ? (
        <p className="mt-0.5 text-xs text-black/50">None.</p>
      ) : (
        <ul className="mt-0.5 space-y-1">
          {read.fruitfulAgents.map((a) => (
            <AgentRow key={`f-${a.planet}`} a={a} />
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-black/50">{read.note}</p>
    </div>
  );
}

/**
 * get_punarphoo (both charts in one call) and get_marital_discord_signature
 * (once per chart). Both are KP and both are read per person, not as a fourth
 * compatibility system. The discord rule sits right after the Manglik card on
 * purpose: KSK gives Mars no special standing, so the two can name different
 * people or planets, and that disagreement stays on screen.
 */
export function KpMarriageCard({ kpMarriage }: { kpMarriage: KpMarriage }) {
  const { punarphoo, discord } = kpMarriage;

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Punarphoo, marriage delay</h3>
        <Chip>KP</Chip>
      </div>
      <p className="mt-1 text-xs text-black/50">
        The natal Moon and Saturn tie. KP reads it as a delay to the date, never a denial.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PunarphooHalf label="Person A" party={punarphoo.personA} />
        <PunarphooHalf label="Person B" party={punarphoo.personB} />
      </div>
      <p className="mt-2 text-xs text-black/50">{punarphoo.note}</p>

      <div className="mt-6 flex items-start justify-between gap-2 border-t border-black/[0.06] pt-5">
        <h3 className="text-sm font-semibold tracking-tight">The KP discord rule</h3>
        <Chip>KP</Chip>
      </div>
      <p className="mt-1 text-xs text-black/50">
        Any planet whose sub lord signifies 6, 10 or 12 can bring discord, short-lived when that
        sub lord also signifies 2, 7 or 11. Mars has no special standing here, unlike Manglik.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DiscordHalf label="Person A's chart" read={discord.personA} />
        <DiscordHalf label="Person B's chart" read={discord.personB} />
      </div>
      <p className="mt-3 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-black/60">
        {/* The payload keeps the tool's disclaimer verbatim; only the display swaps its dash for a comma. */}
        {discord.disclaimer.replace(new RegExp("\\s*\\u2014\\s*", "g"), ", ")}
      </p>
    </section>
  );
}
