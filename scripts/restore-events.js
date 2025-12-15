#!/usr/bin/env node

/**
 * Restore incorrectly removed events
 * These events were wrongly identified as duplicates due to similar naming patterns
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');

// Events to restore, organized by file
const EVENTS_TO_RESTORE = {
  'diplomatic.json': [
    {
      "name": "tang-dynasty",
      "friendly_name": "Tang Dynasty Established",
      "year": 618,
      "category": "diplomatic",
      "description": "The Tang Dynasty began China's golden age of culture and governance.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Tang_outline_map%2C_661.svg/330px-Tang_outline_map%2C_661.svg.png"
    },
    {
      "name": "song-dynasty",
      "friendly_name": "Song Dynasty Established",
      "year": 960,
      "category": "diplomatic",
      "description": "The Song Dynasty ushered in an era of technological innovation and economic growth.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/China_-_Song_Dynasty-en.svg/330px-China_-_Song_Dynasty-en.svg.png"
    },
    {
      "name": "ming-dynasty",
      "friendly_name": "Ming Dynasty Established",
      "year": 1368,
      "category": "diplomatic",
      "description": "The Ming Dynasty restored Chinese rule after Mongol domination.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Map_of_Ming_Chinese_empire_1415_%28cropped_2%29.jpg/330px-Map_of_Ming_Chinese_empire_1415_%28cropped_2%29.jpg"
    },
    {
      "name": "han-dynasty",
      "friendly_name": "Han Dynasty Established",
      "year": -206,
      "category": "diplomatic",
      "description": "The Han Dynasty established the golden age of Chinese civilization.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Han_map.jpg/330px-Han_map.jpg"
    },
    {
      "name": "womens-suffrage-us",
      "friendly_name": "19th Amendment Ratified",
      "year": 1920,
      "category": "diplomatic",
      "description": "American women gained the constitutional right to vote.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Suffragists_Parade_Down_Fifth_Avenue%2C_1917.JPG/330px-Suffragists_Parade_Down_Fifth_Avenue%2C_1917.JPG"
    },
    {
      "name": "salt-i",
      "friendly_name": "SALT I Signed",
      "year": 1972,
      "category": "diplomatic",
      "description": "The US and USSR signed the first Strategic Arms Limitation Treaty.",
      "difficulty": "hard",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Nixon_and_Brezhnev_signing_SALT_I.jpg/330px-Nixon_and_Brezhnev_signing_SALT_I.jpg"
    },
    {
      "name": "start-i",
      "friendly_name": "START I Signed",
      "year": 1991,
      "category": "diplomatic",
      "description": "The US and USSR signed the first Strategic Arms Reduction Treaty.",
      "difficulty": "hard",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/George_Bush_and_Mikhail_Gorbachev_sign_the_START_1991.jpg/330px-George_Bush_and_Mikhail_Gorbachev_sign_the_START_1991.jpg"
    }
  ],
  'conflict.json': [
    {
      "name": "wwi-start",
      "friendly_name": "World War I Begins",
      "year": 1914,
      "category": "conflict",
      "description": "The assassination of Archduke Franz Ferdinand sparked the Great War.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Bataille_de_Verdun_1916.jpg/330px-Bataille_de_Verdun_1916.jpg"
    },
    {
      "name": "wwii-end",
      "friendly_name": "World War II Ends",
      "year": 1945,
      "category": "conflict",
      "description": "Japan surrendered following the atomic bombings, ending WWII.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Surrender_of_Japan_-_USS_Missouri_%28restored%29.jpg/330px-Surrender_of_Japan_-_USS_Missouri_%28restored%29.jpg"
    },
    {
      "name": "irish-independence",
      "friendly_name": "Irish War of Independence Begins",
      "year": 1919,
      "category": "conflict",
      "description": "Irish republicans launched a guerrilla war against British rule.",
      "difficulty": "hard",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Hogan%27s_Flying_Column.gif/330px-Hogan%27s_Flying_Column.gif"
    },
    {
      "name": "iraq-war-start",
      "friendly_name": "Iraq War Begins",
      "year": 2003,
      "category": "conflict",
      "description": "US-led coalition invaded Iraq to remove Saddam Hussein from power.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/UStanks_baghdad_2003.JPEG/330px-UStanks_baghdad_2003.JPEG"
    }
  ],
  'cultural.json': [
    {
      "name": "womens-suffrage-uk",
      "friendly_name": "Women Gain Vote in UK",
      "year": 1918,
      "category": "cultural",
      "description": "British women over 30 gained the right to vote.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Suffragette_Emily_Davison%27s_return_from_Holloway_%28cropped%29.jpg/330px-Suffragette_Emily_Davison%27s_return_from_Holloway_%28cropped%29.jpg"
    },
    {
      "name": "womens-suffrage-us",
      "friendly_name": "Women Gain Vote in US",
      "year": 1920,
      "category": "cultural",
      "description": "The 19th Amendment granted American women the right to vote.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Suffragists_Parade_Down_Fifth_Avenue%2C_1917.JPG/330px-Suffragists_Parade_Down_Fifth_Avenue%2C_1917.JPG"
    }
  ],
  'exploration.json': [
    {
      "name": "jamestown",
      "friendly_name": "Jamestown Colony Founded",
      "year": 1607,
      "category": "exploration",
      "description": "English settlers established the first permanent settlement in North America.",
      "difficulty": "easy",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Jamestown_Church_Tower_2006.jpg/330px-Jamestown_Church_Tower_2006.jpg"
    },
    {
      "name": "south-pole-reached",
      "friendly_name": "South Pole Reached",
      "year": 1911,
      "category": "exploration",
      "description": "Roald Amundsen's expedition became the first to reach the South Pole.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Amundsen_expedition_at_the_South_Pole.jpg/330px-Amundsen_expedition_at_the_South_Pole.jpg"
    },
    {
      "name": "cell-theory",
      "friendly_name": "Cell Theory Established",
      "year": 1839,
      "category": "exploration",
      "description": "Schleiden and Schwann formulated the theory that all living things are made of cells.",
      "difficulty": "hard",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Cells_from_onion_epidermis.jpg/330px-Cells_from_onion_epidermis.jpg"
    },
    {
      "name": "x-ray",
      "friendly_name": "X-Ray Discovered",
      "year": 1895,
      "category": "exploration",
      "description": "Wilhelm Röntgen discovered X-rays, revolutionizing medical imaging.",
      "difficulty": "medium",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/First_medical_X-ray_by_Wilhelm_R%C3%B6ntgen_of_his_wife_Anna_Bertha_Ludwig%27s_hand_-_18951222.gif/330px-First_medical_X-ray_by_Wilhelm_R%C3%B6ntgen_of_his_wife_Anna_Bertha_Ludwig%27s_hand_-_18951222.gif"
    }
  ]
};

function restoreEvents() {
  console.log('🔄 Restoring incorrectly removed events...\n');

  let totalRestored = 0;

  for (const [file, eventsToAdd] of Object.entries(EVENTS_TO_RESTORE)) {
    const filePath = path.join(EVENTS_DIR, file);
    const events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Get existing event names to avoid duplicates
    const existingNames = new Set(events.map(e => e.name));

    let addedCount = 0;
    for (const event of eventsToAdd) {
      if (!existingNames.has(event.name)) {
        events.push(event);
        console.log(`  ✓ Restored: "${event.friendly_name}" (${event.year}) to ${file}`);
        addedCount++;
      } else {
        console.log(`  - Skipped (already exists): "${event.friendly_name}"`);
      }
    }

    if (addedCount > 0) {
      // Sort events by year
      events.sort((a, b) => a.year - b.year);
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
      totalRestored += addedCount;
    }
  }

  console.log(`\n✅ Restored ${totalRestored} events!`);
}

restoreEvents();
