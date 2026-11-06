# UI council — score log

One block per round. Keep it append-only: the value is the trail, including the
rejected claims. Use the **Overall** row (or the mean of all categories; pick
one and stay consistent).

**Gap** = target minus the best reference, for the same reviewer in the same
round. Reviewer drift moves the target and the references together, so the gap
is the number to trend. Raw target scores alone overstate progress.

**Bar:** <e.g. "every council reviewer: gap ≥ 0 in every category" or "every
reviewer, every category ≥ 9"> — kept here, never in a brief.

Running table by round (one row per reviewer that scored):

| Round | Kind | Scope | Reviewer | Target | Best ref | Gap | Note |
|-------|------|-------|----------|--------|----------|-----|------|
| r0    | gate  | desktop | A | 6.2 | 8.3 | −2.1 | baseline |
| r0    | gate  | desktop | B | 6.0 | 7.9 | −1.9 | baseline |
| r0    | gate  | desktop | C | 6.5 | 8.1 | −1.6 | baseline |
| r1    | pacer | desktop | A | 6.9 | 8.4 | −1.5 | type scale, radii |
| ...   |       |       |          |        |          |     |      |

---

## Round <N> — <date> — scope: <scope> — <pacer | gate>

**Captures:** `/tmp/ui-rN` (desktop + phone)
**References:** `references/<product>/`, `references/<product>/` (frozen)
**Reviewers:** <model A>, <model B>, <model C> — request ids `council-rN-*`

### Scores
Per reviewer: target / best reference. Write `no score` where a reviewer gave
none; never fill one in.

| Category | A | B | C |
|----------|---|---|---|
| Typography | / | / | / |
| Hierarchy | / | / | / |
| Spacing | / | / | / |
| Color | / | / | / |
| Iconography & components | / | / | / |
| Consistency | / | / | / |
| Clarity of flow | / | / | / |
| Overall | / | / | / |

**Bar met:** <yes / no — the lowest gap or score, and where>

### Fixed this round
- [MUST] <fix> — <file> — raised by <who>
- [SHOULD] <fix> — <file>

### Rejected (with reason)
- <claim> — <why it didn't hold up: pixel/code evidence>

### Owner overrides applied
- <feedback> — <what changed>

### Biggest risk called out
- <the one thing>
