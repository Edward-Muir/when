# Region tagging spec

The rules for choosing an event's `regions` tags. The `tag-event-regions` skill is the working
version for a tagger; this is the full statement, and where a new edge case gets settled. Why the
system is shaped this way is in [index.md](index.md).

What makes a tag list **well formed** is code, not prose: `scripts/events/region-spec.js`, run by
`region-apply.js` and by `src/utils/eventRegions.test.ts`. Nothing here repeats those checks
except where a writer needs to know them to choose well.

## The one thing to understand first

**Tag where it happened on today's map.** Not where the state that did it used to be, not who
cares about it now, not how important it was. The Nebra sky disc is "Germany", though no Germany
existed; Göbekli Tepe is "Turkey". Because every tag names a place that exists today, no tag ever
depends on when a country was founded.

## Names

Tags are **plain, readable names** from `src/data/regions.json`, spelled exactly as listed. Never
a code or an abbreviation: "United States", not "US" or "USA"; "United Kingdom", not "UK",
"Britain" or "England". The validator rejects anything not in the file and suggests the right
name for the common slips.

There are two kinds of name, and one list holds both:

- **Countries**: present-day sovereign states plus a few territories that have their own entry
  (Hong Kong, Macau, Taiwan, Palestine, Kosovo, Western Sahara, Greenland, Puerto Rico, Bermuda,
  French Guiana, the Falkland Islands, Gibraltar, Saint Helena, the Faroe Islands, Guam, New
  Caledonia, French Polynesia) and Antarctica. Anywhere else overseas uses its country:
  Hawaii is "United States", Corsica is "France".
- **Regions**: Europe, Middle East & North Africa, Sub-Saharan Africa, North & Central Asia,
  South Asia, East Asia, Southeast Asia, North America, South America, Oceania, and Global.

