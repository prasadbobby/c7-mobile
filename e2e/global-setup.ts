/// <reference types="node" />
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
const BACKEND = process.env.BACKEND_DIR ?? '../c7-backend';



/** Fresh c7test DB with seed + scenario data (reuses the backend's API-test setup), plus the mobile scenario. */
export default async function () {
  execSync(`npx tsx -e "import('./tests/global-setup.ts').then(m => m.default())"`, { cwd: BACKEND, stdio: 'inherit' });
  // Mobile-only scenario: Regina's dated workouts, packages, announcements, an invoice, attendance, a video.
  execSync(`npx tsx ${resolve('e2e/scenario.mts')}`, { cwd: BACKEND, stdio: 'inherit', env: { ...process.env, BACKEND_DIR_ABS: resolve(BACKEND) } });
}
