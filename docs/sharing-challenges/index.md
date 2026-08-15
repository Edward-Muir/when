# Sharing & Challenges

Shareable seeded games: settings + a seed are packed into a hyphenated word token embedded
in `/challenge/<token>`, so a recipient plays the exact same cards in the same order.
Original work 2026-03-01, format since rewritten.

**`src/utils/challengeCode.ts` is the source of truth for the wire format.** Its header
comment carries the current bit layout. Read it before touching the encoding.

## The format was rewritten — old numbers are wrong

The 2026-03-01 design was **33 bits → 3 words**, using three separate 2048-word lists
(11 bits each), with a 6-bit category mask and an 8-bit seed. None of that is current.

Today it is **72 bits → 6 words** from a single 4096-entry `WORDLIST` (12 bits each), with a
**fixed 32-bit** category mask and a 21-bit seed. If you find a doc, comment or memory
describing 3-word codes or 33 bits, it predates the rewrite.

Two properties of the current layout are load-bearing:

- **The category mask is fixed-width at 32 bits even though only 20 categories exist.** That
  is what let the taxonomy grow from 6 to 20 without invalidating existing links. Do not
  shrink it to fit.
- **Bit 0 is reserved and ignored.** It used to select the removed `freeplay` mode; roughly
  half of all links ever issued set it. Encoding always writes 0, decoding maps either value
  to `suddenDeath`. It cannot be reclaimed: the format is positional, so shifting it would
  misdecode _every_ link ever issued, not just freeplay ones.

## Decisions still in force

- **`WORDLIST` order is immutable.** Reordering or removing a word changes what every
  existing token decodes to. Append only, and only in multiples that keep the length a power
  of two.
- **Player count travels with the challenge**, rather than being forced to single-player, so
  a recipient can play multiplayer if they have people around. (Moot in practice — no UI
  reaches multiplayer; see CLAUDE.md.)
- **Restart re-rolls the seed** rather than replaying the identical game.
- **BigInt via `BigInt()` calls, not `12n` literals.** The 72-bit value exceeds JS's 53-bit
  safe-integer range, but the TS target is below ES2020 so literals won't parse. (The
  original 33-bit version used plain arithmetic; that stopped being safe at 72 bits.)
- **Event-set drift is accepted.** Adding or removing events can make an old token produce a
  different game — same tradeoff the daily makes.

## Superseded UI work

Two 2026-03-01 sessions built the share-code UI inside a `SettingsPopup`: a "Challenge a
Friend" section, then an editable two-way code input that decodes a pasted code back into
the form controls. **`SettingsPopup` no longer exists.** The two-way input survives, moved
into `CustomGameSettings.tsx` on the Custom tab. One implementation note carried over:

- **A `useRef` flag guards the two-way sync.** Applying a decoded code updates the settings,
  which recomputes the code via `useMemo`, which would sync back and overwrite what the user
  typed. `applyingCodeRef` skips the sync for one cycle. Removing it reintroduces the loop.
- Invalid codes show a red border rather than being silently ignored — a deliberate choice,
  since silently keeping the old settings is confusing.
