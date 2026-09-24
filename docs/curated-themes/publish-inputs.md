# Publish inputs

One ready-to-paste theme object per curated theme, in the exact shape the
`theme` input of `.github/workflows/publish-theme.yml` expects.

## Before you dispatch

**Replace the `dates` placeholder.** Every theme below carries `["2099-01-01"]`,
which is deliberately far future so a careless paste schedules nothing real.

**A date can only be set before it opens.** Puzzle date `D` opens at `D-1 10:00Z`
(midnight in UTC+14), so from Pacific time tomorrow is settable until 03:00 PT and
after that the next clean date is the day after. Publishing rejects a date that has
already opened, and **never rewrite a date that is today or past** — `dailyRecency`
replays the last 28 days to build its exclusion chain, so a retroactive edit makes it
replay decks nobody played. See [index.md](index.md).

**Run `mode: validate` first.** It writes nothing (`dryRun`) and reports what the
catalogue-aware checks think. A theme carrying un-illustrated events will fail on
unresolved slugs — that is expected, not a defect, and is the art column below.

## Art status

`loadAllEvents` hides any event without Cloudinary art, so a deck cannot be dealt —
or validated — until every slug in it is illustrated.

| Theme               | Cards | Awaiting art | Publishable now |
| ------------------- | ----: | -----------: | --------------- |
| `assassinations`    |    36 |           22 | no              |
| `automata`          |    35 |           21 | no              |
| `ciphers`           |    36 |           34 | no              |
| `clockwork`         |    36 |           21 | no              |
| `cosmic-ideas`      |    36 |           19 | no              |
| `crossings`         |    36 |           15 | no              |
| `eureka`            |    36 |           10 | no              |
| `games`             |    36 |           15 | no              |
| `kings-of-england`  |    36 |           18 | no              |
| `light`             |    35 |           22 | no              |
| `lost-and-found`    |    35 |           25 | no              |
| `mapmakers`         |    36 |           23 | no              |
| `money`             |    36 |            7 | no              |
| `nations-of-europe` |    35 |           23 | no              |
| `numbers`           |    36 |           19 | no              |
| `plagues`           |    36 |            9 | no              |
| `the-deep`          |    34 |           30 | no              |
| `upheaval`          |    36 |            8 | no              |
| `what-we-drink`     |    36 |           15 | no              |

## The themes

### Assassinations — `assassinations`

```json
{
  "id": "assassinations",
  "name": "Assassinations",
  "eventNames": [
    "sennacherib-assassinated",
    "death-xerxes-i",
    "philip-ii-macedon-assassinated",
    "julius-caesar",
    "caligula-assassinated",
    "commodus-assassinated",
    "hypatia-of-alexandria-killed",
    "caliph-ali-assassination",
    "nikephoros-phokas-assassinated",
    "nizam-al-mulk-assassinated",
    "murder-thomas-becket",
    "kamakura-internal-conflicts",
    "wat-tyler-killed",
    "louis-of-orleans-assassinated",
    "pazzi-conspiracy",
    "murder-of-lord-darnley",
    "william-of-orange-assassinated",
    "henry-iv-france-assassinated",
    "wallenstein-assassinated",
    "peter-iii-of-russia-killed",
    "marat-killed-by-corday",
    "spencer-perceval-assassinated",
    "jackson-assassination-attempt",
    "lincoln-assassination",
    "assassination-of-alexander-ii",
    "assassination-of-mckinley",
    "archduke-franz-ferdinand-assassinated",
    "pancho-villa-assassinated",
    "trotsky-assassinated",
    "gandhi-assassination",
    "jfk-assassination",
    "mlk-assassination",
    "sadat-assassinated",
    "rabin-assassinated",
    "bhutto-assassinated",
    "khashoggi-murder"
  ],
  "dates": ["2099-01-01"]
}
```

### Automata — `automata`

```json
{
  "id": "automata",
  "name": "Automata",
  "eventNames": [
    "yan-shi-mechanical-man",
    "archytas-flying-dove",
    "antikythera-mechanism",
    "ctesibius-float-regulator",
    "vending-machine",
    "ma-jun-south-pointing-chariot",
    "escapement-mechanism",
    "banu-musa-ingenious-devices",
    "su-song-clock-tower",
    "al-jazari-mechanical-art",
    "mechanical-clock",
    "strasbourg-clock-rooster",
    "joseon-sejong-water-clock",
    "leonardo-mechanical-knight",
    "turriano-mechanical-friar",
    "mechanical-calculator-pascaline",
    "vaucanson-digesting-duck",
    "jaquet-droz-writer-automaton",
    "watt-centrifugal-governor",
    "jacquard-loom",
    "babbage-difference-engine",
    "babbage-analytical-engine",
    "whitehead-torpedo",
    "johnson-thermostat",
    "player-piano",
    "sperry-gyroscopic-autopilot",
    "grey-walter-tortoises",
    "mark-i-perceptron",
    "unimate-industrial-robot",
    "shakey-the-robot",
    "self-driving-car-prototype",
    "deep-blue-beats-kasparov",
    "darpa-grand-challenge-won",
    "alphago-beats-lee-sedol",
    "chatgpt-released"
  ],
  "dates": ["2099-01-01"]
}
```

### Codes & Ciphers — `ciphers`

```json
{
  "id": "ciphers",
  "name": "Codes & Ciphers",
  "eventNames": [
    "mesopotamian-glaze-cipher",
    "atbash-cipher-scribes",
    "histiaeus-tattooed-message",
    "spartan-scytale-cipher",
    "aeneas-tacticus-secret-messages",
    "polybius-square-cipher",
    "caesar-shift-cipher",
    "kamasutra-secret-writing",
    "al-kindi-frequency-analysis",
    "voynich-manuscript-created",
    "alberti-cipher-disk",
    "trithemius-polygraphia",
    "babington-plot-cipher-broken",
    "bacon-bilateral-cipher",
    "great-cipher-of-france",
    "vienna-black-chamber",
    "jefferson-wheel-cipher",
    "great-paris-cipher-broken",
    "playfair-cipher-invented",
    "kasiski-vigenere-attack",
    "kerckhoffs-principle",
    "zimmermann-telegram",
    "vernam-one-time-pad",
    "enigma-machine-sold",
    "rejewski-breaks-enigma",
    "turing-bombe-bletchley",
    "colossus-lorenz-codebreaker",
    "shannon-perfect-secrecy",
    "crypto-ag-rigged-machines",
    "diffie-hellman-key-exchange",
    "rsa-algorithm-published",
    "quantum-key-distribution",
    "pgp-encryption-released",
    "aes-encryption-standard",
    "snowden-revelations",
    "zodiac-cipher-solved"
  ],
  "dates": ["2099-01-01"]
}
```

### Clockwork — `clockwork`

```json
{
  "id": "clockwork",
  "name": "Clockwork",
  "eventNames": [
    "gnomon-shadow-clock",
    "water-clock",
    "sundial-invented",
    "babylonian-hour-division",
    "metonic-cycle",
    "antikythera-mechanism",
    "mayan-written-calendar",
    "julian-calendar-reform",
    "incense-clock",
    "dionysius-anno-domini",
    "hijri-calendar-adopted",
    "escapement-mechanism",
    "su-song-clock-tower",
    "mechanical-clock",
    "sandglass-at-sea",
    "salisbury-cathedral-clock",
    "prague-astronomical-clock",
    "henlein-portable-watch",
    "gregorian-calendar-reform",
    "galileo-pendulum-isochronism",
    "pendulum-clock",
    "balance-spring-watch",
    "longitude-act",
    "marine-chronometer",
    "french-republican-calendar",
    "wristwatch",
    "railway-time-britain",
    "great-clock-westminster",
    "time-zone-development",
    "daylight-saving-time",
    "quartz-clock",
    "atomic-clock-first",
    "si-second-caesium",
    "utc-leap-second",
    "y2k",
    "leap-second-retired"
  ],
  "dates": ["2099-01-01"]
}
```

