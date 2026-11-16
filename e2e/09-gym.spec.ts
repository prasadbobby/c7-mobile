import { type Page } from '@playwright/test';
import { completeSetup, expect, noLoadErrors, test } from './fixtures';

const v = (page: Page, text: string | RegExp) => page.getByText(text).filter({ visible: true }).first();

async function memberHome(page: Page) {
  const hello = page.getByText('Hello Emma 👋').filter({ visible: true });
  await expect(hello.or(page.getByLabel('Step 1 of 6'))).toBeVisible();
  if (await page.getByLabel('Step 1 of 6').isVisible()) await completeSetup(page, 'Get toned');
  await expect(hello).toBeVisible();
}

test('guest requests a package; the request is remembered', async ({ page, signIn, request }) => {
  // A self-signed-up user (registered in the test directory, no invitation).
  await request.post('http://localhost:4100/__test/users', { data: { userId: 'user_guesty', firstName: 'Gina', lastName: 'Guest', email: 'gina@example.com' } });
  await page.addInitScript(() => localStorage.setItem('c7-device-state', JSON.stringify({ state: { onboarded: true, readNotifications: [], testUserId: 'user_guesty', draft: null }, version: 2 })));
  await page.goto('/');
  await completeSetup(page, 'Lose weight');
  await expect(v(page, 'Gina Guest')).toBeVisible();
  await expect(v(page, 'Trial week offer')).toBeVisible(); // guest-only announcement
  await expect(page.getByText('Studio closed Sunday')).toHaveCount(0); // members-only
  await page.getByRole('tab', { name: 'Online' }).click();
  await expect(page.getByLabel('Online Coaching package')).toBeVisible();
  await expect(page.getByLabel('Transform 90 package')).toHaveCount(0);
  await page.getByRole('tab', { name: 'All' }).click();
  await page.getByLabel('Transform 90 package').click();
  await expect(v(page, 'What’s included')).toBeVisible();
  await expect(v(page, /Save ₹5,000/)).toBeVisible();
  await page.getByText('Request this package').click();
  await page.getByLabel('Phone number').fill('12345');
  await page.getByText('Confirm interest').click();
  await expect(v(page, /10-digit mobile number/)).toBeVisible();
  await page.getByLabel('Phone number').fill('9840012345');
  await page.getByText('Confirm interest').click();
  await expect(v(page, 'Your interest is noted.')).toBeVisible();
  await page.getByText('Done', { exact: true }).click();
  await expect(v(page, 'Request sent — the studio will call you')).toBeVisible();
  await page.goBack();
  await expect(v(page, 'Request sent')).toBeVisible();
  void signIn;
});

test('expired member is sent to Renew; training areas stay locked', async ({ page, signIn, errors }) => {
  await signIn('expired');
  await expect(v(page, 'Your package has ended')).toBeVisible();
  await expect(page.getByLabel('Transform 90 package')).toBeVisible();
  await page.goto('/home');
  await expect(v(page, 'Your package has ended')).toBeVisible();
  expect(errors).toEqual([]);
});

test('member: invoices with PDF, attendance month, announcements', async ({ page, signIn }) => {
  await signIn('member');
  await memberHome(page);
  await expect(v(page, 'Studio closed Sunday')).toBeVisible(); // home notice banner
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Invoices' }).filter({ visible: true }).click();
  await expect(v(page, '₹10,000')).toBeVisible(); // outstanding
  await page.getByLabel('Invoice C7-2026-0001').click();
  await expect(v(page, 'GST 18%')).toBeVisible();
  await expect(v(page, 'PARTIAL')).toBeVisible();
  await expect(v(page, 'Share PDF receipt')).toBeVisible();

  await page.goto('/attendance');
  await expect(v(page, 'Visits')).toBeVisible();
  await expect(v(page, 'day streak')).toBeVisible();
  await page.getByLabel('Previous month').click();
  await page.getByLabel('Next month').click();

  await page.goto('/announcements');
  await expect(v(page, 'Studio closed Sunday')).toBeVisible();
  await expect(page.getByText('Trial week offer')).toHaveCount(0);
  await page.getByText('Read all').click();
  await expect(page.getByText('Read all')).toHaveCount(0);
  await noLoadErrors(page);
});

