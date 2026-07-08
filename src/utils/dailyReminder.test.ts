import { getNext8amDates, getReminderCopy, REMINDER_HOUR } from './dailyReminder';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';
import { shouldShowReminderPriming, recordPrimingDismissed } from './playerStorage';

describe('getNext8amDates', () => {
  it('starts with today when called before 8am', () => {
    const now = new Date(2026, 6, 8, 7, 30); // July 8, 07:30 local
    const dates = getNext8amDates(3, now);
    expect(dates).toHaveLength(3);
    expect(dates[0].getDate()).toBe(8);
    expect(dates[0].getHours()).toBe(REMINDER_HOUR);
    expect(dates[0].getMinutes()).toBe(0);
    expect(dates[1].getDate()).toBe(9);
    expect(dates[2].getDate()).toBe(10);
  });

  it('starts with tomorrow when called at or after 8am', () => {
    const atEight = new Date(2026, 6, 8, 8, 0);
    expect(getNext8amDates(1, atEight)[0].getDate()).toBe(9);

    const evening = new Date(2026, 6, 8, 21, 15);
    expect(getNext8amDates(1, evening)[0].getDate()).toBe(9);
  });

  it('rolls across month boundaries', () => {
    const now = new Date(2026, 6, 31, 12, 0); // July 31, noon
    const dates = getNext8amDates(2, now);
    expect(dates[0].getMonth()).toBe(7); // August
    expect(dates[0].getDate()).toBe(1);
    expect(dates[1].getDate()).toBe(2);
  });

  it('keeps 8:00 wall-clock across the US DST fall-back date', () => {
    // DST in the US ends Nov 1 2026; local-calendar construction must stay at 8:00.
    const now = new Date(2026, 9, 31, 12, 0); // Oct 31, noon
    const dates = getNext8amDates(3, now);
    for (const d of dates) {
      expect(d.getHours()).toBe(REMINDER_HOUR);
      expect(d.getMinutes()).toBe(0);
    }
  });
});

describe('getReminderCopy', () => {
  it('themes the body from the UTC date at the fire instant', () => {
    const fireAt = new Date(2026, 6, 9, 8, 0);
    const puzzleDate = fireAt.toISOString().split('T')[0];
    const expectedTheme = getThemeDisplayName(getDailyTheme(puzzleDate));
    const { title, body } = getReminderCopy(fireAt);
    expect(title.length).toBeGreaterThan(0);
    expect(body).toContain(expectedTheme);
  });

  it('is deterministic for a given fire time', () => {
    const fireAt = new Date(2026, 6, 10, 8, 0);
    expect(getReminderCopy(fireAt)).toEqual(getReminderCopy(fireAt));
  });
});

describe('reminder priming', () => {
  beforeEach(() => localStorage.clear());

  it('shows when never dismissed', () => {
    expect(shouldShowReminderPriming()).toBe(true);
  });

  it('hides within the 7-day cooldown and reshows after it', () => {
    const dismissed = new Date(2026, 6, 1, 12, 0);
    recordPrimingDismissed(dismissed);

    const sixDaysLater = new Date(2026, 6, 7, 12, 0);
    expect(shouldShowReminderPriming(sixDaysLater)).toBe(false);

    const eightDaysLater = new Date(2026, 6, 9, 12, 0);
    expect(shouldShowReminderPriming(eightDaysLater)).toBe(true);
  });

  it('stops showing permanently after 3 dismissals', () => {
    recordPrimingDismissed(new Date(2026, 0, 1));
    recordPrimingDismissed(new Date(2026, 1, 1));
    recordPrimingDismissed(new Date(2026, 2, 1));
    const muchLater = new Date(2027, 0, 1);
    expect(shouldShowReminderPriming(muchLater)).toBe(false);
  });
});
