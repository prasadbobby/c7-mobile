import { type Page } from '@playwright/test';
import { completeSetup, expect, noLoadErrors, test } from './fixtures';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${weekDays[d.getDay()]} ${d.getDate()}`;
};
const visible = (page: Page, text: string) => page.getByText(text, { exact: true }).filter({ visible: true });

async function home(page: Page) {
  const greeting = page.getByText('Hello Regina 👋').filter({ visible: true });
  await expect(greeting.or(page.getByLabel('Step 1 of 6'))).toBeVisible();
  if (await page.getByLabel('Step 1 of 6').isVisible()) await completeSetup(page, 'Build muscle');
  await expect(greeting).toBeVisible();
}

test('home calendar shows only coach-assigned workouts for the selected day', async ({ page, signIn, errors }) => {
  await signIn('buddy');
  await home(page);
  await expect(visible(page, 'Lower Body Strength')).toBeVisible();
  await expect(visible(page, 'Full Body Foundations')).toHaveCount(0);
  await expect(visible(page, 'FROM COACH')).toHaveCount(1);
  // No exercise-library / unassigned workouts on Home.
  await expect(visible(page, 'REFERENCE')).toHaveCount(0);

  // Tomorrow is only in this week's strip when today isn't Saturday.
  test.skip(new Date().getDay() === 6, 'tomorrow is in next week’s strip');
  await page.getByLabel(dayLabel(1), { exact: true }).filter({ visible: true }).click();
  await expect(visible(page, 'Full Body Foundations')).toBeVisible();
  await expect(visible(page, 'Lower Body Strength')).toHaveCount(0);

  // A day with nothing assigned shows a calm empty state.
  if (new Date().getDay() >= 1) {
    await page.getByLabel(dayLabel(-1), { exact: true }).filter({ visible: true }).click();
    await expect(page.getByText(/No workout assigned for/).filter({ visible: true })).toBeVisible();
  }
  await noLoadErrors(page);
  expect(errors).toEqual([]);
});

test('Warm Up / Cardio / Strength chips show reference routines only', async ({ page, signIn, errors }) => {
  await signIn('buddy');
  await home(page);
  await page.getByText('Strength', { exact: true }).filter({ visible: true }).click();
  await expect(visible(page, 'Concentration Curl')).toBeVisible();
  await expect(visible(page, 'Core Blast')).toBeVisible();
  await expect(visible(page, 'REFERENCE')).toHaveCount(2);
  await expect(visible(page, 'Lower Body Strength')).toHaveCount(0);

  await page.getByText('Cardio', { exact: true }).filter({ visible: true }).click();
  await expect(visible(page, 'Tempo Run')).toBeVisible();
  await visible(page, 'Tempo Run').click();
  await expect(page.getByText('How it flows')).toBeVisible();
  await expect(page.getByText(/reference routine/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Workout tab groups assigned workouts by date', async ({ page, signIn, errors }) => {
  await signIn('buddy');
  await home(page);
  await page.goto('/workout');
  await expect(visible(page, 'Today')).toBeVisible();
  await expect(visible(page, 'Upcoming')).toBeVisible();
  const today = page.getByLabel('Lower Body Strength', { exact: true }).filter({ visible: true });
  await expect(today).toBeVisible();
  await expect(visible(page, 'Full Body Foundations')).toBeVisible();
  await expect(page.getByText('Exercise library')).toHaveCount(0);
  await today.click();
  await expect(page.getByText('Heavy day')).toBeVisible();
  await noLoadErrors(page);
  expect(errors).toEqual([]);
});
