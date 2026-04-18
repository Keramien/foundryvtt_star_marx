---
name: Terminology — race vs peuple
description: Use "race" (not "peuple") in code, UI labels, and docs for Star Marx
type: feedback
---

In the Star Marx project, always use the word **"race"** rather than **"peuple"**, even though the original rulebook uses "Peuple". The memory codex under `memory/star_marx_codex/races/` already standardizes on "race", and the user wants the codebase (item type names, i18n keys, UI labels, variable names, file names) to stay consistent with that.

**Why:** User preference for consistency with the already-extracted codex — avoids synonyms splitting between code and data.
**How to apply:** When implementing features touching Star Marx races, use `race` / `Race` / `RACE` in identifiers, keys, file names, and user-facing strings. Prefer codex files under `memory/star_marx_codex/` to re-extracting from the raw PDFs in `memory/start_marx_books/`.
