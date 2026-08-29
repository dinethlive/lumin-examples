"use client";

import { useState } from "react";
import type { Disagreement } from "@/lib/types";

/**
 * Where the three systems part company, and why, in the traditions' own
 * terms. A generic astrology API returns one Guna score with no reasoning;
 * this is the part that shows you where they disagree and reads the
 * explanation rather than hiding it.
 */
export function DisagreementDrawer({ disagreements }: { disagreements: Disagreement[] }) {
  const [open, setOpen] = useState(disagreements.length > 0);

  return (
    <section className="rounded-xl bg-white ring-1 ring-black/[0.08]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold tracking-tight">
          Where the systems disagree
          {disagreements.length > 0 && (
            <span className="ml-2 rounded-full bg-black/[0.06] px-2 py-0.5 text-xs font-medium text-black/60">
              {disagreements.length}
            </span>
          )}
        </span>
        <span className="text-black/40">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-black/[0.06] px-5 py-4">
          {disagreements.length === 0 ? (
            <p className="text-sm text-black/60">
              The three systems agreed everywhere on this pairing. No disagreement to explain.
            </p>
          ) : (
            <ul className="space-y-4">
              {disagreements.map((d, i) => (
                <li key={`${d.topic}-${i}`} className="border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium">{d.topic}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-medium text-black/70 ring-1 ring-black/[0.08]">
                      {d.systemA}
                    </span>
                    <span className="self-center text-black/30">vs</span>
                    <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-medium text-black/70 ring-1 ring-black/[0.08]">
                      {d.systemB}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-black/70">{d.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
