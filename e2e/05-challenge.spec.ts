import { expect, test } from './fixtures';

test('90-day challenge: overview, post a check-in, edit it, react and comment in the feed, leaderboard', async ({ page, signIn, errors }) => {
  await signIn('member');
  await page.goto('/challenges');
  await expect(page.getByText('90-Day Transformation').first()).toBeVisible();
  await page.getByText('90-Day Transformation').first().click();
  await expect(page.getByText('Your progress')).toBeVisible();
  await expect(page.getByText('Checked in')).toBeVisible(); // calendar legend

  await page.getByText(/Check in · Day/).click();
  await page.getByLabel('Great').click();
  await page.getByLabel('Charged').click();
  await page.getByLabel('More sleep').click();
  await page.getByLabel('How was your day').fill('Hit a new squat PB');
  await page.getByText('Post check-in').click();
  await expect(page.getByText(/posted 🔥/)).toBeVisible();
  await expect(page.getByText('Hit a new squat PB')).toBeVisible();
  await page.getByLabel('Edit check-in').click();
  await page.getByLabel('Wins').fill('Stayed consistent');
  await page.getByText('Save changes').click();
  await expect(page.getByText('Stayed consistent')).toBeVisible();

  await page.getByText('Feed', { exact: true }).click();
  await expect(page.getByText('Leg day done')).toBeVisible();
  await page.getByLabel('Fire reaction').first().click();
  await expect(page.getByLabel('Fire reaction').first()).toContainText('1');
  await page.getByText(/comments? · Reply/).last().click();
  await page.getByLabel('Write a comment').fill('Great work Regina!');
  await page.getByLabel('Send comment').click();
  await expect(page.getByText('Great work Regina!')).toBeVisible();

  await page.goto('/leaderboard');
  await expect(page.getByText('Regina Fly').first()).toBeVisible();
  await expect(page.getByText(/\(You\) Emma Richardson/)).toBeVisible();
  await page.getByText('Weekly', { exact: true }).click();
  await expect(page.getByText('This week')).toBeVisible();
  expect(errors).toEqual([]);
});
