#!/usr/bin/env node

/**
 * Script to fetch Wikipedia thumbnail images for historical events
 * and update the event JSON files with image_url fields.
 *
 * Usage: node scripts/fetch-wiki-images.js
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const RATE_LIMIT_MS = 100; // Delay between API calls to avoid rate limiting

// Wikipedia search terms that may help find better images
const SEARCH_OVERRIDES = {
  // Wars and conflicts
  'wwi-start': 'World War I',
  'wwi-end': 'Armistice of 11 November 1918',
  'wwii-start': 'Invasion of Poland',
  'wwii-end': 'Victory over Japan Day',
  'pearl-harbor': 'Attack on Pearl Harbor',
  'd-day': 'Normandy landings',
  'hiroshima': 'Atomic bombings of Hiroshima and Nagasaki',
  'civil-war-start': 'Battle of Fort Sumter',
  'vietnam-end': 'Fall of Saigon',
  'september-11': 'September 11 attacks',
  'cuban-missile': 'Cuban Missile Crisis',
  'rome-falls': 'Fall of the Western Roman Empire',
  'constantinople-falls': 'Fall of Constantinople',
  'genghis-khan': 'Genghis Khan',
  'alexander-empire': 'Alexander the Great',
  'norman-conquest': 'Battle of Hastings',
  'first-crusade': 'First Crusade',
  'waterloo': 'Battle of Waterloo',
  'afghanistan-war-start': 'War in Afghanistan (2001–2021)',
  'london-bombings': '7 July 2005 London bombings',
  'crimea-annexation': 'Annexation of Crimea by the Russian Federation',
  'isis-caliphate': 'Islamic State',
  'russia-ukraine-invasion': 'Russian invasion of Ukraine',

  // Political events and people
  'american-independence': 'United States Declaration of Independence',
  'charles-i-execution': 'Charles I of England',
  'napoleon-emperor': 'Napoleon',
  'napoleon-russia': 'French invasion of Russia',
  'chinese-revolution': 'Xinhai Revolution',
  'lusitania-sinking': 'RMS Lusitania',
  'indian-independence': 'Indian independence movement',
  'india-independence': 'Indian independence movement',
  'watergate': 'Watergate scandal',
  'apartheid-ends': 'Apartheid',
  'obama-elected': 'Barack Obama',
  'slavery-abolished': 'Thirteenth Amendment to the United States Constitution',
  'charlemagne': 'Charlemagne',
  'charlemagne-crowned': 'Charlemagne',
  'nixon-china': '1972 Nixon visit to China',

  // Cultural and arts
  'cave-paintings': 'Cave painting',
  'bach-well-tempered': 'The Well-Tempered Clavier',
  'beatles-usa': 'The Beatles',
  'first-writing': 'History of writing',
  'homer-iliad': 'Iliad',
  'buddha-enlightenment': 'Gautama Buddha',
  'confucius-teachings': 'Confucius',
  'socrates-death': 'Socrates',
  'christianity-legalized': 'Edict of Milan',
  'muhammad-revelation': 'Muhammad',
  'tale-of-genji': 'The Tale of Genji',
  'divine-comedy': 'Divine Comedy',
  'protestant-reformation': 'Reformation',
  'reformation-begins': 'Reformation',
  'newton-principia': 'Philosophiæ Naturalis Principia Mathematica',
  'mozart-don-giovanni': 'Don Giovanni',
  'slavery-abolished-uk': 'Slavery Abolition Act 1833',
  'slavery-abolished-us': 'Thirteenth Amendment to the United States Constitution',
  'abolition-slavery-uk': 'Slavery Abolition Act 1833',
  'first-motion-picture': 'Lumière brothers',
  'first-powered-flight': 'Wright brothers',
  'powered-flight': 'Wright brothers',
  'flight': 'Wright brothers',
  'picasso-demoiselles': "Les Demoiselles d'Avignon",
  'titanic-sinks': 'Sinking of the Titanic',
  'titanic-disaster': 'Sinking of the Titanic',
  'women-suffrage-uk': "Women's suffrage in the United Kingdom",
  'women-suffrage-us': "Women's suffrage in the United States",
  'womens-suffrage-us': "Women's suffrage in the United States",
  'first-talking-film': 'The Jazz Singer',
  'first-television-broadcast': 'History of television',
  'wizard-of-oz': 'The Wizard of Oz (1939 film)',
  'elvis-ed-sullivan': 'Elvis Presley',
  'beatles-ed-sullivan': 'The Beatles',
  'first-email': 'Email',
  'mtv-launches': 'MTV',
  'aids-identified': 'HIV/AIDS',
  'dolly-sheep-cloned': 'Dolly (sheep)',
  'dolly-sheep': 'Dolly (sheep)',
  'y2k': 'Year 2000 problem',
  'millennium': 'Millennium',
  'marriage-equality-us': 'Same-sex marriage in the United States',
  'metoo-movement': 'Me Too movement',

  // Institutional and diplomatic
  'first-peace-treaty': 'Egyptian–Hittite peace treaty',
  'qin-unification': 'Qin dynasty',
  'council-nicaea': 'First Council of Nicaea',
  'constitution-medina': 'Constitution of Medina',
  'great-schism': 'East–West Schism',
  'jamestown-founded': 'Jamestown, Virginia',
  'habeas-corpus': 'Habeas Corpus Act 1679',
  'act-of-union-britain': 'Acts of Union 1707',
  'bill-of-rights-us': 'United States Bill of Rights',
  'hague-conventions': 'Hague Conventions of 1899 and 1907',
  'imf-world-bank': 'Bretton Woods Conference',
  'brown-v-board': 'Brown v. Board of Education',

  // Disasters
  'aleppo-earthquake': '1138 Aleppo earthquake',
  'bengal-famine-1770': 'Great Bengal famine of 1770',
  'laki-eruption': 'Laki',
  'yellow-fever-philadelphia': '1793 Philadelphia yellow fever epidemic',
  'cholera-london': '1854 Broad Street cholera outbreak',
  'indian-rebellion-famine': 'Indian Rebellion of 1857',
  'krakatoa-eruption': '1883 eruption of Krakatoa',
  'russian-famine-1891': 'Russian famine of 1891–1892',
  'china-floods-1931': '1931 China floods',
  'great-leap-forward-famine': 'Great Chinese Famine',
  'mount-st-helens': '1980 eruption of Mount St. Helens',
  'armenian-earthquake': '1988 Armenian earthquake',
  'bangladesh-cyclone-1991': '1991 Bangladesh cyclone',
  'somali-famine': 'Somali Civil War',
  'north-korea-famine': 'North Korean famine',
  'kashmir-earthquake': '2005 Kashmir earthquake',
  'sichuan-earthquake': '2008 Sichuan earthquake',
  'haiti-earthquake': '2010 Haiti earthquake',
  'nepal-earthquake': 'April 2015 Nepal earthquake',
  'paris-attacks': 'November 2015 Paris attacks',
  'texas-winter-storm': '2021 Texas power crisis',

  // Exploration and discovery
  'fire-mastery': 'Control of fire by early humans',
  'fire-use': 'Control of fire by early humans',
  'bronze-discovered': 'Bronze Age',
  'phoenician-circumnavigation': 'Phoenicia',
  'herodotus-histories': 'Herodotus',
  'alexander-india': 'Indian campaign of Alexander the Great',
  'archimedes-principle': 'Archimedes',
  'paper-invented': 'History of paper',
  'vikings-iceland': 'Settlement of Iceland',
  'vikings-greenland': 'Greenland',
  'vikings-north-america': "L'Anse aux Meadows",
  'viking-america': "L'Anse aux Meadows",
  'zheng-he-voyages': 'Zheng He',
  'portuguese-cape-verde': 'Cape Verde',
  'dias-cape-good-hope': 'Bartolomeu Dias',
  'columbus-americas': 'Christopher Columbus',
  'vasco-da-gama-india': 'Vasco da Gama',
  'cabot-north-america': 'John Cabot',
  'cabral-brazil': 'Pedro Álvares Cabral',
  'balboa-pacific': 'Vasco Núñez de Balboa',
  'copernicus-heliocentric': 'Nicolaus Copernicus',
  'copernicus': 'Nicolaus Copernicus',
  'cartier-st-lawrence': 'Jacques Cartier',
  'galileo-jupiter-moons': 'Galileo Galilei',
  'galileo-telescope': 'Galileo Galilei',
  'hudson-river': 'Henry Hudson',
  'harvey-circulation': 'William Harvey',
  'tasman-australia': 'Abel Tasman',
  'newton-gravity': 'Isaac Newton',
  'bering-strait': 'Vitus Bering',
  'linnaeus-taxonomy': 'Carl Linnaeus',
  'cook-australia': 'James Cook',
  'hieroglyphics-decoded': 'Jean-François Champollion',
  'dinosaur-fossils': 'History of paleontology',
  'antarctica-sighted': 'History of Antarctica',
  'gorillas-discovered': 'Gorilla',
  'source-of-nile': 'Nile',
  'darwin-evolution': 'Charles Darwin',
  'darwin-origin': 'Charles Darwin',
  'darwin-beagle': 'Charles Darwin',
  'pasteurization': 'Louis Pasteur',
  'mendel-genetics': 'Gregor Mendel',
  'lightbulb-invented': 'Incandescent light bulb',
  'continental-drift': 'Alfred Wegener',
  'hubble-galaxies': 'Edwin Hubble',
  'lucy-discovered': 'Lucy (Australopithecus)',
  'smallpox-eradicated': 'Eradication of smallpox',
  'hiv-identified': 'HIV/AIDS',
  'first-exoplanet': 'Exoplanet',
  'black-hole-image': 'Event Horizon Telescope',
  'mayflower': 'Mayflower',
  'everest': 'Mount Everest',

  // Science and technology
  'first-life': 'Abiogenesis',
  'agriculture': 'Neolithic Revolution',
  'relativity': 'Albert Einstein',
  'vaccination': 'Edward Jenner',
  'first-ivf': 'Louise Brown',
  'steam-engine': 'James Watt',

  // Infrastructure
  'jericho-walls': 'Jericho',
  'catalhoyuk-settlement': 'Çatalhöyük',
  'stonehenge-begins': 'Stonehenge',
  'pantheon-rebuilt': 'Pantheon, Rome',
  'grand-canal-china': 'Grand Canal (China)',
  'notre-dame-paris-begins': 'Notre-Dame de Paris',
  'st-peters-basilica-begins': "St. Peter's Basilica",
  'versailles-expanded': 'Palace of Versailles',
  'iron-bridge': 'The Iron Bridge',
  'first-railway': 'Liverpool and Manchester Railway',
  'chrysler-building': 'Chrysler Building',
  'world-trade-center-completed': 'World Trade Center (1973–2001)',
  'cn-tower': 'CN Tower',

  // Existing overrides
  'moon-landing': 'Apollo 11',
  'titanic': 'Sinking of the Titanic',
  'chernobyl': 'Chernobyl disaster',
  'black-death': 'Black Death',
  'spanish-flu': 'Spanish flu',
  'pompeii': 'Eruption of Mount Vesuvius in 79 AD',
  'krakatoa': '1883 eruption of Krakatoa',
  'tunguska': 'Tunguska event',
  'hindenburg': 'Hindenburg disaster',
  'challenger': 'Space Shuttle Challenger disaster',
  'eiffel-tower': 'Eiffel Tower',
  'statue-liberty': 'Statue of Liberty',
  'great-wall': 'Great Wall of China',
  'panama-canal': 'Panama Canal',
  'golden-gate': 'Golden Gate Bridge',
  'empire-state': 'Empire State Building',
  'sydney-opera': 'Sydney Opera House',
  'transcontinental-railroad': 'First Transcontinental Railroad',
  'printing-press': 'Printing press',
  'internet-birth': 'ARPANET',
  'wright-brothers': 'Wright brothers',
  'telephone-invention': 'Invention of the telephone',
  'electricity-grid': 'War of the currents',
  'first-photograph': 'View from the Window at Le Gras',
  'dna-structure': 'Molecular structure of nucleic acids',
  'penicillin': 'Penicillin',
  'columbus-america': 'Voyages of Christopher Columbus',
  'magellan-circumnavigation': 'Magellan expedition',
  'south-pole': 'Amundsen–Scott South Pole Station',
  'north-pole': 'Robert Peary',
  'mars-rover': 'Curiosity (rover)',
  'hubble-telescope': 'Hubble Space Telescope',
  'iss-assembly': 'International Space Station',
  'first-satellite': 'Sputnik 1',
  'first-spacewalk': 'Voskhod 2',
  'voyager-launch': 'Voyager program',
  'mona-lisa': 'Mona Lisa',
  'sistine-chapel': 'Sistine Chapel ceiling',
  'beethoven-ninth': 'Symphony No. 9 (Beethoven)',
  'shakespeare-hamlet': 'Hamlet',
  'gutenberg-bible': 'Gutenberg Bible',
  'king-tut-tomb': 'KV62',
  'rosetta-stone': 'Rosetta Stone',
  'declaration-independence': 'United States Declaration of Independence',
  'magna-carta': 'Magna Carta',
  'berlin-wall-fall': 'Fall of the Berlin Wall',
  'french-revolution': 'French Revolution',
  'russian-revolution': 'Russian Revolution',
  'industrial-revolution': 'Industrial Revolution',
  'civil-rights-act': 'Civil Rights Act of 1964',
  'womens-suffrage': "Women's suffrage in the United States",
  'abolition-slavery': 'Thirteenth Amendment to the United States Constitution',
  'first-olympics': '1896 Summer Olympics',
  'first-world-cup': '1930 FIFA World Cup',
  'treaty-versailles': 'Treaty of Versailles',
  'un-founding': 'United Nations',
  'eu-formation': 'European Union',
  'nato-founding': 'NATO',
  'bretton-woods': 'Bretton Woods system',
  'geneva-convention': 'Geneva Conventions',
  'peace-westphalia': 'Peace of Westphalia',
  'treaty-rome': 'Treaty of Rome',

  // === MISSING IMAGE OVERRIDES ===

  // Conflict (15 missing)
  'battle-megiddo': 'Battle of Megiddo (15th century BC)',
  'battle-zama': 'Scipio Africanus',
  'crossing-rubicon': 'Rubicon',
  'russia-ukraine-invasion': '2022 Russian invasion of Ukraine',
  'spartacus-revolt': 'Spartacus',
  'jewish-revolt-begins': 'First Jewish–Roman War',
  'sack-rome-visigoths': 'Sack of Rome (410)',
  'sack-rome-vandals': 'Sack of Rome (455)',
  'battle-breitenfeld': 'Battle of Breitenfeld (1631)',
  'easter-rising': 'Easter Rising',
  'hungarian-revolution': 'Hungarian Revolution of 1956',
  'hannibal-crosses-alps': 'Hannibal',
  'crossing-rubicon': 'Crossing the Rubicon',
  'attila-invasion': 'Attila',
  'mongol-baghdad': 'Siege of Baghdad (1258)',
  'wars-of-roses': 'Wars of the Roses',

  // Cultural (35 missing)
  'rigveda-composed': 'Rigveda',
  'zoroaster-teaches': 'Zoroaster',
  'upanishads-composed': 'Upanishads',
  'pythagoras-school': 'Pythagoras',
  'plato-academy': 'Plato',
  'millennium': 'Year 2000',
  'protestant-reformation': 'Martin Luther',
  'reformation-begins': 'Martin Luther',
  'britannica-first': 'William Smellie (encyclopedist)',
  'tchaikovsky-swan-lake': 'Ballet',
  'picasso-blue-period': 'The Old Guitarist',
  'surrealist-manifesto': 'Surrealism',
  'abstract-expressionism': 'Abstract expressionism',
  'punk-rock-emerges': 'Sex Pistols',
  'hip-hop-emerges': 'DJ Kool Herc',
  'roe-v-wade': 'Supreme Court of the United States',
  'aristotle-lyceum': 'Lyceum (Classical)',
  'euclid-elements': "Euclid's Elements",
  'septuagint-translated': 'Septuagint',
  'virgil-aeneid': 'Aeneid',
  'quran-compiled': 'Quran',
  'aquinas-summa': 'Summa Theologica',
  'wycliffe-bible': 'Wycliffe Bible',
  'giotto-scrovegni': 'Scrovegni Chapel',
  'petrarch-sonnets': 'Petrarch',
  'michelangelo-david': 'David (Michelangelo)',
  'britannica-first': 'Encyclopædia Britannica',
  'goethe-faust': 'Goethe\'s Faust',
  'louvre-opens': 'Louvre',
  'tchaikovsky-swan-lake': 'Swan Lake',
  'picasso-blue-period': 'Picasso\'s Blue Period',
  'surrealist-manifesto': 'Surrealist Manifesto',
  'gone-with-wind-film': 'Gone with the Wind (film)',
  'abstract-expressionism': 'Abstract expressionism',
  'elvis-first-single': 'Elvis Presley',
  'beatles-form': 'The Beatles',
  'punk-rock-emerges': 'Punk rock',
  'hip-hop-emerges': 'Hip hop',
  'nevermind-album': 'Nevermind',
  'boy-scouts-founded': 'Scouting',
  'roe-v-wade': 'Roe v. Wade',
  'nobel-prizes-first': 'Nobel Prize',
  'guernica-painted': 'Guernica (Picasso)',
  'warhol-soup-cans': "Campbell's Soup Cans",

  // Diplomatic (13 missing)
  'diocletian-tetrarchy': 'Tetrarchy',
  'capetian-dynasty': 'Hugh Capet',
  'gatt-established': 'World Trade Organization',
  'salt-i': 'Leonid Brezhnev',
  'salt-ii': 'SALT II',
  'china-un-seat': 'Mao Zedong',
  'haitian-independence': 'Haitian Revolution',
  'triple-alliance': 'Triple Alliance (1882)',
  'gatt-established': 'General Agreement on Tariffs and Trade',
  'seato-formed': 'Southeast Asia Treaty Organization',
  'efta-formed': 'European Free Trade Association',
  'salt-i': 'Strategic Arms Limitation Talks',
  'salt-ii': 'SALT II',
  'fourth-crusade-constantinople': 'Fourth Crusade',
  'china-un-seat': 'China and the United Nations',
  'eu-expansion-2004': '2004 enlargement of the European Union',

  // Disasters (29 missing)
  'aleppo-earthquake': 'Aleppo',
  'great-leap-forward-famine': 'Mao Zedong',
  'armenian-earthquake': 'Spitak',
  'north-korea-famine': 'Kim Jong-il',
  '365-crete-earthquake': 'Crete',
  'antioch-earthquake-526': 'Antioch on the Orontes',
  'calabria-earthquake': 'Reggio Calabria',
  'quetta-earthquake': 'Pakistan',
  'ashgabat-earthquake': 'Turkmenistan',
  'huaynaputina-eruption': 'Volcano',
  'finnish-famine-1866': 'Finnish famine of 1866–1868',
  'persian-famine-1917': 'Persian famine of 1917–1919',
  'holodomor': 'Holodomor',
  'bangladesh-famine-1974': 'Bangladesh famine of 1974',
  'antioch-earthquake-526': '526 Antioch earthquake',
  'calabria-earthquake': '1783 Calabrian earthquakes',
  'charleston-earthquake': '1886 Charleston earthquake',
  'valparaiso-earthquake': '1906 Valparaíso earthquake',
  'quetta-earthquake': '1935 Quetta earthquake',
  'ashgabat-earthquake': '1948 Ashgabat earthquake',
  'valdivia-earthquake': '1960 Valdivia earthquake',
  'peru-earthquake-1970': '1970 Ancash earthquake',
  'guatemala-earthquake': '1976 Guatemala earthquake',
  'iran-earthquake-1990': '1990 Manjil–Rudbar earthquake',
  'samalas-eruption': '1257 Samalas eruption',
  'huaynaputina-eruption': 'Huaynaputina',
  'vasa-sinking': 'Vasa (ship)',
  'sewol-ferry': 'Sinking of MV Sewol',
  'russian-flu-1889': '1889–1890 pandemic',
  'bangladesh-cyclone-1970': '1970 Bhola cyclone',
  'european-heat-wave': '2003 European heat wave',
  'australia-bushfires': '2019–20 Australian bushfire season',
  'yellowstone-supervolcano': 'Yellowstone Caldera',
  'justinian-plague-recurrence': 'Plague of Justinian',

  // Exploration (52 missing)
  'fire-mastery': 'Fire',
  'first-ivf': 'In vitro fertilisation',
  'test-tube-baby': 'In vitro fertilisation',
  'black-hole-image': 'Black hole',
  'rutherford-atomic-model': 'Atom',
  'hanno-africa': 'Phoenicia',
  'alphafold-protein': 'Protein structure',
  'invention-sail': 'Sail',
  'thales-eclipse': 'Thales of Miletus',
  'anaximander-world-map': 'Anaximander',
  'hippocrates-medicine': 'Hippocrates',
  'ptolemy-almagest': 'Almagest',
  'al-khwarizmi-algebra': 'Muhammad ibn Musa al-Khwarizmi',
  'fibonacci-arabic-numerals': 'Fibonacci',
  'vesalius-anatomy': 'Andreas Vesalius',
  'tycho-brahe-observatory': 'Tycho Brahe',
  'torricelli-barometer': 'Evangelista Torricelli',
  'hooke-discovers-cells': 'Robert Hooke',
  'franklin-kite-experiment': 'Kite experiment',
  'lavoisier-oxygen': 'Antoine Lavoisier',
  'volta-battery': 'Alessandro Volta',
  'faraday-electric-motor': 'Michael Faraday',
  'joule-thermodynamics': 'James Prescott Joule',
  'pasteur-germ-theory': 'Louis Pasteur',
  'bell-telephone': 'Alexander Graham Bell',
  'edison-phonograph': 'Phonograph',
  'koch-tuberculosis': 'Robert Koch',
  'hertz-radio-waves': 'Heinrich Hertz',
  'rutherford-atomic-model': 'Rutherford model',
  'penicillin-mass-produced': 'Penicillin',
  'test-tube-baby': 'Louise Brown',
  'pytheas-arctic': 'Pytheas',
  'hanno-africa': 'Hanno the Navigator',
  'buddhism-spreads-china': 'Buddhism in China',
  'chinese-discover-america-theory': 'Pre-Columbian trans-oceanic contact theories',
  'cortes-meets-aztecs': 'Hernán Cortés',
  'pizarro-meets-incas': 'Francisco Pizarro',
  'de-soto-mississippi': 'Hernando de Soto',
  'drake-circumnavigation': 'Francis Drake',
  'barents-arctic': 'Willem Barentsz',
  'la-salle-mississippi': 'René-Robert Cavelier, Sieur de La Salle',
  'dampier-circumnavigation': 'William Dampier',
  'humboldt-south-america': 'Alexander von Humboldt',
  'mungo-park-niger': 'Mungo Park (explorer)',
  'livingstone-stanley': 'David Livingstone',
  'shackleton-endurance': 'Imperial Trans-Antarctic Expedition',
  'spirit-of-st-louis': 'Spirit of St. Louis',
  'amelia-earhart-atlantic': 'Amelia Earhart',
  'bathyscaphe-trieste': 'Bathyscaphe Trieste',
  'mars-curiosity-landing': 'Curiosity (rover)',
  'spacex-reusable-rocket': 'SpaceX',
  'perseverance-mars-landing': 'Perseverance (rover)',
  'ingenuity-mars-flight': 'Ingenuity (helicopter)',
  'dart-asteroid-impact': 'Double Asteroid Redirection Test',
  'alphafold-protein': 'AlphaFold',
  'superconductor-claims': 'LK-99',

  // Infrastructure (15 missing)
  'chrysler-building': 'New York City',
  'cn-tower': 'Toronto',
  'hudson-yards': 'Manhattan',
  'jeddah-tower-begins': 'Skyscraper',
  'mycenaean-citadels': 'Mycenae',
  'first-cotton-mill': 'Cromford Mill',
  'liverpool-manchester-railway': 'Liverpool and Manchester Railway',
  'crystal-palace': 'The Crystal Palace',
  'st-gotthard-road-tunnel': 'Gotthard Road Tunnel',
  'hudson-yards': 'Hudson Yards',
  'jeddah-tower-begins': 'Jeddah Tower',
  'new-suez-canal': 'Suez Canal',
  'brasilia-built': 'Brasília',
  'at-and-t-building': '550 Madison Avenue',
  'crossrail-begins': 'Elizabeth line',
  'ferris-wheel-invented': 'Ferris wheel',
  'high-roller-vegas': 'High Roller (Ferris wheel)'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate multiple search term variations from a friendly name
 * to increase chances of finding a Wikipedia article with an image
 */
