# Stage C1: one art batch (at most 10 images)

Makes the images for at most 10 of one deck's slugs in the Gemini web app, through **Claude in
Chrome**, then stops. The next hourly run takes the next 10. The procedure below is carried over
from Edward's hand-run art task (`~/Documents/Claude/Scheduled/when-image-gen/SKILL.md`), which
it replaces for factory decks; the parts that changed are the queue (now `status.js`) and the
download (now `inbox.js`, never a rename by hand).

## 1. The batch

`node scripts/factory/status.js next-batch --deck <deck> --max 10`

It prints a JSON array, each item with `slug`, `attempt`, `research_prompt` and `image_prompt`
(a retry's image prompt already says what QC rejected). Work through exactly these items, in
order. If the array is empty, unlock and stop. **Never take more than it returned.**

## 2. The browser: Claude in Chrome, not the built-in browser

Use the `mcp__claude-in-chrome__*` tools: Edward's real Chrome, already signed in to Google.
The built-in browser pane (`mcp__Claude_Browser__*`) has its own profile with no Google
session, so Gemini loads signed out there and the run gets stuck at a sign-in page.

Load the tools in one call:
`ToolSearch { query: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__find,mcp__claude-in-chrome__browser_batch", max_results: 10 }`

Check `tabs_context_mcp` for a Gemini tab from an earlier run; otherwise open a dedicated tab
with `tabs_create_mcp`. Don't take over a tab Edward is using. If Chrome shows a Google sign-in
screen, stop the run: never enter credentials (STATE D below).

## 3. One slug, start to finish (repeat for each item)

1. **Snapshot first:** `node scripts/factory/inbox.js snapshot --deck <deck> --slug <slug>`.
2. Navigate to `https://gemini.google.com/app` (a fresh chat for every slug). **Wait 6-8
   seconds** before touching anything: the composer looks ready before it is.
3. Check the model chip (see Model). Send the `research_prompt` with the send routine.
4. Wait for the research response to finish (see Knowing when a response is done).
5. Re-check the model chip. Send the `image_prompt` in the same chat.
6. Wait for the image to render fully (30-60 s; the grey placeholder fills in).
7. Download it (see Downloading).
8. **Take it:** `node scripts/factory/inbox.js take --deck <deck> --slug <slug>`.
   - It waits for the download, moves the one new file onto the slug, records its sha256 and
     marks the slug `downloaded`.
   - **Exit 4 (no new file) or 5 (two or more):** nothing was moved. Go back to step 1 for the
     same slug. If you're on the same chat and the image is still on screen, re-snapshot and
     download again rather than regenerating.
9. Commit and push the status: `git add factory/decks/<deck>/status.json`, then `git commit -m
"chore(factory): <slug> downloaded"`, then `git push origin claude/deck-<deck>`. A crash now
   loses at most the slug in flight.

The research step is not optional. It primes the chat so the image is historically accurate,
and an image made without it is wrong even if it looks fine. Never skip, merge or reorder it,
however much UI trouble you hit.

### Send routine (both prompts)

1. **Focus:** click the composer by coordinate on its placeholder text, not by element ref
   (ref clicks on the textbox silently fail to focus it). On an empty page the pill sits
   centred at about y=390; mid-chat it is pinned near the bottom, about y=700.
2. **Settle:** wait 1 second.
3. **Type** the whole prompt. Replace any em dash (—) with a plain hyphen; they type unreliably.
4. **Confirm:** take a screenshot and check the text is visible in the box. If the box still
   shows "Ask Gemini", the text didn't land: go back to step 1. Don't press cmd+a before focus
   is confirmed: outside the composer it selects the whole page.
5. **Send:** click the Send button. The arrow is often missing from the screenshot even when
   live, so use `find` for "Send message button" and click its ref, or click the arrow's
   coordinate. Never use the keyboard.

### Knowing when a response is done

Don't test for a Send button: it exists only while the composer has text. Poll with `find` for
**"Stop response button"** every 20 seconds. While it is there, the response is still streaming;
once `find` returns nothing, it is done.

Research takes 40-90 seconds. Sometimes Gemini first shows an "Initiating Investigation" chip
with an "Answer now" button and searches the web for 30-60 seconds. Let it run, and don't click
"Answer now".

### Downloading

1. Scroll the image into view and click it **once**. That opens Gemini's image editor (Sketch
   and Text tools, a colour row, a Save button). Don't click the image again: a second click
   draws on it. Don't click Save.