### Cosmic Ideas — `cosmic-ideas`

```json
{
  "id": "cosmic-ideas",
  "name": "Cosmic Ideas",
  "eventNames": [
    "thales-eclipse",
    "anaximander-earth-in-space",
    "aristotle-celestial-spheres",
    "aristarchus-heliocentric",
    "eratosthenes-earth-circumference",
    "hipparcus-astronomy",
    "ptolemy-almagest",
    "aryabhata-astronomy",
    "al-battani-solar-year",
    "ibn-al-haytham-doubts-ptolemy",
    "tusi-couple-planetary-model",
    "ibn-al-shatir-lunar-model",
    "cusa-infinite-universe",
    "copernican-revolution",
    "tycho-new-star",
    "giordano-bruno-burned",
    "kepler-planetary-laws",
    "galileos-trial",
    "newton-principia",
    "kant-island-universes",
    "herschel-milky-way-shape",
    "olbers-dark-night-sky",
    "bessel-stellar-parallax",
    "kirchhoff-stellar-composition",
    "general-relativity",
    "hubble-galaxies",
    "expanding-universe",
    "zwicky-dark-matter",
    "gamow-hot-big-bang",
    "stellar-nucleosynthesis-b2fh",
    "cosmic-microwave-background",
    "hawking-radiation",
    "cosmic-inflation-theory",
    "first-exoplanet",
    "dark-energy-discovered",
    "gravitational-waves"
  ],
  "dates": ["2099-01-01"]
}
```

### Bridges & Tunnels — `crossings`

```json
{
  "id": "crossings",
  "name": "Bridges & Tunnels",
  "eventNames": [
    "hezekiah-tunnel-jerusalem",
    "tunnel-engineering",
    "xerxes-hellespont-bridge",
    "roman-aqueducts",
    "arched-bridge-invented",
    "caesar-rhine-bridge",
    "aqueduct-pont-garros",
    "first-aqueduct",
    "trajans-bridge-danube",
    "anji-bridge-china",
    "luoyang-bridge-quanzhou",
    "pont-old-london",
    "yuan-grand-canal",
    "ponte-vecchio-florence",
    "charles-bridge-prague",
    "stari-most-mostar",
    "rialto-bridge",
    "pont-neuf-paris",
    "canal-du-midi-opens",
    "ladoga-canal",
    "canal-network-britain",
    "iron-bridge",
    "pontcysyllte-aqueduct",
    "menai-suspension-bridge",
    "thames-tunnel-opens",
    "suez-canal",
    "brooklyn-bridge-completed",
    "tower-bridge-london",
    "panama-canal",
    "sydney-harbour-bridge",
    "golden-gate-bridge",
    "mackinac-bridge",
    "bosphorus-bridge",
    "chunnel-completed",
    "millau-viaduct",
    "gotthard-base-tunnel"
  ],
  "dates": ["2099-01-01"]
}
```

### Eureka Moments — `eureka`

```json
{
  "id": "eureka",
  "name": "Eureka Moments",
  "eventNames": [
    "pythagoras-theorem",
    "archimedes-principle",
    "eratosthenes-earth-circumference",
    "hipparchus-precession",
    "zhang-heng-lunar-eclipse",
    "gunpowder-invented",
    "ibn-sahl-refraction",
    "al-haytham-optics",
    "al-biruni-geography-astronomy",
    "shen-kuo-explains-fossils",
    "peregrinus-magnetic-poles",
    "copernican-revolution",
    "tycho-new-star",
    "galileo-jupiter-moons",
    "harvey-blood-circulation",
    "newton-gravity",
    "leeuwenhoek-bacteria",
    "franklin-kite-experiment",
    "hutton-deep-time",
    "jenner-vaccination-smallpox",
    "electromagnetism-discovered",
    "electric-generator",
    "hamilton-quaternions",
    "cholera-london",
    "kekule-benzene-ring",
    "michelson-morley-experiment",
    "x-rays-discovered",
    "atomic-nucleus",
    "penicillin-discovered",
    "nuclear-fission",
    "dna-structure",
    "cosmic-microwave-background",
    "asteroid-killed-dinosaurs",
    "fermat-last-theorem-proved",
    "graphene-isolated",
    "gravitational-waves"
  ],
  "dates": ["2099-01-01"]
}
```

### The Games Board — `games`

```json
{
  "id": "games",
  "name": "The Games Board",
  "eventNames": [
    "senet-board-game-egypt",
    "dice",
    "royal-game-of-ur",
    "nine-mens-morris-game",
    "mancala-sowing-game",
    "knucklebones-astragaloi",
    "go-game-china",
    "ludus-latrunculorum",
    "patolli-aztec-game",
    "chaturanga-proto-chess",
    "tabula-roman-backgammon",
    "shatranj-persia",
    "playing-cards-tang-china",
    "shogi-japan",
    "xiangqi-chinese-chess",
    "alfonso-book-of-games",
    "playing-cards-reach-europe",
    "tarot-cards-italy",
    "modern-chess-queen-rules",
    "ridotto-venice-casino",
    "pascal-probability-theory",
    "dominoes-reach-europe",
    "snakes-and-ladders-india",
    "mechanical-turk-chess-automaton",
    "kriegsspiel-prussian-army",
    "mahjong-emerges-china",
    "first-world-chess-championship",
    "contract-bridge-devised",
    "monopoly-board-game",
    "video-game-bertie-the-brain",
    "samuel-checkers-program",
    "world-series-of-poker-first",
    "trivial-pursuit-launched",
    "deep-blue-beats-kasparov",
    "chinook-solves-checkers",
    "alphago-beats-lee-sedol"
  ],
  "dates": ["2099-01-01"]
}
```

### Kings of England — `kings-of-england`

```json
{
  "id": "kings-of-england",
  "name": "Kings of England",
  "eventNames": [
    "law-of-aethelberht",
    "offas-dyke-built",
    "alfred-great-king",
    "athelstan-first-king-of-england",
    "aethelred-unready-becomes-king",
    "canute-king-england",
    "edward-confessor-becomes-king",
    "battle-of-hastings",
    "henry-i-charter-of-liberties",
    "matilda-england",
    "henry-ii-becomes-king",
    "richard-lionheart-crowned",
    "magna-carta",
    "edward-i-annexes-wales",
    "edward-ii-deposed",
    "edward-iii-claims-french-crown",
    "henry-iv-deposes-richard-ii",
    "battle-agincourt",
    "henry-vi-crowned-in-paris",
    "edward-iv-crowned",
    "battle-of-bosworth-field",
    "henry-viii-becomes-king",
    "mary-i-becomes-queen",
    "death-elizabeth-i",
    "king-james-bible",
    "charles-i-execution",
    "english-civil-war-aftermath",
    "glorious-revolution",
    "queen-anne-accession",
    "george-i-hanoverian-succession",
    "george-iii-becomes-king",
    "victoria-becomes-queen",
    "house-of-windsor-founded",
    "edward-viii-abdicates",
    "elizabeth-ii-becomes-queen",
    "queen-elizabeth-ii-dies"
  ],
  "dates": ["2099-01-01"]
}
```

### Let There Be Light — `light`

