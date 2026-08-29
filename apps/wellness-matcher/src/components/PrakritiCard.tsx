import type {
  ConstitutionDriver,
  Dosha,
  DoshaBalance,
  Prakriti,
} from "@/lib/types";

const DOSHA_DESCRIPTIONS: Record<Dosha, string> = {
  vata: "Air and ether: quick, mobile, creative, prone to dryness and irregularity.",
  pitta: "Fire and water: focused, sharp, transformative, prone to heat and intensity.",
  kapha: "Earth and water: steady, nourishing, grounded, prone to heaviness and stagnation.",
};

const DOSHA_BG: Record<Dosha, string> = {
  vata: "bg-[var(--color-vata-soft)]",
  pitta: "bg-[var(--color-pitta-soft)]",
  kapha: "bg-[var(--color-kapha-soft)]",
};

const DOSHA_DOT: Record<Dosha, string> = {
  vata: "bg-[var(--color-vata)]",
  pitta: "bg-[var(--color-pitta)]",
  kapha: "bg-[var(--color-kapha)]",
};

const DOSHA_COLOR: Record<Dosha, string> = {
  vata: "var(--color-vata)",
  pitta: "var(--color-pitta)",
  kapha: "var(--color-kapha)",
};

const DOSHA_LABEL: Record<Dosha, string> = {
  vata: "Vata",
  pitta: "Pitta",
  kapha: "Kapha",
};

const DOSHA_ORDER: Dosha[] = ["vata", "pitta", "kapha"];

export function PrakritiCard({
  prakriti,
  doshaBalance,
  drivers,
  summary,
}: {
  prakriti: Prakriti;
  doshaBalance: DoshaBalance;
  drivers: ConstitutionDriver[];
  summary: string;
}) {
  return (
    <div
      className={`fade-up relative overflow-hidden rounded-2xl ${DOSHA_BG[prakriti.primary]} p-6 md:p-8`}
    >
      <div className="flex items-start justify-between gap-6 md:flex-row">
        <div className="flex-1">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Your prakriti
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-5xl">
            {prakriti.label}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 md:text-base">
            {summary}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
          <DoshaPill dosha={prakriti.primary} role="primary" />
          {prakriti.secondary && (
            <DoshaPill dosha={prakriti.secondary} role="secondary" />
          )}
        </div>
      </div>

      <DoshaMeter balance={doshaBalance} />

      <div className="mt-6 grid gap-3 border-t border-black/[0.06] pt-6 text-sm md:grid-cols-2">
        <div>
          <p className="font-medium capitalize">Primary: {prakriti.primary}</p>
          <p className="mt-1 text-muted-foreground">
            {DOSHA_DESCRIPTIONS[prakriti.primary]}
          </p>
        </div>
        {prakriti.secondary && (
          <div>
            <p className="font-medium capitalize">Secondary: {prakriti.secondary}</p>
            <p className="mt-1 text-muted-foreground">
              {DOSHA_DESCRIPTIONS[prakriti.secondary]}
            </p>
          </div>
        )}
      </div>

      {drivers.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-6">
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
            Constitution drivers
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The planets shaping your dosha mix, paired with their six-fold Shadbala
            strength. A strong planet is a firm driver; a weak one is a softer lean.
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {drivers.map((driver, i) => (
              <DriverRow key={`${driver.planet}-${i}`} driver={driver} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DoshaMeter({ balance }: { balance: DoshaBalance }) {
  const raw = DOSHA_ORDER.map((d) => Math.max(0, balance[d]));
  const total = raw.reduce((sum, v) => sum + v, 0) || 1;
  const pct = DOSHA_ORDER.map((d, i) => ({
    dosha: d,
    value: balance[d],
    width: (raw[i] / total) * 100,
  }));

  return (
    <div className="mt-6 rounded-xl bg-white/55 p-4 ring-1 ring-black/[0.04]">
      <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
        Dosha balance
      </p>
      <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-black/[0.06]">
        {pct.map((seg) => (
          <div
            key={seg.dosha}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${seg.width}%`, background: DOSHA_COLOR[seg.dosha] }}
            aria-label={`${DOSHA_LABEL[seg.dosha]} ${seg.value} percent`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {pct.map((seg) => (
          <span
            key={seg.dosha}
            className="inline-flex items-center gap-1.5 text-xs text-foreground"
          >
            <span
              className="size-2 rounded-full"
              style={{ background: DOSHA_COLOR[seg.dosha] }}
            />
            <span className="font-medium">{DOSHA_LABEL[seg.dosha]}</span>
            <span className="font-mono text-muted-foreground">{seg.value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DriverRow({ driver }: { driver: ConstitutionDriver }) {
  const color = DOSHA_COLOR[driver.dosha];
  const strength = Math.max(0, Math.min(100, driver.strength));
  return (
    <div className="rounded-lg bg-white/65 p-3 ring-1 ring-black/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium text-foreground">
          {driver.planet}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wide uppercase"
          style={{ background: `${color}1f`, color }}
        >
          <span className="size-1.5 rounded-full" style={{ background: color }} />
          {DOSHA_LABEL[driver.dosha]}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.08]">
          <div
            className="h-full rounded-full"
            style={{ width: `${strength}%`, background: color }}
          />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">{strength}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {driver.note}
      </p>
    </div>
  );
}

function DoshaPill({ dosha, role }: { dosha: Dosha; role: "primary" | "secondary" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase text-foreground ring-1 ring-black/[0.05]">
      <span className={`size-1.5 rounded-full ${DOSHA_DOT[dosha]}`} />
      {role}: {dosha}
    </span>
  );
}
