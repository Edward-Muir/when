/**
 * Display-name filtering for the daily leaderboard.
 *
 * No default export, so Vercel treats this as a shared lib rather than a route —
 * same arrangement as ../card-reports/reportSchema.ts and ./botGeneration.ts.
 * Tests live in src/utils/nameFilter.test.ts (CRA's Jest only roots at src/).
 *
 * A blocked name is never rejected: the submission succeeds and the name is quietly
 * swapped for a generated one. Telling someone their name was blocked hands them a
 * feedback loop to probe the filter with, and it does nothing for names already in
 * Redis. Both routes call safeDisplayName() — submit.ts so the raw text never
 * persists, [date].ts so entries already stored are masked on the way out and any
 * future addition to the lists below applies retroactively to history.
 */
import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
} from 'obscenity';
import { generateNameFromSeed } from './botGeneration';

export const MAX_DISPLAY_NAME_LENGTH = 20;

/**
 * Zero-width, bidi and control characters. They render as nothing on the card but
 * split a word for any matcher, so "n<ZWSP>ig" would otherwise sail straight through.
 * Stripped before anything else looks at the string.
 */
const INVISIBLE_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u206F\uFEFF]/g;

/**
 * Slurs and hate references the shipped English dataset doesn't carry.
 *
 * Deliberately short. Every term added here is a false-positive risk, and the
 * dataset already covers the name that prompted this work. Anything that could turn
 * up inside an ordinary word is word-bounded with |pipes| — `|coon|` leaves raccoon,
 * cocoon and tycoon alone, `|paki|` leaves Pakistan alone. If you add a term that
 * can't be bounded, give it an addWhitelistedTerm() for the innocent words it hits.
 */
function addSupplementalTerms<T>(dataset: DataSet<T>): DataSet<T> {
  return dataset
    .addPhrase((phrase) => phrase.addPattern(pattern`|spic[s]|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|paki[s]|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|gook[s]|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|coon[s]|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|wog[s]|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|pikey|`))
    .addPhrase((phrase) => phrase.addPattern(pattern`wetback`))
    .addPhrase((phrase) => phrase.addPattern(pattern`raghead`))
    .addPhrase((phrase) => phrase.addPattern(pattern`towelhead`))
    .addPhrase((phrase) => phrase.addPattern(pattern`zipperhead`))
    .addPhrase((phrase) => phrase.addPattern(pattern`|beaner`))
    .addPhrase((phrase) => phrase.addPattern(pattern`jigaboo`))
    .addPhrase((phrase) => phrase.addPattern(pattern`golliwog`))
    .addPhrase((phrase) => phrase.addPattern(pattern`gyppo`))
    .addPhrase((phrase) => phrase.addPattern(pattern`hitler`));
}

/**
 * Hate references that cannot be expressed as obscenity patterns at all.
 *
 * collapseDuplicatesTransformer rewrites runs of a repeated character before
 * matching, so "kkk" reaches the matcher as "k" and "1488" as "148" — a `|kkk|`
 * pattern would compile fine and then never fire. Matched literally instead, against
 * the name with separators removed. Don't move these into addSupplementalTerms().
 */
const LITERAL_HATE_TERMS = /kkk|1488/;

/**
 * Innocent words the shipped dataset flags, found by running plausible player names
 * through the matcher: `dick` is unbounded so it eats Dickinson, `|ass` eats Assyria,
 * `|fag` eats Fagan/Fagin, and this is a history game where those are likely names.
 *
 * Blanked out of the string before matching rather than skipped, so they neutralise
 * only themselves — "Dickinson" passes, "Dickinson Fuck" still doesn't.
 *
 * `booby` is here because it is a bird in the client's own animals dictionary, so every one
 * of the 1202 adjectives paired with it — "Able Booby", "Golden Booby" — was being offered
 * to the player in the input box and then silently renamed on submit. Found by
 * nameFilterCorpus.test.
 */
const ALLOWED_WORDS =
  // eslint-disable-next-line security/detect-unsafe-regex -- plain alternation, no nested quantifier
  /\b(?:dickinson|assyria(?:ns?)?|penistone|fag(?:an|in|us)|retardant|boob(?:y|ies))\b/gi;

/**
 * Built once per cold start, not per request — constructing a matcher compiles every
 * pattern, and [date] runs this over up to 100 entries on each fetch.
 *
 * englishRecommendedTransformers is what makes this worth using over a plain word
 * list: it resolves unicode confusables, leetspeak and repeated characters before
 * matching, so n1g / nｉg / niiigger all land on the same pattern.
 */
const matcher = new RegExpMatcher({
  ...englishRecommendedTransformers,
  ...addSupplementalTerms(new DataSet<{ originalWord: string }>().addAll(englishDataset)).build(),
});

