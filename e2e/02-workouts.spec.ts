import { completeSetup, expect, noLoadErrors, test } from './fixtures';

test('coach-assigned workout appears, can be logged set-by-set and lands in history', async ({ page, signIn, errors }) => {
  await signIn('member');
  // Member has no saved preferences yet → setup first.
  await completeSetup(page, 'Get toned');

  await expect(page.getByText('Hello Emma 👋')).toBeVisible();
  await expect(page.getByText('1 workout from your coach')).toBeVisible();
  await page.getByText('Full Body Foundations').first().click();
  await expect(page.getByText('Assigned by Coach Prasad')).toBeVisible();
  await expect(page.getByText('Focus on depth')).toBeVisible();
  await expect(page.getByText('Back Squat').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/rest 75s/).first()).toBeVisible();
  await noLoadErrors(page);

  await page.getByText('Start workout').click();
  await expect(page.getByText(/Exercise 1 of/)).toBeVisible();
  await page.getByLabel('kg', { exact: true }).first().fill('40');
  await page.getByLabel('Complete set').click();
  await expect(page.getByText('seconds rest')).toBeVisible();
  await page.getByText('Skip rest').click();
  await page.getByLabel('End workout').click();
  await expect(page.getByText(/1 of \d+ sets completed/)).toBeVisible();
  await page.getByText('Finish & save').click();

  await expect(page.getByText('Workout complete!')).toBeVisible();
  await expect(page.getByText(/new personal best/)).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Hello Emma 👋').filter({ visible: true })).toBeVisible();
  await expect(page.getByText('FROM COACH')).toHaveCount(0); // assignment is now COMPLETED

  await page.goto('/history');
  await expect(page.getByText('Full Body Foundations').first()).toBeVisible();
  await page.getByText('Full Body Foundations').first().click();
  await expect(page.getByText('40 kg × 10 reps')).toBeVisible();
  expect(errors).toEqual([]);
});

test('exercise detail from the assigned program: PB, favourite, set a goal', async ({ page, signIn }) => {
  await signIn('member');
  await expect(page.getByText('Hello Emma 👋').filter({ visible: true })).toBeVisible();
  await page.goto('/program/assign_1');
  await page.getByText('Back Squat').filter({ visible: true }).first().click();
  await expect(page.getByText('How to do it')).toBeVisible();
  await expect(page.getByText(/40 kg × 10 reps/).filter({ visible: true }).first()).toBeVisible(); // PB from the logged workout
  await page.getByLabel('Add to favourites').click();
  await expect(page.getByText('Added to favourites')).toBeVisible();
  await page.getByText('Set a goal').click();
  await page.getByLabel('Goal in kilograms').fill('60');
  await page.getByText('Save goal').click();
  await expect(page.getByText('Goal 60 kg')).toBeVisible();
  await page.goto('/saved');
  await expect(page.getByText('Favourite exercises')).toBeVisible();
});
