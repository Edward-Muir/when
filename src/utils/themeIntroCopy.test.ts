// eslint-disable-next-line @typescript-eslint/no-var-requires
const { introProblems } = require('../../scripts/themes/intro.js');

/**
 * scripts/themes/intro.js is the publish script's date check on a theme's intro popup. It
 * runs in the publish Action rather than in the API because the date rule lives in
 * scripts/events/date-clues.js, beside the catalogue's own check.
 */
describe('theme intro copy', () => {
  const clean = {
    blurb: 'Maps, charts and surveys that changed how people pictured the world.',
    fact: 'The first map to print the name "America" ran to about a thousand copies.',
  };

  it('passes a theme with no intro', () => {
    expect(introProblems({ id: 'x' })).toEqual([]);
  });

  it('passes clean copy, durations and figures included', () => {
    expect(introProblems({ intro: clean })).toEqual([]);
    expect(
      introProblems({
        intro: { ...clean, fact: 'It was heard 4,800 km away, for over a century.' },
      })
    ).toEqual([]);
  });

  it.each([
    ['a year', 'The map was printed in 1507.'],
    ['a decade', 'Mapmaking boomed in the 1500s.'],
    ['a century', 'A 16th-century map.'],
    ['an era', 'Founded in 301 CE.'],
  ])('rejects %s in the fact', (_kind, fact) => {
    const problems = introProblems({ intro: { ...clean, fact } });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('intro.fact states a date');
  });

  it('checks the blurb too', () => {
    const problems = introProblems({ intro: { ...clean, blurb: 'Maps since 1507.' } });
    expect(problems[0]).toContain('intro.blurb states a date');
  });
});

// A module, not a script: CRA compiles with isolatedModules.
export {};
