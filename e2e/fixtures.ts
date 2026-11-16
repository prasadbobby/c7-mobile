import { test as base, expect, type Page } from '@playwright/test';

export const API = 'http://localhost:4100';
export const USERS = {
  member: { userId: 'user_member_1', firstName: 'Emma', lastName: 'Richardson', email: 'emma@c7.test' },
  buddy: { userId: 'user_member_2', firstName: 'Regina', lastName: 'Fly', email: 'regina@c7.test' },
  admin: { userId: 'user_admin_1', firstName: 'Coach', lastName: 'Prasad', email: 'coach@c7.test' },
  newbie: { userId: 'user_new_1', firstName: 'Nina', lastName: 'New', email: 'invited@c7.test' },
  locked: { userId: 'user_locked_1', firstName: 'Lou', lastName: 'Locked', email: 'locked@c7.test' },
  expired: { userId: 'user_expired_1', firstName: 'Eve', lastName: 'Expired', email: 'eve@c7.test' },
} as const;
export type Who = keyof typeof USERS;

/** Device state as zustand persists it (AsyncStorage → localStorage on web). */
function deviceState(testUserId: string | null) {
  return JSON.stringify({ state: { onboarded: true, readNotifications: [], testUserId, draft: null }, version: 2 });
}

export const test = base.extend<{ signIn: (who: Who) => Promise<void>; errors: string[] }>({
  errors: async ({ page }, use) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await use(errs);
  },
  page: async ({ page, request }, use) => {
    // The test backend stands in for Clerk's user directory.
    for (const u of Object.values(USERS)) await request.post(`${API}/__test/users`, { data: u });
    // Every React / React Native dev error (text nodes in <View>, keys, render-time navigation…) fails the test.
    const consoleErrors: string[] = [];
    page.on('console', (m) => {
      const t = m.text();
      if (m.type() !== 'error' && !/Unexpected text node|isFocused\(\)/.test(t)) return;
      if (/Failed to load resource|Clerk|clerk|WebSocket connection to/.test(t)) return; // expected 4xx in negative tests; SDK notices
      consoleErrors.push(t.replace(/\s+/g, ' ').slice(0, 300));
    });
    await use(page);
    expect(consoleErrors, 'console errors during the test').toEqual([]);
  },
  signIn: async ({ page }, use) => {
    await use(async (who) => {
      await page.addInitScript((s) => localStorage.setItem('c7-device-state', s), deviceState(USERS[who].userId));
      await page.goto('/');
    });
  },
});

export async function signedOut(page: Page, onboarded = true) {
  await page.addInitScript(
    ([s, o]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('c7-device-state', o ? s : JSON.stringify({ state: { onboarded: false, readNotifications: [], testUserId: null, draft: null }, version: 2 }));
        sessionStorage.setItem('seeded', '1');
      }
    },
    [deviceState(null), onboarded] as const,
  );
}

export const noLoadErrors = async (page: Page) => expect(page.getByText('Couldn’t load this')).toHaveCount(0);
export { expect };

/** Walks the 6-step first-time setup (name → goal → level → age → weight → height). */
export async function completeSetup(page: Page, goal = 'Build muscle') {
  await expect(page.getByLabel('Step 1 of 6')).toBeVisible();
  await page.getByLabel('Next step').click();
  await expect(page.getByLabel('Step 2 of 6')).toBeVisible();
  await page.getByLabel(goal).click();
  await page.getByLabel('Next step').click();
  await page.getByLabel('Beginner').click();
  await page.getByLabel('Next step').click();
  await expect(page.getByLabel('Age')).toBeVisible();
  await page.getByLabel('Next step').click();
  await expect(page.getByLabel('Weight ruler')).toBeVisible();
  await page.getByLabel('Next step').click();
  await expect(page.getByLabel('Height ruler')).toBeVisible();
  await page.getByLabel('Finish').click();
  await expect(page.getByText(/YOUR COACH WILL ASSIGN YOUR FIRST WORKOUT IN C7|NEXT: PICK A C7 PACKAGE TO START/)).toBeVisible();
  await page.getByLabel('Let’s go').click();
}
