#!/usr/bin/env node
// snapshot.mjs — pin one council round's input: the commit, every file in
// scope at that commit, and whether the gates pass. Read-only against the code.
//
//   node snapshot.mjs --config backend-council.config.json --out /tmp/bc-r1
//
// Run from inside the repository under review; `paths` are git pathspecs from
// its root. Writes <out>/bundle.md (the scoped files, for reviewers) and
// <out>/manifest.md (commit, file list, gate results, for the score log).
// Exit 0: green. 1: a gate failed. 2: no snapshot (bad config, uncommitted
// changes in scope, scope over budget, a gate rewrote files).
import { spawnSync } from "node:child_process";
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function die(message) {
  console.error(message);
  process.exit(2);
}

function git(args, context) {
  const r = spawnSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) die(`${context}: ${(r.stderr || r.error?.message || "").trim()}`);
  return r.stdout;
}

const cfgPath = arg("config", "backend-council.config.json");
const outDir = resolve(arg("out", "/tmp/backend-council"));
let cfg;
try {
  cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
} catch (e) {
  die(`config ${cfgPath}: ${e.message}`);
}
const gates = cfg.gates ?? [];
const maxTokens = cfg.maxTokens ?? 120_000;
if (typeof cfg.scope !== "string" || !Array.isArray(cfg.paths) || !cfg.paths.length || !cfg.paths.every((p) => typeof p === "string"))
  die(`config ${cfgPath}: needs a "scope" name and a non-empty "paths" list of git pathspecs`);
// A budget that is not a number compares false against everything, so the
// size check would silently never fire.
if (!Number.isInteger(maxTokens) || maxTokens <= 0)
  die(`config ${cfgPath}: "maxTokens" must be a positive integer, got ${JSON.stringify(cfg.maxTokens)}`);
if (!gates.every((g) => typeof g.name === "string" && typeof g.cmd === "string"))
  die(`config ${cfgPath}: every gate needs a "name" and a "cmd"`);

process.chdir(git(["rev-parse", "--show-toplevel"], "not inside a git repository").trim());
const sha = git(["rev-parse", "--verify", "HEAD"], "no commit to pin; commit the code under review").trim();
const subject = git(["log", "-1", "--format=%s"], "reading HEAD").trim();

// A snapshot is a commit: reviewers, gates and the log must all see HEAD.
function uncommitted() {
  return git(["status", "--porcelain", "-z", "--", ...cfg.paths], "checking scope").split("\0").filter(Boolean);
}
const dirty = uncommitted();
if (dirty.length)
  die(`scope has uncommitted changes; commit or stash them first:\n  ${dirty.slice(0, 10).join("\n  ")}`);

const included = [];
const skipped = [];
for (const path of git(["ls-files", "-z", "--", ...cfg.paths], "listing scope").split("\0").filter(Boolean)) {
  const stat = lstatSync(path);
  if (!stat.isFile()) {
    skipped.push({ path, why: stat.isSymbolicLink() ? "symlink" : "not a regular file" });
    continue;
  }
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8000).includes(0)) {
    skipped.push({ path, why: "binary" });
    continue;
  }
  const text = bytes.toString("utf8");
  const lines = text === "" ? 0 : text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  included.push({ path, text, lines });
}
if (!included.length) die(`paths matched no tracked text files: ${cfg.paths.join(" ")}`);

const lines = included.reduce((n, f) => n + f.lines, 0);
const tokens = Math.round(included.reduce((n, f) => n + f.text.length, 0) / 4);
if (tokens > maxTokens) {
  const largest = [...included].sort((a, b) => b.text.length - a.text.length).slice(0, 5);
  die(
    `scope is ≈${tokens} tokens, over maxTokens ${maxTokens}. A reviewer skims what it cannot hold, ` +
      `so narrow "paths" (or raise maxTokens to what every reviewer's context fits). Largest files:\n  ` +
      largest.map((f) => `${f.path} (≈${Math.round(f.text.length / 4)})`).join("\n  "),
  );
}

// Fence each file with more backticks than its longest run, so markdown,
// heredocs and raw strings inside it cannot close the block early.
function fenced(text, lang) {
  let longest = 2;
  for (const m of text.matchAll(/`{3,}/g)) longest = Math.max(longest, m[0].length);
  const fence = "`".repeat(longest + 1);
  return `${fence}${lang}\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}`;
}
const cell = (s) => s.replaceAll("|", "\\|");

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "bundle.md"),
  [
    `# ${cfg.scope} @ ${sha.slice(0, 12)}`,
    "",
    `${included.length} files, ${lines} lines, from commit \`${sha}\` (${subject}).`,
    ...included.flatMap((f) => ["", `## \`${f.path}\` (${f.lines} lines)`, "", fenced(f.text, extname(f.path).slice(1))]),
    "",
  ].join("\n"),
);

const results = gates.map((gate) => {
  process.stdout.write(`gate ${gate.name} ... `);
  const started = Date.now();
  const r = spawnSync("sh", ["-c", `exec 2>&1\n${gate.cmd}`], { encoding: "utf8", maxBuffer: 1 << 28 });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const ok = r.status === 0;
  console.log(`${ok ? "pass" : "FAIL"} (${secs}s)`);
  const output = `${r.stdout ?? ""}${r.error ? `\n${r.error.message}` : ""}`.trimEnd();
  return { ...gate, ok, secs, tail: output.split("\n").slice(-40).join("\n") };
});
const rewritten = uncommitted();
if (rewritten.length)
  die(
    `files in scope changed during the snapshot, so the bundle no longer matches the tree. ` +
      `Gates must only check, and --out must sit outside the scope:\n  ${rewritten.slice(0, 10).join("\n  ")}`,
  );

const red = results.filter((r) => !r.ok);
const verdict = !gates.length ? "none configured" : red.length ? `RED — ${red.map((r) => r.name).join(", ")} failed` : "green";
writeFileSync(
  join(outDir, "manifest.md"),
  [
    `# Backend council snapshot — ${cfg.scope}`,
    "",
    `- **Commit:** \`${sha}\` — ${subject}`,
    `- **Taken:** ${new Date().toISOString()}`,
    `- **Scope:** ${included.length} files, ${lines} lines, ≈${tokens} tokens`,
    `- **Gates:** ${verdict}`,
    ...(results.length
      ? ["", "## Gates", "", "| Gate | Command | Result | Time |", "|------|---------|--------|------|",
         ...results.map((r) => `| ${cell(r.name)} | \`${cell(r.cmd)}\` | ${r.ok ? "pass" : "**FAIL**"} | ${r.secs}s |`)]
      : []),
    ...red.flatMap((r) => ["", `### ${r.name} — last 40 lines`, "", fenced(r.tail, "text")]),
    "", "## Files", "", "| Path | Lines |", "|------|-------|",
    ...included.map((f) => `| \`${cell(f.path)}\` | ${f.lines} |`),
    ...(skipped.length ? ["", "## Not bundled", "", ...skipped.map((s) => `- \`${s.path}\` — ${s.why}`)] : []),
    "",
  ].join("\n"),
);

console.log(`snapshot ${cfg.scope} @ ${sha.slice(0, 12)}: ${included.length} files, ${lines} lines, ≈${tokens} tokens → ${outDir}`);
console.log(`gates: ${verdict}`);
if (red.length) {
  console.error("A red gate blocks the round: fix it, commit, and snapshot again.");
  process.exit(1);
}
