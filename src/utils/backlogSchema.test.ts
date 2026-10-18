import fs from 'fs';
import path from 'path';
import { ALL_CATEGORIES } from '../types';
import { ALL_ERAS } from './eras';
import { ALL_REGIONS } from './regions';

/**
 * The deck factory's theme list (docs/curated-themes/backlog.json; see factory.md, section 3).
 *
 * The factory reads this file unattended, one theme a day, so a malformed entry fails here rather
 * than as a stalled scheduled run. The order is deliberately not tested: Edward reorders by hand.
 */

interface BacklogTheme {
  id: string;
  name: string;
  scope: string;
  boundary?: string;
  neighbours?: string[];
  grid: { categories: string[]; eras: string[]; regions: string[] };
  example_beats?: string[];
  appeal?: number;
  notes?: string;
  status: string;
  reason?: string;
}

const BACKLOG = path.join(__dirname, '..', '..', 'docs', 'curated-themes', 'backlog.json');
const themes = (JSON.parse(fs.readFileSync(BACKLOG, 'utf8')) as { themes: BacklogTheme[] }).themes;

/** Mirrors the theme pill's budget in factory.md. */
const MAX_NAME_LENGTH = 20;
const STATUSES = ['queued', 'authoring', 'pr-open', 'done', 'skipped'];

describe('backlog.json', () => {
  it('has unique kebab-case ids and unique names', () => {
    const ids = themes.map((t) => t.id);
    const kebab = (id: string) => /^[a-z0-9-]+$/.test(id) && !/^-|-$|--/.test(id);
    expect(ids.filter((id) => !kebab(id))).toEqual([]);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const names = themes.map((t) => t.name.toLowerCase());
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it(`keeps every name to ${MAX_NAME_LENGTH} characters`, () => {
    expect(themes.filter((t) => t.name.length > MAX_NAME_LENGTH).map((t) => t.name)).toEqual([]);
  });

  it('uses a known status, and says why a theme was skipped', () => {
    expect(themes.filter((t) => !STATUSES.includes(t.status)).map((t) => t.id)).toEqual([]);
    expect(themes.filter((t) => t.status === 'skipped' && !t.reason).map((t) => t.id)).toEqual([]);
  });

  it('keeps notes, where present, to one short instruction', () => {
    expect(
      themes
        .filter(
          (t) =>
            t.notes !== undefined &&
            (typeof t.notes !== 'string' || !t.notes.trim() || t.notes.length > 300)
        )
        .map((t) => t.id)
    ).toEqual([]);
  });

  it('writes every scope as a yes/no rule', () => {
    expect(themes.filter((t) => !/^Yes if /.test(t.scope)).map((t) => t.id)).toEqual([]);
  });

  it('gives every theme still to author a boundary and neighbours that exist', () => {
    const ids = new Set(themes.map((t) => t.id));
    const open = themes.filter((t) => t.status !== 'done' && t.status !== 'skipped');
    expect(open.filter((t) => !t.boundary || !t.neighbours?.length).map((t) => t.id)).toEqual([]);
    const dangling = themes.flatMap((t) =>
      (t.neighbours ?? []).filter((n) => !ids.has(n) || n === t.id).map((n) => `${t.id} -> ${n}`)
    );
    expect(dangling).toEqual([]);
  });

  it('tags the grid with real categories, eras and regions', () => {
    const categories = new Set<string>(ALL_CATEGORIES);
    const eras = new Set<string>(ALL_ERAS);
    const regions = new Set<string>(ALL_REGIONS);
    const bad = themes.flatMap((t) => [
      ...t.grid.categories.filter((c) => !categories.has(c)).map((c) => `${t.id}: ${c}`),
      ...t.grid.eras.filter((e) => !eras.has(e)).map((e) => `${t.id}: ${e}`),
      ...t.grid.regions.filter((r) => !regions.has(r)).map((r) => `${t.id}: ${r}`),
    ]);
    expect(bad).toEqual([]);
  });
});
