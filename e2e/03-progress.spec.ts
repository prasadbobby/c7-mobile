import { expect, noLoadErrors, test } from './fixtures';

test('steps: coach target shows and logging steps updates progress', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/stats');
  await expect(page.getByText(/Daily target 8,000/)).toBeVisible();
  await page.getByText('LOG STEPS').click();
  await page.getByLabel('Steps').fill('9000');
  await page.getByText('Save steps').click();
  await expect(page.getByText('9,000 / 8,000')).toBeVisible();
  await noLoadErrors(page);
});

test('body: log weight and a measurement, set a goal', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/body');
  await page.getByText('Log weight').click();
  await page.getByLabel('Value').fill('51.5');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('51.5kg').first()).toBeVisible();
  await page.getByText('Waist').click();
  await page.getByLabel('Value').fill('28');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('28 inches')).toBeVisible();
  await page.getByText('Set goal').click();
  await page.getByLabel('Target').fill('50');
  await page.getByText('Save goal').click();
  await expect(page.getByText('Goal 50kg')).toBeVisible();
});

test('streaks, achievements and notifications reflect real activity', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/streak');
  await expect(page.getByText('day streak')).toBeVisible();
  await page.goto('/achievements');
  await expect(page.getByText('First Workout')).toBeVisible();
  await expect(page.getByLabel('Badge earned').first()).toBeVisible();
  await page.goto('/notifications');
  await expect(page.getByText(/Membership ends in [56] days/)).toBeVisible();
  await expect(page.getByText('Payment due soon')).toBeVisible();
  await expect(page.getByText("Today's check-in is open")).toBeVisible();
  await page.getByText('Read all').click();
  await noLoadErrors(page);
});
