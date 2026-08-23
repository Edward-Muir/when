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
| `kings-of-england`  |    36 |           19 | no              |
| `light`             |    35 |           22 | no              |
| `lost-and-found`    |    35 |           26 | no              |
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
    "restoration-of-charles-ii",
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
    "terracotta-army-discovered",
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
