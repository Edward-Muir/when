# When?

When is a mobile-first timeline game: you hold a hand of historical event cards and drag each
one into its place on a growing timeline. A correct placement keeps the card and draws a
replacement; a wrong one leaves a grey tombstone at its true slot and shrinks your hand, and the
game ends when the hand is empty. Play at [play-when.com](https://play-when.com), or in the iOS
and Android apps. Built with React 19, TypeScript and Tailwind CSS, deployed on Vercel.

Home has five tabs:

- **Daily**: one shared, themed deck per day, with a leaderboard.
- **Archive**: replay past curated daily decks.
- **Custom**: build a deck by difficulty, category, era, region and country.
- **Stats**: your records and achievements.
- **My Timeline**: every event you have placed correctly.

## Commands

```bash
vercel dev                   # Full-stack dev (frontend + API routes)
npm start                    # Frontend-only dev server (no API)
npm run build                # Production build; verify with CI=true, as Vercel does
npm test                     # Tests (watch mode). CI=true npm test -- --watchAll=false for one pass
npm run lint                 # ESLint (src, api and lib)
npm run typecheck            # TypeScript check for src
npm run typecheck:api        # TypeScript check for api/
npm run format               # Prettier
npm run release              # Bump version (auto-detect from commits)
```

## Further reading

[CLAUDE.md](CLAUDE.md) holds the project's rules and traps; [docs/index.md](docs/index.md)
indexes one digest per area.
