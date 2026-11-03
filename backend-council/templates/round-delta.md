# Round <N> — delta brief

Read this together with the base brief (`brief.md`). The anchor, rubric and
scope are unchanged; only the following is new this round.

## Snapshot
- Commit: `<sha>` (from `manifest.md`)
- Bundle: `<out>/bundle.md`, <files> files, ≈<tokens> tokens
- Gates: green (<the gates that ran>)

## What changed since round <N-1>
<A bullet list of what shipped since the last snapshot: the fixes you made.
This tells reviewers what to re-check and stops them re-reporting fixed issues.
List deleted tests too, so a reviewer doesn't read their absence as a gap.>

## Scope to score this round
<The scope name from the config. If this is a new scope, say so; its scores
start a fresh series and are not comparable to the previous round's.>

## Decisions: do not re-litigate
<Decisions the owner has made that reviewers keep flagging, e.g. "the store
stays on raw SQL, no ORM"; "the v1 webhook payload is frozen for external
consumers". Reviewers should score around these, not against them.>

## Rejected last round: re-raise only with new evidence
<One line per claim rejected last round, with the evidence, e.g. "`retry.go:40`
does not retry non-idempotent calls; only `GET` reaches it (`client.go:112`)".>
