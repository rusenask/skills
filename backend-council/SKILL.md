---
name: backend-council
description: >-
  Iteratively raise the engineering quality of backend code by hill climbing
  against a panel ("council") of independent LLM reviewers from different
  model families. Use when asked to judge or improve the long-term design,
  structure, interfaces, simplicity, readability, edge-case handling, or test
  value of a service or package, or to run a repeatable code-quality review
  loop that produces a tracked score per round. Pins each round to a commit
  and a fixed scope, scores it beside a frozen reference bundle against a
  fixed anchor, verifies every claim against the code before acting,
  implements the highest-value fixes, and re-scores until the scope clears a
  stated bar. Not a diff audit (diff-review) or a bug hunt (/code-review).
---

# Backend council — engineering-quality hill climbing

A loop for raising backend code from "it works" to "reference quality" in
tracked, verifiable rounds. A panel of reviewers from different model families
scores one fixed scope (a service, a bounded context, a package and its tests)
against a fixed anchor. You verify every claim against the code, fix what
survives, and re-score on a fresh snapshot.

It judges what a diff review cannot see: whether this body of code will hold
up through years of change by people who did not write it. Its lenses are
long-term design, structure, interfaces, simplicity, readability, edge cases,
test value, and operability.

| Question | Reach for |
|----------|-----------|
| Is this code well designed, and is it getting better? | **backend-council** |
| Does this diff follow hygiene and design rules? | [diff-review](../diff-review/SKILL.md) |
| Does this diff have bugs? | Claude Code's bundled `/code-review` |
| How do I reshape this so every concept has one owner? | [refactor-clean](../refactor-clean/SKILL.md) |

The council decides *what* to change. refactor-clean is how structural fixes
get made, and diff-review audits each round's diff before it is committed.

## When to use it

- "Is this service well designed? Where will it hurt us in a year?"
- "This package works but it's a mess. Clean it up."
- "Our tests are slow and brittle and still miss bugs."
- Before building heavily on a subsystem, or after a prototype became
  production.
- Any time you want engineering progress you can *defend* with a trend line,
  not a vibe.

## The one rule that makes it work

**A fixed anchor + a fixed brief + a fixed scope + a fixed reference =
comparable scores.** Change the code between rounds, never the ruler. Each
round is pinned to a commit, so every reviewer reads byte-identical code and
every score points at a SHA. If the scope or the reference must change
(another package, a different service), start a *new* score series rather
than pretending it continues the old one.

### Why a reference bundle
Reviewers' scores drift upward over a long climb even when nothing changes:
in one published run, a reviewer's scores for screenshots that never changed
rose from 8.3 to 9.1. A score for the scope alone can't separate that drift
from real progress. So each round, reviewers also score a **frozen reference
bundle**: code the owner holds up as what good looks like here. Its scores
should not move. When they do, that is drift, and the **gap** (scope minus
reference, per reviewer and category) cancels it out. The reference also
anchors the top of the scale to code everyone can read, not to a list of
famous names.

## The loop (one round)

### 1. Snapshot

Commit, then pin the round's input from inside the repository under review:

```
node scripts/snapshot.mjs --config backend-council.config.json --out /tmp/bc-rN
```

It bundles every in-scope file at HEAD into `bundle.md` and runs the configured
gates (build, lint, tests), recording the results and the commit in
`manifest.md`. It refuses to snapshot when:

- **files in scope are uncommitted.** A snapshot is a commit.
- **the scope is too big to read whole** (`maxTokens`). A reviewer that skims
  scores its guesses. Split it into several series.
- **a gate rewrote files in scope.** Gates check; they never fix.

**A red gate blocks the round.** Fix it first. Reviewers handed a failing
build spend the round on it, and the scores stop measuring design.

Pick a scope a strong engineer could review in one sitting, and include its
tests, because test value is scored.

**Reference (once per series).** Pick a package of similar kind and size that
the owner calls reference quality: the team's best package, or a well-regarded
open-source one in the same language. Run `snapshot.mjs` once in its
repository with a config whose `paths` cover it, and keep that bundle frozen
for the whole series. Scope plus reference must still fit what a reviewer
reads whole; if they don't, shrink the scope or run without a reference and
note in the log that raw scores include drift.

