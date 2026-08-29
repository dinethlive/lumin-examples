import type { ElectionProvenance } from "@/lib/types";

const LABEL: Record<ElectionProvenance, string> = {
  BOOK_SOURCED: "Quoted from the books",
  WEB_SOURCED: "Published KP source",
  DERIVED_TABLE_D: "Derived, matter's houses + 6 + 11",
  DERIVED_CUSP_RULE: "Derived from a cusp sub lord rule",
};

const STYLE: Record<ElectionProvenance, string> = {
  BOOK_SOURCED: "bg-elected-soft text-elected ring-elected/30",
  WEB_SOURCED: "bg-elected-soft text-elected ring-elected/30",
  DERIVED_TABLE_D: "bg-muted text-muted-foreground ring-black/[0.08]",
  DERIVED_CUSP_RULE: "bg-muted text-muted-foreground ring-black/[0.08]",
};

/**
 * A quoted claim and a derived one are different claims and must never look
 * the same. Quoted provenances get the warm "elected" tone, derived ones get
 * the neutral one, so the distinction survives a glance.
 */
export function ProvenanceChip({ provenance }: { provenance: ElectionProvenance }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium ring-1 ${STYLE[provenance]}`}
      title={provenance}
    >
      {LABEL[provenance]}
    </span>
  );
}
