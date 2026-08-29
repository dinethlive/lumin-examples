#!/usr/bin/env node
/**
 * Fails when an example references a Lumin tool that does not exist.
 *
 * This exists because the first generation of these examples drifted: READMEs
 * claimed a tool count that was 60 tools out of date, and nothing caught it.
 * A tool name is the one thing in an example that cannot be "close enough":
 * a wrong name is a silent tool-not-found at runtime, inside a model
 * conversation, where nobody sees it.
 *
 * Run: npm run check:tools
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const snapshot = JSON.parse(readFileSync(join(here, "tool-names.json"), "utf8"));
const known = new Set(snapshot.tools);

// Matches the tool-name verbs actually used by the server. Deliberately narrow:
// a broad identifier match would flag every local helper function.
const TOOL_PATTERN =
  /\b((?:get|run|find|analyze|check|detect|rank|rectify|set)_[a-z0-9_]+)\b/g;

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "out",
  "coverage",
]);
const EXTENSIONS = [".ts", ".tsx", ".md", ".mjs", ".json"];

/** Names that look like tools but are ours, not the server's. */
const LOCAL_ALLOW = new Set([
  "get_full_chart_note",
  "check_tool_names",
  "set_birth_profile_note",
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of walk(root)) {
  // The snapshot is the source of truth, so do not lint the snapshot.
  if (file.endsWith(join("scripts", "tool-names.json"))) continue;
  if (file.endsWith("check-tool-names.mjs")) continue;

  const text = readFileSync(file, "utf8");
  const seen = new Set();
  for (const match of text.matchAll(TOOL_PATTERN)) {
    const name = match[1];
    if (seen.has(name) || known.has(name) || LOCAL_ALLOW.has(name)) continue;
    seen.add(name);
    const line = text.slice(0, match.index).split("\n").length;
    problems.push({ file: relative(root, file), line, name });
  }
  checked += 1;
}

if (problems.length > 0) {
  console.error(
    `\nUnknown Lumin tool names in ${problems.length} place(s):\n`,
  );
  for (const p of problems) {
    console.error(`  ${p.file}:${p.line}  ${p.name}`);
  }
  console.error(
    `\nThe server exposes ${snapshot.count} tools (see scripts/tool-names.json).`,
  );
  console.error(
    "If the server genuinely added a tool, regenerate the snapshot. Otherwise fix the name.\n",
  );
  process.exit(1);
}

console.log(
  `Checked ${checked} files against ${snapshot.count} known tool names. No unknown names.`,
);
