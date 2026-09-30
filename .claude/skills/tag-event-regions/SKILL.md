---
name: tag-event-regions
description: Tag events with the present-day countries and macro-regions where they happened (the `regions` field). Use when tagging, reviewing or batch-generating region tags, or working with scripts/events/region-*.js or src/data/regions.json.
---

# Tagging Event Regions

This is the working version. Full rules and the gold set are in
[docs/regions/tagging-spec.md](../../../docs/regions/tagging-spec.md); read its gold-set tables
before your first batch. The reasons behind the design are in
[docs/regions/index.md](../../../docs/regions/index.md).

## The one thing to understand first

**Tag where it happened on today's map.** Don't tag where a vanished state used to be, or who
cares about the event now, or how important it was. A Bronze Age find in Saxony is "Germany".

## Entry format

One entry per event, keyed by slug, in a map file:

```json
{
  "columbus-americas": { "regions": ["Bahamas", "Spain"] },
  "constantinople-fall": { "regions": ["Turkey", "Europe"] },
  "covid-19-pandemic": { "regions": ["China", "Global"] },
  "great-oxidation-event": {
    "regions": ["Global"],
    "note": "change in the whole atmosphere's chemistry"
  }
}
```

| Field     | Rule                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------- |
| `regions` | Non-empty. Exact names from `src/data/regions.json`. Order does not matter; apply sorts it.        |
| `note`    | **Required when the only tag is "Global"**: why no place is focal. Optional otherwise. Not stored. |

Nothing else is allowed in an entry.

## Names: readable, exact, never abbreviated

- **Regions:** Europe · Middle East & North Africa · Sub-Saharan Africa · North & Central Asia ·
  South Asia · East Asia · Southeast Asia · North America · South America · Oceania · Global
- **Countries** use common English short names:
  - United States (not US or USA)
  - United Kingdom (not UK, Britain or England)
  - Turkey
  - Czechia
  - Ivory Coast
  - East Timor
  - Myanmar
  - Eswatini
  - North Macedonia
  - Vatican City
  - Democratic Republic of the Congo, and separately Republic of the Congo
  - Palestine
- **Territories with their own entry:** Hong Kong, Macau, Taiwan, Kosovo, Western Sahara,
  Greenland, Puerto Rico, Bermuda, French Guiana, Falkland Islands, Gibraltar, Saint Helena, Faroe
  Islands, Guam, New Caledonia, French Polynesia, Antarctica.
- **Anywhere else overseas uses its country:** Hawaii is United States; Corsica is France.
- **When in doubt, open `src/data/regions.json`.** A name not in it is rejected.

A country already implies its region: ["Germany"] is in Europe. Don't add "Europe" beside it.

## The rules, in order

1. **The place.** Tag where the event happened: a battle where it was fought, a treaty where it
   was signed, a discovery where it was made, a fossil where it was found.
2. **The moment, not the aftermath.** Consequences in the card's text are not places: "triggering
   declarations from Britain and France" adds nothing.
3. **Up to two principal actors.** Add a state that acted somewhere else: an invader, an
   expedition's sponsor, a colonial power, the victim state in an assassination. A person is not
   an actor, so a scientist abroad gets the place only. An explorer's sponsor or home counts.
   With more than two actors, tag their region instead.
4. **Extinct states: the seat at the time.**

   | State                                   | Tag                                                  |
   | --------------------------------------- | ---------------------------------------------------- |
   | Rome                                    | Italy                                                |
   | Byzantium                               | Turkey                                               |
   | Ottoman Empire                          | Turkey                                               |
   | Persia (Achaemenid, Parthian, Sasanian) | Iran                                                 |
   | Macedon                                 | Greece                                               |
   | Carthage                                | Tunisia                                              |
   | Abbasid Caliphate                       | Iraq                                                 |
   | Umayyad Caliphate                       | Syria                                                |
   | Mongol Empire                           | Mongolia                                             |
   | Golden Horde                            | Russia                                               |
   | Frankish realm before 843               | France and Germany                                   |
   | Papacy                                  | Italy, plus Vatican City when the event is inside it |
   | Soviet Union                            | Russia as an actor; the place is its republic        |
   | Aztec Empire                            | Mexico                                               |
   | Inca Empire                             | Peru                                                 |
   | Mughal Empire                           | India                                                |
   | Hittites                                | Turkey (with Middle East & North Africa)             |
   | Rashidun Caliphate                      | Saudi Arabia (Medina)                                |
   | Umayyad forces from al-Andalus          | Spain                                                |
   | Seljuks; Sultanate of Rum               | Iran; Turkey                                         |
   | Venice, Genoa                           | Italy                                                |
   | East India Company; VOC                 | United Kingdom; Netherlands                          |

   The full table is in the spec.

