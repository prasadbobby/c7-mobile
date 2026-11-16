import { expect, noLoadErrors, test } from './fixtures';

test('profile, membership & payments from the gym, settings and sign out', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/profile');
  await expect(page.getByText('Emma Richardson')).toBeVisible();
  await expect(page.getByText('#C70001')).toBeVisible();
  await page.getByText('Membership & payments').click();
  await expect(page.getByText('Expiring soon')).toBeVisible();
  await expect(page.getByText('₹40,000')).toBeVisible();
  await expect(page.getByText('₹10,000', { exact: true })).toBeVisible();
  await expect(page.getByText('UPI')).toBeVisible();
  await expect(page.getByText('Initial Setup')).toBeVisible();
  await noLoadErrors(page);

  await page.goto('/settings');
  await page.getByText('Edit', { exact: true }).click();
  await page.getByLabel('First name').fill('Emmy');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('Profile updated')).toBeVisible();
  await expect(page.getByText('Emmy Richardson')).toBeVisible();
  await page.getByText('My equipment').click();
  await page.getByText('Dumbbell', { exact: true }).click();
  await page.getByText('Save equipment').click();
  await expect(page.getByText('Equipment saved')).toBeVisible();
  await page.getByText('Log out').click();
  await page.getByText('Log out').last().click();
  await expect(page.getByText('Let’s log you in')).toBeVisible();
});