### 2. Brief

Fill in one **base brief** (`templates/brief.md`) per codebase, plus a short
**per-round delta** (`templates/round-delta.md`) each round. The base brief
carries:

- what the system does, its load and failure profile, and what failure costs,
- the stack and the house conventions that override generic taste,
- the anchor: **10 = code a principal engineer would hold up as a reference**,
  7 = competent but a strong reviewer would push back, 5 = works but fights
  every change, below 5 = actively risky,
- the rubric: eight scored categories plus overall, each with what good looks
  like and the smells to flag,
- a fixed output contract: every finding cites `file:line` and names a
  concrete change.

The delta says only what changed and which snapshot to score. The anchor and
rubric are never edited between rounds. That is what keeps round N comparable
to round 1.

**Reviewers never see the bar.** Do not tell them the target score, earlier
scores, or what other reviewers said. A reviewer that knows you are aiming for
9 drifts toward 9. The bar lives in your log, not in the brief.

The rubric is also **your** yardstick in triage. Read it before step 4.

### 3. Council: reviewers from different model families, in parallel

Dispatch **three heterogeneous reviewers** on the same brief, delta and
bundle, read-only. Heterogeneity is the point. Each model family has its own
engineering taste (one reaches for interfaces, another for deleting them), and
a single model is blind to its own habits. Reviewers run consistently harsh or
lenient, so track **each reviewer's own trend**, not the cross-reviewer
absolute.

Typical panel:
- A frontier model (e.g. Claude Opus) via a native subagent.
- Two others from different families via whatever cross-model delegation you
  have (this repo's author uses `delegate_task` to an OpenCode-hosted GLM and
  DeepSeek). Substitute any two distinct families.

Reviewers that can read the repository may open files outside the bundle at
the pinned commit (callers, the store, the wire types) to judge how the scope
is used. They score only the bundle. Give each dispatch a stable, distinct id
(`bcouncil-rN-<model>`) so it can be traced. If a model is out of quota, swap
in another family rather than dropping to two reviewers. Three is the minimum
that lets one outlier be outvoted. A swapped-in reviewer starts its own trend
line. A timeout, an error or a reply without scores is **no score**: rerun it
or log `no score`, never fill one in.

**Pacer rounds (optional, to save cost).** Once the climb is long, run most
rounds with one **pacer**, the fastest and cheapest reviewer on the panel.
When the pacer's scores clear the bar, run the full council as a **gate
round**. Only a gate round can declare the bar met: a single model climbs
toward its own taste, and the others often disagree once they look. If the
gate fails, triage the council's findings and go back to pacer rounds. Bring
the slowest reviewer in last, so it doesn't hold up rounds it would not change.

### 4. Triage: verify every claim before you touch code

Code reviewers hallucinate as confidently as design reviewers, and acting on a
false claim usually *adds* mechanism. Typical false findings:

- "error is ignored", when the caller handles it or the call cannot fail;
- "unused, delete it", when it is reached through registration, reflection, a
  build tag, or another binary;
- "data race", on state confined to one goroutine or locked one frame up;
- "missing validation", when the boundary already validates;
- "extract an interface for testability", when it would have one
  implementation and the real dependency is cheap to test against;
- "add a unit test for X", when X is a getter, mock wiring, or already covered
  end to end.

For every finding:
- **Check it against the code at the pinned commit.** Read the cited line and
  trace its callers and consumers. If the claim doesn't hold, reject it and
  log the evidence.
- **Edge-case claims must reproduce.** Write the test that should fail, at the
  outermost surface that reaches the path. If it fails, the finding is real
  and that test becomes the fix's regression test. If you cannot make it fail,
  reject or downgrade the finding.
- **Mechanism must earn its place.** A recommendation that adds an interface,
  layer, option or abstraction survives only if you can name its second
  consumer or the outcome it changes. Otherwise decline it. The rubric's
  simplicity standard outranks a reviewer's taste.
- **The reviewer that raised a claim does not get to confirm it.** You confirm
  it against ground truth.
- **Fixes raised by more than one reviewer go first.** Independent agreement
  is the strongest signal on the panel.
- **Contradictions are signal too.** When reviewers pull opposite ways (split
  this / merge this), decide by the rubric, log the call, and do not flip it
  next round without new evidence.
