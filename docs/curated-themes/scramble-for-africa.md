# The Scramble for Africa theme

A 30-card curated theme on outsiders' expeditions, claims and conquests in Africa, and the
resistance to them, from the Persian conquest of Egypt to Italy's invasion of Ethiopia. This note
is why these 30 and not others.

## The scope rule

An event is in only if **it is a foreign expedition, claim or conquest in Africa.**

The boundary with the neighbouring themes:

- **Forts and colonies** such as Elmina and Cape Town go to Flag Planted. This deck has the
  expedition or the invasion, not the settlement that followed.
- **African states' own story** goes to African Kingdoms. `ethiopian-victory-adwa` and
  `zulu-war` are here as resistance to an invader, not as the history of those kingdoms.
- **Independence** goes to Flags Come Down. The deck stops in 1935.

Three edges were argued rather than assumed:

- **The ancient and medieval conquests are in.** The name suggests the 1880s, but the scope rule
  is any foreign conquest in Africa, and the spine opened with Persia in Egypt. Six cards sit
  before 1400 (`cambyses-conquers-egypt` to `arab-conquest-of-egypt`), five of them in Egypt.
  They give the deck its early footholds, and they are the widest reading of the rule: a
  reviewer who wants the deck to start with Portugal at Ceuta should say so.
- **`berlin-conference`** is reused at 1884 for the spine's 1885. The conference opened in
  November 1884 and its General Act was signed in February 1885: the same event under two
  date conventions.
- **`da-gama-sails-round-africa`** (1497) is a new card beside the catalogue's
  `vasco-da-gama-india` (1498). This one is the departure and the passage round the Cape and up
  the east coast; the existing card is the arrival in India. Likewise
  `caesar-besieged-alexandria` is new beside `cleopatra-caesar-alliance` in the same year,
  because the spine's beat is the siege and not the alliance. Both pairs are close enough that
  they should never share a deck.

Cut from the spine of 40: Belisarius invading Vandal Africa (533), Louis IX dying at Tunis
(1270), Cape Bojador passed (1434), Charles V taking Tunis (1535), Portuguese soldiers in
Ethiopia (1541), Bruce at the Blue Nile's source (1770), the African Association's founding
(1788), Livingstone's arrival (1841), Abd el-Kader's surrender (1847) and Barth's Sahara
crossing (1850). Each was the thinnest on fame in its stretch, and Livingstone's arrival crowded
his two other cards. The spine writer had already dropped Tunisia, Gordon at Khartoum and
Rhodes' Pioneer Column to stay inside the bunching limit.

## The 30

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
|  -525 | `cambyses-conquers-egypt`          |                |
|  -332 | `alexander-crowned-pharaoh`        |                |
|   -48 | `caesar-besieged-alexandria`       | foothold · NEW |
|   -30 | `rome-annexes-egypt`               | foothold · NEW |
|   439 | `vandals-take-carthage`            | foothold       |
|   639 | `arab-conquest-of-egypt`           |                |
|  1415 | `portugal-captures-ceuta`          | NEW            |
|  1488 | `dias-cape-good-hope`              | foothold       |
|  1497 | `da-gama-sails-round-africa`       | foothold · NEW |
|  1517 | `selim-i-conquers-egypt-mamluks`   | foothold       |
|  1578 | `alcacer-quibir-sebastian-dies`    | NEW            |
|  1796 | `mungo-park-reaches-niger`         | NEW            |
|  1798 | `napoleons-egyptian-campaign`      |                |
|  1816 | `bombardment-algiers-slaves-freed` |                |
|  1830 | `france-conquers-algiers`          |                |
|  1838 | `boers-win-blood-river`            | foothold · NEW |
|  1855 | `livingstone-sees-victoria-falls`  | foothold · NEW |
|  1858 | `source-of-nile`                   |                |
|  1868 | `british-storm-magdala`            | foothold · NEW |
|  1871 | `livingstone-stanley`              |                |
|  1879 | `zulu-war`                         |                |
|  1882 | `british-occupation-egypt`         |                |
|  1884 | `berlin-conference`                |                |
|  1896 | `ethiopian-victory-adwa`           |                |
|  1898 | `fashoda-incident`                 |                |
|  1899 | `boer-war`                         |                |
|  1911 | `italy-invades-libya`              | foothold · NEW |
|  1912 | `treaty-of-fez-morocco`            | NEW            |
|  1921 | `rif-rout-spain-annual`            | NEW            |
|  1935 | `italy-invades-ethiopia`           |                |

12 of the 30 were authored for this theme. The catalogue already held the Egyptian conquests
and the famous beats of the 1870s to 1890s, but not the Portuguese in Morocco, the two
Livingstone-era journeys, Magdala, or anything in North Africa after 1900. The footholds are
band 0 in theme-gap after blind grading. theme-gap scores that from the difficulty label and how
crowded the timeline is around each year.

Gates: size **30**, band 0 **10**, bins **7/8** (advisory), same-year pairs **0**, bunching **3
in 1879-1884**, shared **2** with any earlier theme (Pharaohs, and Pirates). Re-measure rather
than trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap scramble-for-africa
```

## What the fact check could not support

- **`treaty-of-fez-morocco`**: the description says the treaty left "a northern zone" to Spain.
  The year and the French protectorate are right, but most sources put the Spanish zone's legal
  basis in the separate Franco-Spanish treaty signed in Madrid later the same year. A rewording
  through `date-clues-apply.js` would settle it.

The other 11 new events were supported. Two of them, `portugal-captures-ceuta` and
`alcacer-quibir-sebastian-dies`, were checked against the spine's own source and not a second
one.

One weak spot came out of the region tagging:

- **`portugal-captures-ceuta`** is tagged Spain, Morocco and Portugal. Ceuta is Spanish today
  and claimed by Morocco, and the card calls it a "Moroccan trading port". The tagger kept both
  sides rather than adjudicate.

Five claims in the detail prose were written from the writer's background knowledge and not
searched: the sixty-year union of Spain and Portugal after Alcacer Quibir, Mungo Park's death on
the Niger on his second expedition, Moulay Yusuf succeeding his brother after the Treaty of Fez,
Magdala as the emperor's "last stronghold", and later emperors keeping Egypt as their own
property. All five are standard accounts, but none has a source on file.

## Known crowding kept on purpose

Eight pairs sit inside theme-gap's 8-year advisory window. Two clusters are deliberate:

- **1879 / 1882 / 1884** (the Zulu War, the occupation of Egypt, the Berlin Conference) and
  **1896 / 1898 / 1899** (Adwa, Fashoda, the Boer War): the scramble proper took twenty years,
  and these six are the cards a player expects the deck to hold. Each trio sits at the bunching
  limit of three in ten years.
- **1911 / 1912** (`italy-invades-libya` → `treaty-of-fez-morocco`): the last two pieces of
  North Africa taken, a year apart. This is the pair most worth splitting if a reviewer wants
  one fewer coin-flip.