function generateSearchVariations(friendlyName) {
  const variations = [friendlyName];

  const addVariation = (v) => {
    if (v && !variations.includes(v)) {
      variations.push(v);
    }
  };

  // Remove common suffixes like "Begins", "Ends", "Discovered", "Invented", etc.
  const suffixPatterns = [
    / Begins$/i,
    / Ends$/i,
    / Starts$/i,
    / Started$/i,
    / Ended$/i,
    / Discovered$/i,
    / Invented$/i,
    / Founded$/i,
    / Established$/i,
    / Completed$/i,
    / Signed$/i,
    / Announced$/i,
    / Launched$/i,
    / Opens$/i,
    / Opened$/i,
    / Created$/i,
    / Built$/i,
    / Published$/i,
    / Released$/i,
    / Debuts$/i,
    / Premiered$/i,
    / Succeeds$/i,
    / Fails$/i,
    / Collapses$/i,
    / Dissolves$/i,
    / Assassinated$/i,
    / Executed$/i,
    / Killed$/i,
    / Dies$/i,
    / Born$/i,
    / Elected$/i,
    / Crowned$/i,
    / Takes Power$/i,
    / Becomes .+$/i,
    / Ratified$/i,
    / Crushed$/i,
    / Sunk$/i,
    / Erupts$/i,
    / Identified$/i,
    / Cloned$/i,
    / Legalized$/i,
    / Goes Viral$/i,
    / Flourishes$/i,
    / Expanded$/i,
    / Rebuilt$/i,
    / Extended$/i,
  ];

  for (const pattern of suffixPatterns) {
    if (pattern.test(friendlyName)) {
      const simplified = friendlyName.replace(pattern, '').trim();
      addVariation(simplified);
    }
  }

  // Remove common prefixes
  const prefixPatterns = [
    /^First /i,
    /^The /i,
    /^Discovery of /i,
    /^Invention of /i,
    /^Construction of /i,
    /^Opening of /i,
    /^Launch of /i,
    /^Start of /i,
    /^End of /i,
    /^Fall of /i,
    /^Rise of /i,
    /^Battle of /i,
    /^Siege of /i,
    /^Treaty of /i,
    /^Attack on /i,
    /^Death of /i,
    /^Sinking of /i,
    /^Eruption of /i,
  ];

  for (const pattern of prefixPatterns) {
    if (pattern.test(friendlyName)) {
      const simplified = friendlyName.replace(pattern, '').trim();
      addVariation(simplified);
    }
  }

  // Handle "X Sinks" -> "Sinking of X" pattern
  if (/ Sinks$/i.test(friendlyName)) {
    const subject = friendlyName.replace(/ Sinks$/i, '').trim();
    addVariation(`Sinking of the ${subject}`);
    addVariation(subject);
  }

  // Handle "X Erupts" -> "Eruption of X" or "YEAR eruption of X"
  if (/ Erupts$/i.test(friendlyName)) {
    const subject = friendlyName.replace(/ Erupts$/i, '').trim();
    addVariation(`Eruption of ${subject}`);
    addVariation(subject);
  }

  // Handle "X in Y" patterns - try both X and Y separately
  const inMatch = friendlyName.match(/^(.+) in (.+)$/i);
  if (inMatch) {
    addVariation(inMatch[1].trim()); // Try just X
    addVariation(inMatch[2].trim()); // Try just Y
  }

  // Handle "X of Y" patterns (but not "Battle of", "Fall of", etc.)
  const ofMatch = friendlyName.match(/^(.+) of (.+)$/i);
  if (ofMatch && !/^(Battle|Fall|Rise|Siege|Treaty|Attack|Sinking|Eruption|Death|End|Start|Discovery|Invention)$/i.test(ofMatch[1].trim())) {
    addVariation(ofMatch[2].trim()); // Try just Y (often the main subject)
  }

  // Handle person titles: "King X Executed" -> try "X" without title
  const personTitleMatch = friendlyName.match(/^(King|Queen|Emperor|President|Pope|Dr\.?|Sir|Prince|Princess|Duke|Duchess|Lord|Lady) (.+)$/i);
  if (personTitleMatch) {
    const restOfName = personTitleMatch[2];
    // Remove any action suffix
    const nameOnly = restOfName.replace(/ (Executed|Assassinated|Crowned|Elected|Dies|Born|Killed).*$/i, '').trim();
    addVariation(nameOnly);
    // Also try with title for Wikipedia article format
    addVariation(`${personTitleMatch[1]} ${nameOnly}`);
  }

  // Handle "[Person] [Action]" patterns - extract just the person name
  const personActionMatch = friendlyName.match(/^([A-Z][a-z]+ (?:[A-Z][a-z]+\.? ?)+)(Executed|Assassinated|Crowned|Elected|Dies|Born|Visits|Resigns|Attains|Becomes)/i);
  if (personActionMatch) {
    addVariation(personActionMatch[1].trim());
  }

  // Try extracting key nouns (remove articles, prepositions, etc.)
  // e.g., "Higgs Boson Discovered" -> "Higgs Boson", "Higgs boson"
  const words = friendlyName.split(' ');
  if (words.length >= 2) {
    // Try first two words (often the main subject)
    const firstTwo = words.slice(0, 2).join(' ');
    addVariation(firstTwo);

    // Try with lowercase second word (Wikipedia article style)
    const firstTwoLower = words[0] + ' ' + words.slice(1, 2).join(' ').toLowerCase();
    if (firstTwoLower !== firstTwo) {
      addVariation(firstTwoLower);
    }

    // Try first three words for longer names
    if (words.length >= 3) {
      const firstThree = words.slice(0, 3).join(' ');
      addVariation(firstThree);
    }
  }

  // Add lowercase version of main subject for scientific terms
  // e.g., "Higgs Boson" -> "Higgs boson"
  const lowercaseVariation = friendlyName.split(' ').map((word, i) =>
    i === 0 ? word : word.toLowerCase()
  ).join(' ');
  addVariation(lowercaseVariation);

  // Try adding "The" prefix for works/titles
  if (!friendlyName.startsWith('The ')) {
    addVariation(`The ${friendlyName}`);
  }

  return variations;
}