- Anything that conflicts with a decision the owner already made is declined
  and logged, not silently dropped.
- **Don't agree just to end the loop, and fight scope creep.** Repeated
  rounds invite one more layer, one more test, one more option. If a round
  grew the code without changing an outcome, cut before the next round.

### 5. Implement, then verify by running

Implement the surviving MUSTs first, then SHOULDs as budget allows.

- Make structural changes with [refactor-clean](../refactor-clean/SKILL.md):
  move ownership, delete the old path in the same pass, and leave no
  compatibility sediment.
- Every edge-case fix lands with the regression test written during triage.
- **Deleting a useless test is a fix.** Before you delete it, confirm the
  behavior it claims to cover is either covered at a higher level or is not
  behavior at all, and log which.
- Changes preserve behavior by default. External contracts (public APIs, wire
  formats, schemas, CLI flags) do not move to chase a score. A finding that
  needs a contract change is logged as separate work for the owner.

Then:
- re-run the gates and get them green,
- run [diff-review](../diff-review/SKILL.md) on the round's diff and fix what
  it finds,
- commit with a message that names the round.

### 6. Log the score

Append one block to the score log (`templates/rounds.md`, kept in the target
repository). Record each reviewer's scores for the scope and the reference,
the gap, the snapshot commit, what you fixed and its regression test, the
tests you deleted, and what you rejected with the evidence. The log is the
product. It is how "−2.0 → −0.3 against the reference over six rounds" becomes
a defensible claim instead of a feeling.

If the work ends in a pull request, put the running table (round, reviewer,
scope, reference, gap) in its description. Edit the description; don't post
it as a comment.

### 7. Re-score next round on a fresh snapshot

Go to 1, with the same reference. Stop when the bar is met, the trend
flattens, or the owner is happy (see below).

## User feedback overrides the council, always

The council optimizes toward a generic reference-quality codebase. The owner
knows things it cannot see: the migration planned next quarter, why an odd
module boundary exists, which conventions are house rules, what the deadline
allows. When owner feedback arrives, it wins. Implement it and log it as an
owner override, even if a reviewer scored the old shape well.

## When to stop (or raise the bar)

- **Set a bar up front** and keep it in your log: for example, every council
  reviewer scores the scope at or above the reference in every category, or
  every reviewer scores every category ≥ 8.5. The bar is met only on a gate
  round: the full council, the lowest score across reviewers and categories.
- **Bank each bar.** When a bar is met, the branch is a mergeable checkpoint:
  open or update its PR. To aim higher, continue on a new branch stacked on
  that one. The series continues, since the ruler hasn't changed; only the bar
  has. Each higher bar costs far more rounds than the last; the owner decides
  whether it is worth it.
- Three consecutive rounds within about ±0.2 of each other, below the bar,
  means you have hit the ceiling of *this* scope. Don't grind for decimals.
  Either declare it done or **open a new scope** with its own fresh score series.
- A stubborn package or a single hot path is worth a **scoped council**: the
  same loop with the scope narrowed to it, and its own short series.
- If each round's top findings sit on a boundary *outside* the scope, the
  scope is wrong. Widen it and start a new series.

## Guardrails (carry these into every round)

- Reviewers are read-only. You change only code in scope, plus the callers and
  tests a change forces.
- No new features, and no external-contract changes to chase a score. Flag
  those as separate work.
- Never weaken a check to make code look simpler. Don't swallow errors, loosen
  validation, or delete tests that catch real behavior.
- Don't add mechanism to satisfy a reviewer. Every added interface, layer or
  knob names its consumer.
- Reviewers never see the bar, earlier scores, or each other's replies.
- The reference bundle stays frozen for the whole series.
- Verify before acting; the finder never confirms its own finding.

## Files

- `templates/brief.md`: the fixed base brief and rubric. Fill in the blanks
  once per codebase.
- `templates/round-delta.md`: the per-round delta brief.
- `templates/rounds.md`: the score log format.
- `scripts/snapshot.mjs`: pins the commit, bundles the scope, runs the gates.
- `scripts/selftest`: end-to-end checks of `snapshot.mjs` against throwaway
  repos.
- `backend-council.config.example.json`: copy to
  `backend-council.config.json` in the target repository.