const MAX_CHUNK_LENGTH = 3;

/**
 * Join runs of short chunks separated by punctuation or spaces, so "Motionless N I G"
 * is also tested as "Motionless NIG", "n.i.g.g.e.r" as "nigger" and "ni gg er" as
 * "nigger". This is the spaced-out-text bypass, and it is the one an offender reaches
 * for first once a plain word gets swapped.
 *
 * Obscenity ships skipNonAlphabeticTransformer for the same job but deliberately
 * leaves it out of the recommended set because it false-positives across ordinary word
 * boundaries (their issues #23 and #46). Only joining chunks of three characters or
 * fewer keeps the fix narrow: it fires on "F A G" and "ni gg er", not on "Class
 * Action" or "Rio Negro".
 *
 * Squashing the whole string regardless of chunk length would also close "ni gger",
 * but it invents matches nobody typed — "Alan Iggarson" squashes to a string
 * containing "nigga" — so the length cap is the trade. The result is tested *in
 * addition to* the untouched name, so this can only ever add detections.
 */
function collapseSpacedLetters(name: string): string {
  const words = name.split(/[^a-z0-9]+/i).filter(Boolean);
  const out: string[] = [];
  let run: string[] = [];

  const flushRun = () => {
    // Two or more short chunks in a row is spaced-out text; a single one is just a
    // short word, and joining it to nothing would change nothing anyway.
    out.push(run.length >= 2 ? run.join('') : run.join(' '));
    run = [];
  };

  for (const word of words) {
    if (word.length <= MAX_CHUNK_LENGTH) {
      run.push(word);
      continue;
    }
    if (run.length > 0) flushRun();
    out.push(word);
  }
  if (run.length > 0) flushRun();

  return out.join(' ');
}

/** Indexed by the digit's own value: 0->o, 1->i, 2->z, 3->e, 4->a, 5->s, 6->g, 7->t, 8->b, 9->g. */
const LEET_DIGIT_LETTERS = 'oizeasgtbg';

/**
 * Reduce a token to a canonical skeleton, so spelling games land on the same string.
 *
 * This exists because the two checks below match names the shipped transformers cannot
 * see. obscenity's resolveConfusablesTransformer only maps non-ASCII lookalikes down to
 * ASCII, and its resolveLeetSpeakTransformer is a ten-entry symbols/digits table — neither
 * maps one ASCII letter to a different ASCII letter, so `d1gger` is caught and `dlgger`
 * is not.
 *
 * Step order is load-bearing: `2`->z (4) must run before z->s (6), `x`->ks before the
 * letter classes so k and s are already canonical, and the run-collapse last because every
 * earlier step can create new adjacent duplicates. `ck`->k is deliberately absent — c->k
 * plus the run-collapse already produces it.
 *
 * Note this destroys `kkk` (-> `k`) and `1488` (-> `iab`), the same way obscenity's
 * collapseDuplicatesTransformer does. LITERAL_HATE_TERMS above must keep running on its own
 * digits-preserved string; don't route it through here.
 */
export function foldName(token: string): string {
  return token
    .normalize('NFKD')
    .toLowerCase() // after NFKD: 'İ'.toLowerCase() emits a combining dot for the next step
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/[0-9]/g, (digit) => LEET_DIGIT_LETTERS.charAt(Number(digit)))
    .replace(/ph/g, 'f')
    .replace(/x/g, 'ks')
    .replace(/[lyj]/g, 'i')
    .replace(/v/g, 'u')
    .replace(/z/g, 's')
    .replace(/q/g, 'g')
    .replace(/c/g, 'k')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Known troll handles. "Numb Digger" is a spoonerism — swap the leading consonants and it
 * reads as a racial slur. No character-level filter can see that, because every character
 * is already innocent; the wordplay is above the level obscenity models.
 *
 * Matched as WHOLE names against foldName(), never as substrings. That is what keeps this
 * free of false positives: a substring list would need short terms like `coon`, and
 * `Clever Condor` folds to `kieverkondor`, which contains `kon`. Measured at zero
 * collisions across every name the app can generate or display — see nameFilterCorpus.test.
 *
 * Add a line when a new one shows up. That is the intended maintenance model, and additions
 * clean history for free because [date].ts re-filters on read.
 */
const TROLL_NAMES = ['numb digger'] as const;
const FOLDED_TROLL_NAMES: readonly string[] = TROLL_NAMES.map(foldName);

