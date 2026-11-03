# backend-council

A skill for raising backend code from "it works" to "reference quality" in
tracked, verifiable rounds, by hill climbing against a panel of independent LLM
reviewers. It is [ui-council](../ui-council/README.md)'s loop applied to code:
a pinned commit replaces the screenshots, and build, lint and test gates
replace the overflow check.

It scores long-term design, structure, interfaces, simplicity, readability,
edge-case handling, test value and operability. It works with any language
whose gates run from a shell. The method, triage rules, guardrails and stop
conditions are in [`SKILL.md`](./SKILL.md); the rubric reviewers score against
is in [`templates/brief.md`](./templates/brief.md).

## Quick start

1. In the repository under review, copy the config and set the scope and
   gates:
   ```
   cp <skills>/backend-council/backend-council.config.example.json backend-council.config.json
   ```
   `paths` are git pathspecs from the repository root, so `:(exclude)*.pb.go`
   drops generated files at any depth. The config holds no secrets and can be
   committed. Gates must only check: a formatter that rewrites files fails the
   snapshot.
2. Commit, then take a baseline snapshot:
   ```
   node <skills>/backend-council/scripts/snapshot.mjs --config backend-council.config.json --out /tmp/bc-r0
   ```
3. Fill in `templates/brief.md` once for the codebase, and keep it beside the
   score log (`templates/rounds.md`) in the target repository.
4. Run the loop in `SKILL.md`: snapshot → three-reviewer council → verify
   every claim → implement the survivors → gates and diff-review → log the
   score → repeat.

`scripts/selftest` checks `snapshot.mjs` end to end against throwaway repos;
run it after changing the script.

## Installing as an agent skill

See the repository [README](../README.md#install).
