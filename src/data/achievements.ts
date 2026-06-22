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
  /** Stable event `name` (kept for wiring real unlock logic later). */
  eventName: string;
  /** Raw Cloudinary event-art URL; run through getImageUrl() before display. */
  imageUrl: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: '01',
    name: 'First Steps',
    family: 'Milestone',
    tier: 'none',
    unlockCriteria: 'Play your 1st game',
    eventName: 'moon-landing',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/moon-landing_olbhii?_a=BAMAMiiu0',
  },
  {
    id: '02',
    name: 'Regular',
    family: 'Milestone',
    tier: 'bronze',
    unlockCriteria: 'Play 10 games',
    eventName: 'first-olympics',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/first-olympics_rlacqv?_a=BAMAMiiu0',
  },
  {
    id: '03',
    name: 'Dedicated',
    family: 'Milestone',
    tier: 'silver',
    unlockCriteria: 'Play 50 games',
    eventName: 'angkor-wat-temple',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/angkor-wat-temple_blu2gs?_a=BAMAMiiu0',
  },
  {
    id: '04',
    name: 'Centurion',
    family: 'Milestone',
    tier: 'gold',
    unlockCriteria: 'Play 100 games',
    eventName: 'colosseum-completed',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/colosseum-completed_synpwn?_a=BAMAMiiu0',
  },
  {
    id: '05',
    name: 'Bricklayer',
    family: 'Volume',
    tier: 'bronze',
    unlockCriteria: 'Place 100 events correctly',
    eventName: 'great-wall-begins',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/great-wall-begins_so9bxm?_a=BAMAMiiu0',
  },
  {
    id: '06',
    name: 'Stonemason',
    family: 'Volume',
    tier: 'silver',
    unlockCriteria: 'Place 500 events correctly',
    eventName: 'pyramids',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/pyramids_gqlrge?_a=BAMAMiiu0',
  },
  {
    id: '07',
    name: 'Master Builder',
    family: 'Volume',
    tier: 'gold',
    unlockCriteria: 'Place 1,000 events correctly',
    eventName: 'step-pyramid-djoser',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/step-pyramid-djoser_cucfih?_a=BAMAMiiu0',
  },
  {
    id: '08',
    name: 'Polymath',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place an event in all 7 categories',
    eventName: 'leonardo-mona-lisa',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/leonardo-mona-lisa_rgz72q?_a=BAMAMiiu0',
  },
  {
    id: '09',
    name: 'Category Buff: Conflict',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Conflict events',
    eventName: 'battle-marathon',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/battle-marathon_soclqv?_a=BAMAMiiu0',
  },
  {
    id: '10',
    name: 'Category Buff: Cultural',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Cultural events',
    eventName: 'printing-press-revolution',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/printing-press-revolution_kaudvb?_a=BAMAMiiu0',
  },
  {
    id: '11',
    name: 'Category Buff: Diplomatic',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Diplomatic events',
    eventName: 'magna-carta',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/magna-carta_n1rc9i?_a=BAMAMiiu0',
  },
  {
    id: '12',
    name: 'Category Buff: Disasters',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Disasters events',
    eventName: 'pompeii',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/pompeii_mmd3nh?_a=BAMAMiiu0',
  },
  {
    id: '13',
    name: 'Category Buff: Exploration',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Exploration events',
    eventName: 'wright-brothers-flight',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/wright-brothers-flight_bwni0n?_a=BAMAMiiu0',
  },
  {
    id: '14',
    name: 'Category Buff: Infrastructure',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 Infrastructure events',
    eventName: 'eiffel-tower',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/eiffel-tower_hmglcq?_a=BAMAMiiu0',
  },
  {
    id: '15',
    name: 'Category Buff: People',
    family: 'Collection',
    tier: 'steel',
    unlockCriteria: 'Place 5 People events',
    eventName: 'shakespeare-born',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/shakespeare-born_nwygy0?_a=BAMAMiiu0',
  },
  {
    id: '16',
    name: 'Ancient Historian',
    family: 'Collection',
    tier: 'verdigris',
    unlockCriteria: 'Place an event older than 1000 BCE',
    eventName: 'battle-megiddo',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/battle-megiddo_b8ke6w?_a=BAMAMiiu0',
  },
  {
    id: '17',
    name: 'Across the Ages',
    family: 'Collection',
    tier: 'gold',
    unlockCriteria: 'Place events spanning many centuries',
    eventName: 'great-wall-china',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/great-wall-china_xtcx8z?_a=BAMAMiiu0',
  },
  {
    id: '18',
    name: 'Peak Performance',
    family: 'Difficulty',
    tier: 'obsidian',
    unlockCriteria: 'Place 10 very-hard events',
    eventName: 'everest',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/everest_gqjhcl?_a=BAMAMiiu0',
  },
  {
    id: '19',
    name: 'On a Roll',
    family: 'Streak',
    tier: 'bronze',
    unlockCriteria: 'In-game streak of 5',
    eventName: 'blitzkrieg-tactics-deployed',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/blitzkrieg-tactics-deployed_igse4f?_a=BAMAMiiu0',
  },
  {
    id: '20',
    name: 'Momentum',
    family: 'Streak',
    tier: 'copper',
    unlockCriteria: 'In-game streak of 10',
    eventName: 'genghis-khan',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/genghis-khan_kvlsgi?_a=BAMAMiiu0',
  },
  {
    id: '21',
    name: 'Rampage',
    family: 'Streak',
    tier: 'silver',
    unlockCriteria: 'In-game streak of 15',
    eventName: 'alexander-empire',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/alexander-empire_duesbg?_a=BAMAMiiu0',
  },
  {
    id: '22',
    name: 'Juggernaut',
    family: 'Streak',
    tier: 'gold',
    unlockCriteria: 'In-game streak of 20',
    eventName: 'napoleon-emperor',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/napoleon-emperor_owadjr?_a=BAMAMiiu0',
  },
  {
    id: '23',
    name: 'Unstoppable',
    family: 'Streak',
    tier: 'platinum',
    unlockCriteria: 'In-game streak of 25',
    eventName: 'charlemagne',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/charlemagne_uodxna?_a=BAMAMiiu0',
  },
  {
    id: '24',
    name: 'Daily Grind',
    family: 'Cadence',
    tier: 'bronze',
    unlockCriteria: 'Daily streak of 3 days',
    eventName: 'monets-impression-sunrise',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/monets-impression-sunrise_xvobz6?_a=BAMAMiiu0',
  },
  {
    id: '25',
    name: 'Routine',
    family: 'Cadence',
    tier: 'silver',
    unlockCriteria: 'Daily streak of 7 days',
    eventName: 'mayan-written-calendar',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/mayan-written-calendar_di0dm3?_a=BAMAMiiu0',
  },
  {
    id: '26',
    name: 'Devotion',
    family: 'Cadence',
    tier: 'gold',
    unlockCriteria: 'Daily streak of 30 days',
    eventName: 'maya-astronomical-calendar',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/maya-astronomical-calendar_mcjyty?_a=BAMAMiiu0',
  },
  {
    id: '27',
    name: 'Time Immemorial',
    family: 'Cadence',
    tier: 'diamond',
    unlockCriteria: 'Daily streak of 100 days',
    eventName: 'russia-anno-domini',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/russia-anno-domini_tonm54?_a=BAMAMiiu0',
  },
  {
    id: '28',
    name: 'Good Timing',
    family: 'Single-Game',
    tier: 'bronze',
    unlockCriteria: 'Best single game of 10 correct',
    eventName: 'sundial-invented',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/sundial-invented_mbbrtd?_a=BAMAMiiu0',
  },
  {
    id: '29',
    name: 'Clockwork',
    family: 'Single-Game',
    tier: 'copper',
    unlockCriteria: 'Best single game of 15 correct',
    eventName: 'water-clock',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/water-clock_oz4lsm?_a=BAMAMiiu0',
  },
  {
    id: '30',
    name: 'Well-Oiled',
    family: 'Single-Game',
    tier: 'silver',
    unlockCriteria: 'Best single game of 20 correct',
    eventName: 'incense-clock',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/incense-clock_b6i1fe?_a=BAMAMiiu0',
  },
  {
    id: '31',
    name: 'Horologist',
    family: 'Single-Game',
    tier: 'gold',
    unlockCriteria: 'Best single game of 25 correct',
    eventName: 'mechanical-clock',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/mechanical-clock_iqit2c?_a=BAMAMiiu0',
  },
  {
    id: '32',
    name: 'Time Lord',
    family: 'Single-Game',
    tier: 'platinum',
    unlockCriteria: 'Best single game of 30 correct',
    eventName: 'pendulum-clock',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/pendulum-clock_ecwxh1?_a=BAMAMiiu0',
  },
  {
    id: '33',
    name: 'Old Faithful',
    family: 'Cadence',
    tier: 'gold',
    unlockCriteria: 'Play on 50 distinct days',
    eventName: 'tennis-court-oath',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/tennis-court-oath_ttwebk?_a=BAMAMiiu0',
  },
  {
    id: '34',
    name: 'Warm-Up',
    family: 'Difficulty',
    tier: 'bronze',
    unlockCriteria: 'Place 80 easy events',
    eventName: 'hot-air-balloon',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/hot-air-balloon_aby468?_a=BAMAMiiu0',
  },
  {
    id: '35',
    name: 'Hitting Your Stride',
    family: 'Difficulty',
    tier: 'silver',
    unlockCriteria: 'Place 40 medium events',
    eventName: 'domestication-horses',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/domestication-horses_ud21qx?_a=BAMAMiiu0',
  },
  {
    id: '36',
    name: 'Uphill Battle',
    family: 'Difficulty',
    tier: 'gold',
    unlockCriteria: 'Place 20 hard events',
    eventName: 'hannibal-crosses-alps',
    imageUrl:
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/hannibal-crosses-alps_wbh7cz?_a=BAMAMiiu0',
  },
];
