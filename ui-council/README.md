# ui-council

A skill for raising a web UI from "functional" to "best-in-class" in tracked,
verifiable rounds, by hill climbing against a panel of independent LLM
reviewers.

It is model- and app-agnostic: point it at any web app with a login, give it a
list of routes and the viewports you care about, and run the loop. The full
method, guardrails, and stop conditions are in [`SKILL.md`](./SKILL.md).

## Quick start

1. Copy the config and fill it in for your app:
   ```
   cp ui-council.config.example.json ui-council.config.json
   ```
2. Install Playwright in your project:
   ```
   npm i -D playwright && npx playwright install chromium
   ```
3. Capture a baseline (credentials via env, never in the config):
   ```
   UI_EMAIL=... UI_PASSWORD=... node scripts/capture.mjs --config ui-council.config.json --out /tmp/ui-r0
   UI_EMAIL=... UI_PASSWORD=... node scripts/overflow.mjs --config ui-council.config.json
   ```
4. Screenshot the equivalent screens of two or three products you compete
   with into `references/<product>/`, at the same viewports. They stay frozen
   for the whole series.
5. Fill in `templates/brief.md` once for your product, and write down the bar
   (e.g. "at or above every reference in every category") in the score log.
6. Run the loop in `SKILL.md`: brief → three-reviewer council scoring the
   target and the references → verify every claim → implement the survivors
   → re-capture → log the gap → repeat until a full-council round clears the
   bar.

## What's here

| Path | Purpose |
|------|---------|
| `SKILL.md` | The method: the loop, triage rules, guardrails, stop conditions. |
| `templates/brief.md` | Fixed base brief (the scoring anchor and the reference set live here). |
| `templates/round-delta.md` | Per-round delta brief. |
| `templates/rounds.md` | Score-log format. |
| `scripts/capture.mjs` | Login + full-page screenshots, config-driven. |
| `scripts/overflow.mjs` | Phone-width horizontal-overflow gate. |
| `ui-council.config.example.json` | Copy per app. |

## Installing as an agent skill

See the repository [README](../README.md#install).

The credential environment variables (`UI_EMAIL` / `UI_PASSWORD` by default)
are read at runtime and are never stored in the config or committed.