```json
{
  "id": "light",
  "name": "Let There Be Light",
  "eventNames": [
    "candle-invented",
    "terracotta-oil-lamp",
    "lighthouse",
    "lighthouse-alexandria",
    "roman-factory-lamps",
    "lantern-festival-sui",
    "candle-clock-alfred",
    "fireworks",
    "kaifeng-night-markets",
    "paris-candlemakers-guild",
    "mamluk-mosque-lamps",
    "london-lantern-order",
    "japanese-andon-lantern",
    "cordouan-lighthouse",
    "whale-oil-trade",
    "paris-street-lanterns",
    "spermaceti-candle-works",
    "argand-lamp",
    "gas-lighting",
    "volta-battery",
    "arc-lamp",
    "baltimore-gas-streetlights",
    "electric-generator",
    "kerosene-lamp",
    "light-bulb",
    "niagara-falls-power",
    "tungsten-filament-lamp",
    "neon-lighting",
    "fluorescent-lamp",
    "laser-invented",
    "led-invented",
    "low-loss-optical-fibre",
    "compact-fluorescent-lamp",
    "blue-led",
    "incandescent-bulb-phase-out"
  ],
  "dates": ["2099-01-01"]
}
```

### Lost & Found — `lost-and-found`

```json
{
  "id": "lost-and-found",
  "name": "Lost & Found",
  "eventNames": [
    "sphinx-cleared-from-sand",
    "temple-scroll-found-josiah",
    "nabonidus-excavates-ur",
    "confucian-classics-found-in-wall",
    "bamboo-annals-recovered",
    "golgotha-excavated",
    "mamun-opens-great-pyramid",
    "justinian-digest-rediscovered",
    "petrarch-finds-cicero-letters",
    "poggio-recovers-lucretius",
    "domus-aurea-rediscovered",
    "laocoon-unearthed",
    "roman-catacombs-rediscovered",
    "herculaneum-well-discovery",
    "pompeii-excavation-begins",
    "rosetta-stone",
    "petra-rediscovered",
    "hieroglyphics-decoded",
    "brahmi-script-deciphered",
    "nineveh-palace-excavated",
    "cuneiform-deciphered",
    "troy-discovered",
    "altamira-paintings-found",
    "knossos-palace-excavated",
    "machu-picchu-discovered",
    "tutankhamun-tomb",
    "sutton-hoo-excavated",
    "dead-sea-scrolls",
    "linear-b-deciphered",
    "maya-glyphs-deciphered",
    "terracotta-warriors-discovered",
    "titanic-wreck-found",
    "otzi-iceman-discovered",
    "thonis-heracleion-found",
    "richard-iii-grave-found"
  ],
  "dates": ["2099-01-01"]
}
```

### Mapmakers — `mapmakers`

```json
{
  "id": "mapmakers",
  "name": "Mapmakers",
  "eventNames": [
    "turin-papyrus-map",
    "babylonian-world-map",
    "anaximander-world-map",
    "eratosthenes-earth-circumference",
    "mawangdui-silk-maps",
    "ptolemy-geographia",
    "pei-xiu-map-principles",
    "peutinger-road-map",
    "madaba-mosaic-map",
    "yu-ji-tu-grid-map",
    "al-idrisi-geography-map",
    "compass-adoption-navigation",
    "portolan-chart-development",
    "hereford-mappa-mundi",
    "catalan-atlas",
    "kangnido-world-map",
    "printed-ptolemy-maps",
    "first-globe",
    "first-map-printing",
    "mercator-projection-map",
    "ricci-chinese-world-map",
    "blaeu-atlas-maior",
    "cassini-map-of-france",
    "marine-chronometer",
    "cook-australia",
    "ordnance-survey-founded",
    "great-trigonometrical-survey",
    "smith-geological-map",
    "snow-cholera-map",
    "time-zone-development",
    "aerial-survey-photography",
    "transportation-map",
    "tharp-ocean-floor-map",
    "landsat-earth-imaging",
    "gps-full-coverage",
    "google-earth-launch"
  ],
  "dates": ["2099-01-01"]
}
```

### Hard Currency — `money`

```json
{
  "id": "money",
  "name": "Hard Currency",
  "eventNames": [
    "cowrie-shell-money-china",
    "first-coins",
    "athenian-owl-tetradrachm",
    "punch-marked-coins-india",
    "alexander-coinage-empire",
    "qin-standardization",
    "roman-denarius-introduced",
    "roman-currency-debasement",
    "byzantine-solidus-introduced",
    "islamic-gold-dinar-minted",
    "chinese-paper-money",
    "english-pound-sterling-origin",
    "kublai-khan-paper-currency",
    "venice-gold-coin-standard",
    "medici-banking",
    "fugger-banking-empire",
    "spanish-pieces-of-eight",
    "joachimsthaler-first-struck",
    "great-debasement-henry-viii",
    "bank-of-amsterdam-founded",
    "swedish-banknotes-issued",
    "bank-of-england",
    "gold-standard-newton",
    "continental-dollar-collapse",
    "us-dollar-established",
    "rothschild-banking-empire",
    "us-greenbacks-issued",
    "german-gold-mark-adopted",
    "federal-reserve-created",
    "weimar-hyperinflation",
    "us-leaves-gold-standard",
    "bretton-woods-conference",
    "first-credit-card-bankamericard",
    "end-of-bretton-woods",
    "euro-introduced",
    "bitcoin-created"
  ],
  "dates": ["2099-01-01"]
}
```

### Nations of Europe — `nations-of-europe`

```json
{
  "id": "nations-of-europe",
  "name": "Nations of Europe",
  "eventNames": [
    "san-marino-founded",
    "first-bulgarian-empire-founded",
    "treaty-verdun",
    "kyivan-rus",
    "tomislav-crowned-croatia",
    "gorm-the-old-unites-denmark",
    "baptism-of-poland-mieszko",
    "stephen-first-king-hungary",
    "kingdom-of-bohemia-established",
    "portugal-becomes-a-kingdom",
    "privilegium-minus-austria",
    "serbian-kingdom-stefan-crowned",
    "mindaugas-crowned-lithuania",
    "andorra-pareatges-signed",
    "swiss-confederation",
    "principality-of-moldavia-founded",
    "marriage-ferdinand-isabella",
    "gustav-vasa-elected-king",
    "dutch-republic",
    "act-of-union-britain",
    "liechtenstein-principality-created",
    "greek-independence",
    "belgian-independence",
    "luxembourg-independence-london",
    "kingdom-of-italy-proclaimed",
    "german-unification",
    "romania-independence-recognized",
    "norway-independence-sweden",
    "finland-declares-independence",
    "irish-free-state",
    "iceland-becomes-republic",
    "malta-independence",
    "ukraine-declares-independence",
    "slovakia-becomes-independent",
    "montenegro-independence"
  ],
  "dates": ["2099-01-01"]
}
```

### Numbers & Proofs — `numbers`

```json
{
  "id": "numbers",
  "name": "Numbers & Proofs",
  "eventNames": [
    "thales-measurement-pyramid",
    "pythagoras-theorem",
    "irrational-numbers-discovered",
    "concept-of-zero",
    "euclid-elements-geometry",
    "archimedes-measures-circle",
    "nine-chapters-mathematical-art",
    "diophantus-algebra",
    "aryabhata-zero-concept",
    "maya-mathematical-innovation",
    "brahmagupta-algebra-india",
    "khwarizmi-algorithms",
    "omar-khayyam-algebra",
    "arabic-numerals-adoption",
    "kerala-school-mathematics",
    "cardano-ars-magna",
    "napier-logarithms",
    "descartes-analytical-geometry",
    "pascal-probability-theory",
    "newton-leibniz-calculus",
    "leibniz-binary-system",
    "euler-graph-theory",
    "bayes-theorem",
    "gauss-disquisitiones",
    "non-euclidean-geometry",
    "galois-group-theory",
    "boole-laws-of-thought",
    "cantor-uncountable-infinity",
    "hilbert-problems",
    "godel-incompleteness-theorems",
    "turing-computable-numbers",
    "cohen-continuum-hypothesis",
    "four-colour-theorem-proved",
    "classification-finite-simple-groups",
    "fermat-last-theorem-proved",
    "poincare-conjecture-proved"
  ],
  "dates": ["2099-01-01"]
}
```

