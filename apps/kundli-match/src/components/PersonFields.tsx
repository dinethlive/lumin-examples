"use client";

import type { PersonInput } from "@/lib/types";

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
            UTC offset in minutes
          </span>
          <input
            type="number"
            value={value.utc_offset_minutes}
            onChange={(e) => set("utc_offset_minutes", Number(e.target.value))}
            min={-720}
            max={840}
            required
            className="min-h-[44px] w-full max-w-[200px] rounded-lg bg-white px-3 py-2 ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-black/20"
          />
          <span className="mt-1.5 block text-xs text-black/50">
            330 for India and Sri Lanka, -300 for US Eastern. This feeds the Ascendant
            directly, so it is asked for rather than guessed.
          </span>
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

export function defaultPerson(name: string): PersonInput {
  return {
    name,
    birth_date: "1992-06-10",
    birth_time: "08:15",
    birth_time_known: true,
    location_name: "",
    utc_offset_minutes: 330,
    gender: "other",
  };
}
