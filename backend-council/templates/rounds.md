# Backend council — score log

One block per round. Keep it append-only: the value is the trail, including
the rejected claims and the deleted tests. Use the **Overall** row (or the mean
of all categories; pick one and stay consistent).

**Gap** = scope minus reference, for the same reviewer in the same round.
Reviewer drift moves both together, so the gap is the number to trend. Without
a reference, trend raw scores and remember they include drift.

**Reference:** `<path>` at `<sha>` (frozen for this series)
**Bar:** <e.g. "every council reviewer: gap ≥ 0 in every category" or "every
reviewer, every category ≥ 8.5"> — kept here, never in a brief.

Running table by round (one row per reviewer that scored):

| Round | Kind | Commit | Reviewer | Scope | Reference | Gap | Note |
|-------|------|--------|----------|-------|-----------|-----|------|
| r0    | gate  | abc1234 | A | 5.6 | 8.0 | −2.4 | baseline |
| r0    | gate  | abc1234 | B | 6.1 | 8.2 | −2.1 | baseline |
| r0    | gate  | abc1234 | C | 5.4 | 7.8 | −2.4 | baseline |
| r1    | pacer | def5678 | A | 6.5 | 8.1 | −1.6 | error paths, store seam |
| ...   |       |        |          |       |           |     |      |

---

## Round <N> — <date> — scope: <scope> — commit `<sha>` — <pacer | gate>

**Snapshot:** `/tmp/bc-rN` (gates green)
**Reviewers:** <model A>, <model B>, <model C>, with ids `bcouncil-rN-*`

### Scores
Per reviewer: scope / reference. Write `no score` where a reviewer gave none;
never fill one in.

| Category | A | B | C |
|----------|---|---|---|
| Long-term design | / | / | / |
| Structure | / | / | / |
| Interfaces & abstractions | / | / | / |
| Simplicity | / | / | / |
| Readability | / | / | / |
| Edge cases & failure handling | / | / | / |
| Tests | / | / | / |
| Operability | / | / | / |
| Overall | / | / | / |

**Bar met:** <yes / no — the lowest gap or score, and where>

### Fixed this round
- [MUST] <fix> — `<file>` — raised by <who> — regression test: `<test>`
- [SHOULD] <fix> — `<file>`

### Tests deleted
- `<test>` — <why it was useless> — behavior now covered by `<test>` (or: not
  behavior)

### Rejected (with evidence)
- <claim> — <why it didn't hold: the line, the caller, the test that would not
  fail>

### Deferred: contract change or out of scope
- <finding> — <the contract it touches> — <owner decision>

### Owner overrides applied
- <feedback> — <what changed>

### Biggest risk called out
- <the one thing>