### Plague Years — `plagues`

```json
{
  "id": "plagues",
  "name": "Plague Years",
  "eventNames": [
    "plague-of-athens",
    "antonine-plague",
    "plague-of-cyprian",
    "plague-of-justinian",
    "justinian-plague-recurrence",
    "japan-smallpox-epidemic",
    "al-razi-distinguishes-smallpox",
    "leprosy-hospitals-spread",
    "black-death-arrives",
    "ragusa-quarantine",
    "sweating-sickness",
    "population-collapse-americas",
    "variolation-china",
    "italian-plague",
    "great-plague-london",
    "marseille-plague",
    "moscow-plague-riot",
    "jenner-vaccination-smallpox",
    "first-cholera-pandemic",
    "public-health",
    "cholera-london",
    "london-main-drainage",
    "koch-tuberculosis-bacterium",
    "yersin-plague-bacillus",
    "manchurian-plague",
    "spanish-flu-begins",
    "penicillin-discovered",
    "streptomycin-cures-tb",
    "polio-vaccine",
    "hong-kong-flu",
    "last-natural-smallpox-case",
    "aids-epidemic-recognized",
    "haart-aids-treatment",
    "sars-outbreak",
    "ebola-outbreak",
    "covid-19-pandemic"
  ],
  "dates": ["2099-01-01"]
}
```

### The Deep — `the-deep`

```json
{
  "id": "the-deep",
  "name": "The Deep",
  "eventNames": [
    "aegean-sponge-divers",
    "gulf-pearl-diving",
    "scyllis-combat-diver",
    "syracuse-underwater-palisade",
    "aristotle-diving-kettle",
    "alexander-diving-bell",
    "roman-urinatores",
    "ama-divers-japan",
    "marine-law",
    "bacon-undersea-instruments",
    "coral-trade-mediterranean",
    "leonardo-diving-apparatus",
    "nemi-diving-bell",
    "drebbel-submarine-thames",
    "vasa-cannon-salvaged",
    "halley-diving-bell",
    "lethbridge-diving-engine",
    "turtle-submarine-attack",
    "smeaton-diving-bell-pump",
    "deane-diving-helmet",
    "siebe-closed-diving-dress",
    "dover-calais-submarine-cable",
    "hunley-sinks-housatonic",
    "challenger-expedition",
    "antikythera-wreck-found",
    "haldane-decompression-tables",
    "bathysphere-descent",
    "aqua-lung-invented",
    "mariana-trench",
    "hydrothermal-vents-discovered",
    "titanic-wreck-found",
    "kaiko-challenger-deep",
    "cameron-challenger-deep",
    "titan-submersible-implosion"
  ],
  "dates": ["2099-01-01"]
}
```

### When the Earth Moved — `upheaval`

```json
{
  "id": "upheaval",
  "name": "When the Earth Moved",
  "eventNames": [
    "toba-supereruption",
    "thera-eruption",
    "sparta-earthquake",
    "helike-earthquake",
    "rhodes-earthquake-colossus",
    "vesuvius-eruption",
    "hatepe-eruption",
    "365-crete-earthquake",
    "volcanic-winter-536",
    "damghan-earthquake",
    "aleppo-earthquake",
    "samalas-eruption",
    "basel-earthquake",
    "meio-nankai-earthquake",
    "shaanxi-earthquake",
    "huaynaputina-eruption",
    "etna-catania-eruption",
    "cascadia-earthquake-1700",
    "lisbon-earthquake",
    "laki-eruption",
    "unzen-eruption",
    "tambora-eruption",
    "ansei-earthquake",
    "krakatoa-eruption",
    "mount-pelee-eruption",
    "san-francisco-earthquake",
    "great-kanto-earthquake",
    "nepal-bihar-earthquake-1934",
    "paricutin-volcano-born",
    "valdivia-earthquake",
    "tangshan-earthquake",
    "mount-st-helens",
    "pinatubo-eruption",
    "indian-ocean-tsunami",
    "tohoku-earthquake",
    "turkey-syria-earthquake"
  ],
  "dates": ["2099-01-01"]
}
```

### What We Drink — `what-we-drink`

```json
{
  "id": "what-we-drink",
  "name": "What We Drink",
  "eventNames": [
    "first-beer-brewed",
    "first-wine-making",
    "tea-discovered-china",
    "hammurabi-alehouse-laws",
    "chocolate-in-mesoamerica",
    "greek-symposium-wine",
    "vineyards-spread-rome",
    "quran-forbids-wine",
    "lu-yu-classic-of-tea",
    "coffee-origins-ethiopia",
    "wine-barrel",
    "aqua-vitae-distilled",
    "yemen-coffee-cultivation",
    "first-scotch-whisky-record",
    "reinheitsgebot-beer-purity",
    "chocolate-introduced-europe",
    "tea-ceremony-codification",
    "tea-trade-begins",
    "first-european-coffeehouse",
    "first-colonial-rum-distillery",
    "champagne-region-bubbly",
    "tea-craze-britain",
    "gin-craze-london",
    "guinness-brewery-lease",
    "boston-tea-party",
    "schweppes-bottled-soda-water",
    "american-temperance-society",
    "pilsner-first-brewed",
    "pasteurization",
    "coca-cola-invented",
    "instant-coffee-introduced",
    "prohibition-begins-us",
    "prohibition-repealed-us",
    "espresso-machine-crema",
    "starbucks-coffee-chain",
    "new-coke-launched"
  ],
  "dates": ["2099-01-01"]
}
```

## Bank 2 (2026-09)

