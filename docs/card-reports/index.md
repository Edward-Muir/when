# Card Reports

Players flag bad card data (wrong year/image/description) from the card detail popup;
reports land in Upstash Redis and are read at the hidden `/card-reports` page.

Shipped 2026-08-02. Endpoints, Redis keys, env vars and the `?key=` flow are documented in
[../architecture-reference.md](../architecture-reference.md) — not repeated here. This file
is the reasoning behind the design and the traps.

## Why it works the way it does

- **In-app, not `mailto:`.** It started as a mail link and was converted mid-session: a
  mail-app handoff bounces the player out of the game on mobile and most reports never get
  finished.
- **Minimal payload.** Only event id + reason id + timestamp + app version. The admin page
  joins the id back to the full card client-side via `loadAllEvents()`, so a report can't be
  forged to carry arbitrary display text.
- **Dedup is the real anti-spam control; the rate limit only stops floods.** 20/hour per IP
  is deliberately generous — carrier CGNAT and office wifi put many genuine players behind
  one address, and blocking them would be invisible to us.
- **Auth is checked before any Redis call.** Upstash bills per command, and an open GET runs
  a `ZRANGE` + `LRANGE` for anyone who loops it. That cost is the whole reason for the gate.

## Correctness details that are easy to undo

- **The dedup key is claimed with `SET … NX`, atomically.** A get-then-set lets a double-tap
  through. The claim is released with `DEL` if the write pipeline throws, so a transient
  Redis error can't lock a device out for 30 days with nothing recorded.
- **From `x-forwarded-for`, take the _last_ hop.** A client can prepend entries, so the
  first is attacker-controlled and would make the limit trivially bypassable.
  `x-vercel-forwarded-for` is preferred (edge-written, not settable by the caller). With no
  proxy headers at all it falls back to the device id — not one shared bucket, which would
  429 every user at once if the headers went missing.
- **Timing-safe comparison runs over SHA-256 digests, not raw keys.** Digesting first
  matters: `timingSafeEqual` throws on mismatched buffer lengths, so a wrong-length guess
  would 500 instead of 401.
- **A duplicate returns 409 and the client treats it as success.** The report already
  exists, so surfacing an error would be wrong.

## Gotchas

- **The description popup dismisses on any click reaching the backdrop.** `GamePopup.tsx`
  only calls `stopPropagation` for the `gameOver` variant, so every control in the report
  row needs it or the card vanishes mid-report. The wrapper `<div>` carries it.
- **Event ids are not all ASCII.** Three carry accents (`chimú-kingdom`,
  `mining-mercury-potosí`, `chimú-chan-chan-peak`). The first validation regex was
  `/^[a-z0-9-]+$/`, which would have silently made those cards unreportable. It is now
  Unicode-aware (`\p{L}\p{N}`), pinned by a test.
- **CRA's Jest sets `resetMocks: true`** — a `jest.mock()` factory's `mockResolvedValue` is
  wiped before each test; re-apply implementations in `beforeEach`.
- **`src/` tests can import from `api/`** across the tsconfig boundary. That is how the
  reason-id allowlist and the auth decision table are unit-tested.
- **Capacitor iOS needs no release for API changes.** `capacitor.config.ts` points
  `server.url` at the live site, so relative `/api/*` resolves the same as on web.

## Open reports we could not close

A 2026-08-22 pass read the live reports and fixed every `bad-description`, `wrong-year` and
`other` one. **Six `wrong-image` reports remain open and are blocked on Cloudinary
credentials** — replacing a card's art means uploading a new asset, and no `CLOUDINARY_*`
values are available to a sandboxed session. Triage, from fetching each image at the
delivery rung the game actually uses:

| card                                           | verdict                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `qhapaq-nan-expansion` (Inca roads)            | **wrong** — a Florence Nightingale hospital ward. Reported twice.      |
| `jackie-robinson-mlb-debut`                    | **wrong** — a honey-hunter on ropes at a cliff hive.                   |
| `medieval-jousting-tournaments`                | **wrong** — a 20th-century American courtroom with press cameras.      |
| `sulfuric-acid-production` (German alchemists) | **wrong** — an Islamic courtyard majlis with musicians.                |
| `telescope-invention`                          | fine — a period Dutch spyglass scene. No action.                       |
| `birth-napoleon`                               | borderline — on-topic, but an adult's bicorne hangs in the birth room. |

Each wrong image depicts a subject belonging to some _other_ card, and the asset is stored
under the correct `public_id`, so the mis-assignment happened when the art was generated,
not when the URL was built. Two of the four (`jackie-robinson-mlb-debut`,
`medieval-jousting-tournaments`) already have correct prompts queued in `all_prompts.csv`
and sit in its 654-row not-yet-generated backlog, so regenerating that backlog fixes them;
the other two are not in that file at all and need prompts written.

## Known gaps

- **The endpoints have never been run against real Redis.** No Upstash credentials were
  available; logic is covered by unit tests and Playwright against stubbed responses. The
  Redis wiring needs one manual pass.
- No notification — reports sit until someone visits `/card-reports`.
- No free-text field. Deliberate for v1: it would bring back sanitization, length caps and
  moderation. Cost is that "Other" reports say a card is wrong but not why.
- Two feedback addresses coexist app-wide (`feedback@play-when.com` in Menu,
  `playwhenfeedback@gmail.com` in Support/Privacy/Terms). Unrelated, but worth unifying.