/**
 * Onset swaps that produce `nigger`/`nigga` — "Numb Digger" -> "Dumb N⋯", and equally
 * "Nice Digger", "New Digger", "Nasty Trigger", "Nice Jigger". Without this the list above
 * is bypassed by changing one word, which is the whole problem with a blocklist of one.
 *
 * Restricted to these two targets on purpose; a broader target list is unusable because
 * onset swapping invents strings nobody typed. Measured against the same corpora: checking
 * every racial slur this way blocks 739 names the app itself can generate (`Calm Loon` ->
 * "Lalm Coon", `Casual Pike` -> "Pasual Kike", `Golden Fox` -> "Folden Gook"), and matching
 * those slurs as substrings rather than whole tokens blocks 10,566 (`Clever Condor` again).
 * Adding general profanity would block `Fancy Duck` — `duck` is in the client's own animals
 * dictionary and 62 of its adjectives start with f.
 *
 * CARRIER_EXEMPTIONS is the entire exemption list, and it is short because it turns out
 * `tiger` is the ONLY innocent word in the app's whole vocabulary carrying the -iger rime:
 * 31 hits across the client dictionary and one in the bot list (`Noble Tiger`, which the app
 * generates itself, so a hit there would mean a replacement name that is itself blockable).
 * Niger/Nigeria are here for the same reason they are in ALLOWED_WORDS — this is a history
 * game.
 */
const SLUR_TARGETS = new Set(['niger', 'niga']); // foldName('nigger') / foldName('nigga')
const CARRIER_EXEMPTIONS = new Set(['tiger', 'tigris', 'niger', 'nigeria', 'nigerian']);

const MAX_ONSET_LENGTH = 3;

/** Leading consonant run of an already-folded token, capped so a long cluster can't eat it. */
function onset(folded: string): string {
  const leading = /^[^aeiou]*/.exec(folded)?.[0] ?? '';
  if (leading.length === folded.length) return folded;
  return leading.slice(0, MAX_ONSET_LENGTH);
}

/**
 * Whether swapping any token's onset onto any other token spells a slur.
 *
 * Tokens are folded *before* onsets are taken, not after. Digits are not vowels, so the
 * onset of a raw "d1gger" is "d1g" and the swap silently misses; folding first turns it into
 * "diger" and "Numb D1gger" is caught. A trailing s is tolerated so "Numb Diggers" is too.
 */
function onsetSwapProducesSlur(name: string): boolean {
  const tokens = name
    .split(/[^a-z0-9]+/i)
    .map(foldName)
    .filter(Boolean);

  for (const [donorIndex, donor] of tokens.entries()) {
    for (const [carrierIndex, carrier] of tokens.entries()) {
      if (donorIndex === carrierIndex) continue;
      if (CARRIER_EXEMPTIONS.has(carrier) || CARRIER_EXEMPTIONS.has(carrier.replace(/s$/, ''))) {
        continue;
      }
      const swapped = onset(donor) + carrier.slice(onset(carrier).length);
      if (SLUR_TARGETS.has(swapped) || SLUR_TARGETS.has(swapped.replace(/s$/, ''))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Trim, strip markup characters and invisibles, collapse whitespace, cap the length.
 * The cap matches the maxLength on the client's input.
 */
export function normalizeDisplayName(raw: string | undefined | null): string {
  return (raw || '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH)
    .trim();
}

/**
 * The two word-level checks, together. Exported so the corpus test can measure them on
 * their own — they invent candidate strings, so their false-positive rate is the thing
 * worth pinning separately from the shipped dataset's.
 */
export function isKnownTrollName(name: string): boolean {
  return FOLDED_TROLL_NAMES.includes(foldName(name)) || onsetSwapProducesSlur(name);
}

/**
 * Whether a name is clean. Expects an already-normalized name.
 *
 * A filter is a heuristic, never a verdict — this will miss things, which is exactly
 * why [date] filters on read: adding a pattern above cleans historical entries on the
 * next fetch, with no Redis surgery.
 */
export function isNameAllowed(name: string): boolean {
  if (isKnownTrollName(name)) {
    return false;
  }
  if (LITERAL_HATE_TERMS.test(name.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
    return false;
  }
  const hasMatch = (candidate: string) => matcher.hasMatch(candidate.replace(ALLOWED_WORDS, ' '));
  return !hasMatch(name) && !hasMatch(collapseSpacedLetters(name));
}

/**
 * The one function both routes call: a display name that is safe to show.
 *
 * Empty and blocked names both fall back to a generated name seeded off the player's
 * deviceId, so the same player keeps the same replacement everywhere and across
 * polls. The seed is prefixed so it can't collide with botGeneration's own
 * `bot-${date}-${i}` seeds.
 */
export function safeDisplayName(raw: string | undefined | null, deviceId: string): string {
  const normalized = normalizeDisplayName(raw);
  if (normalized && isNameAllowed(normalized)) {
    return normalized;
  }
  return generateNameFromSeed(`name-${deviceId}`);
}
