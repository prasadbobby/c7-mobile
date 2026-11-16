import { expect, test } from './fixtures';

test('meals: coach goal, water, log a recipe and a custom meal, remove one', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/meals');
  await expect(page.getByText('/ 1800 goal')).toBeVisible();
  await page.getByLabel('Add 250ml water').click();
  await expect(page.getByLabel('Water today')).toHaveText('0.25L');
  await page.getByLabel('Add to Breakfast').click();
  await page.getByLabel('Log Berry Yogurt Bowl').click();
  await expect(page.getByText('Added to Breakfast')).toBeVisible();
  await expect(page.getByText('290 kcal').first()).toBeVisible();
  await page.getByLabel('Add to Snack').click();
  await page.getByText('Custom', { exact: true }).click();
  await page.getByLabel('Meal name').fill('Protein shake');
  await page.getByLabel('Calories').fill('180');
  await page.getByLabel('Protein').fill('30');
  await page.getByText('Add meal').click();
  await expect(page.getByText('Protein shake')).toBeVisible();
  await page.getByText('Protein shake').click();
  await page.getByLabel('Remove Protein shake').click();
  await expect(page.getByText('Meal removed')).toBeVisible();
});

test('recipe detail: like, save, comment, add with servings', async ({ page, signIn }) => {
  await signIn('member');
  await page.goto('/meals');
  await page.getByLabel('Power-packed Bowl').first().click();
  await expect(page.getByText('Ingredients')).toBeVisible();
  await page.getByLabel('Like', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('1 Likes').filter({ visible: true })).toBeVisible();
  await page.getByLabel('Save', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Saved to your collection')).toBeVisible();
  await page.getByLabel('Comment', { exact: true }).filter({ visible: true }).fill('Made this tonight, great!');
  await page.getByLabel('Post comment').filter({ visible: true }).click();
  await expect(page.getByText('Made this tonight, great!').filter({ visible: true })).toBeVisible();
  await page.getByText('Add to today’s meals').filter({ visible: true }).click();
  await page.getByText('Dinner', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Added to Dinner')).toBeVisible();
  await page.goto('/search');
  await page.getByLabel('Search', { exact: true }).filter({ visible: true }).fill('salmon');
  await expect(page.getByText('Lemon-Herb Butter Salmon').filter({ visible: true }).first()).toBeVisible();
});