/**
 * Try to fetch a Wikipedia image using multiple search strategies
 */
async function tryFetchImage(searchTerm) {
  const encodedTitle = encodeURIComponent(searchTerm);

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.thumbnail?.source || null;
  } catch (error) {
    return null;
  }
}

async function fetchWikipediaImage(eventName, friendlyName) {
  // If there's a manual override, use it first
  if (SEARCH_OVERRIDES[eventName]) {
    const imageUrl = await tryFetchImage(SEARCH_OVERRIDES[eventName]);
    if (imageUrl) {
      console.log(`  [OK] Found image for "${friendlyName}" (via override: "${SEARCH_OVERRIDES[eventName]}")`);
      return imageUrl;
    }
    await sleep(RATE_LIMIT_MS);
  }

  // Generate and try multiple search variations
  const variations = generateSearchVariations(friendlyName);

  for (const searchTerm of variations) {
    const imageUrl = await tryFetchImage(searchTerm);

    if (imageUrl) {
      const note = searchTerm !== friendlyName ? ` (via: "${searchTerm}")` : '';
      console.log(`  [OK] Found image for "${friendlyName}"${note}`);
      return imageUrl;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`  [SKIP] No image found for "${friendlyName}" after trying ${variations.length} variations`);
  return null;
}

async function processJsonFile(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const events = JSON.parse(content);

  let updated = false;

  for (const event of events) {
    // Skip if already has an image_url
    if (event.image_url) {
      console.log(`  [CACHED] "${event.friendly_name}" already has image`);
      continue;
    }

    const imageUrl = await fetchWikipediaImage(event.name, event.friendly_name);

    if (imageUrl) {
      event.image_url = imageUrl;
      updated = true;
    }

    // Rate limiting
    await sleep(RATE_LIMIT_MS);
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
    console.log(`  [SAVED] Updated ${path.basename(filePath)}`);
  }

  return events.length;
}

async function findJsonFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Wikipedia Image Fetcher for Timeline Events');
  console.log('='.repeat(60));

  const jsonFiles = await findJsonFiles(EVENTS_DIR);
  console.log(`Found ${jsonFiles.length} event files to process`);

  let totalEvents = 0;

  for (const file of jsonFiles) {
    const count = await processJsonFile(file);
    totalEvents += count;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Done! Processed ${totalEvents} events across ${jsonFiles.length} files`);
  console.log('='.repeat(60));
}

main().catch(console.error);
