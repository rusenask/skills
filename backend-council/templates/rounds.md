# Backend council — score log

One block per round. Keep it append-only: the value is the trail, including
the rejected claims and the deleted tests. Averages are of the **Overall** row
across reviewers (or of all categories; pick one and stay consistent).

Running average by round:

| Round | Commit | Scope | Reviewer A | Reviewer B | Reviewer C | Avg | Note |
|-------|--------|-------|-----------|-----------|-----------|-----|------|
| r0    | abc1234 | billing | 5.x | 6.x | 5.x | 5.6 | baseline |
| r1    | def5678 | billing | 6.x | 7.x | 6.x | 6.5 | error paths, store seam |
| ...   |        |       |     |     |     |     |      |

---

## Round <N> — <date> — scope: <scope> — commit `<sha>`

**Snapshot:** `/tmp/bc-rN` (gates green)
**Reviewers:** <model A>, <model B>, <model C>, with ids `bcouncil-rN-*`

### Scores
| Category | A | B | C |
|----------|---|---|---|
| Long-term design | | | |
| Structure | | | |
| Interfaces & abstractions | | | |
| Simplicity | | | |
| Readability | | | |
| Edge cases & failure handling | | | |
| Tests | | | |
| Operability | | | |
| Overall | | | |

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