5. **Region tags only where no country says it:**
   - a footprint with no focal country (the Black Death in Europe is "Europe")
   - an empire or network wider than its countries (its seat plus the regions it spanned)
   - a destination you should not adjudicate (the Holy Land is "Middle East & North Africa")
6. **Transcontinental countries must name their side.** This applies to Russia, Turkey, Georgia,
   Armenia and Azerbaijan.
   - Siberia is "Russia", "North & Central Asia".
   - Moscow acting as a state is "Russia", "Europe".
   - Istanbul is "Turkey", "Europe".
   - Anatolia is "Turkey", "Middle East & North Africa".
   - The US state of Georgia is "United States".
7. **Global is a footprint, not importance.** It means worldwide, on at least three continents
   with no set of four regions describing it better. **Combine it with focal places** (where it
   began or was first identified): COVID is China, Global. Use Global alone only when no place
   is honest (geology, the atmosphere, a period boundary), and give a note.
8. **Caps.** At most six countries (past that, use the region) and four regions (past that, use
   Global).
9. **Disputed places.**
   - Jerusalem is "Israel" and "Palestine".
   - Crimea is "Ukraine".
   - Kashmir and Punjab are tagged by the side the event happened on, or both when the dispute is
     the event.
10. **Life events.** Births and deaths are tagged with the place, plus the country the person is
    chiefly associated with (at most one). Marie Curie's birth is Poland and France.
11. **Peoples and cultures are not actors.** Vikings, Huns and Goths without a state get the
    place only, unless the card is their own voyage from a known homeland (explorer rule). "Greek
    engineers" at Syracuse are Italy: a culture adjective is not a state.
12. **War begins.** Where it broke out plus the principal belligerents. Global only when the
    card itself frames the war as worldwide.
13. **Colonial power.** Tag it beside the place only when its forces or officials acted in the
    event (Boston Massacre), not when colonists acted against it (Boston Tea Party).
14. **Written works.** Where written or researched, else the author's base; not the birthplace.
15. **Card and prose disagree on the origin.** Tag both, and report it as a catalogue error.
16. **Sport.** The host, plus the winning nation whenever the card names one. A multi-nation
    team (West Indies) is its region; a winning athlete is a person, not an actor.

## Common mistakes

| Wrong                                                        | Right                          | Why                                                          |
| ------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------ |
| Moon landing: Global                                         | United States                  | Importance is not a footprint                                |
| World War II begins: Germany, Poland, United Kingdom, France | Germany, Poland                | The declarations of war are consequences                     |
| World Wide Web: Switzerland, United Kingdom                  | Switzerland                    | Berners-Lee is a person, not an actor                        |
| Battle of Kulikovo: Russia                                   | Russia, Europe                 | Russia must name its side                                    |
| Fall of Constantinople: Turkey, Middle East & North Africa   | Turkey, Europe                 | The city is on the European side                             |
| Birth of Alexander: North Macedonia                          | Greece                         | Pella is in Greece                                           |
| USA / UK / Britain                                           | United States / United Kingdom | Tags are exact names                                         |
| Treaty of Tordesillas: Global                                | Portugal, Spain                | About the world is not worldwide                             |
| Chernobyl: Ukraine, Russia, Europe                           | Ukraine                        | A Soviet-era place is its republic; fallout is a consequence |

## Workflow for a batch (the orchestrating session)

1. Run `node scripts/events/region-report.js --chunks`. It writes chunks of 60 to
   `untracked_data/event-regions/worklist/`.
2. Dispatch one `event-region-tagger` per chunk. Each writes
   `untracked_data/event-regions/batch-NNN.json`, and never a file in `public/events/`.
3. Check the batch:
   - Run `node scripts/events/region-audit.js batch-NNN.json` and read the list. It flags text
     that names places the tags miss. Many flags are correct decisions (consequences, the seat
     rule); an outright miss is what it is for.
   - Run `node scripts/events/region-apply.js --dry-run batch-NNN.json`. Any invalid entry aborts
     the run.
   - Cold-read 5 entries against the spec. Check every Global-only note.
4. Apply with `node scripts/events/region-apply.js batch-NNN.json`.
5. Verify with `CI=true npm test -- --watchAll=false src/utils/eventRegions.test.ts` (always
   through npm).
