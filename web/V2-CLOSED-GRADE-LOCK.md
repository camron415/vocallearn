# V2 closed SAY grading — locked

**Status:** Active. `HomeBubbles.tsx` → `closedHit` / `gradeAgainst`.

Closed recall = **word-for-word**, not open paraphrase. Normalize formatting; do not accept prefixes or single letters.

## Normalize (all kinds)

- Case-insensitive
- Strip punctuation (`.` `,` `'` etc.)
- Commas in numbers optional (`4130` = `4,130`)
- Leading `the` / `a` / `an` ignored
- Trailing unit aliases ignored when answer is numeric: `m`, `meters`, `miles`, `km`, `ft`, etc.
- r1 letter-cue prefix ignored when assembling variants

## Per kind

| Kind | Pass | Fail |
| --- | --- | --- |
| **when** | Full year/digit string (≥2 digits) | `1` for `1969`, partial year |
| **where** | Exact place after Mount/Lake/the strip (≥3 chars) | `N` for `Nile`, `Par` for `Paris` |
| **who** | Full name exact, **or** last name only (≥3 chars, not first name) | `N` for `Nile`, `Neil` for `Neil Armstrong` |
| **meaning (numeric)** | Full digit core matches; units optional | `377` for `3776`, `3` for `3776` |
| **meaning (text)** | Exact after normalize; or 1-edit if both ≥8 chars | substring, single letter |

## Examples

| Answer | Pass | Fail |
| --- | --- | --- |
| Mount Fuji | `Fuji`, `Mount Fuji` | `F`, `Fu` |
| Neil Armstrong | `Armstrong`, `Neil Armstrong` | `N`, `Neil` |
| 3,776 meters | `3776`, `3,776 m` | `377`, `3` |
| The Nile | `Nile`, `The Nile` | `N` |
| 1969 | `1969` | `19`, `1` |

## Not in scope

- Open / gist facts (post-V2)
- Model grading on SAY (local only for V2)
- SEE multiple-choice (separate `choiceLabel` from answer)
