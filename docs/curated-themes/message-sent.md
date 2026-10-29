# The Message Sent theme

A 30-card curated theme on sending a message or a parcel across distance, from the Persian
royal relay to a parcel lowered by drone: runners, riders, beacons, semaphore, posts, wires,
cables, airmail and couriers. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a way of sending a message or parcel across distance**: carried
or wired messages and mail.

- **Carried**: runners, mounted relays, coaches, pigeons, aeroplanes, couriers and drones, plus
  the postal systems and reforms that organised them (the stamp, rural delivery, ZIP codes).
- **Wired or signalled point to point**: beacons, semaphore, the telegraph, telephone links and
  the undersea cables that carried them.

The neighbours take the rest: broadcasting goes to Tune In, the internet to Going Online, and
pocket gadgets to In Your Pocket. Two edges were argued rather than assumed:

- **`marconi-transatlantic-radio-signal`** is in. The 1901 signal was a wireless telegraph
  message from one station to another, not a broadcast to an audience.
- **`communications-satellite`** (Telstar, 1962) is in as a relay link between two continents,
  carrying calls as well as pictures. Broadcasting itself stays with Tune In.

## The 30

|  Year | Slug                                   |                |
| ----: | -------------------------------------- | -------------- |
|  -500 | `postal-system-persia`                 |                |
|  -490 | `pheidippides-marathon-run`            | NEW            |
|   -27 | `cursus-publicus-founded`              | NEW            |
|  1229 | `mongol-yam-relay-network`             | NEW            |
|  1490 | `postal-system-expansion`              |                |
|  1588 | `beacon-chain-armada-warning`          | NEW            |
|  1635 | `royal-mail-opens-to-public`           | NEW            |
|  1784 | `first-mail-coach-bath-london`         | NEW            |
|  1794 | `chappe-semaphore-line`                | NEW            |
|  1837 | `cooke-wheatstone-telegraph`           | NEW            |
|  1840 | `postage-stamp`                        | foothold       |
|  1844 | `first-telegraph-message`              | foothold       |
|  1858 | `first-transatlantic-cable`            | foothold       |
|  1860 | `pony-express-launches`                | foothold · NEW |
|  1866 | `transatlantic-cable-completed`        |                |
|  1876 | `bell-telephone`                       | foothold       |
|  1896 | `rural-free-delivery-begins`           | NEW            |
|  1901 | `marconi-transatlantic-radio-signal`   | foothold · NEW |
|  1911 | `first-official-airmail-flight`        | NEW            |
|  1917 | `zimmermann-telegram`                  |                |
|  1918 | `cher-ami-pigeon-message`              | NEW            |
|  1927 | `transatlantic-radiotelephone-service` | NEW            |
|  1935 | `china-clipper-pacific-airmail`        | NEW            |
|  1956 | `tat-1-transatlantic-telephone-cable`  | NEW            |
|  1962 | `communications-satellite`             |                |
|  1963 | `zip-codes-introduced`                 | NEW            |
|  1969 | `dhl-express-courier-founded`          | NEW            |
|  1973 | `fedex-first-deliveries`               | foothold · NEW |
|  2006 | `western-union-ends-telegrams`         | NEW            |
|  2016 | `amazon-first-drone-delivery`          | NEW            |

21 of the 30 were authored for this theme. The footholds are the reconciler's picks from the
spine's fame; band 0 itself is measured by `theme-gap` and moves with the catalogue.

Gates: size **30**, band 0 **13**, bins **8/8** (advisory), same-year pairs **0**, bunching **3
in 1837-1844**, shared **1** (ciphers: `zimmermann-telegram`). Re-measure rather than trust these
figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Deliberate omissions

Cut from the spine to reach 30, on fame or an uncertain year, and to thin the crowded 1850-1870
stretch: the Baghdad pigeon post (1167), Dockwra's London Penny Post (1680), Reuters' pigeons
(1850), Wells Fargo (1852), the first postcard (1869), the Universal Postal Union (1874), UPS
(1907), the first fibre-optic Atlantic cable (1988) and India's last telegram (2013). The 1959
missile mail stunt was dropped from the spine itself to clear the 1956-1963 bunching.

## Fact-check flags

Still `unsupported` after the fact check, for review:

- **`cursus-publicus-founded`, year**: -27 is the start of Augustus's reign. Sources say only
  that he founded the system, some placing it around 20 BCE.
- **`mongol-yam-relay-network`, year**: 1229 is Ögedei's accession. The yam existed under
  Genghis Khan, and Ögedei expanded and formalised it; no source gives an exact year.
- **`beacon-chain-armada-warning`, description**: "within hours" is unsupported. One account
  has the Queen alerted about three days after the 19 July sighting.

Also noted: the mail coach trial ran Bristol to London by way of Bath, so the slug
`first-mail-coach-bath-london` is loose though the card's text holds; and Cher Ami was found by
DNA analysis to be male, which is why the name reads "Delivers the Message".
