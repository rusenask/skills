# skills

Reusable agent skills, adopted across projects.

| Skill | What it does |
|-------|--------------|
| [`ui-council`](./ui-council) | Improve a web UI's design in tracked, verifiable rounds by hill climbing against a panel of independent LLM reviewers, scored side by side with the products it competes with. |
| [`backend-council`](./backend-council) | The same loop for backend code: score a pinned scope beside a frozen reference on long-term design, structure, interfaces, simplicity, readability, edge cases, test value and operability, verify every claim, fix, re-score. |
| [`ratchet-files`](./ratchet-files) | Keep every source file small enough for an agent to read whole: find and split oversized files, and install a pre-commit + CI ratchet that stops them growing. Adapted from [dzhng/skills](https://github.com/dzhng/skills) (MIT). |
| [`closeout-review`](./closeout-review) | Closeout pass on a finished change: runs refactor-clean, then diff-review, then write-docs, looping until a full pass adds nothing. |
| [`refactor-clean`](./refactor-clean) | Refactor to the shape the code would have if designed today — one owner per concept, no compatibility sediment. |
| [`diff-review`](./diff-review) | Audit a diff against hygiene and design rules (names, stale references, guards, comments, tests, boundaries). Not a bug hunt. |
| [`write-docs`](./write-docs) | Write docs as a glossary of principles and pointers, not a copy of the code. |

Each skill is a self-contained directory with a `SKILL.md` (the entry point an
agent loads), plus any templates and scripts it needs.

## Install

- **Claude Code** discovers one skill per `~/.claude/skills/<name>/`, so run
  [`scripts/install`](scripts/install) after cloning and after every pull. It
  links each skill and removes links to skills that are gone.
- **opencode** reads a directory of skills: add this repository's root to
  `skills.paths` in its config once.

## Adding a skill

Run `node scripts/check-skills.mjs` before opening a PR. It checks that each
skill's `name` matches its directory, that the name does not shadow a Claude
Code bundled skill or alias, and that every relative link resolves. Skills
adapted from elsewhere keep the source's license beside them and a Provenance
section saying what changed.
