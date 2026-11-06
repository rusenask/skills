---
name: ui-council
description: >-
  Iteratively improve the visual design and clarity of a web UI by hill
  climbing against a panel ("council") of independent LLM reviewers. Use when
  asked to polish, restyle, or raise the design quality of an app's screens,
  or to run a repeatable design-review loop that produces a tracked score per
  round. Captures screenshots with Playwright, scores them side by side with
  frozen screenshots of the products it competes with, verifies every claim
  before acting, implements the highest-value fixes, and re-scores until the
  target clears a stated bar.
---

# UI council — design hill climbing

A loop for raising a web UI from "functional" to "best-in-class" in tracked,
verifiable rounds. It is deliberately boring and repeatable: the score only
means something because the brief, the references, and the capture are held
fixed across rounds while the UI changes underneath them.

This skill is **read-only against the running app**. It never edits data,
touches servers, or sends network traffic beyond loading pages you were given
to review. It changes *your own repo's* UI code, nothing else.

## When to use it

- "Make this app look more like Linear / Vercel / Stripe."
- "The UI works but feels amateur — tighten it up."
- "Review the design of these screens and fix what's weak."
- Any time you want design progress you can *defend* with a trend line, not a
  vibe.

## The one rule that makes it work

**A fixed brief + a fixed reference set + a fixed capture set = comparable
scores.** Change the app between rounds, never the ruler. If you must change
scope (new screens, new viewport, different references), start a *new* score
series for that scope rather than pretending it continues the old one.

### Why references, not just a written anchor
A reviewer looking at one product alone scores it generously, and its scores
drift upward as a session goes on. In one published run, a reviewer rated a UI
6 → 9 when it saw only that UI. Shown the same screens next to two competitors,
the same reviewer rated them 7.0 → 7.4. Its scores for the competitors, whose
screenshots never changed, rose from 8.3 to 9.1 over the run.

So every round, reviewers also score **frozen screenshots of two or three real
products** you are measuring against. Two things follow:
- The references pin the scale to real products, so a 9 means "as good as
  those products", not "fine on its own".
- References never change, so any movement in their scores is reviewer drift.
  Track the **gap** (target minus best reference, per reviewer and category),
  and the drift cancels out.

## The loop (one round)

### 0. References (once per series)
Pick two or three products the owner would actually compare against: direct
competitors or the best tools the same users already have open, not a generic
mood board. Screenshot their equivalent screens at the same viewports, by hand
or with any capture tool, into `references/<product>/` in the target repo.
They are **frozen** for the whole series; recapturing them starts a new series.

### 1. Capture
Run `scripts/capture.mjs` to log in as a **realistic user account** (the one
your customers actually use — not an admin with extra chrome) and take
full-page screenshots of every screen in the flow, at every viewport you care
about. Desktop (1440) and phone (390) is the usual pair; phone is where most
real defects hide.

```
node scripts/capture.mjs --config ui-council.config.json --out /tmp/ui-rN
```

Also run `scripts/overflow.mjs` at phone width — it reports any element that
runs past the viewport edge. Horizontal overflow is an objective, automatable
defect; treat a non-empty report as a failing gate, not a suggestion.

Before a round, finish the fixes you already know about and get checks green.
Reviewers handed a known defect spend the round on it.

### 2. Brief
One **base brief** (`templates/brief.md`, filled in once for the product) plus
a short **per-round delta** (`templates/round-delta.md`). The base brief
carries:
- what the product is and who uses it,
- the products under review: the target and its references,
- the scoring anchor: **10 = Linear/Vercel/Stripe/best-in-class**, 7 =
  competent but visibly behind, 5 = usable with friction, below 5 = actively
  hurts trust. Every product, target and references alike, is scored on it,
- the eight scored categories (typography, hierarchy, spacing, color,
  iconography & components, consistency, clarity of flow, overall),
- a fixed output contract so every reviewer returns the same shape.

The delta says only what changed since last round and what scope to score. The
anchor text is never edited — that is what keeps round N comparable to round 1.

**Reviewers never see the bar.** Do not tell them the target score, earlier
scores, or what other reviewers said. A reviewer that knows you are aiming for
9.5 drifts toward 9.5. The bar lives in your log, not in the brief.

### 3. Council — reviewers from different model families
Dispatch **three heterogeneous reviewers** on the same brief + the same
screenshots, read-only. Heterogeneity is the point: a single model is
blind to its own habits. Each reviewer tends to run consistently harsh or
consistently lenient — that is fine, because you track **each reviewer's own
trend**, not the cross-reviewer absolute.

Typical panel:
- A frontier model (e.g. Claude Opus) via a native subagent.
- Two others from different families via whatever cross-model delegation you
  have (this repo's author uses `delegate_task` to an OpenCode-hosted GLM and
  DeepSeek). Substitute any two distinct families.

Give each round a stable, distinct request id (`council-rN-<model>`) so the
dispatches are traceable. If a model is out of quota, swap in another family
rather than dropping to two reviewers — three is the minimum that lets one
outlier be outvoted. A swapped-in reviewer starts its own trend line. A
timeout, an error or a reply without scores is **no score**: rerun it or log
`no score`, never fill one in.

