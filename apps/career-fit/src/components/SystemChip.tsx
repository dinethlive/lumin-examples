/**
 * Every panel in this app carries one of these. KP panels get the quiet
 * default; the D10 cross-system panel gets the amber variant so it never
 * reads as part of the KP verdict sitting next to it.
 */
export function SystemChip({ system }: { system: "kp" | "cross-system" }) {
  if (system === "cross-system") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
        Vedic Parashari, cross-system
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
      KP
    </span>
  );
}
