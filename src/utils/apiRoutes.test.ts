import fs from 'fs';
import path from 'path';

/**
 * Guards Vercel's Serverless Function budget.
 *
 * Vercel turns EVERY `.ts` file under `api/` into its own Serverless Function — there is no
 * opt-out, and an underscore prefix does not exempt a file. The Hobby plan caps a deployment
 * at 12. Shared helpers therefore live in `lib/`, which the bundler still follows imports
 * into but does not deploy as functions.
 *
 * This exists because the alternative — a comment asking people to keep helpers out of
 * `api/` — already failed. Six helper files had accumulated under `api/`, silently burning
 * half the budget, and the limit was only discovered when a deploy died: the build passes
 * locally, passes with CI=true, and fails only on Vercel. That is an expensive way to learn,
 * so the rule gets a test instead of a comment.
 */

const API_DIR = path.join(__dirname, '..', '..', 'api');

/**
 * Deliberately below Vercel's actual limit of 12, so there is room to add a route and still
 * see this fail with a useful message rather than a broken deployment.
 */
const MAX_FUNCTIONS = 10;

function apiFiles(dir: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed path, walked
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return apiFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const files = apiFiles(API_DIR);
const relative = (file: string) => path.relative(API_DIR, file);

describe('the api/ directory holds only Vercel routes', () => {
  it('finds the routes', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(f), f]))(
    '%s is a route with a default export',
    (name, file) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- from the walk above
      const source = fs.readFileSync(file, 'utf8');

      expect(/^export default/m.test(source)).toBe(true);
    }
  );

  it(`deploys at most ${MAX_FUNCTIONS} functions`, () => {
    expect(files.length).toBeLessThanOrEqual(MAX_FUNCTIONS);
  });
});