Twenty-two themes authored spine-first in a second pass; see [index.md](index.md#bank-2-2026-09).
Every one of their new events is un-illustrated, so **none of these can be validated or published
until the art lands**. Art prompts are in [art/bank-2_prompts.csv](art/bank-2_prompts.csv).

| Theme               | Cards | Awaiting art | Publishable now |
| ------------------- | ----: | -----------: | --------------- |
| `before-us`         |    32 |            3 | no              |
| `founding-cities`   |    35 |           25 | no              |
| `great-fires`       |    35 |           22 | no              |
| `ends-of-the-earth` |    36 |           21 | no              |
| `famine`            |    36 |           18 | no              |
| `chinese-dynasties` |    36 |            6 | no              |
| `on-stage`          |    36 |           24 | no              |
| `peace`             |    35 |           10 | no              |
| `pharaohs`          |    34 |           18 | no              |
| `pirates`           |    34 |           33 | no              |
| `schools`           |    35 |           20 | no              |
| `ships`             |    35 |           24 | no              |
| `heists`            |    33 |           30 | no              |
| `flight`            |    36 |           22 | no              |
| `skyline`           |    31 |           18 | no              |
| `tamed`             |    34 |           19 | no              |
| `first-women`       |    36 |           27 | no              |
| `rome`              |    36 |            3 | no              |
| `sieges`            |    36 |           17 | no              |
| `under-the-knife`   |    36 |           12 | no              |
| `walls`             |    34 |           24 | no              |
| `waterworks`        |    36 |           20 | no              |

### Before Us — `before-us`

```json
{
  "id": "before-us",
  "name": "Before Us",
  "eventNames": [
    "first-life",
    "first-cyanobacteria",
    "eukaryotic-cell-evolution",
    "snowball-earth-cryogenian",
    "ediacaran-biota",
    "cambrian-explosion",
    "first-vertebrates",
    "plants-colonize-land",
    "ordovician-mass-extinction",
    "first-insects-appear",
    "first-amphibians-tiktaalik",
    "late-devonian-extinction",
    "end-permian-mass-extinction",
    "first-dinosaurs-appear",
    "first-mammals",
    "jurassic-period-begins",
    "pangaea-breaks-apart",
    "first-birds-archaeopteryx",
    "first-flowering-plants",
    "dinosaur-extinction",
    "first-primates",
    "eocene-epoch-begins",
    "whales-return-to-sea",
    "oligocene-epoch-begins",
    "first-apes",
    "first-upright-walkers",
    "lucy-australopithecus-lived",
    "homo-habilis",
    "homo-erectus-emerges",
    "fire-mastery",
    "homo-heidelbergensis-emerges",
    "neanderthals-appear"
  ],
  "dates": ["2099-01-01"]
}
```

### Capitals Founded — `founding-cities`

```json
{
  "id": "founding-cities",
  "name": "Capitals Founded",
  "eventNames": [
    "david-establishes-jerusalem-capital",
    "rome-founded",
    "paris-parisii-settlement",
    "romans-found-londinium",
    "baghdad-founded",
    "viking-dublin-settlement",
    "muhammad-i-founds-madrid-fortress",
    "vikings-iceland",
    "fatimids-conquer-egypt",
    "ly-thai-to-founds-thang-long",
    "moscow-first-chronicled",
    "berthold-v-founds-bern",
    "kublai-khan-builds-dadu",
    "aztec-tenochtitlan-founding",
    "taejo-founds-hanseong",
    "ota-dokan-builds-edo-castle",
    "pizarro-founds-lima",
    "quesada-founds-bogota",
    "valdivia-founds-santiago",
    "gustav-vasa-founds-helsinki",
    "legazpi-founds-manila",
    "garay-refounds-buenos-aires",
    "batavia-founded",
    "rama-i-founds-bangkok",
    "dc-established",
    "john-by-founds-bytown",
    "settlers-found-wellington",
    "miners-found-kuala-lumpur",
    "buda-pest-obuda-unite-budapest",
    "menelik-founds-addis-ababa",
    "railway-depot-becomes-nairobi",
    "george-v-announces-new-delhi",
    "foundation-stone-laid-canberra",
    "brasilia-built",
    "abuja-becomes-nigeria-capital"
  ],
  "dates": ["2099-01-01"]
}
```

### Cities Ablaze — `great-fires`

```json
{
  "id": "great-fires",
  "name": "Cities Ablaze",
  "eventNames": [
    "burning-of-ugarit",
    "babylonian-destruction-jerusalem",
    "persians-burn-athens",
    "burning-of-persepolis",
    "alexandria-library-caesar-fire",
    "rome-founds-vigiles",
    "great-fire-rome",
    "nika-riots",
    "tatars-burn-moscow",
    "sack-of-magdeburg",
    "great-fire-of-meireki",
    "great-fire-london",
    "great-fire-of-copenhagen",
    "franklin-founds-fire-company",
    "lisbon-earthquake",
    "great-boston-fire-1760",
    "graff-post-fire-hydrant",
    "burning-of-moscow",
    "british-burn-washington",
    "edinburgh-municipal-fire-brigade",
    "great-fire-new-york",
    "great-fire-of-hamburg",
    "burning-of-atlanta",
    "great-chicago-fire",
    "parmelee-automatic-sprinkler",
    "great-seattle-fire",
    "nfpa-founded",
    "iroquois-theatre-fire",
    "san-francisco-earthquake",
    "triangle-shirtwaist-fire",
    "great-kanto-earthquake",
    "cocoanut-grove-fire",
    "hamburg-firestorm",
    "nazis-raze-warsaw",
    "tokyo-firebombing"
  ],
  "dates": ["2099-01-01"]
}
```

### Ends of the Earth — `ends-of-the-earth`

```json
{
  "id": "ends-of-the-earth",
  "name": "Ends of the Earth",
  "eventNames": [
    "humans-reach-australia",
    "humans-reach-the-americas",
    "settlement-of-fiji",
    "settlement-of-madagascar",
    "faroe-islands-settled-monks",
    "vikings-iceland",
    "marquesas-settlement-east-polynesia",
    "vikings-greenland",
    "viking-america",
    "polynesian-easter-island-settlement",
    "maori-settlement-new-zealand",
    "first-ascent-mont-blanc",
    "ross-reaches-north-magnetic-pole",
    "first-ascent-matterhorn",
    "nansen-crosses-greenland-icecap",
    "first-ascent-kilimanjaro",
    "first-landing-on-antarctica",
    "first-ascent-aconcagua",
    "belgica-overwinters-antarctica",
    "north-pole-reached",
    "south-pole-reached",
    "first-ascent-denali",
    "first-auto-crossing-sahara",
    "byrd-flies-over-south-pole",
    "first-ascent-annapurna",
    "everest",
    "first-ascent-k2",
    "first-land-crossing-antarctica",
    "mariana-trench",
    "first-ascent-vinson-massif",
    "plaisted-reaches-north-pole",
    "first-women-reach-south-pole",
    "messner-solo-ascent-everest",
    "unsupported-trek-to-north-pole",
    "ousland-solo-crossing-antarctica",
    "cameron-challenger-deep"
  ],
  "dates": ["2099-01-01"]
}
```

### Famine Years — `famine`

```json
{
  "id": "famine",
  "name": "Famine Years",
  "eventNames": [
    "akkadian-empire-famine-collapse",
    "grain-storage-silos",
    "grain-price-controls",
    "great-famine-cairo",
    "great-european-famine",
    "potato-introduction-europe",
    "sweet-potato-reaches-china",
    "english-poor-law-relief",
    "deccan-famine-mughal-india",
    "great-famine-france-louis-xiv",
    "great-baltic-famine",
    "bengal-famine-company-rule",
    "chalisa-famine",
    "doji-bara-famine",
    "guano-boom-fertilizer-trade",
    "irish-potato-famine",
    "corn-laws-repealed-britain",
    "finnish-famine",
    "great-famine-british-india",
    "indian-famine-codes-adopted",
    "haber-process",
    "russian-famine-civil-war",
    "holodomor",
    "bengal-famine-wwii",
    "dutch-hunger-winter",
    "great-leap-forward-famine",
    "world-food-programme-founded",
    "green-revolution-begins",
    "biafra-famine",
    "china-ends-collective-farming",
    "ethiopian-famine",
    "famine-early-warning-launched",
    "north-korea-famine",
    "horn-of-africa-famine",
    "south-sudan-famine-declared",
    "yemen-famine-crisis"
  ],
  "dates": ["2099-01-01"]
}
```

### Mandate of Heaven — `chinese-dynasties`

```json
{
  "id": "chinese-dynasties",
  "name": "Mandate of Heaven",
  "eventNames": [
    "xia-dynasty",
    "shang-dynasty-established",
    "establishment-zhou-dynasty",
    "qin-unification",
    "qin-book-burning",
    "han-dynasty",
    "silk-trade-begins",
    "wang-mang-usurps-han",
    "yellow-turban-rebellion",
    "battle-red-cliffs",
    "fall-han-dynasty",
    "sima-yan-jin-unification",
    "fall-western-jin",
    "grand-canal-china",
    "tang-dynasty",
    "princess-wu-empress",
    "an-lushan-rebellion",
    "fall-tang-dynasty",
    "song-dynasty",
    "jin-forces-sack-kaifeng",
    "yuan-khanate-founded",
    "mongol-khubilai-conquest",
    "red-turban-rebellion-begins",
    "ming-dynasty",
    "ming-treasure-fleets",
    "ming-forbidden-city",
    "ming-emperor-captured-tumu",
    "qing-dynasty",
    "kangxi-military-campaigns",
    "qing-xinjiang-conquest",
    "macartney-mission-rebuffed",
    "treaty-nanking",
    "taiping-rebellion",
    "boxer-rebellion",
    "chinese-revolution",
    "last-emperor-china-abdicates"
  ],
  "dates": ["2099-01-01"]
}
```

### On Stage — `on-stage`

```json
{
  "id": "on-stage",
  "name": "On Stage",
  "eventNames": [
    "thespis-first-actor",
    "aeschylus-tragedy-origins",
    "oresteia-trilogy-premieres",
    "sophocles-oedipus",
    "lysistrata-premieres",
    "theatre-of-epidaurus-built",
    "theatre-of-pompey-opens",
    "noh-theater-emergence",
    "commedia-dell-arte-emerges",
    "ballet-de-cour-france",
    "globe-theatre-built",
    "kabuki-theater-begins",
    "monteverdi-orfeo",
    "san-cassiano-opera-house",
    "moliere-comedies",
    "beggars-opera-premieres",
    "la-scala-opens",
    "magic-flute-premieres",
    "barber-of-seville-premieres",
    "la-sylphide-premieres",
    "giselle-premieres",
    "la-traviata-premieres",
    "tchaikovsky-swan-lake",
    "dolls-house-premieres",
    "earnest-premieres-london",
    "stanislavski-seagull-triumph",
    "rite-of-spring",
    "show-boat-premieres",
    "oklahoma-premieres",
    "west-side-story-opens",
    "hair-opens-broadway",
    "chorus-line-premieres",
    "cats-opens-west-end",
    "phantom-of-opera-premieres",
    "wicked-premieres-broadway",
    "hamilton-opens-broadway"
  ],
  "dates": ["2099-01-01"]
}
```

### Peace at Last — `peace`

```json
{
  "id": "peace",
  "name": "Peace at Last",
  "eventNames": [
    "first-peace-treaty",
    "peace-of-callias",
    "peace-of-nicias",
    "first-treaty",
    "treaty-wedmore",
    "peace-of-constance",
    "treaty-of-bretigny",
    "peace-of-lodi",
    "treaty-of-picquigny",
    "treaty-madrid",
    "peace-augsburg",
    "peace-cateau-cambresis",
    "peace-westphalia",
    "treaty-breda",
    "treaty-utrecht",
    "treaty-aix-la-chapelle",
    "treaty-paris-seven-years",
    "treaty-paris-1783",
    "peace-of-amiens",
    "treaty-of-ghent",
    "second-treaty-of-paris",
    "treaty-nanking",
    "treaty-of-guadalupe-hidalgo",
    "treaty-of-paris-crimean-war",
    "peace-of-prague",
    "treaty-of-frankfurt",
    "treaty-of-shimonoseki",
    "wwi-end",
    "treaty-versailles",
    "wwii-end",
    "korean-war-armistice",
    "geneva-accords-indochina",
    "paris-peace-accords-1973",
    "egypt-israel-peace",
    "dayton-accords"
  ],
  "dates": ["2099-01-01"]
}
```

### Pharaohs — `pharaohs`

```json
{
  "id": "pharaohs",
  "name": "Pharaohs",
  "eventNames": [
    "unification-egypt",
    "step-pyramid-djoser",
    "sneferu-red-pyramid",
    "pyramids",
    "menkaure-pyramid-giza",
    "sphinx-built",
    "mentuhotep-ii-reunification",
    "amenemhat-i-founds-dynasty",
    "new-kingdom-egypt-begins",
    "hatshepsut-becomes-pharaoh",
    "battle-megiddo",
    "akhenaten-religious-revolution",
    "death-tutankhamun",
    "seti-i-recovers-levant",
    "battle-kadesh",
    "first-peace-treaty",
    "abu-simbel-temples-dedicated",
    "merneptah-victory-stele",
    "ramesses-iii-sea-peoples",
    "ramesses-iii-assassinated",
    "piye-conquers-egypt",
    "taharqa-crowned-pharaoh",
    "psamtik-i-reunifies-egypt",
    "necho-ii-defeats-josiah",
    "cambyses-conquers-egypt",
    "nectanebo-i-founds-dynasty",
    "last-native-pharaoh-flees",
    "alexander-crowned-pharaoh",
    "ptolemaic-kingdom-established",
    "lighthouse-alexandria",
    "cleopatra-vii-reign",
    "cleopatra-caesar-alliance",
    "battle-actium",
    "death-cleopatra"
  ],
  "dates": ["2099-01-01"]
}
```

### Pirates & Privateers — `pirates`

```json
{
  "id": "pirates",
  "name": "Pirates & Privateers",
  "eventNames": [
    "ramesses-iii-sea-peoples",
    "rome-war-on-queen-teuta",
    "caesar-captured-cilician-pirates",
    "pompey-sweeps-mediterranean-pirates",
    "viking-lindisfarne",
    "vikings-sack-paris",
    "stortebeker-executed-hamburg",
    "barbarossa-brothers-seize-algiers",
    "battle-of-preveza",
    "wokou-raiders-besiege-nanjing",
    "qi-jiguang-crushes-wokou",
    "drake-raids-nombre-de-dios",
    "drake-knighted-golden-hind",
    "grace-omalley-meets-elizabeth",
    "piet-heyn-captures-treasure-fleet",
    "corsairs-sack-baltimore-ireland",
    "morgan-sacks-panama-city",
    "every-raids-ganj-i-sawai",
    "captain-kidd-hanged-london",
    "blackbeard-killed-ocracoke",
    "bonny-read-convicted-piracy",
    "bartholomew-roberts-killed",
    "vijaydurg-falls-to-british",
    "rachel-wall-hanged-piracy",
    "surcouf-captures-kent",
    "decatur-burns-philadelphia",
    "zheng-yi-sao-fleet-surrenders",
    "bombardment-algiers-slaves-freed",
    "france-conquers-algiers",
    "spain-storms-balanguingui",
    "recaap-piracy-pact-signed",
    "eu-operation-atalanta-launched",
    "maersk-alabama-hijacked",
    "somali-hijackings-fall-to-zero"
  ],
  "dates": ["2099-01-01"]
}
```

### Places of Learning — `schools`

```json
{
  "id": "schools",
  "name": "Places of Learning",
  "eventNames": [
    "ashurbanipal-library-founded",
    "plato-founds-academy",
    "aristotle-peripatetic-school",
    "first-public-library",
    "han-civil-service",
    "alexandria-library-caesar-fire",
    "nalanda-university",
    "bayt-al-hikma",
    "al-qarawiyyin-university",
    "fatimid-al-azhar-mosque",
    "dom-university-bologna",
    "dom-university-paris",
    "oxford-founded",
    "nalanda-destroyed",
    "cambridge-university-founded",
    "salamanca-university-founded",
    "university-paris-sorbonne",
    "house-of-wisdom-destroyed",
    "charles-university-prague",
    "heidelberg-university",
    "eton-college-founded",
    "leiden-university-founded",
    "edinburgh-university-founded",
    "harvard-college-founded",
    "yale-founded",
    "princeton-founded",
    "west-point-founded",
    "university-berlin-founded",
    "vassar-college-founded",
    "cornell-university-founded",
    "johns-hopkins-founded",
    "stanford-university-founded",
    "louvain-library-burns",
    "sarajevo-library-destroyed",
    "mosul-libraries-destroyed"
  ],
  "dates": ["2099-01-01"]
}
```

### Sail & Steam — `ships`

```json
{
  "id": "ships",
  "name": "Sail & Steam",
  "eventNames": [
    "khufu-ship",
    "phoenician-bireme",
    "greek-trireme",
    "lateen-sail-spreads",
    "polynesian-double-canoe-design",
    "longship-technology",
    "junk-watertight-bulkheads",
    "venice-founds-arsenal",
    "song-sternpost-rudder",
    "hanseatic-cog",
    "carrack-emerges",
    "portuguese-caravels",
    "dutch-fluyt",
    "hms-sovereign-of-the-seas",
    "turtle-submarine-attack",
    "steamboat",
    "fultons-steamboat",
    "first-atlantic-steamship-crossing",
    "rattler-beats-alecto",
    "flying-cloud-record-run",
    "french-ironclad-gloire",
    "hms-warrior-launches",
    "battle-hampton-roads",
    "cutty-sark-launches",
    "hms-havock-first-destroyer",
    "turbinia-storms-spithead",
    "uss-holland-commissioned",
    "hms-dreadnought-launches",
    "bells-hydrofoil-record",
    "uss-nautilus-launched",
    "hovercraft",
    "ss-ideal-x-sails",
    "ns-lenin-enters-service",
    "caspian-sea-monster-flies",
    "yara-birkeland-launches"
  ],
  "dates": ["2099-01-01"]
}
```

### Stolen! — `heists`

```json
{
  "id": "heists",
  "name": "Stolen!",
  "eventNames": [
    "deir-el-medina-tomb-robberies",
    "trial-verres-plunder",
    "westminster-crown-jewels-heist",
    "blood-crown-jewels-heist",
    "south-sea-bubble",
    "french-crown-jewels-theft",
    "great-gold-robbery",
    "irish-crown-jewels-theft",
    "mona-lisa-theft",
    "ponzi-scheme-exposed",
    "kreuger-empire-collapse",
    "just-judges-panel-theft",
    "amber-room-looted",
    "van-meegeren-fake-vermeer-sale",
    "great-train-robbery-buckinghamshire",
    "caravaggio-nativity-theft",
    "baker-street-robbery",
    "russborough-house-art-heist",
    "lufthansa-heist",
    "brinks-mat-robbery",
    "gardner-museum-art-heist",
    "theft-of-the-scream",
    "enron-scandal",
    "van-gogh-museum-theft",
    "antwerp-diamond-heist",
    "northern-bank-robbery",
    "madoff-ponzi-scheme-unravels",
    "paris-modern-art-museum-heist",
    "kunsthal-rotterdam-art-heist",
    "hatton-garden-vault-burglary",
    "bangladesh-bank-cyber-heist",
    "dresden-green-vault-heist",
    "ftx-crypto-collapse"
  ],
  "dates": ["2099-01-01"]
}
```

### Taking Flight — `flight`

```json
{
  "id": "flight",
  "name": "Taking Flight",
  "eventNames": [
    "eilmer-flying-monk",
    "passarola-balloon-demonstration",
    "hot-air-balloon",
    "blanchard-jeffries-channel-crossing",
    "garnerin-parachute-descent",
    "cayley-glider-model",
    "dirigible-airship",
    "cayley-coachman-flight",
    "ader-eole-liftoff",
    "lilienthal-glider",
    "zeppelin-airship",
    "wright-brothers-flight",
    "santos-dumont-14-bis",
    "cornu-helicopter-hop",
    "bleriot-channel-crossing",
    "quimby-channel-flight",
    "first-scheduled-airline",
    "junkers-allmetal-aircraft",
    "alcock-brown-transatlantic",
    "coleman-earns-pilot-license",
    "first-flight-around-world",
    "spirit-of-st-louis",
    "graf-zeppelin-world-circle",
    "jet-engine-invented",
    "amelia-earhart-atlantic",
    "wiley-post-solo-world-flight",
    "hindenburg-disaster",
    "helicopter-modern",
    "yeager-sound-barrier",
    "dehavilland-comet-first-flight",
    "cochran-sound-barrier",
    "concorde-maiden-flight",
    "boeing-747-enters-service",
    "voyager-nonstop-world-flight",
    "piccard-balloon-circumnavigation",
    "solar-impulse-2-circles-globe"
  ],
  "dates": ["2099-01-01"]
}
```

### Tallest in the World — `skyline`

```json
{
  "id": "skyline",
  "name": "Tallest in the World",
  "eventNames": [
    "step-pyramid-djoser",
    "red-pyramid-sneferu",
    "pyramids",
    "lincoln-cathedral-spire",
    "lincoln-spire-collapses",
    "st-olafs-tallinn-spire",
    "beauvais-cathedral-collapse",
    "st-olafs-spire-burns",
    "strasbourg-cathedral-tallest",
    "elevator-invented",
    "bessemer-steel-process",
    "st-nicholas-church-hamburg",
    "rouen-cathedral-iron-spire",
    "cologne-cathedral-completed",
    "washington-monument-completed",
    "steel-frame-skyscraper",
    "eiffel-tower",
    "woolworth-building-opens",
    "bank-of-manhattan-trust-tops-out",
    "chrysler-building",
    "empire-state-building",
    "kvly-tv-mast-erected",
    "ostankino-tower-completed",
    "world-trade-center-tops-out",
    "sears-tower",
    "warsaw-radio-mast-erected",
    "cn-tower",
    "warsaw-mast-collapses",
    "petronas-towers",
    "taipei-101",
    "burj-khalifa"
  ],
  "dates": ["2099-01-01"]
}
```

### Tamed — `tamed`

```json
{
  "id": "tamed",
  "name": "Tamed",
  "eventNames": [
    "dog-becomes-companion",
    "domestication-cattle",
    "domestication-of-sheep-and-goats",
    "cats-domesticated",
    "domestication-of-donkeys",
    "water-buffalo-domesticated",
    "silkworm-domesticated",
    "hierakonpolis-royal-menagerie",
    "domestication-horses",
    "dromedary-camel-domesticated",
    "honeybee-keeping-begins",
    "falconry-emerges-central-asia",
    "chickens-domesticated",
    "kikkuli-horse-training-text",
    "rome-sacred-geese-alarm",
    "hydaspes-war-elephants",
    "hannibal-crosses-alps",
    "battle-zama",
    "mutina-pigeon-messengers",
    "stirrup-invented",
    "veterinary-school",
    "general-stud-book-published",
    "jardin-des-plantes-zoo-opens",
    "barry-rescue-dog-legend",
    "london-zoo-opens-regents-park",
    "first-formal-dog-show",
    "kennel-club-founded-britain",
    "old-hemp-border-collie-ancestor",
    "beersheba-cavalry-charge",
    "seeing-eye-guide-dog-school",
    "izbushensky-cavalry-charge",
    "laika-in-space",
    "przewalski-horses-rewilded",
    "dolly-sheep-cloned"
  ],
  "dates": ["2099-01-01"]
}
```

### The First Woman — `first-women`

```json
{
  "id": "first-women",
  "name": "The First Woman",
  "eventNames": [
    "enheduanna-first-author-hymns",
    "hatshepsut-crowned-pharaoh",
    "hypatia-alexandria",
    "princess-wu-empress",
    "murasaki-shikibu-genji",
    "gentileschi-joins-accademia",
    "chatelet-fire-essay-published",
    "baret-completes-world-circuit",
    "herschel-discovers-comet",
    "lovelace-publishes-algorithm",
    "blackwell-earns-medical-degree",
    "womens-suffrage-nz",
    "curie-wins-nobel-prize",
    "first-woman-in-parliament",
    "rankin-elected-to-congress",
    "astor-takes-commons-seat",
    "coleman-earns-pilot-license",
    "amelia-earhart-atlantic",
    "hopper-builds-first-compiler",
    "bandaranaike-becomes-worlds-first-pm",
    "first-woman-space",
    "gandhi-becomes-indias-pm",
    "switzer-runs-boston-marathon",
    "chisholm-elected-to-congress",
    "meir-becomes-israels-pm",
    "peron-becomes-worlds-first-president",
    "tabei-summits-everest",
    "thatcher-becomes-pm",
    "oconnor-joins-supreme-court",
    "ride-flies-into-space",
    "jemison-flies-into-space",
    "morrison-wins-nobel-prize",
    "angela-merkel-elected",
    "sirleaf-elected-liberias-president",
    "lagarde-leads-the-imf",
    "harris-becomes-vice-president"
  ],
  "dates": ["2099-01-01"]
}
```

### The Roman Story — `rome`

```json
{
  "id": "rome",
  "name": "The Roman Story",
  "eventNames": [
    "rome-founded",
    "roman-republic",
    "twelve-tables",
    "gauls-sack-rome",
    "pyrrhus-invades-italy",
    "first-punic-war",
    "hannibal-crosses-alps",
    "battle-cannae",
    "battle-zama",
    "third-punic-war",
    "tiberius-gracchus-reforms",
    "sullas-civil-war",
    "pompey-great-rome",
    "crossing-rubicon",
    "julius-caesar",
    "battle-actium",
    "roman-empire-founded",
    "battle-teutoburg-forest",
    "great-fire-rome",
    "colosseum-rome",
    "hadrian-wall-construction",
    "edict-caracalla",
    "diocletian-tetrarchy",
    "edict-milan",
    "council-nicaea",
    "constantinople-founded",
    "division-roman-empire",
    "sack-rome-visigoths",
    "rome-falls",
    "justinian-becomes-emperor",
    "construction-hagia-sophia",
    "plague-of-justinian",
    "siege-of-constantinople-717",
    "great-schism",
    "fourth-crusade-byzantine",
    "constantinople-fall"
  ],
  "dates": ["2099-01-01"]
}
```

### Under Siege — `sieges`

```json
{
  "id": "sieges",
  "name": "Under Siege",
  "eventNames": [
    "assyrian-siege-lachish",
    "fall-of-babylon-cyrus",
    "athenian-siege-syracuse",
    "alexanders-siege-tyre",
    "siege-syracuse",
    "third-punic-war",
    "vercingetorix-gallic-revolt",
    "siege-of-jerusalem-70ce",
    "siege-masada",
    "siege-of-constantinople-717",
    "viking-siege-of-paris",
    "antioch-crusader-conflicts",
    "capture-of-jerusalem-1099",
    "third-crusade-siege-acre",
    "fourth-crusade-byzantine",
    "mongol-baghdad",
    "siege-of-orleans",
    "constantinople-fall",
    "reconquista-completion",
    "ottoman-siege-rhodes",
    "siege-vienna-first",
    "great-siege-of-malta",
    "battle-vienna",
    "siege-of-derry",
    "battle-yorktown",
    "siege-of-sevastopol",
    "siege-of-vicksburg",
    "prussian-siege-of-paris",
    "siege-of-khartoum",
    "siege-of-mafeking",
    "siege-leningrad",
    "siege-of-bastogne",
    "siege-of-dien-bien-phu",
    "battle-khe-sanh-begins",
    "siege-of-sarajevo-begins",
    "battle-to-retake-mosul"
  ],
  "dates": ["2099-01-01"]
}
```

### Under the Knife — `under-the-knife`

```json
{
  "id": "under-the-knife",
  "name": "Under the Knife",
  "eventNames": [
    "trepanation-earliest-known",
    "hammurabi-surgeon-laws",
    "edwin-smith-surgical-papyrus",
    "cataract-surgery-ancient",
    "hippocratic-surgical-texts",
    "celsus-de-medicina-encyclopedia",
    "galen-medical-dominance",
    "al-zahrawi-surgical-encyclopedia",
    "guy-de-chauliac-surgery-text",
    "pare-improves-wound-care",
    "blood-transfusion",
    "first-appendectomy",
    "mcdowell-first-ovariotomy",
    "anesthesia-invented",
    "semmelweis-childbed-fever",
    "chloroform-eases-childbirth",
    "antiseptic-surgery",
    "surgery-local-anesthesia",
    "rubber-surgical-gloves",
    "rehn-sutures-heart-wound",
    "blood-types-discovered",
    "citrate-blood-storage",
    "magill-endotracheal-tube",
    "blood-bank-established",
    "first-blue-baby-operation",
    "heart-lung-machine-first-use",
    "first-organ-transplant",
    "pacemaker-implanted",
    "first-lung-transplant",
    "first-heart-transplant",
    "first-artificial-heart",
    "keyhole-laparoscopic-surgery",
    "first-hand-transplant",
    "da-vinci-surgical-robot",
    "first-face-transplant",
    "first-pig-heart-transplant"
  ],
  "dates": ["2099-01-01"]
}
```

### Walls & Fortresses — `walls`

```json
{
  "id": "walls",
  "name": "Walls & Fortresses",
  "eventNames": [
    "walls-of-uruk-raised",
    "walls-of-babylon-rebuilt",
    "long-walls-of-athens-built",
    "long-walls-of-athens-torn-down",
    "servian-wall-of-rome-built",
    "great-wall-china",
    "herod-builds-masada-fortress",
    "hadrian-wall-construction",
    "antonine-wall-built",
    "aurelian-walls-encircle-rome",
    "theodosian-walls-completed",
    "sigiriya-rock-fortress-raised",
    "offas-dyke-built",
    "tower-london",
    "krak-des-chevaliers-rebuilt",
    "great-zimbabwe-stone-construction",
    "malbork-castle-built",
    "carcassonne-refortified",
    "walls-of-benin-city-built",
    "constantinople-fall",
    "kumbhalgarh-fort-built",
    "kremlin-walls",
    "suleiman-rebuilds-jerusalem-walls",
    "cartagena-walls-begun",
    "mombasa-fort-jesus-construction",
    "fort-ticonderoga-built",
    "france-builds-maginot-line",
    "warsaw-ghetto-wall-built",
    "germany-builds-atlantic-wall",
    "korean-dmz-fortified",
    "berlin-wall-built",
    "berlin-wall-fall",
    "israel-builds-west-bank-barrier",
    "us-secure-fence-act-signed"
  ],
  "dates": ["2099-01-01"]
}
```

### Waterworks — `waterworks`

```json
{
  "id": "waterworks",
  "name": "Waterworks",
  "eventNames": [
    "first-irrigation-systems",
    "lagash-girsu-canal-network",
    "levee",
    "mohenjo-daro-covered-drains",
    "earliest-persian-qanats",
    "great-dam-of-marib",
    "hezekiah-tunnel-jerusalem",
    "sennacherib-jerwan-aqueduct",
    "first-sewer-system",
    "roman-aqueducts",
    "dujiangyan-irrigation-system",
    "petra-nabataean-water-system",
    "aqueduct-pont-garros",
    "nazca-puquios-aqueducts",
    "sigiriya-water-gardens",
    "basilica-cistern-built",
    "marib-dam-collapses",
    "grand-canal-china",
    "hohokam-canal-network",
    "khmer-baray-hydraulics",
    "yuan-grand-canal",
    "machu-picchu-water-channels",
    "chapultepec-aqueduct",
    "beemster-polder-drained",
    "great-level-fens-drained",
    "erie-canal",
    "croton-aqueduct-opens",
    "london-main-drainage",
    "suez-canal",
    "chicago-river-reversal",
    "la-aqueduct-owens-valley",
    "panama-canal",
    "afsluitdijk-completed",
    "hoover-dam",
    "aswan-high-dam",
    "thames-barrier-completed"
  ],
  "dates": ["2099-01-01"]
}
```