2. Click **"Download full size image"** in the top-right toolbar. Left to right the toolbar is
   share, copy, **download**, undo, redo, Save; the download icon is about x = viewport width −
   220, y = 32. Click the coordinate: the `find` ref is often stale.
3. Confirm the "Downloading full size..." toast appears at the bottom left.
4. Leave the editor with the back arrow at the top left.

The file lands in `~/Downloads` as `Gemini_Generated_Image_<random>.jpeg`, 2048×2048, about
3.5 MB. `inbox.js take` handles it from there. Never rename or move a download yourself.

## Model

**Never use plain "Flash."** Use "Pro"; fall back to "Flash 3.7" only if Pro is unavailable
(greyed out, or its quota is used up). The chip near the composer shows the active model. Check
it before each prompt: Gemini can reset it between messages in one chat. If it reads Flash,
click it and choose Pro.

## Recovery playbook

- **STATE A: "Stop response" persists after the content has stopped changing.** Reload the chat
  URL (`/app/<chatid>`); the research is kept server side. Then send the image prompt.
- **STATE B: blank send** (the composer still shows "Ask Gemini" after typing). The commonest
  failure, about one attempt in three. It comes from clicking before the page has hydrated, or
  from a stale coordinate (the viewport resizes between screenshots). Take a fresh screenshot,
  read the composer position from it, click, wait 1 s, retype, confirm. Up to 3 tries.
- **STATE C: Gemini refuses the image because it would show a real person.** Taking the names
  out isn't enough: the scene still asks for those people ("two bearded young men scooping"),
  so Gemini still refuses. Retry once with **no people in the picture at all**. Rewrite the
  prompt around the place, the object or the result the event left: the shop front, the product
  on the counter, the empty stage after the show. Keep the setting, the era and every object the
  scene names, and add "no people". A far-off crowd with no faces is fine; a figure meant to be
  the person isn't. If Gemini refuses that too, don't keep rewriting it to get past the filter.
  Mark the slug and move on:
  `node scripts/factory/status.js mark --deck <deck> <slug> needs-human --reason "Gemini refused to depict a real person; no-people retry refused too"`
  Then commit and push the status, as in step 9. The deck can't ship until Edward rewrites the
  scene and resets the card.
- **STATE D: a Google sign-in screen.** Don't enter credentials. Leave the slug as it is, stop
  the run, unlock with `--outcome blocked`, and report that Chrome is signed out of Google, so
  Edward needs to sign in.
- **Three full recoveries fail on one slug:** leave it as it is (it stays in the queue) and go
  on to the next.
- **"I can't create more images for you today":** stop the whole session, and unlock with
  `--outcome quota`, so no art batch runs again until tomorrow, when the quota resets.

## When to stop

After the last item of the batch, or one of the stops above. Budget about 3 minutes per slug.
Then unlock:

- **`--outcome blocked` if no slug moved:** nothing downloaded and nothing marked `needs-human`,
  without the quota message. That means Gemini or Chrome is broken in a way the playbook doesn't
  cover, such as a changed page. Report what the page showed. The `blocked` outcome makes `auto`
  leave art alone for 6 hours, instead of repeating the same failing batch every run while the
  other stages wait.
- `--outcome ok` otherwise, even if some slugs were left in the queue.

The report gives the images taken, any slug left or marked `needs-human`, and what
`status.js summary --deck <deck>` says.
