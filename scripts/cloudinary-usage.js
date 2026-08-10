#!/usr/bin/env node
/**
 * Report Cloudinary credit usage against the plan limit.
 *
 * Cloudinary has no self-service spend cap: on a fixed plan it warns at ~90% and 100%,
 * then disables the account, which takes every card image in the game down with it. The
 * built-in alerts fire too late to react to a traffic spike, so this prints the current
 * rolling-30-day position and exits non-zero past a threshold — usable as a manual
 * spot-check or as a CI step.
 *
 * Usage:
 *   node scripts/cloudinary-usage.js            # report, exit 1 above 75% of any quota
 *   node scripts/cloudinary-usage.js --warn 60  # custom threshold
 *   node scripts/cloudinary-usage.js --json     # machine-readable
 *
 * Needs CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (Cloudinary console → Settings →
 * API Keys), or a single CLOUDINARY_URL. Read-only: calls the Admin API `usage` endpoint.
 */

require('dotenv').config();

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  console.error('Please install cloudinary: npm install cloudinary');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dscb8inz1',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const warnIndex = args.indexOf('--warn');
const WARN_PCT = warnIndex !== -1 ? Number(args[warnIndex + 1]) : 75;

/** Percentage used, or null when Cloudinary reports no limit for that metric. */
function pct(used, limit) {
  if (!limit || !Number.isFinite(limit)) return null;
  return (used / limit) * 100;
}

function bar(percent) {
  if (percent === null) return '';
  const filled = Math.min(20, Math.round((percent / 100) * 20));
  return `[${'#'.repeat(filled)}${'.'.repeat(20 - filled)}]`;
}

function gb(bytes) {
  return bytes / 1024 ** 3;
}

async function main() {
  if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_API_SECRET) {
    console.error(
      'Missing credentials. Set CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (or CLOUDINARY_URL).'
    );
    process.exit(2);
  }

  const usage = await cloudinary.api.usage();

  // Cloudinary bills one fungible credit pool: 1 credit = 1GB bandwidth OR 1,000
  // transformations OR 1GB storage. `credits` is the number that actually matters;
  // the rest is the breakdown showing which axis is spending it.
  const rows = [
    {
      label: 'Credits',
      used: usage.credits?.usage ?? 0,
      limit: usage.credits?.limit ?? null,
      fmt: (n) => n.toFixed(2),
    },
    {
      label: 'Bandwidth',
      used: gb(usage.bandwidth?.usage ?? 0),
      limit: usage.bandwidth?.limit ? gb(usage.bandwidth.limit) : null,
      fmt: (n) => `${n.toFixed(2)} GB`,
    },
    {
      label: 'Transformations',
      used: usage.transformations?.usage ?? 0,
      limit: usage.transformations?.limit ?? null,
      fmt: (n) => n.toLocaleString(),
    },
    {
      label: 'Storage',
      used: gb(usage.storage?.usage ?? 0),
      limit: usage.storage?.limit ? gb(usage.storage.limit) : null,
      fmt: (n) => `${n.toFixed(2)} GB`,
    },
  ].map((r) => ({ ...r, percent: pct(r.used, r.limit) }));

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          plan: usage.plan,
          lastUpdated: usage.last_updated,
          derivedResources: usage.derived_resources,
          metrics: rows.map(({ label, used, limit, percent }) => ({
            label,
            used,
            limit,
            percent,
          })),
        },
        null,
        2
      )
    );
  } else {
    console.log(`\nCloudinary usage — plan: ${usage.plan}, as of ${usage.last_updated}`);
    console.log('Rolling 30-day window.\n');
    for (const r of rows) {
      const of = r.limit === null ? 'no limit' : `of ${r.fmt(r.limit)}`;
      const percentText = r.percent === null ? '' : `${r.percent.toFixed(1).padStart(5)}%`;
      console.log(
        `  ${r.label.padEnd(16)} ${r.fmt(r.used).padStart(12)}  ${of.padEnd(14)} ${percentText} ${bar(r.percent)}`
      );
    }
    // Derived assets track how many distinct transformation variants exist. Growing far
    // faster than traffic means too many unique transformation URLs are being minted.
    if (usage.derived_resources !== undefined) {
      console.log(`\n  Derived assets   ${String(usage.derived_resources).padStart(12)}`);
    }
    console.log('');
  }

  const breached = rows.filter((r) => r.percent !== null && r.percent >= WARN_PCT);
  if (breached.length > 0) {
    if (!asJson) {
      console.error(
        `At or above ${WARN_PCT}%: ${breached.map((r) => `${r.label} (${r.percent.toFixed(1)}%)`).join(', ')}\n`
      );
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Failed to read Cloudinary usage:', err.message || err);
  process.exit(2);
});
