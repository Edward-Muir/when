# Player avatars

Every player has a **portrait** (an animal) and a **background** (a history theme), after the
portrait and background pickers in the digital edition of Wingspan. The portrait shows wherever
a player is named. The background is a wide painted place shown only as a profile banner (the
menu drawer, the Stats tab, the picker), because it is far too detailed for a 32px row.

As of this writing the art does not exist: every surface draws a placeholder. The prompts and
the Cloudinary pipeline are the next piece of work (see [Still to do](#still-to-do)).

## Where things live

| What                                                       | Where                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| The 60 animals, the 20 themes, the adjective→theme map     | `src/data/avatars.json`                               |
| Identity rules, wire format, the art seam, name generation | `src/utils/avatar.ts`                                 |
| The saved pick (`when-avatar`) and display name            | `src/utils/playerStorage.ts`                          |
| Live name + avatar for the player's own surfaces           | `src/hooks/usePlayerProfile.ts`                       |
| The square tile / the banner                               | `src/components/ui/Portrait.tsx`, `ProfileBanner.tsx` |
| The picker (menu item "Your Avatar", or tap a banner)      | `src/components/AvatarPickerModal.tsx`                |
| Server format check                                        | `lib/leaderboard/avatar.ts`                           |

## Decisions

**The name decides the avatar by default.** The last word of the fun name picks the animal and
the first word picks the theme through `adjectiveThemes`, so "Linguistic Platypus" is a
platypus, and every "Linguistic" player shares a background. Anything outside the lists (a
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

**Placeholders are first-class.** `portraitArtUrl` / `backgroundArtUrl` return null until the art
exists, and they are the only seam. The tile shows the animal's emoji, or its initial where no
emoji reads as that animal; ZWJ emoji (phoenix, raven, moose) are skipped because older
WebViews draw them as two glyphs. Banners use a gradient of the theme's `color`. Colours are
inline styles or the `paper` / `ink` tokens, never `bg-token/NN`, which compiles to nothing
(see CLAUDE.md, Styling).

## The art spec, from the Wingspan reference

- **Portraits.** A square head-and-shoulders bust of the animal in ink linework and soft
  watercolour on textured cream paper, with no scene behind it. Each animal has one fun history
  persona, such as a scholarly platypus with spectacles and a quill, or a knightly aardvark in
  a helm.
- **Backgrounds.** 2:1 landscapes of historic places in the same style, with torn watercolour
  edges, for example the Library of Alexandria, a Viking fjord or a Silk Road market. One per
  theme in `avatars.json` (`place`).

### It must work very small

Portraits mostly show at **20–32px** (leaderboard rows) and at most 96px (the banner). Every
portrait prompt must ask for:

- a large head filling most of the frame, in a tight bust crop;
- one strong, simple silhouette with high contrast against the paper;
- at most one bold costume element and one prop;
- no fine detail, small text or busy pattern;
- a clear colour identity for each animal.

Check every generated portrait downscaled to 20px and 32px before accepting it. Backgrounds need
a calm, low-detail lower-left area, because the portrait tile sits there.

## Still to do

1. **Bucket the adjectives.** Sort all 1,202 package adjectives plus the 35 bot adjectives into
   the 20 themes, filling `adjectiveThemes`, with a coverage test.
2. **Write the prompts.** Give each animal a persona and write `scripts/avatars/prompts.json`
   with a shared style preamble (Sonnet agents), then review them in a gallery.
3. **Deliver through Cloudinary.** Upload the art and wire the two `*ArtUrl` functions through
   the `cloudinaryImage.ts` patterns. Read
   [cloudinary-cost-controls.md](../cloudinary-cost-controls.md) first: no `dpr_auto`, capped
   widths, square rungs for portraits.