test('member: BMI calculator saves a weigh-in and shows category', async ({ page, signIn }) => {
  await signIn('member');
  await memberHome(page);
  await page.goto('/bmi');
  await expect(v(page, 'Body mass index')).toBeVisible();
  await page.getByLabel('Weight in kg').fill('60');
  await page.getByLabel('Height in cm').fill('168');
  await expect(v(page, '21.3')).toBeVisible();
  await page.getByText('Save as today’s weigh-in').click();
  await expect(v(page, 'Weigh-in saved')).toBeVisible();
  await expect(page.getByLabel('BMI 21.3')).toBeVisible();
  await expect(v(page, 'HEALTHY')).toBeVisible();
  await page.getByLabel('Weight in kg').fill('5');
  await expect(v(page, 'Up to date')).toBeVisible();
});

test('member: medical report upload, open and delete', async ({ page, signIn }) => {
  await signIn('member');
  await memberHome(page);
  await page.goto('/reports');
  await expect(v(page, 'No reports yet')).toBeVisible();
  await page.getByLabel('Add report').click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Choose PDF or photo').click();
  await (await chooser).setFiles({ name: 'lipid_profile.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%test\n') });
  await expect(page.getByLabel('Report name')).toHaveValue('lipid profile');
  await page.getByText('Save report').click();
  await expect(v(page, 'Report added')).toBeVisible();
  await expect(page.getByLabel('Open lipid profile')).toBeVisible();
  const popup = page.waitForEvent('popup');
  await page.getByLabel('Open lipid profile').click();
  await page.getByText('Open PDF').click();
  await (await popup).close();
  await page.getByText('Delete report').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).filter({ visible: true }).last().click();
  await expect(v(page, 'No reports yet')).toBeVisible();
});

test('member: progress photo add and compare; videos and devices screens', async ({ page, signIn }) => {
  await signIn('member');
  await memberHome(page);
  await page.goto('/photos');
  await expect(v(page, 'No front photos yet')).toBeVisible();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  for (const w of ['50', '49']) {
    const chooser = page.waitForEvent('filechooser');
    await page.getByLabel('Add photo').click();
    await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
    await page.getByLabel('Weight today').fill(w);
    await page.getByRole('button', { name: 'Save' }).filter({ visible: true }).last().click();
    await expect(v(page, 'Photo saved')).toBeVisible();
  }
  const tiles = page.getByLabel(/Photo from/);
  await expect(tiles).toHaveCount(2);
  await expect(page.getByLabel('Before and after comparison, drag to compare')).toBeVisible();
  await expect(v(page, 'Days apart')).toBeVisible();
  await expect(v(page, /50 kg → 49 kg/)).toBeVisible();

  await page.goto('/videos');
  await expect(v(page, 'Goblet squat — form')).toBeVisible();
  await expect(v(page, 'ANIMATED DEMO')).toBeVisible();
  await expect(v(page, /Offline saving works in the C7 app/)).toBeVisible();

  await page.goto('/devices');
  await expect(v(page, 'Step counting works in the C7 app on your phone.')).toBeVisible();
  await expect(v(page, 'Fitbit')).toBeVisible();
});

test('member: snap a meal photo when logging a custom meal', async ({ page, signIn }) => {
  await signIn('member');
  await memberHome(page);
  await page.goto('/meals');
  await page.getByLabel('Add to Dinner').filter({ visible: true }).first().click();
  await page.getByText('Custom').filter({ visible: true }).click();
  await page.getByLabel('Meal name').fill('Idli sambar');
  await page.getByLabel('Calories').fill('320');
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Add a photo').click();
  await (await chooser).setFiles({ name: 'idli.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.getByLabel('Remove meal photo')).toBeVisible();
  await page.getByText('Add meal').click();
  await expect(v(page, 'Idli sambar')).toBeVisible();
});
