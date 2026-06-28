// AUTO-GENERATED from when-achievement-badge-prompts.csv (session 1: card visual design).
// Edit the CSV and regenerate, or hand-edit once real unlock logic lands.

export type AchievementTier =
  | 'none'
  | 'bronze'
  | 'copper'
  | 'silver'
  | 'gold'
  | 'steel'
  | 'platinum'
  | 'diamond'
  | 'obsidian'
  | 'verdigris';

export type AchievementFamily =
  | 'Milestone'
  | 'Volume'
  | 'Collection'
  | 'Difficulty'
  | 'Streak'
  | 'Cadence'
  | 'Single-Game';

export interface AchievementDef {
  /** CSV badge_id, stable id, e.g. '01' */
  id: string;
  name: string;
  family: AchievementFamily;
  tier: AchievementTier;
  /** The "how to unlock" line shown on the card. */
  unlockCriteria: string;
  /** Stable event `name`. The card art is resolved from this event so the image URL
   *  has a single source of truth (the event JSON). */
  eventName: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: '01',
    name: 'First Steps',
    family: 'Milestone',
    tier: 'none',
    unlockCriteria: 'Play your 1st game',
    eventName: 'moon-landing',
  },
  {
    id: '02',
    name: 'Regular',
    family: 'Milestone',
    tier: 'bronze',
    unlockCriteria: 'Play 10 games',
    eventName: 'first-olympics',
  },
  {
    id: '03',
    name: 'Dedicated',
    family: 'Milestone',
    tier: 'silver',
    unlockCriteria: 'Play 50 games',
    eventName: 'angkor-wat-temple',
  },
  {
    id: '04',
    name: 'Centurion',
    family: 'Milestone',
    tier: 'gold',
    unlockCriteria: 'Play 100 games',
    eventName: 'colosseum-completed',
  },
  {
    id: '05',
    name: 'Bricklayer',
    family: 'Volume',
    tier: 'bronze',
    unlockCriteria: 'Place 100 events correctly',
    eventName: 'great-wall-begins',
  },
  {
    id: '06',
    name: 'Stonemason',
    family: 'Volume',
    tier: 'silver',
    unlockCriteria: 'Place 500 events correctly',
    eventName: 'pyramids',
  },
  {
    id: '07',
    name: 'Master Builder',
    family: 'Volume',
    tier: 'gold',
    unlockCriteria: 'Place 1,000 events correctly',
    eventName: 'step-pyramid-djoser',
  },
  {
    id: '08',
    name: 'Polymath',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place an event in all 20 categories',
    eventName: 'leonardo-mona-lisa',
  },
  // Each category badge links to a recognizable event of that category (art derives
  // from the event JSON via eventName). Ids MUST stay `cat-<category>` to match the
  // generated ACHIEVEMENT_TESTS in achievementLogic.ts.
  {
    id: 'cat-empires',
    name: 'Imperator',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Empires events',
    eventName: 'roman-empire-founded',
  },
  {
    id: 'cat-revolution',
    name: 'Firebrand',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Revolution events',
    eventName: 'tiananmen-square',
  },
  {
    id: 'cat-architecture',
    name: 'Architect',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Architecture events',
    eventName: 'taj-mahal-completed',
  },
  {
    id: 'cat-writing',
    name: 'Wordsmith',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Writing events',
    eventName: 'frankenstein-published',
  },
  {
    id: 'cat-invention',
    name: 'Inventor',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Invention events',
    eventName: 'wheel-invented',
  },
  {
    id: 'cat-figures',
    name: 'Luminary',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Figures events',
    eventName: 'shakespeare-born',
  },
  {
    id: 'cat-media',
    name: 'Trendsetter',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Media events',
    eventName: 'instagram-launched',
  },
  {
    id: 'cat-craft',
    name: 'Artisan',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Craft events',
    eventName: 'chain-mail-evolution',
  },
  {
    id: 'cat-diplomacy',
    name: 'Diplomat',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Diplomacy events',
    eventName: 'swiss-confederation',
  },
  {
    id: 'cat-disasters',
    name: 'Survivor',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Disasters events',
    eventName: 'titanic-disaster',
  },
  {
    id: 'cat-commerce',
    name: 'Tycoon',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Commerce events',
    eventName: 'google-founded',
  },
  {
    id: 'cat-law',
    name: 'Magistrate',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Law events',
    eventName: 'magna-carta',
  },
  {
    id: 'cat-agriculture',
    name: 'Cultivator',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Agriculture events',
    eventName: 'domestication-cattle',
  },
  {
    id: 'cat-warfare',
    name: 'Warmonger',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Warfare events',
    eventName: 'd-day',
  },
  {
    id: 'cat-science',
    name: 'Empiricist',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Science events',
    eventName: 'periodic-table',
  },
  {
    id: 'cat-trade',
    name: 'Navigator',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Trade events',
    eventName: 'panama-canal',
  },
  {
    id: 'cat-migration',
    name: 'Wayfarer',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Migration events',
    eventName: 'columbus-americas',
  },
  {
    id: 'cat-art',
    name: 'Maestro',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Art events',
    eventName: 'van-gogh-starry-night',
  },
  {
    id: 'cat-medicine',
    name: 'Physician',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Medicine events',
    eventName: 'florence-nightingale-crimea',
  },
  {
    id: 'cat-nature',
    name: 'Naturalist',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 20 Nature events',
    eventName: 'earth-formation',
  },
  {
    id: '16',
    name: 'Ancient Historian',
    family: 'Collection',
    tier: 'verdigris',
    unlockCriteria: 'Place an event older than 1000 BCE',
    eventName: 'battle-megiddo',
  },
  {
    id: '17',
    name: 'Across the Ages',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place an event in every century from the 1st to the 21st',
    eventName: 'great-wall-china',
  },
  {
    id: '18',
    name: 'Peak Performance',
    family: 'Difficulty',
    tier: 'obsidian',
    unlockCriteria: 'Place 10 very-hard events',
    eventName: 'everest',
  },
  {
    id: '19',
    name: 'On a Roll',
    family: 'Streak',
    tier: 'bronze',
    unlockCriteria: 'Get 5 events right in a row',
    eventName: 'blitzkrieg-tactics-deployed',
  },
  {
    id: '20',
    name: 'Momentum',
    family: 'Streak',
    tier: 'copper',
    unlockCriteria: 'Get 10 events right in a row',
    eventName: 'genghis-khan',
  },
  {
    id: '21',
    name: 'Rampage',
    family: 'Streak',
    tier: 'silver',
    unlockCriteria: 'Get 15 events right in a row',
    eventName: 'alexander-empire',
  },
  {
    id: '22',
    name: 'Juggernaut',
    family: 'Streak',
    tier: 'gold',
    unlockCriteria: 'Get 20 events right in a row',
    eventName: 'napoleon-emperor',
  },
  {
    id: '23',
    name: 'Unstoppable',
    family: 'Streak',
    tier: 'platinum',
    unlockCriteria: 'Get 25 events right in a row',
    eventName: 'charlemagne',
  },
  {
    id: '24',
    name: 'Daily Grind',
    family: 'Cadence',
    tier: 'bronze',
    unlockCriteria: 'Play 3 days in a row',
    eventName: 'monets-impression-sunrise',
  },
  {
    id: '25',
    name: 'Routine',
    family: 'Cadence',
    tier: 'silver',
    unlockCriteria: 'Play 7 days in a row',
    eventName: 'mayan-written-calendar',
  },
  {
    id: '26',
    name: 'Devotion',
    family: 'Cadence',
    tier: 'gold',
    unlockCriteria: 'Play 30 days in a row',
    eventName: 'maya-astronomical-calendar',
  },
  {
    id: '27',
    name: 'Time Immemorial',
    family: 'Cadence',
    tier: 'diamond',
    unlockCriteria: 'Play 100 days in a row',
    eventName: 'russia-anno-domini',
  },
  {
    id: '28',
    name: 'Good Timing',
    family: 'Single-Game',
    tier: 'bronze',
    unlockCriteria: 'Build a 10-event timeline',
    eventName: 'sundial-invented',
  },
  {
    id: '29',
    name: 'Clockwork',
    family: 'Single-Game',
    tier: 'copper',
    unlockCriteria: 'Build a 15-event timeline',
    eventName: 'water-clock',
  },
  {
    id: '30',
    name: 'Well-Oiled',
    family: 'Single-Game',
    tier: 'silver',
    unlockCriteria: 'Build a 20-event timeline',
    eventName: 'incense-clock',
  },
  {
    id: '31',
    name: 'Horologist',
    family: 'Single-Game',
    tier: 'gold',
    unlockCriteria: 'Build a 25-event timeline',
    eventName: 'mechanical-clock',
  },
  {
    id: '32',
    name: 'Time Lord',
    family: 'Single-Game',
    tier: 'platinum',
    unlockCriteria: 'Build a 30-event timeline',
    eventName: 'pendulum-clock',
  },
  {
    id: '33',
    name: 'Old Faithful',
    family: 'Cadence',
    tier: 'gold',
    unlockCriteria: 'Play on 50 distinct days',
    eventName: 'tennis-court-oath',
  },
  {
    id: '34',
    name: 'Warm-Up',
    family: 'Difficulty',
    tier: 'bronze',
    unlockCriteria: 'Place 80 easy events',
    eventName: 'hot-air-balloon',
  },
  {
    id: '35',
    name: 'Hitting Your Stride',
    family: 'Difficulty',
    tier: 'silver',
    unlockCriteria: 'Place 40 medium events',
    eventName: 'domestication-horses',
  },
  {
    id: '36',
    name: 'Uphill Battle',
    family: 'Difficulty',
    tier: 'gold',
    unlockCriteria: 'Place 20 hard events',
    eventName: 'hannibal-crosses-alps',
  },
  // --- Collection breadth: unique-event milestones (distinct from Volume, which counts repeats).
  {
    id: 'coll-100',
    name: 'Curator',
    family: 'Collection',
    tier: 'bronze',
    unlockCriteria: 'Collect 100 unique events',
    eventName: 'rosetta-stone',
  },
  {
    id: 'coll-500',
    name: 'Archivist',
    family: 'Collection',
    tier: 'silver',
    unlockCriteria: 'Collect 500 unique events',
    eventName: 'library-alexandria',
  },
  {
    id: 'coll-1500',
    name: 'Custodian',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Collect 1,500 unique events',
    eventName: 'british-museum-founded',
  },
  {
    id: 'coll-3000',
    name: 'Keeper of Time',
    family: 'Collection',
    tier: 'diamond',
    unlockCriteria: 'Collect 3,000 unique events',
    eventName: 'stonehenge',
  },
  // --- Era / epoch flavor (derived from placed-event years).
  {
    id: 'era-bce',
    name: 'Antiquarian',
    family: 'Collection',
    tier: 'silver',
    unlockCriteria: 'Place 25 events from BCE',
    eventName: 'code-hammurabi',
  },
  {
    id: 'era-modern',
    name: 'Present Tense',
    family: 'Collection',
    tier: 'silver',
    unlockCriteria: 'Place 50 events from the 21st century',
    eventName: 'iphone-released',
  },
  {
    id: 'era-epochs',
    name: 'Epoch Hopper',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place 15 events in each of 5 great eras',
    eventName: 'antikythera-mechanism',
  },
  // --- Themed multi-category combos.
  {
    id: 'theme-renaissance',
    name: 'Renaissance Soul',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place 15 each of Art, Science & Writing',
    eventName: 'italian-renaissance-begins',
  },
  {
    id: 'theme-statecraft',
    name: 'Power Broker',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place 15 each of Empires, Law & Diplomacy',
    eventName: 'peace-westphalia',
  },
  // --- Completionist meta: every category badge earned.
  {
    id: 'meta-categories',
    name: 'The Complete Collection',
    family: 'Collection',
    tier: 'obsidian',
    unlockCriteria: 'Earn all 20 category badges',
    eventName: 'hanging-gardens-babylon',
  },
];
