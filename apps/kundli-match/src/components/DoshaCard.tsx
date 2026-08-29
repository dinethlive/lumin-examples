import type { Doshas } from "@/lib/types";

function PersonDoshaRow({
  label,
  manglik,
  kalsarpa,
}: {
  label: string;
  manglik: Doshas["manglik"]["personA"];
  kalsarpa: Doshas["kalsarpa"]["personA"];
}) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-3 ring-1 ring-black/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span>Manglik</span>
          <span
            className={`font-medium ${manglik.present ? "text-rose-800" : "text-emerald-800"}`}
          >
            {manglik.present ? `Present, ${manglik.severity}` : "Not present"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Kala Sarpa</span>
          <span
            className={`font-medium ${kalsarpa.present ? "text-rose-800" : "text-emerald-800"}`}
          >
            {kalsarpa.present
              ? `${kalsarpa.full ? "Full" : "Partial"}${kalsarpa.variant ? `, ${kalsarpa.variant}` : ""}`
              : "Not present"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * check_doshas + get_kalsarpa_variants, for both charts, with the KP corpus's
 * own dissent from the Manglik premise carried alongside the traditional
 * computation. This is the single most persuasive card in the app: a generic
 * astrology API returns a Manglik flag with no reasoning, this shows the
 * traditional finding and the source tradition's own argument against it, on
 * the same screen.
 */
export function DoshaCard({ doshas }: { doshas: Doshas }) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Doshas</h3>
        <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-violet-800 ring-1 ring-violet-200">
          Vedic Parashari
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PersonDoshaRow
          label="Person A"
          manglik={doshas.manglik.personA}
          kalsarpa={doshas.kalsarpa.personA}
        />
        <PersonDoshaRow
          label="Person B"
          manglik={doshas.manglik.personB}
          kalsarpa={doshas.kalsarpa.personB}
        />
      </div>

      <div className="mt-4 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800">
          What the KP corpus itself says about Manglik
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-950">{doshas.kpDissent}</p>
      </div>
    </section>
  );
}
