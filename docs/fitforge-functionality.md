# FitForge (C7 Personal Fitness) — functionality reference

Source: `fitforge/fit-forge-dev` (Next.js 14 App Router · Clerk auth · Prisma + Postgres · NextUI + Tailwind · Vercel Blob · Recharts · OpenAI). Production: c7personalfitness.com. A gym-management + member training app.

## Access & roles
- Clerk auth; **invite-only sign-up** (sign-up blocked unless an invitation ticket/token is present). Public: `/`, sign-in, sign-up, privacy, terms, `/locked`.
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`. Super admins have an extra password + OTP gate (`SuperAdminAuth`).
- Admins can **lock/unlock** a member (locked users land on `/locked`).

## Member app (bottom nav: Dashboard · Workout · Activity · Challenge · Profile)
- **Dashboard** — cards (weekly workouts, daily streak, avg workout duration, weekly PBs, challenges), charts (progress over time, volume load, workout frequency, exercise-category distribution, date ranges), **goals** (create/delete, e.g. target weight on an exercise), assigned workouts, recent activity, quick links.
- **Exercises** — ~800+ exercise library; filter by category, muscle, difficulty, force, my equipment, favourites; search, pagination (state in URL). Detail modal tabs: About, Charts, History, Records (PBs). Favourite (star), add to routine. Admins add/edit/delete exercises and upload images.
- **Routines** — 3-step builder (`/edit-routine/step-1..3`): name/notes/training type → pick exercises → order, sets, reps or duration (`trackingType` reps|duration). Training types: ENDURANCE, HYPERTROPHY, STRENGTH, POWER, TONING, FUNCTIONAL. Workout page shows admin-created system routines + your routines + assigned workouts.
- **Live workout** (`/workout/[id]`, `WorkoutManager`) — per-exercise set table (weight × reps or duration, warm-up flag), add/remove sets, complete sets, **rest timer** with per-exercise defaults (min/max/auto-start), floating timer controls, totals for rest time vs active time, PB detection, confetti, summary; saves a `WorkoutLog` (SetLogs with timestamps). Server-side `WorkoutSession` tracks active/paused/resting state. Admins can run a workout on behalf of a member (saves to their progress).
- **Activity** — history of completed workouts, edit a past workout, share-image generation (OG image).
- **Step tracking** — admin-assigned daily step goals (`StepGoal`); daily `StepLog` with target/actual, carry-over & excess steps, completion and streak; weekly breakdown, history calendar. Data sources: manual, Google Fit / Health Connect, **Fitbit** (OAuth, webhook, weekly/enhanced sync, daily cron 23:55). Also stores heart rate, calories, sleep, distance.
- **90-Day Challenge** — join a challenge (admin enables participants). **Daily post**: sleep hours, sleep quality, meal tracking, day description, mood, energy, achievements, challenges, fasting toggle, photos (HEIC converted + compressed, uploaded to Blob). Calendar of posted days, stats, community feed (posts + photos), reactions (LIKE, LOVE, SUPPORT, STRONG, FIRE, CLAP), threaded comments with reactions, post views, admin-pinned posts, **leaderboard** (overall + weekly).
  - Score weights: consistency 25%, sleep hours 18%, sleep quality 15%, mood 12%, energy 12%, photos 10% (1–3 photos = 1–3 pts, fasting = full 3), posts 8%. Weekly score uses the same formula on that week's posts.
- **Profile** — hero, details (age, height, weight, DOB), equipment owned, body measurements (22 types: weight, body fat %, visceral fat, muscle mass, metabolic age, neck/chest/arms/waist/hips/thighs/calves…) with history + goals, **membership** status & history, payment info.
- **Support** — FAQ.

## Admin console (`/admin`)
- Users: invite (email + role), search, view, lock/unlock, assign workouts (status PENDING / IN_PROGRESS / COMPLETED / SKIPPED / ABSENT, due dates), training progressions (type, weeks), step goals, measurements, **progress** page per user, clear records/payments/membership.
- Membership: statuses ACTIVE, INACTIVE, EXPIRED, SUSPENDED, PAUSED, UPCOMING, CANCELLED; extend, renew, pause (auto-extends end date), early cancellation; full change log.
- Payments: package/offered/discounted price, amount paid, remaining, next due date, methods (CASH, ONLINE, CARD, UPI, BANK_TRANSFER, CHEQUE). Advanced system: pro-rata cross-month revenue, installments, early renewal, refunds (proportional/policy/none), discounts, complimentary extensions.
- Monthly expenses (rent, salaries, electricity, internet, misc, custom) vs revenue.
- Workouts/routines management, analytics, step-tracking overview, 90-day challenge management (challenges, participants, weekly stats, photos, reset points), **Gym Master** live gym sessions (members joined / working out / resting), settings (super admins).

## Integrations
Clerk · Postgres (Prisma, RDS) · Vercel Blob (images) · Google Fit API · Fitbit API + webhook · OpenAI (`/api/ai`) · Resend (email) · Vercel Analytics/OG · cron `/api/cron/daily-fitbit-sync` (CRON_SECRET).
