# Player avatars

Every player has a **portrait**: an animal painted on a small square tile. An avatar is just the
animal's id (`"platypus"`). It is a deliberately quiet touch. It shows on leaderboard
rows, beside the name box when a daily score is submitted, and as the icon of the menu's "Your
Avatar" row. Both the menu row and the portrait beside the name box open the picker. There are no profile banners and no presence on the Stats
tab: an earlier pass had both and read as far too prominent.

All 62 portraits exist and are served from Cloudinary (see [Delivery](#delivery)).

## Where things live

| What                                                       | Where                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| The 62 animals                                             | `src/data/avatars.json`                                                        |
| Identity rules, wire format, the art seam, name generation | `src/utils/avatar.ts`                                                          |
| The saved pick (`when-avatar`) and display name            | `src/utils/playerStorage.ts`                                                   |
| Live name + avatar for the player's own surfaces           | `src/hooks/usePlayerProfile.ts`                                                |
| The square tile, and the player's own live one             | `src/components/ui/Portrait.tsx`, `OwnPortrait.tsx`                            |
| The picker (menu "Your Avatar", or the submit portrait)    | `src/components/AvatarPickerModal.tsx`                                         |
| Server format check                                        | `lib/leaderboard/avatar.ts`                                                    |
| Each animal's persona (hand-reviewed, from Sonnet agents)  | `scripts/avatars/personas.json`                                                |
| The prompts CSV, and the script that builds it             | `docs/avatars/art/avatar_prompts.csv`, `scripts/avatars/avatar-art-prompts.py` |

## Decisions

**The name decides the avatar by default.** The last word of the fun name picks the animal, so
"Linguistic Platypus" is a platypus. Anything outside the list (a free-typed name,
"Anonymous", an animal from before the list was cut) falls back to a hash of that word. The fallback is deterministic on purpose: the board polls every 15 seconds and must
never reshuffle anyone.

**62 animals, not the package's 355.** One portrait per animal is the expensive part of the
art. `generateRandomName()` still uses all of `unique-names-generator`'s adjectives but draws
the animal from our 62, so every new name has a portrait. The list was chosen to contain:

- **Platypus and Goldfish**, the two animals real players had when the list was cut;
- **all 29 bot animals** (`lib/leaderboard/botGeneration.ts`), so bots, which never send an
  avatar, always match their portrait. `avatar.test.ts` enforces both;
- **a cat**, added after the first 60 on request. Its portrait is specifically a Burmilla: the
  persona's optional `animal` field ("Burmilla cat") names the breed in the prompt while the
  player-facing label stays "Cat";
- **a dog**, added with the cat. Its portrait (a hussar) was made by hand outside the CSV, so
  like platypus and goldfish it has no persona and the prompt builder skips it.

Don't drop an animal from the list: saved names and stored picks that use it fall back to a
hashed stranger.

**Generated names always fit the 20-character cap.** A longer pair used to be cut mid-word on
the board ("Straightforward Cock…"), which here would also lose the animal. Pairs that do not
fit are never drawn, and the name-filter corpus test covers exactly the drawable set.

**A pick travels with the score; everything else resolves from the name.** The client always
sends `avatar` (`"platypus"`) with a daily score: exactly what the submit form showed, the pick
or what the typed name implied. The server stores it in the sorted-set member and returns it.
It checks the **format only** (`/^[a-z0-9-]{1,24}$/`) and drops rather than rejects anything
else. A server-side copy of the list would drift as art is added and start discarding honest picks
(the failure `submit.ts` documents for daily themes). The client's `parseAvatar` ignores ids it does
not know and falls back to the name, so a forged value can only be ignored.

A pick made after submitting reaches other players with the next day's score. The player's own
row, the menu icon and the game-over preview always show their current pick (`OwnPortrait`).

**The name is created on first use and saved.** `getOrCreateDisplayName()` replaces the old
per-session re-roll, because the name now shows outside the submit form. It also holds the
generated name in memory for the session: where storage is blocked, a name re-rolled on every
read would make `usePlayerProfile`'s snapshot change forever.

**A fallback for failed art.** `portraitArtUrl` is the only URL seam. If the art fails to load
(offline, say), the tile shows the animal's emoji, or its initial where no emoji reads as that
animal; ZWJ emoji (phoenix, raven, moose) are skipped because older WebViews draw them as two
glyphs.

**The podium is a frame, not a medal.** Leaderboard rows show a plain rank number beside the
portrait, and the top three portraits get a gold, silver or bronze frame (`getMedalColor` in
`leaderboardUtils.ts`) in place of the old medal emoji column. The game-over preview does the
same. On the full board the podium also steps down gently in size so first place leads the
eye: 60px, 52px and 48px portraits in slightly taller rows, then 44px for everyone else
(`podiumStyle`, shared with the loading skeleton so the card does not jump when data lands).
Every row keeps its number: dropping it on the podium was tried and read worse. Number, frame
and size all follow the row's _place_, not the server's rank: tied scores share the place of the
first row with that score (`podiumPlaces`, competition ranking), so 11, 9, 7, 7, 7, 5 reads 1, 2,
3, 3, 3, 6 and is gold, silver and three bronzes. The game-over preview and the home "Longest
Timelines" teaser number rows the same way. The share text and saved stats keep the server's
rank: it only knows positions, not who is tied.

**Every board portrait is painted at first place's scale.** A smaller tile does not shrink the
painting; it crops it (`Portrait`'s `paintedAt`, `PAINTED_AT` in `leaderboardLayout.ts`). First place shows the whole bust at
60px, and each smaller tile shows the middle of the same 60px painting, anchored a little above
centre (`50% 30%`) so the head stays in frame. So the 44px rows read as head-and-shoulders
rather than a tiny whole figure, and first place shows more of the scene instead of looking out
of scale. Each portrait sits flush against its rank number in a slot as wide as first place's
tile (`PORTRAIT_SLOT`), so every name starts on the same line as the top one.

**The picker opens from the submit form too.** A first-time player finishes the daily and
claims a score before ever opening the menu, so the portrait beside the name box
(`LeaderboardSubmitForm`) is a button, marked with a small pencil, that opens the same picker.
It is the same saved pick as the menu's, for new and existing players alike. From there the
picker previews the name as typed (its `name` prop), so until a first pick the checked tile is
the animal the form shows, not the one the saved name implies. It renders inside the host
popup's card on the `reveal` layer; that card's scale spring settles to `transform: none`, so
`fixed` resolves to the viewport. Once today's score is submitted the form is gone, and the
menu is the way back in.

**The picker fits the visible screen.** It is capped at 80% of `--vh` (`1dvh` where
supported), not `vh`, which on iOS browsers is the viewport with the toolbars hidden: a 90vh card
ran off both ends with the toolbars showing. The preview and the Done footer are pinned and only
the grid scrolls, so the way out is always on screen. There is no "match my name" reset: once
picked, an avatar stays picked.

**No colour themes.** Each avatar once carried one of 20 colour themes, picked by the name's
first word and mixed faintly into the tile, first with a tint picker and later without. It was
dropped: the art is `object-cover` with an opaque painted backdrop, so the tint showed only
while an image loaded, yet it cost a second half in the stored pick, the wire format and the
server check, plus an always-empty adjective map. The plain paper tile (`bg-paper`) is the
loading backdrop. Painted background art per theme was also planned and dropped earlier, for
want of anywhere to show it.

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

**A dark painted backdrop, not a cut-out.** The plan was a transparent cut-out so the tint
showed behind the animal. The two finished previews have a plain dark painted backdrop and read
well, so the rest match them: the prompt asks for "a plain dark painted backdrop, like a gallery
portrait", and no background-removal step is needed.

**The prompts CSV.** `scripts/avatars/avatar-art-prompts.py` fills the template above (with the
backdrop clause in place of "isolated on a flat plain uniform background") from
`scripts/avatars/personas.json`, one persona per animal: a distinct role, spread across eras and
cultures, archetypes rather than real people, one costume element and one prop that is not text.
It writes the event cards' five-column contract
(`event_name,research_prompt,image_prompt,image_generated,saved_filename`; see
[events-images/](../events-images/index.md#the-prompt-csv-contract)) with the animal id as
`event_name`, so the same browser task runs it, and it fails on a missing or unknown animal, an
empty field, a colour adjective or anything that would be lettered. Edit a persona, not the CSV,
and re-run; progress columns carry over by id.

### It must work very small

Portraits mostly show at **20–44px** (the game-over preview at 20px; leaderboard rows, the
menu icon and the picker grid at 44px), 48–60px on the board's podium, and at most 96px (the
picker's preview). Every portrait
prompt must ask for:

- a large head filling most of the frame, in a tight bust crop;
- one strong, simple silhouette that holds up at a glance;
- at most one bold costume element and one prop;
- no fine detail, small text or busy pattern;
- a clear colour identity for each animal.

Check every generated portrait downscaled to 20px and 32px, on a paper tile, before
accepting it.

## Delivery

Every portrait is on Cloudinary at the public id `avatars/<animal id>`, so `portraitArtUrl`
builds the URL from the id; nothing is stored per animal. It goes through `getImageUrl(…,
'thumbnail')`, the existing square 400px rung: that covers the 96px picker preview at DPR 3,
costs about 15–20 KB a tile, and adds no transformation string to allow-list. A third,
portrait-sized rung would be smaller per tile but mints new derived assets
([cloudinary-cost-controls.md](../cloudinary-cost-controls.md)). Every portrait still loads
through `Portrait`'s one `<img loading="lazy" decoding="async">`, pinned by `Portrait.test.tsx`;
add no eager path.

The pipeline is the event cards' tooling in `../when-images`, run on its own folders:

1. Put the 2048px originals in `when-images/avatars/generated/`, named by animal id.
2. Run `scripts/downsample.py`'s code against that folder, writing `avatars/downsampled/`
   (the script's directories are module constants; override `INPUT_DIR` / `OUTPUT_DIR`).
3. `node ../when-images/scripts/upload_to_cloudinary.js --avatars` for a dry run, then with
   `--upload`. It matches stems against `avatars.json`, uploads to `avatars/<id>` and never
   overwrites, so replacing a portrait means deleting the old asset first.

There is no URL-writing step. A new animal needs only its id in `avatars.json` and an upload.

The first 24 uploads (platypus to badger in list order) went up as 1024px JPEGs from an ad-hoc
downsample, the rest as `downsample.py`'s 2048px quality-80 output. Delivery resizes both to the
same 400px rung, so they look identical in the app.

## Still to do

1. **Review the art at size.** Every portrait was checked as a contact sheet at 96px, not yet
   one by one at 20px and 32px on a paper tile. Re-run any that do not read, then replace the
   asset as described under [Delivery](#delivery).

## Ideas for later

Not built. Recorded so a later pass starts from the reasoning rather than from scratch.

**Earned portraits as variants, never locked animals.** The idea is to reward achievements
with portraits: placing 20 Art events (`cat-art`, "Maestro") might earn a painter aardvark.
Lock **variants** of existing animals, not the 62 base animals. The name decides the avatar
by default, so a locked base animal would break a generated name ("Artistic Aardvark" with no
aardvark), and the 62 must stay complete for the name generator and the bots. A variant is
pick-only and never implied by a name.

- **One variant per category achievement**, so 21 paintings (`ACHIEVEMENTS` in
  `src/data/achievements.ts`), plus perhaps a few rare ones for the top milestones (Time Lord,
  Keeper of Time, The Complete Collection). A costume of _every_ animal per achievement would be
  62 × 21 = 1,302 paintings. The personas already lean towards categories (the penguin
  conducts, the mongoose paints miniatures, the owl watches the stars), so a variant can take
  an animal somewhere its base persona does not, such as the archaeologist aardvark at an easel.
- **The wire format already allows it.** An id such as `aardvark-maestro` passes the server's
  format check (`/^[a-z0-9-]{1,24}$/`), and a client that does not know an id falls back to
  the name. Achievements are stored on the device, so a variant can be forged; acceptable for a
  cosmetic.
- **The name word could unlock too.** Earning Maestro might add "Maestro" as a pickable first
  word, so name and portrait match, within the 20-character cap.
- **In the picker**, locked variants show greyed with their unlock line, so the picker also
  says what is left to earn.

Traps: don't mark an earned portrait with a metal frame (gold, silver and bronze already mean
podium place on the board, and achievement badges carry metal rings); keep the quiet touch
(profile banners and a Stats-tab presence were tried and removed); every variant must still
read at 20px, as above.

**Other uses considered**, in rough order of fit:

- seasonal or curated-theme portraits, earned by playing that day (missing one is final, which
  must be a deliberate choice);
- a collection goal across the variants, a long arc the daily score does not give;
- the sender's portrait on a challenge ("Beat Linguistic Platypus's 14"), which touches the
  challenge-code encoding ([sharing-challenges/](../sharing-challenges/index.md));
- turn markers in multiplayer, which the engine supports and no screen offers;
- a portrait on a generated share image;
- reactions (a different expression on a win or a loss), which multiply the art cost.
