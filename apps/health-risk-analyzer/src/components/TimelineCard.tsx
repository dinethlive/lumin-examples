import type {
  ChronicityProfile,
  SaturnCycle,
  ScreeningEntry,
  TimingWindow,
} from "@/lib/types";
import { getBodySystem } from "@/lib/body-systems";

const TENDENCY_LABEL: Record<ChronicityProfile["tendency"], string> = {
  acute: "Acute-leaning",
  chronic: "Chronic-leaning",
  mixed: "Mixed",
};

const TENDENCY_COLOR: Record<ChronicityProfile["tendency"], string> = {
  acute: "var(--color-risk-elevated)",
  chronic: "var(--color-risk-moderate)",
  mixed: "var(--color-vitality-balanced)",
};

const SATURN_TONE: Record<
  SaturnCycle["status"],
  { color: string; soft: string; label: string }
> = {
  active: {
    color: "var(--color-risk-elevated)",
    soft: "var(--color-risk-elevated-soft)",
    label: "Sade Sati active",
  },
  approaching: {
    color: "var(--color-risk-moderate)",
    soft: "var(--color-risk-moderate-soft)",
    label: "Approaching",
  },
  clear: {
    color: "var(--color-risk-low)",
    soft: "var(--color-risk-low-soft)",
    label: "Clear",
  },
};

export function TimelineCard({
  chronicity,
  saturn,
  surgery,
  recovery,
  screening,
}: {
  chronicity: ChronicityProfile;
  saturn: SaturnCycle;
  surgery: TimingWindow[];
  recovery: TimingWindow[];
  screening: ScreeningEntry[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-7">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Chronicity profile
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-sm">
          <span
            className="size-1.5 rounded-full"
            style={{ background: TENDENCY_COLOR[chronicity.tendency] }}
          />
          <span className="font-medium">{TENDENCY_LABEL[chronicity.tendency]}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {chronicity.reasoning}
        </p>

        <SaturnSection saturn={saturn} />

        <Section title="Surgery windows" empty="No active surgical windows in horizon.">
          {surgery.map((w, i) => (
            <WindowRow key={i} window={w} accent="var(--color-risk-elevated)" />
          ))}
        </Section>

        <Section
          title="Recovery & healing periods"
          empty="No standout recovery periods identified."
        >
          {recovery.map((w, i) => (
            <WindowRow key={i} window={w} accent="var(--color-risk-low)" />
          ))}
        </Section>
      </div>

      <div className="fade-up rounded-2xl bg-card p-6 ring-1 ring-black/[0.06] md:p-7">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Screening calendar
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Lab and imaging tests aligned to vulnerability windows. Bring this list to your
          physician.
        </p>

        <ul className="mt-5 space-y-3">
          {screening.length === 0 && (
            <li className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              No specific screening dates were generated.
            </li>
          )}
          {screening.map((entry, i) => {
            const systemMeta = getBodySystem(entry.system);
            return (
              <li
                key={i}
                className="flex gap-4 rounded-lg p-3 transition hover:bg-muted/40"
                style={{ background: "rgba(0,0,0,0.012)" }}
              >
                <div
                  className="flex w-20 shrink-0 flex-col items-center justify-center rounded-md py-2 text-center"
                  style={{
                    background: systemMeta ? `${systemMeta.hue}18` : "rgba(0,0,0,0.04)",
                  }}
                >
                  <p
                    className="font-mono text-[10px] tracking-wider uppercase"
                    style={{ color: systemMeta?.hue }}
                  >
                    {monthShort(entry.month)}
                  </p>
                  <p className="font-serif text-base leading-none text-foreground">
                    {monthYear(entry.month)}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{entry.test}</p>
                  <p className="mt-0.5 text-[11px] tracking-wide uppercase text-muted-foreground">
                    {systemMeta?.label ?? entry.system}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {entry.rationale}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SaturnSection({ saturn }: { saturn: SaturnCycle }) {
  const tone = SATURN_TONE[saturn.status];
  const hasPhase = Boolean(saturn.phase) && saturn.phase !== "none";
  return (
    <section className="mt-5 border-t border-black/[0.06] pt-5">
      <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
        Saturn cycle (Sade Sati)
      </p>
      <div
        className="mt-3 rounded-lg px-3 py-2.5"
        style={{ background: tone.soft }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: tone.color }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: tone.color }}
            />
            {tone.label}
          </span>
          {hasPhase && (
            <span className="font-mono text-[12px] text-foreground">
              {saturn.phase}
            </span>
          )}
        </div>
        {saturn.window && (
          <p className="mt-1.5 font-mono text-[12px] text-foreground/80">
            {monthShort(saturn.window.start)} {monthYear(saturn.window.start)} →{" "}
            {monthShort(saturn.window.end)} {monthYear(saturn.window.end)}
          </p>
        )}
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
          {saturn.note}
        </p>
        {typeof saturn.intensity === "number" && (
          <div className="mt-3 border-t border-black/[0.06] pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
                Peak intensity
              </span>
              <span className="font-mono text-[12px]" style={{ color: tone.color }}>
                {Math.round(saturn.intensity)}/100
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, saturn.intensity))}%`,
                  background: tone.color,
                }}
              />
            </div>
            {(saturn.peak_window || saturn.peak_theme) && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/70">
                {saturn.peak_window && (
                  <span className="font-mono">
                    {monthShort(saturn.peak_window.start)}{" "}
                    {monthYear(saturn.peak_window.start)} →{" "}
                    {monthShort(saturn.peak_window.end)}{" "}
                    {monthYear(saturn.peak_window.end)}
                  </span>
                )}
                {saturn.peak_window && saturn.peak_theme ? " · " : ""}
                {saturn.peak_theme}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.length > 0 && arr.every(Boolean);
  return (
    <section className="mt-5 border-t border-black/[0.06] pt-5">
      <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
        {title}
      </p>
      {hasContent ? (
        <div className="mt-3 space-y-2">{children}</div>
      ) : (
        <p className="mt-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  );
}

function WindowRow({ window, accent }: { window: TimingWindow; accent: string }) {
  return (
    <div className="rounded-lg border border-black/[0.05] p-3">
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full" style={{ background: accent }} />
        <span className="font-mono text-[12px] font-medium text-foreground">
          {monthShort(window.start)} {monthYear(window.start)} → {monthShort(window.end)}{" "}
          {monthYear(window.end)}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
        {window.reason}
      </p>
    </div>
  );
}

function monthShort(value: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = parseInt(m[2], 10) - 1;
  return months[idx] ?? m[2];
}

function monthYear(value: string): string {
  const m = /^(\d{4})/.exec(value);
  return m ? m[1] : value;
}
