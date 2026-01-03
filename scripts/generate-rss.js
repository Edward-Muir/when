const fs = require('fs');
const path = require('path');

// Read package.json for metadata
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let changelog = '';
if (fs.existsSync(changelogPath)) {
  changelog = fs.readFileSync(changelogPath, 'utf8');
}

// Parse changelog into versions
function parseChangelog(content) {
  if (!content) return [];

  const versions = [];
  // Match headers like: ## [1.0.0](https://...) (2024-01-15) or ## 1.0.0 (2024-01-15)
  const versionRegex =
    /^## \[?(\d+\.\d+\.\d+)\]?(?:\([^)]+\))?\s*\((\d{4}-\d{2}-\d{2})\)/gm;

  let match;
  const matches = [];

  while ((match = versionRegex.exec(content)) !== null) {
    matches.push({
      version: match[1],
      date: match[2],
      index: match.index,
      fullMatch: match[0],
    });
  }

  // Extract content between version headers
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index + current.fullMatch.length;
    const endIndex = next ? next.index : content.length;
    const changes = content.slice(startIndex, endIndex).trim();

    versions.push({
      version: current.version,
      date: current.date,
      changes: changes,
    });
  }

  return versions.slice(0, 10); // Last 10 versions
}

// Convert markdown to basic HTML for RSS
function mdToHtml(md) {
  if (!md) return '';

  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\* \*\*([^*]+)\*\*: (.+)$/gm, '<li><strong>$1</strong>: $2</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(
      /(<li>.*<\/li>\n?)+/g,
      (match) => `<ul>${match.trim()}</ul>`
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n+/g, '<br/><br/>')
    .replace(/\n/g, ' ');
}

// Escape XML special characters
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate RSS XML
function generateRSS(versions) {
  const siteUrl = 'https://play-when.com';
  const now = new Date().toUTCString();

  const items = versions
    .map(({ version, date, changes }) => {
      const htmlContent = mdToHtml(changes);
      return `    <item>
      <title>When? v${version}</title>
      <link>${siteUrl}</link>
      <guid isPermaLink="false">when-v${version}</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>When? - The Timeline Game Releases</title>
    <link>${siteUrl}</link>
    <description>Version releases and updates for When? - The Timeline Game</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

// Main execution
const versions = parseChangelog(changelog);
const rss = generateRSS(versions);

// Write to public directory
const rssPath = path.join(__dirname, '..', 'public', 'feed.xml');
fs.writeFileSync(rssPath, rss);

console.log(
  `RSS feed generated with ${versions.length} release(s) at public/feed.xml`
);
