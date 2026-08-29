"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogEvent, CatalogResponse } from "@/lib/types";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import { NAMED_TOOL_ROUTES } from "@/lib/event-routing";

type Props = {
  onSelect: (event: CatalogEvent) => void;
};

export function EventPicker({ onSelect }: Props) {
  const [events, setEvents] = useState<CatalogEvent[] | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    (async () => {
      try {
        const res = await fetch("/api/catalog", { signal: controller.signal });
        if (!res.ok) {
          let message = "Could not load the event catalog.";
          try {
            const body = (await res.json()) as { error?: string };
            if (body.error) message = body.error;
          } catch {
            message = `Request failed with status ${res.status}.`;
          }
          setError(message);
          return;
        }
        const data = (await res.json()) as CatalogResponse;
        setEvents(data.events);
        setDisclaimer(data.disclaimer);
      } catch (err) {
        setError(
          (err as Error).name === "AbortError"
            ? "That took too long. Reload to try again."
            : "Could not reach the server.",
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }, [events, query]);

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-8 text-center ring-1 ring-black/[0.08]">
        <p className="text-sm text-muted-foreground">Loading the electable event catalog.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-200"
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground/80">
          What are you planning?
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, for example wedding, exam, launch, surgery"
          className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {filtered.map((event) => {
          const named = NAMED_TOOL_ROUTES[event.key];
          return (
            <li key={event.key}>
              <button
                type="button"
                onClick={() => onSelect(event)}
                className="flex w-full flex-col items-start gap-2 rounded-xl bg-card p-4 text-left ring-1 ring-black/[0.08] transition hover:ring-primary/40"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{event.label}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {event.defaultGranularity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Elects on houses {event.electedHouses.join("-")}
                  {event.avoidHouses.length > 0 && (
                    <> , excludes {event.avoidHouses.join("-")}</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ProvenanceChip provenance={event.provenance} />
                  {named && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[0.7rem] font-medium text-primary ring-1 ring-primary/20">
                      Named tool
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nothing matches &ldquo;{query}&rdquo;. Try a plainer word for what you are planning.
        </p>
      )}

      {disclaimer && (
        <p className="mt-6 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground ring-1 ring-black/[0.06]">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
