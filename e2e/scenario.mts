// Mobile-only e2e scenario (runs with the backend's node_modules; see global-setup.ts).
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const BACKEND = process.env.BACKEND_DIR_ABS!;
const pg = createRequire(resolve(BACKEND, 'package.json'))('pg');
const { TEST_DB, USERS } = await import(resolve(BACKEND, 'tests/fixtures.ts'));

const c = new pg.Client({ connectionString: TEST_DB });
await c.connect();
const plan = async (n: string) => (await c.query('SELECT id FROM "WorkoutPlan" WHERE name=$1', [n])).rows[0].id;
const noon = (d: number) => { const x = new Date(); x.setUTCHours(12, 0, 0, 0); x.setUTCDate(x.getUTCDate() + d); return x; };
const ins = 'INSERT INTO "AssignedWorkout"(id,"userId","workoutPlanId","assignedBy",status,notes,"dueDate") VALUES ($1,$2,$3,$4,$5,$6,$7)';
await c.query(ins, ['assign_b_today', USERS.buddy.userId, await plan('Lower Body Strength'), USERS.admin.userId, 'PENDING', 'Heavy day', noon(0)]);
await c.query(ins, ['assign_b_tomorrow', USERS.buddy.userId, await plan('Full Body Foundations'), USERS.admin.userId, 'PENDING', 'Light day', noon(1)]);
// Gym features: packages, announcements, an invoice, attendance and a video.
const q = (sql: string, p: unknown[] = []) => c.query(sql, p);
await q(`INSERT INTO "Package"(id,name,mode,"durationDays",price,"offerPrice",features,highlight,"sortOrder","createdBy") VALUES
  ('pkg_t90','Transform 90','OFFLINE',90,45000,40000,ARRAY['Personal coach','Diet plan','Body composition scans'],true,1,$1),
  ('pkg_online','Online Coaching','ONLINE',30,6000,NULL,ARRAY['Weekly video check-in','Custom plan in the app'],false,2,$1)`, [USERS.admin.userId]);
await q(`INSERT INTO "Announcement"(id,title,body,kind,audience,pinned,"createdBy") VALUES
  ('ann_members','Studio closed Sunday','Deep cleaning — we reopen Monday 6am.','CLOSURE','MEMBERS',true,$1),
  ('ann_guests','Trial week offer','Join this month and get a free body-composition scan.','OFFER','GUESTS',false,$1)`, [USERS.admin.userId]);
await q(`INSERT INTO "Invoice"(id,number,"userId",description,subtotal,"taxPercent","taxAmount",total,"amountPaid",status,"paymentMethod","createdBy") VALUES
  ('inv_1','C7-2026-0001',$1,'C7 membership — 90 days',33898.31,18,6101.69,40000,30000,'PARTIAL','UPI',$2)`, [USERS.member.userId, USERS.admin.userId]);
const ymd = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
for (const d of [0, 1, 2]) await q(`INSERT INTO "Attendance"(id,"userId",date,status,"markedBy") VALUES ($1,$2,$3::date,'PRESENT',$4)`, ['att_' + d, USERS.member.userId, ymd(d), USERS.admin.userId]);
await q(`INSERT INTO "WorkoutVideo"(id,title,category,"videoUrl","durationSec","isAnimated","createdBy") VALUES ('vid_1','Goblet squat — form','strength','http://localhost:4100/files/videos/demo.mp4',45,true,$1)`, [USERS.admin.userId]);
await c.end();
