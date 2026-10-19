/**
 * The placement-first difficulty grid (docs/events-images/difficulty-grading-rubric.md,
 * "Difficulty Matrix"), in code, so a grader only rates recognition and inferability and never
 * does the arithmetic.
 *
 * The game is placing a card on a timeline, so a card whose text makes its era obvious is easy
 * however obscure the event: high inferability is Easy whatever the recognition.
 */

const RECOGNITION = ['high', 'medium', 'low', 'very-low'];
const INFERABILITY = ['high', 'medium', 'low', 'very-low'];

const GRID = {
  high: { high: 'easy', medium: 'easy', low: 'medium' },
  medium: { high: 'easy', medium: 'medium', low: 'hard' },
  low: { high: 'easy', medium: 'medium', low: 'very-hard' },
  'very-low': { high: 'easy', medium: 'hard', low: 'very-hard' },
};

function difficultyFor(recognition, inferability) {
  if (!RECOGNITION.includes(recognition))
    throw new Error(`recognition must be one of ${RECOGNITION.join(', ')}`);
  if (!INFERABILITY.includes(inferability))
    throw new Error(`inferability must be one of ${INFERABILITY.join(', ')}`);
  return GRID[recognition][inferability === 'very-low' ? 'low' : inferability];
}

/**
 * Words that place a card in an era on their own: the rubric's strong anchors, plus the obvious
 * eras. A card naming one can't be hard to place. `Roman Catholic` and `Romanov` are not ancient
 * Rome; `Romanesque` is medieval, so it stays.
 */
const STRONG_ANCHORS = [
  /\bRom(e|an|ans)\b(?! Catholic)/i,
  /\bByzantine\b/i,
  /\bOttoman\b/i,
  /\bpharaohs?\b/i,
  /\bVikings?\b/i,
  /\bmedieval\b/i,
  /\bVictorian\b/i,
  /\bRenaissance\b/i,
  /\bsamurai\b/i,
  /\bshoguns?\b/i,
  /\bAztecs?\b/i,
  /\bIncas?\b/i,
  /\bCrusade(s|rs?)?\b/i,
  /\bNapoleon(ic)?\b/i,
  /\b(Julius )?Caesar\b/i,
  /\bWorld War\b|\bWWI+\b/i,
  /\bCold War\b/i,
  /\b(Stone|Bronze|Iron) Age\b/i,
  /\bNeolithic\b|\bPal(a)?eolithic\b/i,
  /\bdinosaurs?\b/i,
  /\bTudor\b|\bElizabethan\b/i,
  /\bSoviet\b/i,
  /\bancient\b/i,
];

/** The strong anchors a card's visible text names. */
function anchorsIn(event) {
  const text = `${event.friendly_name || ''} ${event.description || ''}`;
  return STRONG_ANCHORS.map((re) => text.match(re))
    .filter(Boolean)
    .map((m) => m[0]);
}

module.exports = { GRID, INFERABILITY, RECOGNITION, STRONG_ANCHORS, anchorsIn, difficultyFor };
