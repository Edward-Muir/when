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
const RATE_LIMIT_MS = 50; // Delay between API calls to avoid rate limiting

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

  // === ADDITIONAL MISSING IMAGE OVERRIDES ===

  // Conflict
  'kamikaze-mongol-fleet': 'Mongol invasions of Japan',
  'pompey-conquers-jerusalem': 'Pompey',

  // Cultural
  'war-of-the-worlds-broadcast': 'The War of the Worlds (1938 radio drama)',
  'war-of-worlds-radio': 'The War of the Worlds (1938 radio drama)',
  'british-slave-trade-abolished': 'Slave Trade Act 1807',
  'daguerreotype-photography': 'Daguerreotype',
  'daguerreotype': 'Daguerreotype',
  'ghana-independence': 'Ghana',
  'phoenician-alphabet-development': 'Phoenician alphabet',
  'phoenician-alphabet': 'Phoenician alphabet',
  'burning-of-books-and-scholars': 'Burning of books and burying of scholars',
  'burning-books-scholars': 'Burning of books and burying of scholars',
  'god-emperor-golden-throne': 'Emperor of Mankind',
  'plato-writes-republic': 'Republic (Plato)',
  'plato-republic': 'Republic (Plato)',

  // Diplomatic - Treaties and Independence
  'treaty-paris-american-independence': 'Treaty of Paris (1783)',
  'treaty-paris-1783': 'Treaty of Paris (1783)',
  'unification-upper-lower-egypt': 'Narmer',
  'egypt-unification': 'Narmer',
  'athens-surrenders-sparta': 'Peloponnesian War',
  'lex-hortensia': 'Lex Hortensia',
  'jin-dynasty-reunifies-china': 'Jin dynasty (266–420)',
  'jin-reunifies-china': 'Jin dynasty (266–420)',
  'seljuk-empire-founded': 'Seljuk Empire',
  'first-irrigation-systems': 'Irrigation',
  'david-establishes-jerusalem': 'David',
  'fall-israel-northern-kingdom': 'Kingdom of Israel (Samaria)',
  'caesar-invades-britain': 'Julius Caesar',
  'theodoric-ostrogothic-kingdom': 'Theodoric the Great',
  'rurik-founds-novgorod': 'Rurik',
  'toledo-reconquered': 'Reconquista',
  'henry-iv-deposes-richard-ii': 'Henry IV of England',
  'portuguese-capture-goa': 'Portuguese India',
  'augsburg-confession': 'Augsburg Confession',
  'pizarro-executes-atahualpa': 'Atahualpa',
  'servetus-burned-stake': 'Michael Servetus',
  'first-korean-turtle-ships': 'Turtle ship',
  'great-migration-massachusetts': 'Great Migration (Puritan)',
  'first-freemason-grand-lodge': 'Freemasonry',
  'stamp-act': 'Stamp Act 1765',
  'france-enters-american-revolution': 'France in the American Revolutionary War',
  'malthus-essay-population': 'An Essay on the Principle of Population',
  'dual-alliance': 'Dual Alliance (1879)',
  'bismarck-dismissed': 'Otto von Bismarck',
  'plessy-v-ferguson': 'Plessy v. Ferguson',
  'ethiopian-victory-adwa': 'Battle of Adwa',
  'us-annexes-hawaii': 'Annexation of Hawaii',
  'panama-independence': 'Separation of Panama from Colombia',
  'norway-independence-sweden': 'Dissolution of the union between Norway and Sweden',
  'austria-annexes-bosnia': 'Bosnian crisis',
  'japan-annexes-korea': 'Korea under Japanese rule',
  'black-thursday': 'Wall Street Crash of 1929',
  'japan-invades-manchuria': 'Japanese invasion of Manchuria',
  'us-leaves-gold-standard': 'Nixon shock',
  'italy-invades-ethiopia': 'Second Italo-Ethiopian War',
  'rhineland-remilitarized': 'Remilitarization of the Rhineland',
  'germany-absorbs-austria': 'Anschluss',
  'blitz-begins': 'The Blitz',
  'nuremberg-verdicts': 'Nuremberg trials',
  'truman-doctrine': 'Truman Doctrine',
  'indonesia-independence': 'Proclamation of Indonesian Independence',
  'treaty-paris-ecsc': 'Treaty of Paris (1951)',
  'egyptian-revolution': 'Egyptian revolution of 1952',
  'de-stalinization-speech': 'On the Cult of Personality and Its Consequences',
  'morocco-independence': 'Morocco',
  'tunisia-independence': 'History of Tunisia',
  'alaska-hawaii-statehood': 'Alaska',
  'algeria-independence': 'Algerian War',
  'mandela-sentenced': 'Rivonia Trial',
  'khrushchev-ousted': 'Nikita Khrushchev',
  'miranda-v-arizona': 'Miranda v. Arizona',
  'paris-may-events': 'May 68',
  'end-bretton-woods': 'Nixon shock',
  'bloody-sunday-ireland': 'Bloody Sunday (1972)',
  'oil-crisis': '1973 oil crisis',
  'cyprus-divided': 'Turkish invasion of Cyprus',
  'spanish-democracy-transition': 'Spanish transition to democracy',
  'djibouti-independence': 'Djibouti',
  'vietnam-invades-cambodia': 'Cambodian–Vietnamese War',
  'zimbabwe-independence': 'Zimbabwe',
  'sdi-announced': 'Strategic Defense Initiative',
  'glasnost-perestroika': 'Perestroika',
  'us-bombs-libya': '1986 United States bombing of Libya',
  'black-monday': 'Black Monday (1987)',
  'soviet-withdrawal-afghanistan': 'Soviet–Afghan War',
  'iraq-invades-kuwait': 'Invasion of Kuwait',
  'namibia-independence': 'Namibia',
  'anc-unbanned': 'African National Congress',
  'slovenia-croatia-independence': 'Ten-Day War',
  'eritrea-independence': 'Eritrea',
  'anc-wins-election': '1994 South African general election',
  'amazon-founded': 'Amazon (company)',
  'taliban-takes-kabul': 'Taliban',
  'welfare-reform-act': 'Personal Responsibility and Work Opportunity Act',
  'blair-becomes-pm': 'Tony Blair',
  'nato-kosovo-campaign': 'NATO bombing of Yugoslavia',
  'euro-coins-circulation': 'Euro',
  'montenegro-independence': 'Montenegro',
  'burma-saffron-revolution': 'Saffron Revolution',
  'kosovo-independence': 'Kosovo',
  'obama-inaugurated': 'First inauguration of Barack Obama',
  'wikileaks-cables': 'United States diplomatic cables leak',
  'chilean-mine-rescue': '2010 Copiapó mining accident',
  'egyptian-revolution-2011': 'Egyptian revolution of 2011',
  'refugee-crisis-peak': 'European migrant crisis',
  'trump-inauguration': 'Inauguration of Donald Trump',
  'us-north-korea-summit': '2018 North Korea–United States Singapore Summit',
  'us-withdrawal-afghanistan': 'Withdrawal of United States troops from Afghanistan (2020–2021)',
  'cop26-glasgow': '2021 United Nations Climate Change Conference',
  'taliban-return-power': 'Fall of Kabul (2021)',
  'iran-protests': 'Mahsa Amini protests',
  'pelosi-taiwan-visit': 'Pelosi visit to Taiwan',
  'ai-rapid-advancement-gpt4': 'GPT-4',

  // Disasters
  'svb-collapse': 'Silicon Valley Bank',

  // Exploration
  'first-stone-tools': 'Oldowan',
  'domestication-sheep-goats': 'Sheep',
  'buddhism-introduced-japan': 'Buddhism in Japan',
  'gunpowder-formula-recorded': 'Gunpowder',
  'silver-discovered-potosi': 'Potosí',
  'penny-post-introduced': 'Uniform Penny Post',
  'general-strike-britain': '1926 United Kingdom general strike',
  'first-soviet-nuclear-test': 'RDS-1',
  'first-hydrogen-bomb-test': 'Ivy Mike',
  'geneva-summit': 'Geneva Summit (1955)',
  'viking-lands-mars': 'Viking program',
  'first-space-shuttle-launch': 'STS-1',

  // Infrastructure
  'museum-alexandria-founded': 'Library of Alexandria',
  'transatlantic-cable-completed': 'Transatlantic telegraph cable',
  'first-commercial-radio-broadcast': 'History of radio',

  // === ROUND 2 MISSING IMAGE OVERRIDES (exact name matches) ===

  // Cultural
  'war-of-worlds-broadcast': 'Orson Welles',
  'phoenician-alphabet': 'Phoenician alphabet',
  'qin-book-burning': 'Burning of books and burying of scholars',

  // Diplomatic - Ancient/Medieval
  'unification-egypt': 'Narmer',
  'lex-hortensia': 'Lex Hortensia',
  'seljuk-empire-founded': 'Great Seljuk Empire',
  'david-establishes-jerusalem-capital': 'King David',
  'fall-of-israel-northern-kingdom': 'Kingdom of Israel (Samaria)',
  'theodoric-establishes-ostrogothic-kingdom': 'Theodoric the Great',
  'augsburg-confession': 'Augsburg Confession',
  'servetus-burned-at-stake': 'Michael Servetus',

  // Modern History
  'plessy-v-ferguson': 'Plessy v. Ferguson',
  'truman-doctrine': 'Truman Doctrine',
  'treaty-of-paris-ecsc': 'European Coal and Steel Community',
  'egyptian-revolution-1952': 'Egyptian revolution of 1952',
  'de-stalinization-speech': 'On the Cult of Personality and Its Consequences',
  'mandela-sentenced': 'Rivonia Trial',
  'miranda-v-arizona': 'Miranda v. Arizona',
  'end-of-bretton-woods': 'Nixon shock',
  'oil-crisis-1973': '1973 oil crisis',
  'wikileaks-cables': 'WikiLeaks',
  'trump-inauguration': 'Donald Trump',
  'taliban-return-to-power': 'Fall of Kabul (2021)',
  'iran-protests-2022': 'Mahsa Amini protests',
  'pelosi-taiwan-visit': 'Nancy Pelosi',

  // Exploration
  'domestication-of-sheep-and-goats': 'Domestic sheep',
  'buddhism-officially-introduced-to-japan': 'Buddhism in Japan',
  'gunpowder-formula-first-recorded': 'History of gunpowder',
  'silver-discovered-at-potosi': 'Potosí',
  'general-strike-in-britain': '1926 United Kingdom general strike',
  'viking-lands-on-mars': 'Viking 1',

  // === ROUND 3 - Final missing images ===
  'phoenician-alphabet': 'Alphabet',
  'lex-hortensia': 'Roman law',
  'seljuk-empire-founded': 'Tughril',
  'augsburg-confession': 'Martin Luther',
  'plessy-v-ferguson': 'Racial segregation in the United States',
  'truman-doctrine': 'Harry S. Truman',
  'de-stalinization-speech': 'Nikita Khrushchev',
  'mandela-sentenced': 'Nelson Mandela',
  'miranda-v-arizona': 'Miranda warning',

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
  'high-roller-vegas': 'High Roller (Ferris wheel)',

  // === NEW MISSING IMAGE OVERRIDES (50 events) ===

  // Conflict (8 missing)
  'napoleon-escapes-elba': 'Hundred Days',
  'napoleon-hundred-days': 'Hundred Days',
  'batista-cuba-coup': 'Fulgencio Batista',
  'operation-chopper-vietnam': 'Vietnam War',
  'uss-pueblo-seized': 'USS Pueblo (AGER-2)',
  'jan-palach-death': 'Jan Palach',
  'biafra-capitulates': 'Nigerian Civil War',
  'beslan-school-siege': 'Beslan',

  // Cultural (12 missing)
  'nara-period-begins': 'Nara, Nara',
  'kamakura-shogunate': 'Minamoto no Yoritomo',
  'nascar-incorporated': 'Stock car racing',
  'russia-anno-domini': 'Soviet calendar',
  'beethoven-first-symphony': 'Symphony No. 1 (Beethoven)',
  'ford-five-dollar-wage': 'Henry Ford',
  'ulysses-published': 'Ulysses (novel)',
  'islamic-caliphate-abolished': 'Abolition of the Caliphate',
  'gandhi-salt-march': 'Salt March',
  'pinocchio-premieres': 'Pinocchio (1940 film)',
  'tokyo-olympics-1964': '1964 Summer Olympics',
  'beijing-olympics-2008': '2008 Summer Olympics',

  // Diplomatic (8 missing)
  'bolivia-independence': 'Bolivia',
  'last-emperor-china-abdicates': 'Puyi',
  'rhineland-remilitarization': 'Remilitarization of the Rhineland',
  'burma-independence': 'Myanmar',
  'reform-opening-china': 'Chinese economic reform',
  'ussr-dissolved': 'Dissolution of the Soviet Union',
  'china-wto-entry': 'China and the World Trade Organization',
  'belt-road-initiative': 'Xi Jinping',

  // Disasters (3 missing)
  'great-boston-fire-1760': 'Boston',
  'nepal-bihar-earthquake-1934': '1934 Nepal–India earthquake',
  'tonghai-earthquake': '1970 Tonghai earthquake',

  // Exploration (16 missing)
  'first-newspaper-americas': 'Boston News-Letter',
  'dampier-new-britain': 'New Britain',
  'first-synagogue-nyc': 'Congregation Shearith Israel',
  'continental-drift-theory': 'Alfred Wegener',
  'first-scheduled-airline': 'St. Petersburg–Tampa Airboat Line',
  'first-insulin-injection': 'Insulin',
  'television-first-demonstration': 'John Logie Baird',
  'goddard-liquid-rocket': 'Robert H. Goddard',
  'first-woman-us-senator': 'Hattie Caraway',
  'georgetown-ibm-machine-translation': 'Machine translation',
  'uss-nautilus-launched': 'USS Nautilus (SSN-571)',
  'van-allen-belt-detected': 'Van Allen radiation belt',
  'japan-launches-ohsumi': 'Ōsumi (satellite)',
  'first-dna-sequencing': 'DNA sequencing',
  'india-mars-mission': 'Mars Orbiter Mission',
  'china-moon-samples': "Chang'e 5",

  // Infrastructure (3 missing)
  'singapore-founded': 'Stamford Raffles',
  'india-first-railway': 'Indian Railways',
  'china-high-speed-rail': 'High-speed rail in China',

  // === INVENTIONS CATEGORY ===
  'pottery-invented': 'Pottery',
  'bow-and-arrow-invented': 'Bow and arrow',
  'plow-invented': 'Ard (plough)',
  'bronze-smelting': 'Bronze Age',
  'crossbow-invented': 'Crossbow',
  'catapult-invented': 'Catapult',
  'roman-concrete': 'Roman concrete',
  'chainmail-armor': 'Chain mail',
  'astrolabe-invented': 'Astrolabe',
  'coins-invented': 'Lydia',
  'roman-aqueducts': 'Roman aqueduct',
  'windmill-invented': 'Windmill',
  'mechanical-clock': 'Clock',
  'knitting-machine': 'Stocking frame',
  'pendulum-clock': 'Pendulum clock',
  'piano-invented': 'Piano',
  'seed-drill': 'Seed drill',
  'newcomen-steam-engine': 'Newcomen atmospheric engine',
  'sextant-invented': 'Sextant',
  'lightning-rod': 'Lightning rod',
  'marine-chronometer': 'Marine chronometer',
  'flush-toilet': 'Flush toilet',
  'hot-air-balloon': 'Montgolfier brothers',
  'parachute-invented': 'Parachute',
  'cotton-gin': 'Cotton gin',
  'steam-locomotive': 'Steam locomotive',
  'canning-invented': 'Canning',
  'stethoscope-invented': 'Stethoscope',
  'bicycle-invented': 'Draisine',
  'portland-cement': 'Portland cement',
  'typewriter-invented': 'Typewriter',
  'mechanical-reaper': 'Reaper (agriculture)',
  'combine-harvester': 'Combine harvester',
  'revolver-invented': 'Colt Paterson',
  'vulcanized-rubber': 'Vulcanization',
  'anesthesia-invented': 'General anaesthesia',
  'sewing-machine': 'Sewing machine',
  'safety-pin-invented': 'Safety pin',
  'elevator-invented': 'Elevator',
  'bessemer-steel-process': 'Bessemer process',
  'internal-combustion-engine': 'Internal combustion engine',
  'submarine-first-practical': 'Submarine',
  'pasteurization-invented': 'Pasteurization',
  'barbed-wire-invented': 'Barbed wire',
  'kodak-roll-film-camera': 'Kodak',
  'contact-lens-invented': 'Contact lens',
  'wind-turbine-invented': 'Wind turbine',
  'motion-picture-camera': 'Kinetoscope',
  'zipper-invented': 'Zipper',
  'lumiere-cinematograph': 'Cinématographe',
  'aspirin-invented': 'Aspirin',
  'air-conditioner-invented': 'Air conditioning',
  'electrocardiogram-invented': 'Electrocardiography',
  'haber-process': 'Haber process',
  'ford-assembly-line': 'Assembly line',
  'color-film-technicolor': 'Technicolor',
  'tank-invented': 'Mark I tank',
  'jet-engine-invented': 'Jet engine',
  'radar-developed': 'Radar',
  'nylon-invented': 'Nylon',
  'helicopter-modern': 'Sikorsky R-4',
  'kidney-dialysis': 'Dialysis',
  'microwave-oven-invented': 'Microwave oven',
  'velcro-invented': 'Velcro',
  'credit-card-invented': 'Credit card',
  'first-solar-cell': 'Solar cell',
  'first-organ-transplant': 'Organ transplantation',
  'first-nuclear-power-plant': 'Calder Hall',
  'cochlear-implant': 'Cochlear implant',
  'pacemaker-implanted': 'Artificial cardiac pacemaker',
  'oral-contraceptive-pill': 'Combined oral contraceptive pill',
  'communications-satellite': 'Telstar',
  'compact-cassette': 'Compact Cassette',
  'kevlar-invented': 'Kevlar',
  'atm-invented': 'Automated teller machine',
  'floppy-disk-invented': 'Floppy disk',
  'microprocessor-invented': 'Intel 4004',
  'email-invented': 'Email',
  'pong-arcade-game': 'Pong',
  'ethernet-invented': 'Ethernet',
  'first-mobile-phone-call': 'History of mobile phones',
  'personal-computer': 'Altair 8800',
  'gps-system': 'Global Positioning System',
  'ivf-first-baby': 'In vitro fertilisation',
  'compact-disc-invented': 'Compact disc',
  'artificial-heart-implanted': 'Jarvik-7',
  'dna-fingerprinting': 'DNA profiling',
  'washing-machine-electric': 'Washing machine',
  'vacuum-cleaner-electric': 'Vacuum cleaner',
  'dishwasher-invented': 'Dishwasher',
  'lithium-ion-battery': 'Lithium-ion battery',
  'dvd-invented': 'DVD',
  'usb-standard': 'USB',
  'wifi-standard': 'Wi-Fi',
  'bluetooth-invented': 'Bluetooth',
  'youtube-launched': 'YouTube',
  'tesla-model-s': 'Tesla Model S',
  'consumer-3d-printing': '3D printing',
  'geodesic-dome': 'Geodesic dome',
  'steel-frame-skyscraper': 'Skyscraper',
  'refrigerator-invented': 'Refrigerator',
  'kindle-ereader': 'Amazon Kindle',
  'first-arcade-video-game': 'Computer Space',
  'coca-cola-invented': 'Coca-Cola',
  'silk-production-invented': 'Silk',
  'candle-invented': 'Candle',
  'soap-invented': 'Soap',
  'abacus-invented': 'Abacus',
  'locks-and-keys-invented': 'Lock and key',
  'sundial-invented': 'Sundial',
  'scissors-invented': 'Scissors',
  'water-wheel-invented': 'Water wheel',
  'arched-bridge-invented': 'Arch bridge',
  'compound-pulley-archimedes': 'Archimedes',
  'blast-furnace-invented': 'Blast furnace',
  'wheelbarrow-invented': 'Wheelbarrow',
  'stirrup-invented': 'Stirrup',
  'horseshoe-invented': 'Horseshoe',
  'spinning-wheel-invented': 'Spinning wheel',
  'trebuchet-invented': 'Trebuchet',
  'longbow-developed': 'English longbow',
  'mercury-thermometer': 'Thermometer',
  'spinning-mule': 'Spinning mule',
  'threshing-machine': 'Threshing',
  'gas-lighting': 'Gas lighting',
  'corkscrew-patented': 'Corkscrew',
  'jacquard-loom': 'Jacquard machine',
  'arc-lamp': 'Arc lamp',
  'metronome-patented': 'Metronome',
  'electric-motor': 'Electric motor',
  'braille-invented': 'Braille',
  'electromagnet-invented': 'Electromagnet',
  'friction-match': 'Match',
  'lawn-mower-invented': 'Lawn mower',
  'electric-generator': 'Electric generator',
  'stereoscope-invented': 'Stereoscope',
  'postage-stamp': 'Postage stamp',
  'calotype-photography': 'Calotype',
  'rubber-band-patented': 'Rubber band',
  'can-opener-invented': 'Tin can',
  'gatling-gun': 'Gatling gun',
  'reinforced-concrete': 'Reinforced concrete',
  'stock-ticker': 'Stock ticker',
  'stapler-invented': 'Stapler',
  'cash-register': 'James Ritty',
  'electric-streetcar': 'Tram',
  'electric-fan': 'Fan (machine)',
  'fountain-pen': 'Fountain pen',
  'steam-turbine': 'Steam turbine',
  'pneumatic-tire': 'Pneumatic tire',
  'jukebox-invented': 'Jukebox',
  'escalator-invented': 'Escalator',
  'player-piano': 'Player piano',
  'diesel-engine': 'Diesel engine',
  'electric-hearing-aid': 'Ear trumpet',
  'zeppelin-airship': 'Zeppelin',
  'safety-razor': 'Safety razor',
  'bakelite-plastic': 'Bakelite',
  'neon-lighting': 'Neon sign',
  'stainless-steel': 'Stainless steel',
  'electric-traffic-light': 'Traffic light',
  'band-aid-invented': 'Band-Aid',
  'pop-up-toaster': 'Toaster',
  'frozen-food': 'Frozen food',
  'scotch-tape': 'Scotch Tape',
  'parking-meter': 'Parking meter',
  'ballpoint-pen': 'Ballpoint pen',
  'teflon-discovered': 'Polytetrafluoroethylene',
  'tupperware-introduced': 'Earl Tupper',
  'polaroid-camera': 'Instant camera',
  'transistor-radio': 'Transistor radio',
  'tv-remote-control': 'Remote control',
  'xerox-photocopier': 'Xerox',
  'led-invented': 'Light-emitting diode',
  'computer-mouse': 'Computer mouse',
  'fiber-optics': 'Optical fiber',
  'barcode-scanned': 'Barcode',
  'vhs-videotape': 'VHS',
  'atari-2600': 'Atari 2600',
  'post-it-notes': 'Post-it note',
  'game-boy-released': 'Game Boy',
  'mosaic-web-browser': 'Mosaic (web browser)',
  'napster-launched': 'Shawn Fanning',
  'segway-unveiled': 'Segway',
  'first-space-tourist': 'Dennis Tito',
  'roomba-released': 'Roomba',
  'spotify-launched': 'Daniel Ek',
  'dji-phantom-drone': 'DJI (company)',
  'lab-grown-burger': 'Cultured meat',
  'oculus-rift-vr': 'Oculus Rift',
  'amazon-echo-launched': 'Amazon Alexa',
  'electric-scooter-sharing': 'Electric kick scooter',
  'waymo-self-driving': 'Waymo'
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
    / Begin$/i,
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
    / Premieres$/i,
    / Succeeds$/i,
    / Fails$/i,
    / Collapses$/i,
    / Dissolves$/i,
    / Dissolved$/i,
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
    / Incorporated$/i,
    / Abolished$/i,
    / Abdicates$/i,
    / Seized$/i,
    / Capitulates$/i,
    / Adopted$/i,
    / Adopts .+$/i,
    / Joins .+$/i,
    / Escapes .+$/i,
    / Reoccupies .+$/i,
    / Return$/i,
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

  // Handle possessive forms: "Beethovens First Symphony" -> "Beethoven"
  const possessiveMatch = friendlyName.match(/^([A-Z][a-z]+)s /);
  if (possessiveMatch) {
    addVariation(possessiveMatch[1]); // Just the name
    // Also try common patterns like "Beethoven's First Symphony" -> "Symphony No. 1 (Beethoven)"
    const rest = friendlyName.substring(possessiveMatch[0].length);
    if (rest.includes('Symphony')) {
      addVariation(`${possessiveMatch[1]}'s ${rest}`);
    }
  }

  // Handle "City Olympics" -> "YEAR Summer Olympics" pattern
  if (/Olympics$/i.test(friendlyName)) {
    const city = friendlyName.replace(/ Olympics$/i, '').trim();
    addVariation(`${city} Olympics`);
    addVariation(city);
    // Common Olympics searches
    addVariation('Summer Olympics');
  }

  // Handle "X's Y" pattern (possessive with apostrophe)
  const apostropheMatch = friendlyName.match(/^([^']+)'s (.+)$/);
  if (apostropheMatch) {
    addVariation(apostropheMatch[1]); // Just the owner
    addVariation(apostropheMatch[2]); // Just the thing
  }

  // Handle country/location + event patterns
  const countryEventMatch = friendlyName.match(/^(China|India|Japan|Russia|Germany|France|Britain|USA|US|UK)'?s? (.+)$/i);
  if (countryEventMatch) {
    addVariation(countryEventMatch[2]); // Just the event
    addVariation(`${countryEventMatch[2]} in ${countryEventMatch[1]}`);
  }

  // Handle "X Minimum Wage" patterns
  if (/Minimum Wage$/i.test(friendlyName)) {
    addVariation('Minimum wage');
    const match = friendlyName.match(/^(.+?) (?:Dollar |)Minimum Wage$/i);
    if (match) {
      addVariation(match[1]);
    }
  }

  // Handle "X Network Begins" patterns
  if (/Network/i.test(friendlyName)) {
    const networkMatch = friendlyName.match(/(.+?)\s*Network/i);
    if (networkMatch) {
      addVariation(networkMatch[1].trim());
    }
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
