/*
 * The directions under test in /timeline-lab.
 *
 * Deliberately short. An earlier pass built ten of these on an eight-colour era palette with
 * chapter headings, an era spine and a coverage bar; all of it was rejected, and so was the
 * family it came from (see docs/ui-redesign/index.md). What is left is the two materials
 * already on screen — the paper and the rail — plus the one moment where growing the timeline
 * is something you feel. New marks on the board are typographic and monochrome only: no
 * colour coding, no badges, no bars.
 */

export interface LabLayers {
  /** One continuous warm→cool ramp down the board, keyed to year. No bands, no eras. */
  paper: boolean;
  /** The rail exists only between the first and last card, and previews its own growth. */
  rail: boolean;
  /** Optional: the years covered, as a single Playfair figure. Off by default. */
  span: boolean;
}

export interface LabVariant extends LabLayers {
  id: string;
  name: string;
  blurb: string;
}

const off: LabLayers = { paper: false, rail: false, span: false };

export const VARIANTS: LabVariant[] = [
  {
    ...off,
    id: 'none',
    name: 'Today',
    blurb: 'The board as it ships. The reference shot: identical at 5 cards and at 30.',
  },
  {
    ...off,
    paper: true,
    id: 'paper',
    name: 'Paper',
    blurb:
      'One continuous ramp down the board, a few percent warm to a few percent cool, interpolated from each card’s year on a log-of-time-before-now scale. No bands and no era names — a board inside one century stays flat, and only a board that reaches back earns the warm end.',
  },
  {
    ...off,
    rail: true,
    id: 'rail',
    name: 'Rail',
    blurb:
      'The gold line stops being page furniture: it exists only between your earliest and latest card, so the runway above and below is bare paper and the line is the thing you built. Nothing added to it.',
  },
  {
    ...off,
    paper: true,
    rail: true,
    id: 'both',
    name: 'Paper + rail',
    blurb: 'The two together — the proposal.',
  },
  {
    ...off,
    paper: true,
    rail: true,
    span: true,
    id: 'span',
    name: '+ span figure',
    blurb:
      'The optional extra: the years you have covered as one Playfair figure in the gutter above the board, no pill and no colour. Worth a look, but the number stops moving after about eight cards, which is why it is not the thing carrying the progression.',
  },
];

export function variantById(id: string | null): LabVariant {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0]!;
}
