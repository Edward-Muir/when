# Player avatars

Every player has a **portrait**: an animal on a small square tile, faintly tinted by a
**theme** (one of 20 named colours). It is a deliberately quiet touch. It shows on leaderboard
rows, beside the name box when a daily score is submitted, and as the icon of the menu's "Your
Avatar" row, which opens the picker. There are no profile banners and no presence on the Stats
tab: an earlier pass had both and read as far too prominent.

As of this writing the art does not exist: every surface draws a placeholder. The prompts and
the Cloudinary pipeline are the next piece of work (see [Still to do](#still-to-do)).

## Where things live

| What                                                       | Where                                  |
| ---------------------------------------------------------- | -------------------------------------- |
| The 60 animals, the 20 themes, the adjective→theme map     | `src/data/avatars.json`                |
| Identity rules, wire format, the art seam, name generation | `src/utils/avatar.ts`                  |
| The saved pick (`when-avatar`) and display name            | `src/utils/playerStorage.ts`           |
| Live name + avatar for the player's own surfaces           | `src/hooks/usePlayerProfile.ts`        |
| The tinted square tile                                     | `src/components/ui/Portrait.tsx`       |
| The picker (menu item "Your Avatar")                       | `src/components/AvatarPickerModal.tsx` |
| Server format check                                        | `lib/leaderboard/avatar.ts`            |

## Decisions

**The name decides the avatar by default.** The last word of the fun name picks the animal and
the first word picks the theme through `adjectiveThemes`, so "Linguistic Platypus" is a
platypus, and every "Linguistic" player shares a tint. Anything outside the lists (a
free-typed name, "Anonymous", an animal from before the list was cut) falls back to a hash of
that word. The fallback is deterministic on purpose: the board polls every 15 seconds and must
never reshuffle anyone.

**60 animals, not the package's 355.** One portrait per animal is the expensive part of the
art. `generateRandomName()` still uses all of `unique-names-generator`'s adjectives but draws
the animal from our 60, so every new name has a portrait. The list was chosen to contain:

- **Platypus and Goldfish**, the two animals real players had when the list was cut;
- **all 29 bot animals** (`lib/leaderboard/botGeneration.ts`), so bots, which never send an
  avatar, always match their portrait. `avatar.test.ts` enforces both.

Don't drop an animal from the list: saved names and stored picks that use it fall back to a
hashed stranger.

**Generated names always fit the 20-character cap.** A longer pair used to be cut mid-word on
the board ("Straightforward Cock…"), which here would also lose the animal. Pairs that do not
fit are never drawn, and the name-filter corpus test covers exactly the drawable set.

**A pick travels with the score; everything else resolves from the name.** The client always
sends `avatar` (`"platypus.scholar"`) with a daily score: the pick, or what the name implied.
The server stores it in the sorted-set member and returns it. It checks the **format only**
(`/^[a-z0-9-]{1,24}\.[a-z0-9-]{1,24}$/`) and drops rather than rejects anything else. A
server-side copy of the lists would drift as art is added and start discarding honest picks
(the failure `submit.ts` documents for themes). The client's `parseAvatar` ignores ids it does
not know and falls back to the name, so a forged value can only be ignored.

A pick made after submitting reaches other players with the next day's score. The player's own
row always shows their current pick (`OwnRowCells` in `LeaderboardRow.tsx`).

**The name is created on first use and saved.** `getOrCreateDisplayName()` replaces the old
per-session re-roll, because the name now shows outside the submit form. It also holds the
generated name in memory for the session: where storage is blocked, a name re-rolled on every
read would make `usePlayerProfile`'s snapshot change forever.

**Placeholders are first-class.** `portraitArtUrl` returns null until the art exists, and it is
the only seam. The tile shows the animal's emoji, or its initial where no
emoji reads as that animal; ZWJ emoji (phoenix, raven, moose) are skipped because older
WebViews draw them as two glyphs.

**The theme is a tint, not a picture.** Each theme's `color` is mixed at 22% into the paper
behind the portrait (`tintStyle` in `Portrait.tsx`, shared with the picker's swatches), so
players read apart at a glance without the tile shouting. The mix is an inline `color-mix`,
never `bg-token/NN`, which compiles to nothing (see CLAUDE.md, Styling). There is no background
art: a painted landscape per theme was planned, but with no banner to show it on, it would only
ever appear in the picker.

## The art spec, from the Wingspan reference

**Portraits only.** A square head-and-shoulders bust of the animal in ink linework and soft
watercolour, after the portrait cards in the digital edition of Wingspan. Each animal has one
fun history persona, such as a scholarly platypus with spectacles and a quill, or a knightly
aardvark in a helm.

**Transparent background.** The tint has to show behind the animal, so each portrait is a
cut-out with no paper or scene of its own. Generate on a flat plain background and remove it
(Cloudinary's background removal or rembg; decide when the art is made).

### It must work very small

Portraits mostly show at **20–32px** (leaderboard rows, the menu icon) and at most 72px (the
picker). Every portrait prompt must ask for:

- a large head filling most of the frame, in a tight bust crop;
- one strong, simple silhouette that holds up against a pale tint;
- at most one bold costume element and one prop;
- no fine detail, small text or busy pattern;
- a clear colour identity for each animal.

Check every generated portrait downscaled to 20px and 32px, on a tinted tile, before
accepting it.

## Still to do

1. **Bucket the adjectives** (optional now that a theme is only a tint). Sort all 1,202 package
   adjectives plus the 35 bot adjectives into the 20 themes, filling `adjectiveThemes`, with a
   coverage test. Until then the tint is a stable hash of the first word.
2. **Write the prompts.** Give each of the 60 animals a persona and write
   `scripts/avatars/prompts.json` with a shared style preamble (Sonnet agents), then review
   them in a gallery. Portraits only; no background prompts.
3. **Deliver through Cloudinary.** Upload the art and wire `portraitArtUrl` through the
   `cloudinaryImage.ts` patterns, keeping transparency (`f_auto` picks WebP or AVIF, both of
   which have alpha). Read
   [cloudinary-cost-controls.md](../cloudinary-cost-controls.md) first: no `dpr_auto`, capped
   widths, square rungs for portraits.
