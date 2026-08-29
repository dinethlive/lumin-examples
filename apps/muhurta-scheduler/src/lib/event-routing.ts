/**
 * Which of the nine named electional tools covers a given catalog event key,
 * and the one or two extra arguments that tool needs beyond the common
 * birth-data and window fields.
 *
 * This table is what deletes the guess. The prompt in the reference protocol
 * tells a model to "prefer the named tool", which still leaves the model to
 * pick one. Here the route handler picks it, in code, from the event key the
 * user already chose on the event-picker screen, before the model is ever
 * called. The model is then told exactly one tool name and exactly one set
 * of arguments: there is nothing left to guess.
 *
 * A key with no entry here falls back to `find_election_window` with
 * `event: <key>`, which is the documented long-tail path for the other ~29
 * catalog events (and any of the 78 natal event names) that have no tool of
 * their own.
 */
export type NamedToolRoute = {
  tool: string;
  /** Extra arguments this tool's schema expects beyond the common fields. */
  extraParams?: Record<string, string>;
};

export const NAMED_TOOL_ROUTES: Record<string, NamedToolRoute> = {
  marriage: { tool: "find_wedding_muhurta" },
  competitive_exam: { tool: "find_exam_time" },
  interview: { tool: "find_interview_time" },
  // find_meeting_time's `subject` picks the house group: 'business' for the
  // 3-6-9-10-11 group, 'third_party_approval' for the 3-5-9-11 group. The
  // catalog's own "negotiation" key maps to the second, per the tool's own
  // paramSelector in kp-mcp's tools.ts.
  business_meeting: { tool: "find_meeting_time", extraParams: { subject: "business" } },
  negotiation: { tool: "find_meeting_time", extraParams: { subject: "third_party_approval" } },
  sign_agreement: { tool: "find_contract_signing_time" },
  start_business: { tool: "find_business_launch_time" },
  begin_journey: { tool: "find_travel_departure_time" },
  // find_property_muhurta's `mode` picks between three separately sourced
  // house groups; these are genuinely different elections, not one rule
  // relabelled.
  property_purchase: { tool: "find_property_muhurta", extraParams: { mode: "purchase" } },
  occupy_new_house: { tool: "find_property_muhurta", extraParams: { mode: "griha_pravesha" } },
  lay_a_foundation: { tool: "find_property_muhurta", extraParams: { mode: "foundation" } },
  surgery: { tool: "find_surgery_time" },
};

export const GENERIC_ELECTION_TOOL = "find_election_window";

/** Resolve an event key to the tool that should elect it, and that tool's fixed arguments. */
export function resolveElectionTool(eventKey: string): {
  tool: string;
  args: Record<string, string>;
} {
  const named = NAMED_TOOL_ROUTES[eventKey];
  if (named) return { tool: named.tool, args: { ...(named.extraParams ?? {}) } };
  return { tool: GENERIC_ELECTION_TOOL, args: { event: eventKey } };
}

/** Every tool `resolveElectionTool` can return. Used to build the static allowlist. */
export const ALL_ELECTION_TOOLS = [
  "find_wedding_muhurta",
  "find_exam_time",
  "find_interview_time",
  "find_meeting_time",
  "find_contract_signing_time",
  "find_business_launch_time",
  "find_travel_departure_time",
  "find_property_muhurta",
  "find_surgery_time",
  GENERIC_ELECTION_TOOL,
] as const;
