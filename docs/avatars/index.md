# Player avatars

Every player has a **portrait**: an animal on a small square tile, faintly tinted by a
**theme** (one of 20 named colours). It is a deliberately quiet touch. It shows on leaderboard
rows, beside the name box when a daily score is submitted, and as the icon of the menu's "Your
Avatar" row, which opens the picker. Tapping a row on the daily leaderboard shows that player's
portrait up close. There are no profile banners and no presence on the Stats
tab: an earlier pass had both and read as far too prominent.

As of this writing the art does not exist: every surface draws a placeholder. The prompts and
the Cloudinary pipeline are the next piece of work (see [Still to do](#still-to-do)).

## Where things live

| What                                                       | Where                                    |
| ---------------------------------------------------------- | ---------------------------------------- |
| The 60 animals, the 20 themes, the adjective→theme map     | `src/data/avatars.json`                  |
| Identity rules, wire format, the art seam, name generation | `src/utils/avatar.ts`                    |
| The saved pick (`when-avatar`) and display name            | `src/utils/playerStorage.ts`             |
| Live name + avatar for the player's own surfaces           | `src/hooks/usePlayerProfile.ts`          |
| The tinted square tile                                     | `src/components/ui/Portrait.tsx`         |
| The picker (menu item "Your Avatar")                       | `src/components/AvatarPickerModal.tsx`   |
| A player's portrait up close (tap a leaderboard row)       | `src/components/PortraitViewerModal.tsx` |
| Server format check                                        | `lib/leaderboard/avatar.ts`              |

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

**The podium is a frame, not a medal.** Leaderboard rows show a plain rank number beside the
portrait, and the top three portraits get a gold, silver or bronze frame (`getMedalColor` in
`leaderboardUtils.ts`) in place of the old medal emoji column. The game-over preview does the
same.

**Preview art is temporary.** Two finished portraits (platypus, goldfish) live in
`public/avatars/preview/` and `portraitArtUrl` serves them for every animal, the other 58
borrowing one by hash, so the look can be judged in the app. Remove `PREVIEW_ART` and the
folder when the Cloudinary set lands.

**The picker fits the visible screen.** It is capped at 80% of `--vh` (`1dvh` where
supported), not `vh`, which on iOS browsers is the viewport with the toolbars hidden: a 90vh card
ran off both ends with the toolbars showing. The preview and the Done footer are pinned and only
the grids scroll, so the way out is always on screen.

**The board's own row is two buttons.** Every leaderboard row is a button that opens the
portrait up close, but the player's sticky row already jumps back to their place, and buttons
cannot nest. Its rank and portrait open the portrait; its name and score jump. The viewer is a
sibling of the board's `Modal`, not a child, and locks the board while open so ESC closes only
the viewer.

**The theme is a tint, not a picture.** Each theme's `color` is mixed at 22% into the paper
behind the portrait (`tintStyle` in `Portrait.tsx`, shared with the picker's swatches), so
players read apart at a glance without the tile shouting. The mix is an inline `color-mix`,
never `bg-token/NN`, which compiles to nothing (see CLAUDE.md, Styling). There is no background
art: a painted landscape per theme was planned, but with no banner to show it on, it would only
ever appear in the picker.

## The art spec: the game's own oil-painting style

**Portraits only, painted like the event cards.** The idea of a portrait per animal came from
the digital edition of Wingspan, but the look is the game's own: the dramatic chiaroscuro oil
painting of every event card (the skeleton in
[events-images/](../events-images/index.md#the-prompt-csv-contract)), not Wingspan's ink and
watercolour. Each portrait is a square head-and-shoulders bust of the animal in an Old Master
portrait manner, with one fun history persona, such as a scholarly platypus with spectacles and
a quill, or a knightly aardvark in a helm. The card rules carry over: no text or lettering
(no books with writing, no maps), no colour adjectives, one prop.

The template, with only the second half changing per animal:

```
A dramatic chiaroscuro oil painting in the manner of an Old Master {role}'s portrait.
1:1 square composition optimized for very small screen viewing (it must read at 24 pixels).
A tight head-and-shoulders bust of a {animal} as {persona}, its {defining feature} filling
most of the frame, turned three-quarters toward the viewer with {expression}. It wears
{costume}. One prop only: {prop}. Strong simple silhouette, high contrast, warm {light}
from one side, rich painterly brushwork but no fine detail. Isolated on a flat plain
uniform background with nothing behind the figure. No text, no letters, no numbers, no
labels, no borders, no frame, no watermarks.
```

Worked example, the platypus: a learned linguist, its broad flat bill and head filling the
frame, small round brass spectacles perched on the bill, a dark scholar's robe with a white
ruff collar, a quill pen held up beside its face, candlelight.

**Transparent background.** The tint has to show behind the animal, so each portrait is a
cut-out with no paper or scene of its own. Generate on a flat plain background and remove it
(Cloudinary's background removal or rembg; decide when the art is made).

### It must work very small

Portraits mostly show at **20–44px** (the game-over preview at 20px; leaderboard rows, the
menu icon and the picker grid at 44px), the picker's preview at 72px, and up to **192px** in the
tap-to-view popup. Cloudinary's large rung has to cover that 192px. Every portrait prompt must ask for:

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
