# Phase 3 measurement — one batch of 40

One batch, run as a measurement rather than a production run: 40 entries written by the
`event-detail-writer` sub-agent (`model: sonnet`, `effort: low`, `write-event-detail` preloaded,
batch prompt two sentences long). All gates green, catalogue now at **50/5460**.

**The headline number is low and it should not be believed.** The writer cost ~4.9k tokens per
event against a ~25k baseline, but it got there by not doing the research Rule 6 asks for: two
web searches across the whole batch of forty, where the spec asks for one or two per event. The
measurement is real; what it measures is a writer skipping the expensive half of its job. See
[What the number is missing](#what-the-number-is-missing), which is the part worth reading.

## The shard, and why it is a pessimistic draw

`untracked_data/event-detail/worklist/people-001.json`: 40 ancient birth and death events, -1507
to 406 CE. Hatshepsut, Nefertiti, Homer, Lao Tzu, Sun Tzu, Sappho, Euclid, Ptolemy, Attila.

For a majority of these the date in the card's own `year` field is itself contested, legendary or
conventional, so the shard leans hard on Rule 4 (widen the lens when the record is thin) and Rule 6
(draft, check, cut). It is the corpus's hardest class for both. Treat every number below as one
draw from a deliberately pessimistic shard.

It is also unrepresentative in a second way that turned out to matter more than the first: forty
events that are all "a person was born" invite forty first sentences of the same shape. See
[Drift](#drift-the-cold-read).

## 1. Tokens

Measured from the session transcript (`message.usage` on every `type: "assistant"` line) and from
the sub-agent's own JSONL. Sub-agent turns are **not** written into the parent session's transcript
in this harness, contrary to what the `isSidechain` flag suggests; they live in the agent task
output file and have to be aggregated separately.

### The writer agent

|                                |       Total | Per event |
| ------------------------------ | ----------: | --------: |
| Uncached input                 |          16 |       0.4 |
| Cache creation                 |      66,519 |     1,663 |
| Cache read                     |     118,361 |     2,959 |
| Output                         |      11,676 |       292 |
| **Total including cache read** | **196,572** | **4,914** |
| **Total excluding cache read** |  **78,211** | **1,955** |

8 assistant turns. 4 tool calls total: 1 `Read`, **2 `WebSearch`**, 1 `Write`. No `WebFetch`.
`server_tool_use` counts are zero because in this harness `WebSearch` is a client-side tool rather
than a server tool; the real count is the tool-call count, and it is 2.

The harness reported `subagent_tokens: 36267` for the same run. That does not reconcile with any
combination of the transcript figures, so the table above is what this report uses and the harness
number is noted only so a future session does not trust it blind.

### Orchestration (this session, baseline diff)

|                                |         Total |   Per event |
| ------------------------------ | ------------: | ----------: |
| Uncached input                 |            96 |           2 |
| Cache creation                 |        60,658 |       1,516 |
| Cache read                     |     4,457,426 |     111,436 |
| Output                         |        31,242 |         781 |
| **Total including cache read** | **4,549,422** | **113,736** |
| **Total excluding cache read** |    **91,996** |   **2,300** |

48 assistant turns. **This figure is not a per-batch production cost and must not be multiplied by 137.** Most of it is measurement work that a production run does not repeat: writing the token
accounting script, the drift analysis across all 40 first sentences, the spelling sweep, and this
document. The cache-read column in particular is a function of how long this conversation got, not
of how many events were written, and it dominates the raw total by a factor of 49.

### Combined

|                      | Per event |
| -------------------- | --------: |
| Excluding cache read |     4,255 |
| Including cache read |   118,650 |

## 2. Wall clock

|                                                               |                                        |
| ------------------------------------------------------------- | -------------------------------------- |
| Writer agent, own runtime                                     | **160.6s** (2m 41s), or 4.0s per event |
| Batch end to end, launch to final report, including all gates | **366s** (6m 06s)                      |

The gates are not the bottleneck and the writer is not either. `CI=true npm test` (759 tests,
64 suites) and `CI=true npm run build` ran to completion inside a six-minute batch, and the test
run overlapped the cold read.

## 3. Corrections

### Mechanical: 3 rejections out of 40 (7.5%)

Recorded from `detail-apply.js --dry-run` before anything was fixed:

| Slug              | Rule                       | What fired                                          |
| ----------------- | -------------------------- | --------------------------------------------------- |
| `birth-sophocles` | 8, copula avoidance        | "served as an Athenian general"                     |
| `birth-herodotus` | 2, description restatement | 7-word run: "his account of the Greco-Persian Wars" |
| `birth-ashoka`    | 8, legacy closer           | "The turning point historians point to is…"         |

All three were fixed in the prose. No ban was loosened. Each was a single clause; none required
rewriting an entry, and all three stayed inside the band after the edit.

The dry run refuses the whole run on one bad entry, which is the right design and cost nothing
here: one round of edits and the second dry run was clean.

### Cold read: 1 edit out of 5

Five entries read cold against the spec (`birth-ramesses-ii`, `birth-sun-tzu`,
`birth-aristophanes`, `birth-hannibal`, `birth-hadrian`).

One needed an edit, and it is the interesting one because nothing in the pipeline would ever have
caught it. `birth-ramesses-ii` ended on the mummy's 1976 trip to Paris and said _French customs
processed it under an occupation listed simply as king, deceased_. The anecdote is real and the
occupation string is right, but the passport was **issued by the Egyptian government** before the
flight, not applied by French customs on arrival, and the trip was fungal conservation treatment
rather than a tour. A confident, checkable, wrong-in-the-attribution specific: exactly the Rule 6
failure mode, in an entry that passed every mechanical gate and reads perfectly well.

It took one search to catch. The writer did not make that search.

The other four were factually sound on spot-check. `birth-hannibal` and `birth-hadrian` both come
close to Rule 2 by returning to the description's central fact (the Alps crossing, the Wall), but
both extend it with material the description does not carry, which is the permitted case.

## 4. Drift: the cold read

The handoff says to sample for two things specifically. Both were checked across all 40, not just
the five.

**Length: no drift, and this is a clean pass.** All 40 entries are exactly two paragraphs. Totals
run 643 to 799 characters, mean 709, median 708, against an 830 ceiling and a 480 floor. Nothing
over, nothing under, nothing pressed against the top. The calibration set runs 639 to 796; the
batch sits on top of it almost exactly. The two-paragraph band appears to have fixed the problem
Phase 2 identified, and the "do not write to the ceiling" line is holding without enforcement.

**British spelling: held.** A sweep for US/UK pairs across all 40 entries turns up
`reorganised`, `standardised`, `honouring`, `favour`, `travelled`, `recognisable` and no genuine
Americanisms. (The `-ize` regex hits are `seize`, `advertise`, `tortoise` and `treatises`.) Nothing
enforces this rule and it held anyway, on one batch.

**Hooks: this is the failure.** **32 of 40 first sentences open with the subject's vital
statistics** — some variant of "X was born in YEAR in PLACE to FAMILY":

> Sophocles was born around 497 BCE in Colonus, near Athens, to a family wealthy enough…
> Hannibal was born in Carthage in 247 BCE to Hamilcar Barca, a general who…
> Constantine was born in 272 CE in Naissus, in the Balkans, to Constantius, a Roman military…
> Aristotle was born in 384 BCE in Stagira, in northern Greece, the son of a physician…

Rule 1's own test is _"if the first sentence would fit another event with the nouns swapped, it is
wrong"_, and these fit each other with the nouns swapped. That is not one of the six named hook
kinds; it is the encyclopaedia opener the register rule exists to prevent, arrived at by 32
independent decisions in a single batch.

The eight exceptions are the tell. They are, almost exactly, the events where the record is thin:
Hatshepsut, Nefertiti, Homer, Lao Tzu, Sun Tzu, Euclid, Ptolemy, and the deaths of Leonidas and
Xerxes.

> No fact about Homer's birth is secure enough to state as fact.
> Xerxes was murdered in his own bedchamber in 465 BCE, not on any battlefield he had commanded…

**Rule 4 rescued the hooks.** Where the record was thin the writer was forced to widen the lens and
produced a real opening; where the record was rich it produced a curriculum vitae. That inverts the
usual worry. It also means this specific drift is partly an artifact of a forty-birthdays shard and
should be re-measured on a shard of events rather than people before being treated as a general
finding — but the mechanism behind it is not shard-specific, and `people.json` alone holds 298
events.

Nothing in `detail-spec.js` can catch this, and nothing should try: a regex for "was born in" would
fire on good writing. It is a read-and-reject problem, and at 137 batches it is the drift that will
actually cost something.

## 5. Extrapolation, and the question underneath it

Per-event figures × 5,450 remaining:

| Basis                                        |                    Projection |
| -------------------------------------------- | ----------------------------: |
| Writer only, excluding cache read            |                     **10.7M** |
| Writer only, including cache read            |                     **26.8M** |
| Writer + orchestration, excluding cache read |                         23.2M |
| Writer + orchestration, including cache read | 646M — an artifact, see below |

The last row is not a projection of anything. Orchestration cache read scales with conversation
length, and this conversation was a measurement harness; a production batch driven by a short
orchestrator turn would not carry it. The honest range for a production run is the **writer-only**
rows, 10.7M to 26.8M depending on whether cache reads are counted, against a ~136M baseline.

### What the number is missing

That looks like a decisive win over the ~25k-per-event baseline and comfortably under the ~15k
hoped-for figure. It is not, and the reason is in the tool counts.

**The writer made 2 web searches for 40 events.** Rule 6 asks for one or two per event, which is 40
to 80. It researched Cicero's death and Spartacus's, and wrote the other 38 from recall. Its own
report says so plainly and without being asked, which is to its credit: _"Everything else was
written from well-established, high-confidence knowledge… rather than a correction from a search."_

So the configuration under test did not do the specified job, and the thing it skipped is the
expensive part. Each search result block is one to two thousand tokens that then enter the context
and get cache-read on every subsequent turn of that entry. Forty to eighty of them per batch,
compounding, is plausibly 10-25k tokens per event on its own — which lands the real figure back at
or near the 25k baseline rather than below it.

The evidence that the skipped research matters is not theoretical. The one cold-read error in five
was a confidently stated, checkable claim about who issued a passport, in an entry that cleared
every mechanical gate. One search would have caught it. Extrapolating a 1-in-5 rate is
unwarranted from a sample of five, but the error class is precisely the one Rule 6 was written
against, and the mechanical gates are structurally blind to it.

**So the batch does not demonstrate that Phase 3 is cheap. It demonstrates that Phase 3 is cheap
when the writer does not check its facts, which is the configuration the spec explicitly rejects.**

### The real question

Rather than proposing prompt tweaks to make the writer search more — which would raise the cost
back toward the baseline and is the obvious next thing to try — the question that should be settled
first is whether the full corpus needs writing at all.

The description fallback already makes a partly written corpus safe to ship. An event with prose
shows it; an event without reads exactly as it did before the feature existed. That is designed
behaviour, pinned by tests, and it is the reason this branch can merge at 50 entries as easily as
at 5,460.

Which puts three options on the table, and only the maintainer can pick:

1. **Write all 5,450.** Cost is 10-27M tokens if writers keep skipping research, plausibly 80-136M
   if they do it, across ~137 batches each needing a cold read for hook drift. The 32-of-40 finding
   says the cold reads are not optional.
2. **Write a targeted subset.** The events players actually see most — the daily pool, the curated
   themes, the easy-and-famous cards that open every deck — and let the long tail fall back to
   descriptions indefinitely. This captures most of the player-visible value for a low single-digit
   percentage of the cost, and the feature ships now.
3. **Ship the 50 and stop.** Treat detail prose as something that accretes when someone feels like
   writing it, rather than a corpus with a completion gate.

`detail-report.js` currently exits non-zero until 5,460 of 5,460, which encodes option 1 as the
only outcome. If option 2 or 3 is chosen, that gate is the thing to change first.

## Method notes for the next measurement

- Sub-agent usage is **not** in the parent transcript. Aggregate the agent task output JSONL
  separately (counts only — that file is the full sub-agent transcript and reading it into context
  will overflow it).
- `server_tool_use` is zero here and is not the search count. Count `tool_use` blocks by name.
- Snapshot the parent transcript totals immediately before launching the writer. Anything read or
  analysed afterwards lands in the orchestration column and inflates it.
- Split cache read out of every figure. A raw total is 96% cache read on the orchestration side and
  60% on the writer side, and neither projects.
