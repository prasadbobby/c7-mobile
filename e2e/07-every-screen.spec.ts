import { expect, test } from './fixtures';

const routes = ['/home', '/workout', '/stats', '/meals', '/profile', '/challenges', '/leaderboard', '/notifications', '/achievements', '/streak', '/history', '/body', '/saved', '/search', '/settings', '/membership', '/goals', '/attendance', '/bmi', '/reports', '/photos', '/videos', '/announcements', '/invoices', '/devices'];

for (const r of routes)
  test(`screen ${r} renders real data without errors`, async ({ page, signIn, errors }) => {
    await signIn('buddy');
    await page.goto(r);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Couldn’t load this')).toHaveCount(0);
    await expect(page.locator('body')).not.toBeEmpty();
    if (process.env.SHOTS) { await page.waitForTimeout(1200); await page.screenshot({ path: `${process.env.SHOTS}/${r.slice(1)}.png` }); }
    expect(errors).toEqual([]);
  });