Every country rolls up to one region, so `["Germany"]` is already in Europe. Writing "Europe"
beside it is harmless (the apply script drops it) but says nothing. A few countries do not
roll up; see [transcontinental countries](#transcontinental-countries).

## What goes in

### 1. The place

Where the event happened, on today's map. A battle is where it was fought; a treaty is where it
was signed; a building is where it stands; a discovery is where it was made; a fossil species is
where its defining fossils were found.

**Tag the moment the card names, not what followed.** The card's own text often runs on into
consequences ("triggering declarations of war from Britain and France", "caused global climate
disruption"). Those are not places the event happened. The Tambora eruption is "Indonesia"; the
famine it caused a year later is a different card.

### 2. Up to two principal actors

Add the country of a **state that acted**, when it acted somewhere else: the invader, the
sponsor of an expedition, the colonial power, the victim state in an assassination. At most two,
and only principal ones.

| Event                         | Tags                                    | Why                                                          |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Columbus reaches the Americas | Bahamas, Spain                          | Landfall at Guanahani; the Crown of Castile paid for it      |
| Attack on Pearl Harbor        | Japan, United States                    | Place and attacker                                           |
| Battle of Teutoburg Forest    | Germany, Italy                          | Place, and Rome (the seat) as the defeated power             |
| Franz Ferdinand assassinated  | Austria, Bosnia and Herzegovina, Serbia | Sarajevo; the victim's state; the assassins' backers         |
| Treaty of Versailles          | France, Germany                         | Signed at Versailles; Germany is the party it was imposed on |

A person is not an actor. A scientist working abroad is tagged by where the work was done: the
World Wide Web is "Switzerland" (CERN), not the United Kingdom because Berners-Lee is British.
The exceptions are explorers, whose sponsor counts (Magellan's voyage is Spain), and the
life-event rule below.

When more than two states are principal actors, tag their region instead of listing them: the
Atlantic slave trade's British, French and Portuguese carriers are "Europe".

### 3. Region tags, where no country says it

Write a region explicitly only when a country cannot say it:

- **A footprint with no focal country.** The Black Death's demographic collapse is "Europe".
  Modern humans emerging "in Africa", from scattered sites, is "Middle East & North Africa" and
  "Sub-Saharan Africa".
- **A footprint wider than its countries.** An empire or trade network is its seat plus the
  regions it spanned: the Pax Mongolica is China, Mongolia, Europe, Middle East & North Africa,
  North & Central Asia. The Silk Road textile trade is China, Italy (Rome, the buyer), Middle East
  & North Africa (Parthia), North & Central Asia.
- **A disputed place you should not adjudicate.** "The Holy Land" as a destination is Middle East
  & North Africa (see [disputed territory](#disputed-territory) for Jerusalem itself).
- **The side of a transcontinental country.** Required, below.

The caps are six countries and four regions (Global aside). Past six countries, use the region.
Past four regions, the footprint is worldwide: that is what Global is for.

## Global

**Global is a footprint, not a measure of importance.** It means the event genuinely happened
worldwide: on at least three continents, where no set of four or fewer regions describes it
better.

**Global does not exclude other tags.** Add the focal places beside it: where it started, was
first identified, or was centred.

| Event                   | Tags                          | Why                                                |
| ----------------------- | ----------------------------- | -------------------------------------------------- |
| World War II ends       | Japan, United States, Global  | The surrender in Tokyo Bay; a world war            |
| COVID-19 pandemic       | China, Global                 | First identified in Wuhan                          |
| Great Depression        | United States, Global         | The Wall Street Crash; a worldwide slump           |
| Spanish flu begins      | United States, Global         | First recognised at a Kansas army camp             |
| Dinosaur extinction     | Mexico, Global                | The Chicxulub impact; a planet-wide extinction     |
| First circumnavigation  | Spain, Global                 | Sponsor; a voyage around the world                 |
| UN founded              | United States, Global         | Signed in San Francisco; a worldwide body          |
| Out of Africa dispersal | Sub-Saharan Africa, Global    | Origin; the spread reached every continent but one |
| Year Without a Summer   | Europe, North America, Global | The card's own text centres New England and Europe |

**Global alone** is for events with no honest focal place: a geological period boundary, the
Great Oxidation Event, Snowball Earth, the Spanish flu's second wave (which struck worldwide at
once). It needs a `note` saying why no place is focal, and the apply script prints every one.
There is no quota. A batch of prehistory can hold many Global-only entries and be right; one
famous event tagged Global alone is wrong. Each note is judged on its own.

**Not Global**, however much it mattered:

- **Important events** are tagged where they happened. The Moon landing is "United States". The printing press is
  "Germany". Penicillin is "United Kingdom". The iPhone is "United States".
- **An event _about_ the world** is tagged by where it was decided. The Treaty of Tordesillas divided the world, and
  it is "Portugal, Spain".
- **An event with worldwide _consequences_** is tagged by where it happened. The Tambora eruption is "Indonesia".
- **Several regions is not the world.** The Silk Road is four regions of Eurasia, so it is not Global.

## Extinct states: the seat at the time

A state that no longer exists is tagged as the present-day country that holds its **seat** (capital,
court) **at the time of the event**. The rule is mechanical on purpose, so two taggers agree:

| State                                        | Tag                                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Roman Empire (and Republic)                  | Italy. Late Western court at Ravenna: still Italy                                                                           |
| Byzantine (Eastern Roman) Empire             | Turkey (Constantinople)                                                                                                     |
| Ottoman Empire                               | Turkey (Bursa, Edirne, Istanbul: all Turkey)                                                                                |
| Achaemenid, Parthian, Sasanian Persia        | Iran                                                                                                                        |
| Macedon (Philip, Alexander)                  | Greece (Pella), not North Macedonia                                                                                         |
| Carthage                                     | Tunisia                                                                                                                     |
| Umayyad Caliphate                            | Syria (Damascus). The Córdoba emirate is Spain                                                                              |
| Abbasid Caliphate                            | Iraq (Baghdad)                                                                                                              |
| Mongol Empire                                | Mongolia (Karakorum). Yuan dynasty: China. Golden Horde: Russia (Sarai). Ilkhanate: Iran                                    |
| Frankish realm before 843                    | France and Germany, both successor kingdoms                                                                                 |
| Holy Roman Empire                            | The emperor's seat at the time; Germany unless it was Vienna (Austria) or Prague (Czechia)                                  |
| The Papacy                                   | Italy; add Vatican City when the event is inside it (St Peter's, the Sistine Chapel)                                        |
| Austria-Hungary                              | Austria (Vienna)                                                                                                            |
| Prussia                                      | Germany                                                                                                                     |
| Soviet Union                                 | Russia (Moscow), as an actor. Places inside other republics are that republic: Chernobyl is Ukraine; Baikonur is Kazakhstan |
| Yugoslavia, Czechoslovakia                   | By place; as an actor, the capital (Serbia; Czechia)                                                                        |
| British, French, Spanish, Portuguese empires | Their home country, as the actor                                                                                            |
| Aztec Empire                                 | Mexico                                                                                                                      |
| Inca Empire                                  | Peru                                                                                                                        |
| Mughal Empire                                | India                                                                                                                       |
| Mali Empire                                  | Mali                                                                                                                        |
| Hittite Empire                               | Turkey (Hattusa), on the Middle East & North Africa side                                                                    |
| Rashidun Caliphate                           | Saudi Arabia (Medina); Iraq (Kufa) under Ali                                                                                |
| Umayyad forces from al-Andalus               | Spain, before and after 756: the base they marched from, not Damascus (Tours is France, Spain)                              |
| Seljuk Empire                                | Iran (Isfahan). The Sultanate of Rum: Turkey (Konya)                                                                        |
| Venice, Genoa, the Italian city-states       | Italy                                                                                                                       |
| East India Company, VOC                      | Their home country, as the colonial actor (United Kingdom; Netherlands)                                                     |
| An alliance (Holy League, Coalition)         | Its members, or their region past two                                                                                       |

The seat rule covers the _actor_ tag. The _place_ is still where the event happened: Hadrian's
Wall is "United Kingdom" (place) and "Italy" (Rome, the actor).

## Transcontinental countries

Russia, Turkey, Georgia, Armenia and Azerbaijan span two regions, so they do not roll up on their
own. An event tagged with one **must also name the side it sits on**; the validator enforces it.

- **Russia.** Use Europe for events west of the Urals, and for Moscow acting as a state (Sputnik
  is Kazakhstan, Russia, Europe). Use North & Central Asia for Siberia and the Russian Far East
  (Tunguska is Russia, North & Central Asia).
- **Turkey.** Istanbul's historic city is in Europe (the fall of Constantinople is Turkey, Europe). Anatolia is Middle East & North Africa (Göbekli Tepe is Turkey, Middle East & North Africa).
- **Georgia, Armenia, Azerbaijan.** Pick by which story the event belongs to: Persian, Ottoman or
  ancient Near Eastern is Middle East & North Africa; Russian, Soviet or European is Europe. Tag
  both when it is genuinely both. The US state of Georgia is "United States", never "Georgia".

## Sea, air, space and the poles

- **At sea.** Tag the actors: the ship's flag, the navies involved, the ports of departure and
  arrival where the card turns on them. The Titanic is United Kingdom and United States; the
  Battle of Midway is Japan and United States.
- **Space.** Tag the launching or operating country. Add the launch site only when the event _is_
  the launch. The Moon landing is "United States". Sputnik is Kazakhstan (Baikonur), Russia and Europe.
- **Antarctica.** "Antarctica" belongs to no region, so it always needs an actor country beside
  it (the validator enforces this). Amundsen at the Pole is Antarctica and Norway.

## Disputed territory

Follow borders as the United Nations recognises them, and do not adjudicate:

- **Jerusalem** (the Old City and holy sites) is "Israel" and "Palestine" both. Other places in the West Bank and Gaza are "Palestine".
- **Kashmir, Punjab and Bengal** are tagged by the side the event happened on. When the dispute or the partition _is_ the event,
  tag both sides.
- **Crimea** is "Ukraine".
- **Taiwan, Kosovo and Western Sahara** use their own entries.

## Kinds of event

- **Births and deaths.** Tag the place of birth or death, plus the country the person is chiefly
  associated with if that is different (at most one). Marie Curie's birth is Poland and France.
  Napoleon's birth is France. Trajan's birth is Spain and Italy.
- **Inventions, products, companies and works of art.** Tag where each was made, founded or first
  shown. How far it later spread does not count.
- **Diffusion events** ("Printing press spreads", "Buddhism reaches Central Asia"). Tag the origin
  plus the places the card names as reached. Past the cap, use the region they spread across.
- **Migration and diaspora.** Tag the origin plus the destination. Partition is Bangladesh, India
  and Pakistan.
- **"First X in Y".** Tag Y, plus the foreign actor if there was one.
- **Species, fossils and prehistory.** Tag where the defining evidence was found (Plateosaurus is
  France, Germany and Switzerland). Planet-wide geology, climate and atmosphere are Global.
- **Sport.** Tag the host, plus the winner when the card is about the win.
- **Wars and their outbreak.** A "war begins" card is the outbreak: where the fighting or the
  declaration happened, plus the principal belligerents (at most two, else their region). Add
  Global only when the card's own text frames the war as fought worldwide (Seven Years' War
  Begins is United Kingdom, France, Global; World War II Begins is Germany, Poland).
- **Colonial protest and repression.** Tag the colonial power beside the place only when its
  forces or officials acted in the event itself. The Boston Massacre (British troops fired) is
  United States, United Kingdom; the Boston Tea Party (colonists acted) is United States.
- **Written works and scholarship.** Where the work was written or the research done, when known;
  otherwise the author's principal base. Not the birthplace, which belongs to a birth card.
- **Card and prose disagree on the origin.** Independent-invention cards often credit one place
  ("Egyptians invented the lock") while the prose gives the earliest evidence elsewhere (Nineveh).
  Tag both, within the caps, and report the disagreement as a catalogue error.

### Peoples and cultures are not actors

A people without a state (Vikings, Huns, Goths, Scythians) is not an actor: tag the place only.
The exception is a voyage or migration that is the card's subject and sets out from a known
homeland, which is tagged like an explorer's home (the Norse at L'Anse aux Meadows sailed from Greenland: Canada, Greenland).
A culture adjective is not a state either. "Greek engineers" at Syracuse are Italy; "a Greek
philosopher" at Miletus is Turkey. The audit flags these ethnonyms, and the flag is expected.

## When unsure

The chunk carries the card's detail prose, which was researched and names places. Judge from it
first. Search when the place itself is genuinely unclear, not to add more tags. If you are
still unsure after that, prefer fewer and surer tags and say so in the report. A missing actor
tag costs little. A wrong place tag puts the card in the wrong game.

## The gold set

Sixty-one hand-decided entries, applied to the catalogue with the system itself, so the tags
are on the cards and `region-report.js` skips them. Several appear in the tables above. The rest:

| Event                            | Tags                                                     | What it shows                                                   |
| -------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Fall of the Western Roman Empire | Italy                                                    | The moment, at Ravenna, not the empire's footprint              |
| Aurelian reunites the empire     | France, Italy, Syria                                     | Châlons and Palmyra (the places), and Rome (the actor)          |
| Trajan becomes emperor           | Italy                                                    | An accession is an act of the state's seat                      |
| World War II begins              | Germany, Poland                                          | The British and French declarations are consequences            |
| Mongols sack Baghdad             | Iraq, Mongolia                                           | Place and invader                                               |
| Genghis Khan unites the Mongols  | Mongolia                                                 |                                                                 |
| Battle of Kulikovo               | Russia, Europe                                           | The Golden Horde's seat (Sarai) is also in Russia               |
| First Crusade begins             | France, Italy, Middle East & North Africa                | Called at Clermont, by Rome, for the Holy Land                  |
| Capture of Jerusalem             | France, Israel, Palestine                                | Jerusalem rule; the crusader army's leaders                     |
| Partition of India migration     | Bangladesh, India, Pakistan                              | Origin and destination on both borders                          |
| Charlemagne crowned              | France, Germany, Italy, Vatican City                     | Frankish rule; St Peter's is now Vatican City                   |
| Sistine Chapel ceiling           | Italy, Vatican City                                      | The Papacy rule                                                 |
| Falklands War                    | Argentina, Falkland Islands, United Kingdom              | A territory with its own entry                                  |
| Alexander conquers Persia        | Greece, Iran, Iraq                                       | Gaugamela (Iraq); Persia (Iran); Macedon's seat (Pella, Greece) |
| Marco Polo reaches China         | China, Italy                                             | An explorer's home counts, like a sponsor                       |
| Korean War begins                | North Korea, South Korea                                 |                                                                 |
| Middle Passage peaks             | Europe, North America, South America, Sub-Saharan Africa | Too many actors, so their region is tagged                      |
| Hong Kong handover               | China, Hong Kong, United Kingdom                         |                                                                 |
| Chernobyl disaster               | Ukraine                                                  | A Soviet-era place is tagged by its republic                    |
| Mount Tambora erupts             | Indonesia                                                | Consequences are the next card                                  |
| Treaty of Tordesillas            | Portugal, Spain                                          | About the world, but not Global                                 |

**The audit flags some of these, and that is expected.** `region-audit.js` flags three of them:

- World War II's start names Britain and France.
- Kulikovo names "Mongol rule".
- Chernobyl names the Soviet Union.

Each is a decision recorded above, not a miss. The audit exists to catch misses, and a reviewer
reads its list rather than obeying it.
