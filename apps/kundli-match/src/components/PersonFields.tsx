"use client";

import { useEffect, useState } from "react";
import { formatUtcOffset, isKnownTimeZone, offsetMinutesAt } from "@lumin-examples/client/zone";
import type { PersonInput } from "@/lib/types";

/** The id of the zone suggestions that MatchForm renders once for both people. */
export const TIME_ZONE_LIST_ID = "time-zones";

type Props = {
  label: string;
  value: PersonInput;
  onChange: (next: PersonInput) => void;
  disabled: boolean;
};

/** One person's half of the two-birth-form screen. Controlled, no local state. */
export function PersonFields({ label, value, onChange, disabled }: Props) {
  function set<K extends keyof PersonInput>(key: K, v: PersonInput[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <fieldset className="rounded-xl bg-white p-5 ring-1 ring-black/[0.08]" disabled={disabled}>
      <legend className="px-1 text-sm font-semibold tracking-tight">{label}</legend>

      <div className="mt-3 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">Name</span>
          <input
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Optional, used for labelling only"
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black/70">Birth date</span>
            <input
              type="date"
              value={value.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
              required
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black/70">Birth time</span>
            <input
              type="time"
              value={value.birth_time}
              onChange={(e) => set("birth_time", e.target.value)}
              required={value.birth_time_known}
              disabled={!value.birth_time_known}
              className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            checked={!value.birth_time_known}
            onChange={(e) => set("birth_time_known", !e.target.checked)}
            className="size-4 rounded ring-1 ring-black/20"
          />
          I do not know the exact birth time
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">Birth place</span>
          <input
            value={value.location_name}
            onChange={(e) => set("location_name", e.target.value)}
            placeholder="e.g. Colombo, Sri Lanka"
            required
            className="min-h-[44px] w-full rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">
            Birth time zone
          </span>
          <input
            value={value.time_zone}
            onChange={(e) => set("time_zone", e.target.value.trim())}
            list={TIME_ZONE_LIST_ID}
            placeholder="e.g. Asia/Colombo"
            required
            autoComplete="off"
            spellCheck={false}
            className="min-h-[44px] w-full max-w-[280px] rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
          <span className="mt-1.5 block text-xs text-black/50">{zoneHint(value)}</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/70">Gender</span>
          <div className="grid grid-cols-3 gap-2">
            {(["female", "male", "other"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("gender", g)}
                aria-pressed={value.gender === g}
                className={`min-h-[44px] rounded-lg px-2 text-sm font-medium capitalize ring-1 transition ${
                  value.gender === g
                    ? "bg-black text-white ring-black"
                    : "bg-white text-black/70 ring-black/[0.08] hover:ring-black/20"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </label>
      </div>
    </fieldset>
  );
}

/**
 * What clocks read in the chosen zone at this birth moment. The offset at birth
 * feeds the Ascendant directly, so showing it lets a wrong zone show itself.
 */
function zoneHint(p: PersonInput): string {
  if (!isKnownTimeZone(p.time_zone)) {
    return "Use an IANA name, such as Asia/Colombo, Asia/Kolkata or America/New_York.";
  }
  const time = p.birth_time_known && p.birth_time ? p.birth_time : "12:00";
  const offset = offsetMinutesAt(p.time_zone, `${p.birth_date}T${time}:00`);
  if (offset === null) return "Enter the birth date to see the offset at birth.";
  return `Clocks there read UTC${formatUtcOffset(offset)} at that birth date and time.`;
}

/**
 * The zone names the browser knows, offered as suggestions. Filled after mount,
 * because the server and the browser can carry different zone lists.
 */
export function TimeZoneList() {
  const [zones, setZones] = useState<string[]>([]);
  useEffect(() => {
    setZones(Intl.supportedValuesOf("timeZone"));
  }, []);
  return (
    <datalist id={TIME_ZONE_LIST_ID}>
      {zones.map((zone) => (
        <option key={zone} value={zone} />
      ))}
    </datalist>
  );
}

export function defaultPerson(name: string): PersonInput {
  return {
    name,
    birth_date: "1992-06-10",
    birth_time: "08:15",
    birth_time_known: true,
    location_name: "",
    time_zone: "Asia/Colombo",
    gender: "other",
  };
}