**Pacer rounds (optional, to save cost).** Once the climb is long, run most
rounds with one **pacer**, the fastest and cheapest reviewer on the panel.
When the pacer's scores clear the bar, run the full council as a **gate
round**. Only a gate round can declare the bar met. A single model climbs
toward its own taste: in the run above, the pacer reached exactly 9.5 in every
category, and the next reviewer brought in gave 9.5 in only one. If the gate
fails, triage the council's findings and go back to pacer rounds. Bring the
slowest reviewer in last, so it doesn't hold up rounds it would not change.

### 4. Triage — verify every claim before you touch code
This is the step that separates hill climbing from thrashing. Reviewers
hallucinate. In a representative round, ~1 in 9 findings was wrong:
a misread contrast class, a "blank strip" that was really the gap between two
cards, a complaint driven by stale test data, a "missing badge" on an element
that is intentionally plain.

For every finding:
- **Check it against the pixels or the code before acting.** Open the actual
  crop; read the actual class. If it doesn't hold up, reject it and write down
  why.
- The reviewer that raised a claim does not get to confirm it — you confirm it
  against ground truth.
- **Fixes raised by more than one reviewer go first** — independent agreement
  is the strongest signal on the panel.
- A finding that points at something a reference does better is concrete:
  look at the reference crop and take the specific thing it does, not its
  brand.
- Anything that conflicts with a product decision the owner already made is
  declined and logged, not silently dropped.
- Don't agree just to end the loop, and fight scope creep: a finding that needs
  a new feature or a backend change is logged as separate work.

### 5. Implement, then verify by looking
Implement the surviving MUSTs first, then SHOULDs as budget allows. Never
remove information the user needs in the name of "cleaner." Then:
- re-run typecheck / unit checks,
- **re-capture and actually open the changed screens** — a clean exit and a
  plausible screenshot count are not verification; look at them,
- re-run the overflow gate,
- commit with a message that names the round.

### 6. Log the score
Append one block per round to `templates/rounds.md`: each reviewer's
category scores for the target and every reference, the gap, what you fixed,
and what you rejected with the reason. The log is the product — it is how
"−1.4 → +0.2 against the references over ten rounds" becomes a defensible
claim instead of a feeling.

If the work ends in a pull request, put the running table (round, reviewer,
target, best reference, gap) in its description. Edit the description; don't
post it as a comment.

### 7. Re-score next round on fresh captures
Go to 1, with the same references. Stop when the bar is met, the trend
flattens, or the owner is happy (see below).

## User feedback overrides the council, always
The council optimizes toward a generic best-in-class look. The owner's direct
feedback encodes product intent the council cannot see ("keep the brand
primary, not white", "that tab bar jumping is the worst part", "move the legal
text to its own tab"). When owner feedback arrives, it wins — implement it and
note it in the log as an owner override, even if a reviewer scored the old
behavior well.

Ask the owner to look every few rounds, switching between the target and the
references themselves. A council drifts toward **subtraction**: reviewers
reward removing things, so color drains toward grayscale, accents go, and
emphasis flattens until everything is quiet and nothing stands out. Scores keep
rising while the product loses its character. Only an owner looking at it
catches this. The fix is an override ("too grayscale — restore color"), which
the next rounds then build on.

## When to stop (or raise the bar)
- **Set a bar up front** and keep it in your log. The default is that every
  council reviewer scores the target at or above every reference in every
  category. An absolute bar (every reviewer, every category ≥ 9) also works.
  The bar is met only on a gate round: the full council, the lowest score
  across reviewers and categories.
- **Bank each bar.** When a bar is met, the branch is a mergeable checkpoint:
  open or update its PR. To aim higher (9 → 9.5 → 10), continue on a new
  branch stacked on that one. The series continues, since the ruler hasn't
  changed; only the bar has. Each higher bar costs far more rounds than the
  last; the owner decides whether it is worth it.
- Three consecutive rounds within about ±0.2 of each other, below the bar,
  means you have hit the ceiling of *this* scope. Don't grind for decimals —
  either declare it done or **open a new scope** (new screens, a harder
  viewport, a specific flow) with its own fresh score series.
- A single stubborn screen is worth a **scoped council**: same loop, brief
  narrowed to that one screen, its own short score series.

## Guardrails (carry these into every round)
- Read-only against the target; you only change your own UI source.
- No new features, no backend/API changes to chase a design score — flag those
  as separate work.
- Never delete information the user relies on to make a screen look tidier.
- Reviewers never see the bar, earlier scores, or each other's replies.
- References stay frozen for the whole series.
- Verify before acting; the finder never confirms its own finding.
- Clean up any test data you create in the app while capturing.

## Files
- `templates/brief.md` — the fixed base brief; fill the blanks once per product.
- `templates/round-delta.md` — the per-round delta brief.
- `templates/rounds.md` — the score log format.
- `scripts/capture.mjs` — login + full-page screenshots, driven by a config.
- `scripts/overflow.mjs` — phone-width horizontal-overflow gate.
- `ui-council.config.example.json` — copy to `ui-council.config.json` per app.
