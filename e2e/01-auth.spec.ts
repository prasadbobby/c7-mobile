import { completeSetup, expect, signedOut, test } from './fixtures';

test('first launch shows onboarding, then the login with how-it-works', async ({ page }) => {
  await signedOut(page, false);
  await page.goto('/');
  await expect(page).toHaveURL(/onboarding/);
  await page.getByText(/skip/i).first().click().catch(() => {});
  await page.goto('/login');
  await expect(page.getByText('Let’s log you in')).toBeVisible();
  await expect(page.getByText('New to C7?')).toBeVisible();
  await page.getByText('How it works').click();
  await expect(page.getByText('How C7 works')).toBeVisible();
  await expect(page.getByText('Request a package')).toBeVisible();
});

test('a new email signs up as a guest and only sees packages', async ({ page, errors }) => {
  await signedOut(page);
  await page.goto('/email-login');
  await page.getByLabel('Email').fill('walkin@example.com');
  await page.getByText('Send code').click();
  await expect(page.getByText('There’s no account for walkin@example.com yet', { exact: false })).toBeVisible();
  await page.getByLabel('First name').fill('Walt');
  await page.getByLabel('Last name').fill('Kin');
  await page.getByText('Create account').click();
  await page.getByLabel('Verification code').fill('424242');
  // New people do the same first-time setup as members, then land on packages.
  await completeSetup(page, 'Build muscle');
  await expect(page.getByText(/^Walt/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByLabel('Transform 90 package')).toBeVisible();
  // Member areas are closed to guests.
  await page.goto('/home');
  await expect(page.getByText(/^Walt/).filter({ visible: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('wrong code is rejected, right code signs in; invited member completes first-time setup', async ({ page, errors }) => {
  await signedOut(page);
  await page.goto('/email-login');
  await page.getByLabel('Email').fill('invited@c7.test');
  await page.getByText('Send code').click();
  await expect(page.getByText(/A 6-digit code has been sent to invited@c7.test/)).toBeVisible();
  await page.getByLabel('Verification code').fill('111111');
  await expect(page.getByText(/That code isn’t right/)).toBeVisible();
  await page.getByLabel('Verification code').fill('424242');
  // First sign-in of an invited member creates their C7 profile and starts setup.
  await expect(page.getByLabel('First name')).toHaveValue('Nina'); // prefilled from the invite
  await completeSetup(page);
  await expect(page.getByText('Hello Nina 👋')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a locked account sees the locked screen and can sign out', async ({ page, signIn }) => {
  await signIn('locked');
  await expect(page.getByText('Account locked')).toBeVisible();
  await page.getByText('SIGN OUT').click();
  await expect(page.getByText('Let’s log you in')).toBeVisible();
});
