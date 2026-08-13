# Difficulty Grading Process v3

How to regrade the `difficulty` label across the catalogue with parallel agents.

Read [difficulty-grading-rubric.md](difficulty-grading-rubric.md) first — it defines what is being graded and, just as importantly, what is _not_ (timeline crowding is computed, not graded).

## Why the label matters

`src/utils/difficultyScore.ts` scores every event as `C = 0.6 · recognition(label) + 0.4 · crowding`, sorts the catalogue into four bands by the global quartiles of `C`, and `src/utils/deckBuilder.ts` composes the opening 24 cards of every deck from those bands. A mis-graded label does not just mislabel one card; it moves that card into the wrong band, and a whole mis-graded category distorts the quartiles for everyone.

See [../gameplay-feel/session-2026-08-13-deck-difficulty-ramp.md](../gameplay-feel/session-2026-08-13-deck-difficulty-ramp.md) for how the deck is built.

## Tooling

Everything lives in `scripts/difficulty/grade/`. It has no dependencies beyond the standard library.

| Script               | Role                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `catalogue.py`       | Shared catalogue loading and a line-by-line port of `difficultyScore.ts`. If you change the scoring in TypeScript, change it here too. |
| `extract_batches.py` | Splits the catalogue into per-category batch files under `batches/`, one per agent.                                                    |
| `apply.py`           | Validates graded output and writes it back into `public/events/*.json`.                                                                |
| `band_report.py`     | Prints the bands the game will compute. This is the acceptance gate.                                                                   |

> The pre-v3 `scripts/difficulty/apply_grades.py` was retired. It hardcoded six categories and silently ignored every other graded file, which is how a tranche of events ended up graded by nobody; and it wrote the `difficulty` string through with no enum check.

## Workflow

### 1. Record the baseline

```bash
npm test -- --watchAll=false   # must be fully green before you start
python3 scripts/difficulty/grade/band_report.py --save /tmp/before.json
```

Note the **min band-0 pool** it prints. That is the smallest warm-up pool any themed day draws its opening cards from, and it must not go down.

### 2. Build the batches

```bash
python3 scripts/difficulty/grade/extract_batches.py
```

Batching is **by category, not by file** — the category is what the game filters a themed day on, and it is independent of which JSON file an event lives in. Measured, calibrating per file collapses `trade`'s band-0 pool from 30 to 17; per category it rises to 33.

Categories over 250 events are split round-robin by year rank, so each part carries the same spread of eras and the same target applies to all of them.

Batch files carry only `name`, `friendly_name`, `year`, `category`, `description` and `current_difficulty`. Crowding and `wikipedia_views` are deliberately withheld — see the rubric for why.

### 3. Launch the agents

One agent per batch, in waves of five or six. Each agent gets the rubric, its batch file path, and the target distribution. Each writes:

`scripts/difficulty/grade/output/graded_<batch>.json`

```json
{
  "batch": "trade",
  "category": "trade",
  "graded": [
    {
      "name": "silk-road-opens",
      "difficulty": "easy",
      "recognition": "high",
      "inferability": "high",
      "reasoning": "Universally known; 'Silk Road' anchors to antiquity."
    }
  ]
}
```

Every event in the batch needs an entry. Every entry whose label _differs_ from `current_difficulty` needs a non-empty `reasoning`; unchanged labels do not.

**Target distribution: 20% easy / 35% medium / 35% hard / 10% very-hard**, per category, as a calibration anchor rather than a quota. Agents report what they actually produced and flag any category that could not honestly reach it.

### 4. Apply

```bash
python3 scripts/difficulty/grade/apply.py --dry-run   # validate + report, writes nothing
python3 scripts/difficulty/grade/apply.py
```

Validation fails the whole run rather than warning:

- `difficulty` must be exactly one of `easy` / `medium` / `hard` / `very-hard`
- every graded `name` must exist in the catalogue
- no `name` may be graded twice across batch files
- every event in every batch file must appear in the output
- every changed label must carry a non-empty `reasoning`
- re-serialising each event file must be byte-identical before the change, so the diff can only contain `difficulty` lines

### 5. Verify

```bash
python3 scripts/difficulty/grade/band_report.py --compare /tmp/before.json
npm test -- --watchAll=false
npm run typecheck && npm run lint
git diff --stat public/events/
```

**Run tests with `npm test`, never `npx react-scripts test`** — the npm script sets `TZ=America/Los_Angeles`, and without it five date tests fail spuriously and look like real breakage.

Acceptance gates, all enforced by `band_report.py`:

| Gate                       | Why                                                                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| min band-0 pool ≥ 27       | The warm-up pool for the thinnest themed day. `deckBuilder.test.ts` leans on it via the thin-pool cap.                                                                                                    |
| every band ≥ 150 cards     | `deckBuilder.test.ts` asserts `floor(bandSize / SPREAD) > RAMP_WINDOW`.                                                                                                                                   |
| every band share in 15–35% | `difficultyScore.test.ts` asserts it. Structurally safe — bands are index quartiles and the `log1p` density term breaks ties — so a failure here means the data is wrong, not the bound. Do not widen it. |

`deckBuilder.test.ts`'s ramp and foothold assertions are the real signal for whether the regrade improved the game rather than just moving labels around. If those degrade, the grading is wrong.

### 6. Reconcile

If a category's band-0 pool is under the floor, re-run that category alone and ask whether genuinely recognisable cards were over-graded. The categories at risk are the intrinsically modern and dense ones, where crowding saturates and the label does all the work: `trade`, `art`, `medicine`, `warfare`, `science`.

Never invent easy labels to clear the gate. If a category honestly cannot reach the floor, record that in the PR body.

## Re-running a single category

```bash
mv scripts/difficulty/grade/output/graded_trade.json /tmp/graded_trade_v1.json
# launch one agent for batches/trade.json
python3 scripts/difficulty/grade/apply.py --dry-run
```

`apply.py` globs `output/graded_*.json`, so moving a file out of that directory de-registers it.

## Shipping

A regrade is a `fix:` — it changes what players feel in the ramp. That title auto-triggers the Release Action on merge to `main` and deploys to production immediately, so merge deliberately.
