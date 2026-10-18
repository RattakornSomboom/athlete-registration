## Excellence: ออกแบบ UX/UI ระดับ production — เฟส 1 หน้าภาพรวมผู้บริหาร — 2026-10-18
- ผลสำรวจผู้ใช้: ผู้ใช้ปลายทาง = เจ้าหน้าที่กองกิจการนิสิต, ผู้บริหาร, โค้ช, นักกีฬา; งานหลักของหน้าแรก = ดูภาพรวมเพื่อรายงานผู้บริหาร; อุปกรณ์ = เดสก์ท็อปอย่างเดียว; กีฬา = ยังไม่ขยาย แต่โครงหน้าต้องไม่ผูกกีฬา
- ทำแล้ว (เฟส 1): หน้า `/staff/excellence` เป็นรายงานผู้บริหาร + ทะเบียนกีฬา + ส่งออก CSV + พิมพ์รายงาน
- เฟสถัดไป: (2) ปรับหน้ารายคน/heatmap/เป้าหมายให้เข้ากับโครงเดียวกันและบันทึกผลเป็นชุดต่อรายการ/วัน, (3) มุมมองโค้ช (เฉพาะกีฬาของตน) และนักกีฬา (อ่านอย่างเดียว) ซึ่งต้องออกแบบสิทธิ์และเส้นทางใหม่ ตอนนี้เข้าได้เฉพาะ STAFF/ADMIN, (4) ทดสอบการพิมพ์จริงและการเข้าถึง (keyboard/screen reader)

## Excellence: ใช้สถานีและระดับตามเกณฑ์กลุ่ม 9 — 2026-10-18
- สถานีเปลี่ยนเป็น 11 รายการของกลุ่ม 9 (ไขมัน, นั่งงอตัว, นอนแอ่นหลัง, แรงบีบมือ, แรงเหยียดขา, ลุก-นั่ง, ดันพื้น, วิ่ง 40 ม., Wingate power/capacity, Multistage) แทน 7 สถานีเดิม (ตัด Agility ที่กลุ่ม 9 ไม่มี)
- ระดับ 5 ระดับ ดีมาก/ดี/ปานกลาง/ต่ำ/ต่ำมาก จุดอ่อนคือต่ำและต่ำมากเท่านั้น "ปานกลาง" ไม่นับ ส่วน "พอใช้" ของเกณฑ์รุ่นเดิมอ่านเป็น "ปานกลาง"
- ตัวเลขดิบใต้ key ของสถานีถูกตัดสินด้วย `rateGroup9Value` ตามเพศ งานถัดไปที่เป็นไปได้: หน้ากรอกตัวเลขดิบกลุ่ม 9 ที่บันทึกลง `scores` (ตอนนี้ผลนำเข้าเป็นผ่าน/ไม่ผ่านหรือระดับข้อความ)

## Excellence: ขอบเขตการเก็บข้อมูลการแข่งขัน — 2026-10-18
- ตัดสินใจ: **ไม่ทำช่วง "ระหว่างแข่ง"** (split, ผลรายรอบ/รายครั้ง, ความเร็วลม, ความสูงที่ผ่านในกระโดดสูง/ค้ำถ่อ) ไม่อยู่ในขอบเขตของโมดูลนี้
- ขอบเขตที่ถือว่าครบ: **ก่อนแข่ง** (ผลทดสอบสมรรถภาพ, จุดอ่อน, แผนพัฒนา, เป้าหมาย, heatmap) และ **หลังแข่ง** (ผลแข่ง 1 ผลต่อ 1 ครั้งที่แข่ง, PB/SB, Gap, % ของเป้า, กราฟพัฒนาการ, ทดสอบซ้ำเทียบก่อน-หลัง) ตามที่ implement ไว้แล้ว ไม่มีงานค้างในส่วนนี้
- ถ้าภายหลังต้องการเก็บผลระหว่างแข่ง ต้องออกแบบที่เก็บข้อมูลใหม่ (ผลปัจจุบันเป็นตัวเลขเดียวต่อผลแข่ง)

## Excellence: เพิ่มรายการลานและ Heatmap ทีม — 2026-10-18
- รองรับกรีฑาประเภทลาน (กระโดดไกล/สามชั้น/สูง/ค้ำถ่อ, ทุ่มน้ำหนัก, ขว้างจักร, พุ่งแหลน, ขว้างค้อน) วัดเป็นเมตร ยิ่งมากยิ่งดี นอกเหนือจากลู่ที่วัดเวลา
- หน้าใหม่ `/staff/excellence/heatmap` แสดงนักกีฬา × 7 สถานี เรียงคนที่มีจุดอ่อนมากสุดก่อน พร้อมสรุปจุดอ่อนของทีมรายสถานี
- งานถัดไปที่เป็นไปได้: ทดสอบสิทธิ์ ATHLETICS/CLUB ด้วยบัญชีจริง (`excellence-access.spec.ts`), คะแนนทางการ (World Athletics Points) ถ้าได้ตารางสัมประสิทธิ์, กำหนดกฎชนิดรายการตามประเภทที่สมัคร ถ้าต้องการจำกัดไม่ให้นักกีฬาลู่บันทึกรายการลาน

## Excellence ใหม่: กรีฑาประเภทลู่ ที่ /staff/excellence — 2026-10-18
- เลิกใช้แท็บ `staff/analytics?tab=excellence` และลบโค้ดเดิมทั้งหมด (สำรองไว้ใน commit `0e2d3f9`)
- หน้าใหม่ 3 หน้า: ภาพรวม (กรองรายการ/เพศ), รายคน (ผลแข่ง PB/SB, จุดอ่อน, แผนผูกสถานี, ทดสอบซ้ำ, ไทม์ไลน์), เป้าเวลาแยกรายการ+เพศ
- งานถัดไปที่เป็นไปได้: ทดสอบบันทึกจริงด้วยบัญชี STAFF บนฐานข้อมูลทดสอบ, กราฟพัฒนาการเวลา, ทดสอบสิทธิ์ ATHLETE/CLUB ด้วย e2e

## Sport-Specific Fitness Display — 2026-10-17
- ปรับหน้า Excellence ให้ใช้โปรไฟล์นำร่องกรีฑา 7 รายการ และว่ายน้ำ 8 รายการ แยกแรงบีบมือออกจากดันพื้น ไม่บังคับจำนวนเท่ากัน
- กรีฑาใช้ชุดความเร็ว 40 เมตร พลังระเบิดขา ความคล่องแคล่ว ความอ่อนตัว แรงบีบมือ ระบบหายใจ และองค์ประกอบร่างกาย
- กีฬาทางน้ำ/ว่ายน้ำใช้ชุดแรงช่วงบน แกนกลาง พลังระเบิดขา ความอ่อนตัว/นอนแอ่นหลัง ระบบหายใจ และองค์ประกอบร่างกาย โดยเวลา 50 เมตรอยู่ในผลการแข่งขัน
- ฟอร์มผลทดสอบซ้ำและการเปรียบเทียบก่อน-หลังใช้ station profile เดียวกับการ์ดนักกีฬา เพื่อให้ข้อมูลที่กรอกสอดคล้องกับกีฬาของนักกีฬา

## Excellence Pilot Sports Isolation (Strict 2-Sport Scope) — 2026-10-16
- Enforced strict 2-sport isolation for the Excellence Module (ทั้ง 10 ข้อ: แผนพัฒนา, ผู้รับผิดชอบ, วันที่เริ่ม-สิ้นสุด, สถานะ, ผลทดสอบซ้ำ, Benchmarks, สมรรถภาพก่อนแข่ง, เวลา/อันดับ, ตัวอย่างแผน, ติดตามผล 4-6 สัปดาห์):
  1. กรีฑา (Athletics - 40m Sprint)
  2. กีฬาทางน้ำ / ว่ายน้ำ (Aquatics / Swimming - 50m Freestyle)
- Removed team sports (บาสเกตบอล, ฟุตซอล, วอลเลย์บอล) completely from `DEFAULT_SPORT_BENCHMARKS` and `BenchmarkModal` dropdown.
- Filtered real applications query in `getPerformanceInsights` to include only `PILOT_SPORTS` (`กรีฑา`, `กีฬาทางน้ำ`, `ว่ายน้ำ`).
- Updated `StaffExcellenceTab` filter dropdown to display only the 2 pilot sports clearly.
- Quality gates: `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors, 0 warnings), `npm run test:unit` (95 passed), `npm run build` (74 routes successfully built).

## Two Pilot Sports Scope: Athletics & Aquatics/Swimming — 2026-10-16
- Defined the Excellence feature scope to focus on two quantitative, time-based pilot sports:
  1. กรีฑา (Athletics): Sprint 40m, default benchmark 5.2s, target readiness score 85.
  2. กีฬาทางน้ำ / ว่ายน้ำ (Aquatics / Swimming): 50m Freestyle, default benchmark 27.5s, target readiness score 85.
- Updated `DEFAULT_SPORT_BENCHMARKS` to include both `กีฬาทางน้ำ` and `ว่ายน้ำ` alongside `กรีฑา`.
- Tailored rule-based recommendations in `analyzeAthletePerformance` for swimming (Aerobic swim capacity, stroke rate pacing, dryland core/resistance, and shoulder/ankle mobility).
- Added two Swimming fixtures with a 6-week Closed-Loop follow-up retest fixture showing -1.6s progress and +18 readiness score.
- Updated Demo script at `docs/PERFORMANCE_DEMO_SCRIPT.md` to document the 2-sport walkthrough.
- Quality gates: typecheck passed, lint 0 warnings, 95 unit tests passed, and build passed.

## Production Closed-Loop Input — 2026-10-16
- Added the real staff workflow on the Excellence tab without changing the existing demo fixtures.
- Added `/api/staff/excellence` with server-side role checks and validation for action plans, follow-up retests, and sport benchmarks.
- Stored action plan metadata and an append-only retest history under the existing `FitnessTestResult.scores._excellence` JSON namespace, preserving legacy score fields and avoiding an unapproved database migration.
- Added `ActionPlanModal` for coach, responsible person, date range, plan items, status, and retest station results.
- Added `BenchmarkModal` for staff-editable target time and target readiness score, persisted in `SystemSetting` key `SPORT_BENCHMARKS`.
- Real records now render the latest Closed-Loop comparison and expose all retest history; demo records remain read-only.
- Quality gates: `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` (94 passed), and `npm run build` passed. Build retains the existing non-blocking middleware deprecation warning.

## Performance Excellence Analytics — Implementation Status — 2026-10-15
- Demo readiness follow-up — 2026-10-16: deterministic Demo mode now uses the three athletics/40m sprint fixtures only, keeps demo and real records separate, aligns fixture event names with the 5.2-second benchmark, and adds the graduation-project walkthrough at `docs/PERFORMANCE_DEMO_SCRIPT.md`.
- สถานะ: COMPLETED (Single Sport Demo: กรีฑา)
- ปรับปรุงครบตามแผน:
  1. รวมชุดข้อมูลตัวอย่างเป็นกีฬาเดียวคือ "กรีฑา" ทั้ง 3 โปรไฟล์ (Benchmarking, Speed/Endurance Gap, Flexibility Risk)
  2. คำนวณและแสดงผล 7 สถานีมาตรฐาน (Standard 7 Stations) อย่างชัดเจนและแน่นอน
  3. คำนวณ Gap เทียบเกณฑ์มาตรฐาน (80 คะแนน) และ Gap เวลาที่ทำได้จริงเทียบกับเวลาเป้าหมาย (5.2s)
  4. ครอบ query ดึงข้อมูลใน getPerformanceInsights ด้วย prisma.$transaction
  5. บังคับใช้ includeDemo=true เพื่อไม่ให้ข้อมูลตัวอย่างปะปนกับข้อมูลจริง
- Quality gates: npx tsc --noEmit (ผ่าน), npm run lint (ผ่าน), npm run test:unit (86/86 ผ่าน), npm run build (ผ่าน)
- ไม่มี database migration หรือ db:push

## Release Final Verification — 2026-09-28 (Run ID: run-20260928-191300)

Final pre-release verification bundle established:
- Full integration suite (all 6 files) rerun serially against localhost:3138 using `.env.release-test` and isolated Supabase PostgreSQL (`aws-0-ap-southeast-1`): **38 passed, 0 failed, 0 skipped, 0 cancelled**, duration 96877.0285 ms. Evidence: `test-results/release-final/run-20260928-191300/logs/integration-full-suite.log`.
- Confirmed full integration with legacy Club temporary password recovery, suspension preservation, forced password change, and activation controls.
- Code quality checks: `npx tsc --noEmit` passed (0 errors), `npm run lint` passed (0 errors, 0 warnings), `npm run test:unit` passed (51 passed), `npm run build` passed (62 static/dynamic routes).
- Comprehensive report generated: `docs/RELEASE_FINAL_REPORT.md`, with traceable evidence artifacts in `test-results/release-final/run-20260928-191300/manifest.json` and `checks.json`.
- This supersedes earlier notes that the full suite was pending after the Club suspension UI change.
- Status: **LOCAL/TEST VERIFIED**. Production gates (migration `20260928010000_admin_temporary_password`, deployment, and backup restore to dedicated empty DB) remain BLOCKED awaiting explicit user authorization. Real athlete data import remains OUT OF SCOPE.

## Club suspension controls and live recovery verification — 2026-09-28

Added ADMIN club suspension/reactivation confirmation controls using the existing PUT /api/clubs/[id] endpoint. Account access is explicitly displayed from isActive, independently of club approval status. Success is shown after the mutation completes and data is reloaded. No schema or auth changes.

Extended admin-password-reset integration coverage with a disposable legacy Club: STAFF/CLUB cannot change activation; ADMIN suspension rejects existing sessions and login; reset preserves suspension; reactivation permits temporary login with forced change; final password works and temporary credentials/session are rejected. Targeted integration passed (1 scenario, 12875.0523 ms); fixtures cleaned up. Typecheck, lint, all 51 unit tests and production build passed. Full suite was not repeated for this UI change. Build required network access for the existing Google font. No production changes or migrations. The manual Club fixture remains available for user testing; no existing account activation state was changed.

## Full integration rerun after ADMIN recovery — 2026-09-28

Ran all six tests/integration/*.test.mjs files serially against localhost:3138 using .env.release-test, with TEST_ALLOW_WRITE=yes enabled only for the runner. Result: 38 passed, 0 failed, 0 skipped, 0 cancelled; duration 101548.6736 ms. Raw evidence: test-results/integration-after-admin-reset.txt.

Coverage includes ADMIN temporary-password recovery, invalidation of old credentials/sessions, forced password change, suspended-account preservation, removed recovery/dev endpoints, competition state/deadline gates, authorization, private documents, scoped reports/exports, quota concurrency and the persisted release core flow. Counts differ from the previous email-enabled suite because retired recovery tests were replaced.

This supersedes earlier notes that the full integration rerun or isolated test schema verification was pending. Legacy Club temporary-password recovery still has unit coverage only; this run does not establish live coverage for that specific recovery path. No migration was run by the assistant, no email was sent, and no production database/storage was changed. Production rollout and backup/restore evidence remain separate open gates. Historical email-delivery requirements no longer apply to the replaced password-recovery flow.

## Live ADMIN recovery integration follow-up

The dedicated .env.release-test database now exposes mustChangePassword on both User and Club (read-only preflight passed). The user previously reported the manual recovery flow works. No migration was executed by the assistant in this follow-up.

Ran admin-password-reset.test.mjs and account-smoke.test.mjs serially against localhost:3138 with isolated test writes enabled for the runner only: 5 passed, 0 failed, 0 skipped; duration 9395.6898 ms. Confirmed ADMIN-only reset and identity confirmation, old password/session rejection, forced-change page redirect and protected API rejection, successful change/new login, temporary password/session invalidation, suspended-account preservation, removed email recovery endpoints and unauthenticated guards. Generated fixture accounts and their audit records were cleaned up by the test. No email was sent, no production data/storage was changed.

This supersedes the earlier pending test-schema and targeted integration notes. The full integration suite was NOT rerun in this follow-up, and live legacy Club recovery is not covered by this targeted test (unit coverage exists). Production migration/release readiness remains unverified. The test server remains running at localhost:3138.
## ADMIN-only password recovery — 2026-09-28

User-authorized replacement of email recovery: ADMIN verifies the requester, issues a random temporary password (shown once), and delivers it through a verified channel. The owner must change it before protected pages or APIs can be used. User and legacy Club accounts are supported; suspension is preserved. Reset and audit commit atomically; no password/token/hash is stored in audit events. All earlier email-delivery release gates below are historical and no longer apply to password recovery.

Implementation is complete locally, but deployment/live verification is BLOCKED on explicit authorization to apply migration 20260928010000_admin_temporary_password to the isolated test database first. It adds mustChangePassword=false to User and Club. No migration or db:push has run. Do not run this new build against the old schema. Prisma Client generation only has run. Existing sessions without credential binding require a fresh login after rollout; password changes invalidate previous sessions.

Verified: typecheck, lint, unit tests (51 passed) and production build. New integration test tests/integration/admin-password-reset.test.mjs is prepared but NOT run because the schema has not been migrated. Browser verification also remains pending. Tests for retired email recovery were removed/replaced; counts are not directly comparable to previous email-enabled suites. Unrelated workspace changes were preserved.

Rollout: back up the chosen database, authorize/apply the new migration there, regenerate/build/restart, then verify ADMIN reset → old session rejected → temporary login → protected API denied → change password → new login, plus suspended accounts and legacy Club. Production needs a separate authorized rollout. Backup/restore and athlete-data import gates remain separate. Recovery for the sole ADMIN requires another established recovery operator; self-reset is rejected by this endpoint.

## XLSX browser artifact verified — 2026-09-28

The newly supplied Desktop/ก/applicants.xlsx passes both structure and known core-flow content verification: twelve headers in order; exactly one applicant cmujekjzd00079gc76u3x2fa1, student 95071709, Browser Core 1790455070687, football/team men, published status, submitted 27/9/2569 12:53:31. SHA-256: 77cbf12db6e282bbcdf16fb9a9afaf5f3256ef6ea723610ec38cadc0a3af9f47. Evidence: test-results/xlsx-download-verification.json. This supersedes earlier pending XLSX verification notes for this scenario. Production legacy access, email and backup/restore gates remain open. No workbook, database or storage contents were modified.
## Latest verification — 2026-09-28
Production readiness remains OPEN. Read-only metadata verified, but the stored legacy URL is example.test, and the actual downloaded XLSX is the old five-column version. Fresh workbook, authorized legacy access, production email and backup/restore evidence remain pending. See the latest HANDOFF correction. Historical claims below do not supersede these findings.

# Current Task

## Status
Release implementation added on 2026-09-26. Follow-up on 2026-09-27: 44 unit tests and local checks passed; the complete isolated-test integration suite passed 39/39. Browser ADMIN configuration, ATHLETE submission, STAFF review/publication, ATHLETE final result and filtered CSV download were verified. The user confirmed XLSX downloads normally in the browser follow-up; workbook contents remain unverified. Club-stage wording now uses recorded club decisions/history instead of inferring approval from STAFF/final status; follow-up checks pass with 46 unit tests. Live Gmail recovery was user-verified with limits documented in `docs/HANDOFF.md`. Production database/storage cutover, legacy-file privacy and production email readiness remain open. See `docs/RELEASE_RUNBOOK.md`.

[ ] Production readiness pending — test-environment integration and browser evidence are recorded above and in `docs/HANDOFF.md`; outstanding verification and production cutover gates must close before release. Checked feature items describe code behavior, not proof of production readiness.

## Objective
ระบบลืมรหัสผ่านและตั้งรหัสผ่านใหม่ (Forgot Password & Reset Password) และระบบจัดการบัญชีเจ้าหน้าที่/ผู้ดูแลระบบ (Staff & Admin Account Management) สำหรับมหาวิทยาลัยพะเยา

## Requirements (ADMIN temporary password recovery)
- [x] Only ADMIN can issue a random temporary password after confirming requester identity.
- [x] Show plaintext only in the successful reset response/modal; no credential in audit logs.
- [x] Reset and audit are atomic; suspended accounts remain suspended.
- [x] Invalidate previous sessions using server-verified credential binding.
- [x] Force change before protected UI/API access, including legacy Club logins.
- [x] Remove public forgot/reset pages, email-token APIs and email-delivery implementation.
- [ ] Apply the prepared migration only after explicit authorization; verify integration and browser flow.

## Requirements (Staff & Admin Account Management)
- [x] ดูรายชื่อผู้ใช้งานทั้งหมด พร้อมระบบค้นหาและตัวกรองตามสิทธิ์ (Role) และสถานะ (Status)
- [x] สร้างบัญชีผู้ใช้งานภายใน (STAFF, ADMIN, TEAM_OFFICIAL) พร้อมแฮชรหัสผ่านด้วย bcrypt
- [x] แก้ไขข้อมูลพื้นฐานของผู้ใช้งาน (ชื่อ, อีเมล, เบอร์โทรศัพท์)
- [x] เปลี่ยนสิทธิ์ของผู้ใช้งาน (Change Role)
- [x] ระงับการใช้งานและเปิดใช้งานบัญชี (Status Activation/Suspension)
- [x] ป้องกัน Admin ระงับบัญชีของตนเอง หรือลดสิทธิ์ Admin ของตนเอง (Self-protection)
- [x] ป้องกันการระงับหรือลดสิทธิ์ Admin บัญชีสุดท้ายในระบบ (Last-admin protection)
- [x] ป้องกันไม่ให้ Public registration กำหนดสิทธิ์ privileged roles (ADMIN, STAFF)
- [x] ป้องกันไม่ให้ STAFF เข้าถึงหน้าจัดการบัญชีหรือ API ของ Admin (403 Forbidden)
- [x] บันทึกการกระทำสำคัญทั้งหมดลงใน Audit Log แบบ atomic

## Relevant Area
- Frontend: `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/login/page.tsx`, `app/admin/users/page.tsx`, `app/admin/page.tsx`, `app/admin/clubs/page.tsx`, `app/superadmin/page.tsx`
- Backend: `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/admin/users/[id]/reset-password/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`, `app/api/admin/users/[id]/role/route.ts`, `app/api/admin/users/[id]/status/route.ts`
- Core Services: `lib/password-reset.ts`, `lib/audit-service.ts`, `lib/account-service.ts`, `lib/validation.ts`
- Tests: `tests/unit/password-reset.test.mjs`, `tests/unit/admin-users.test.mjs`

## Definition of Done
- [x] Feature implemented according to requirements
- [x] Code follows existing architecture
- [x] Type checking passes (`npx tsc --noEmit`)
- [x] Linting passes (`npm run lint`)
- [x] Validation and authorization are implemented server-side
- [x] Tests pass (`npm run test:unit`)
- [x] Build passes (`npm run build`)

# CODEX FOCUS — DEPLOY BEFORE 4/10/2569
## Goal
ทำระบบให้พร้อมใช้งานจริงและ Deploy ก่อน **4 October 2026**
เป้าหมายไม่ใช่ Feature Completeness
Core flow ที่ต้องผ่าน:
```text
ADMIN Configure
→ ATHLETE Apply
→ STAFF Review
→ STAFF Publish
→ ATHLETE View Result
```
ถ้า Core Flow ยังไม่ผ่าน **ห้ามเพิ่ม Feature ใหม่**

---

# Production Roles

เหลือเฉพาะ:

```text
ADMIN
STAFF
ATHLETE
CLUB
TEAM_OFFICIAL
```

นำออกจาก Production:

```text
SUPERADMIN
DEV
/dev
Dev Login
Dev Auth Bypass
```

`ADMIN` คือ Role สูงสุดของระบบ

ถ้ามีข้อมูล `SUPERADMIN` เดิม ให้เตรียม Strategy:

```text
SUPERADMIN → ADMIN
```

ก่อนลบ Role

อย่ารัน Database Migration เว้นแต่ได้รับคำสั่งโดยตรง

---

# Priority 0 — Remove SUPERADMIN / DEV

Search repository ทั้งหมด:

```text
SUPERADMIN
superadmin
DEV
/dev
dev-login
dev-user-id
```

ตรวจ:

- Prisma schema
- auth
- authorization
- API guards
- proxy/middleware
- pages
- navigation
- role selectors
- types/constants
- validation
- seed
- tests

Production ต้องไม่มี Dev authentication path

Test helper เก็บได้เฉพาะใน test infrastructure

---

# Priority 1 — Authorization

ใช้ Permission นี้สำหรับ Release:

| Capability | STAFF | ADMIN |
|---|---:|---:|
| View/Search Applicants | ✅ | ✅ |
| Approve/Reject | ✅ | ✅ |
| Publish Results | ✅ | ✅ |
| Analytics / Export | ✅ | ✅ |
| Create/Edit Competition | ❌ | ✅ |
| Sport / Quota / Deadline | ❌ | ✅ |
| Manage Users | ❌ | ✅ |
| Manage Clubs | ❌ | ✅ |
| Change Roles | ❌ | ✅ |

ทุก Protected API ต้องตรวจ Server-side:

```text
Authentication
→ Role
→ Ownership/Scope
→ Current State
→ Allowed Action
```

---

# Priority 2 — Security Blockers

ต้องแก้ก่อน Deploy:

- CLUB export ข้อมูลข้าม Scope ไม่ได้
- Document delete ต้องตรวจ Ownership
- CLUB ห้ามแก้ Global Competition
- Client ห้ามกำหนด approval status เอง
- Sensitive athlete documents ต้องไม่ Public
- Production ต้องไม่มี Dev Login/Auth bypass

---

# Priority 3 — ADMIN

ADMIN ต้องทำได้:

```text
Login
→ Manage Users
→ Manage Clubs
→ Manage Competition
→ Set Sport
→ Set Quota
→ Set Deadline
→ Open/Close Registration
```

User Management:

- Search / Filter
- Create / Edit
- Activate / Suspend
- Change Role
- Last ADMIN protection
- Self protection

Role selector มีเฉพาะ:

```text
ADMIN
STAFF
ATHLETE
CLUB
TEAM_OFFICIAL
```

---

# Priority 4 — Competition

ใช้:

```text
Competition + SportQuota
```

เป็น Source of Truth สำหรับ Release นี้

ADMIN ต้อง:

- Create Competition
- Edit Competition
- Set status
- Set deadline
- Set sports
- Set quotas
- Open/Close registration

ห้ามมี SportQuota ซ้ำใน Competition เดียว

ถ้า `SportConfig` ยังไม่เชื่อมกับ Registration จริง ให้ Freeze ไว้ก่อน

---

# Priority 5 — ATHLETE Minimal Flow

ทำเฉพาะ:

```text
Register
→ Login
→ Profile
→ View Competition
→ Apply
→ Upload
→ Submit
→ View Status
→ View Result
```

Server validation ขั้นต่ำ:

- required fields
- competition exists
- competition open
- deadline not passed
- sport belongs to competition
- numeric fields valid
- duplicate application blocked
- required documents present

ยังไม่ทำ:

- Draft
- Withdraw
- Correction
- Reapply
- Accept/Decline
- Notification
- Revision system

---

# Priority 6 — STAFF

STAFF ต้องทำได้:

```text
Applicant List
→ Search / Filter
→ Detail
→ Approve / Reject
→ Publish
→ Export
```

Filters ขั้นต่ำ:

- Name
- Student ID
- Competition
- Sport
- Status

Review action ต้อง:

1. Validate server-side
2. Persist DB จริง
3. Commit ก่อน return success
4. Refresh UI จากข้อมูลจริง
5. ไม่มี fake success

---

# Priority 7 — Result

Publication ต้อง Scope ด้วย Competition:

```text
STAFF
→ Select Competition
→ Preview Approved Applicants
→ Publish
```

ห้าม publish `STAFF_APPROVED` ทุก Competition รวมกัน

ATHLETE ต้องเห็น:

- Competition
- Sport
- Status
- Final Result

---

# Analytics / Export

ขั้นต่ำ:

```text
Total Applicants
Pending
Approved
Rejected
By Competition
By Sport
```

Filters:

```text
Competition
Sport
Status
```

Export CSV/XLSX ต้องตรวจ:

- scope
- competition
- sport
- status
- column mapping

---

# Do NOT Build Before Deploy

เลื่อนไปหลัง Release:

- Notification system
- Audit UI
- Import reconciliation ขั้นสูง
- Athlete drafts
- Correction workflow เต็มรูปแบบ
- Withdrawal
- Accept/Decline
- Reserve automation
- Special Request enhancement
- Activity enhancement
- Training enhancement
- Advanced blocker queue
- Major UI redesign
- Microservices
- Fixtures / scoring / tournament bracket

ยกเว้นต้องแก้เพื่อ Security หรือ Build/Deployment

---

# Codex Working Rules

ก่อนแก้:

1. Inspect implementation จริงก่อน
2. Reuse existing code
3. แก้เฉพาะ Scope ที่เกี่ยวข้อง
4. หลีกเลี่ยง unrelated refactor
5. ไม่เพิ่ม dependency ถ้าไม่จำเป็น
6. TypeScript strict
7. Validate input server-side
8. Authorization server-side
9. เพิ่ม regression test สำหรับ bug ที่แก้

---

# Execution Order

```text
1. Remove SUPERADMIN / DEV
2. Fix authorization/security
3. ADMIN core
4. Competition config
5. ATHLETE submit flow
6. STAFF review flow
7. Publish/result/export
8. Production hardening
```

---

# Definition of Done

## Roles

- [ ] ไม่มี SUPERADMIN ใน Production
- [ ] ไม่มี DEV Role
- [ ] ไม่มี `/dev` / Dev Login / Dev Auth bypass
- [ ] ADMIN เป็น Role สูงสุด

## ADMIN

- [ ] Manage Users
- [ ] Manage Clubs
- [ ] Manage Competition
- [ ] Sport / Quota / Deadline
- [ ] Open/Close Registration

## ATHLETE

- [ ] Register/Login
- [ ] Profile
- [ ] Apply
- [ ] Upload
- [ ] Submit
- [ ] View Status
- [ ] View Result

## STAFF

- [ ] Applicant List
- [ ] Search/Filter
- [ ] Detail
- [ ] Approve
- [ ] Reject
- [ ] Publish per Competition
- [ ] Analytics
- [ ] Export

## Security

- [ ] Scope authorization ถูกต้อง
- [ ] Document ownership ถูกต้อง
- [ ] Sensitive documents ไม่ Public
- [ ] Client self-approval ไม่ได้
- [ ] ไม่มี Dev auth ใน Production

## Quality

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] Core smoke test ผ่าน

---

# Core Smoke Test

```text
ADMIN login
→ Create Competition
→ Set Sport/Quota/Deadline
→ Open Registration

ATHLETE register/login
→ Complete Profile
→ Apply
→ Submit

STAFF login
→ Find Applicant
→ Review
→ Approve

ATHLETE
→ See updated status

STAFF
→ Publish selected Competition

ATHLETE
→ See final result

STAFF
→ Export

Verify unauthorized access is blocked
Verify duplicate application is blocked
Verify deadline enforcement
Verify /dev unavailable
Verify SUPERADMIN cannot be assigned
```

# Scope Gate

ก่อนทำ Task ใหม่ถามเพียง:

```text
ช่วยให้ ADMIN configure ระบบ,
ATHLETE สมัคร,
STAFF ตรวจ/ประกาศผล,
หรือช่วย Security/Deploy หรือไม่?
```

ถ้า `YES` → ทำ

ถ้า `NO` → เลื่อนไปหลัง Deploy

## Migration status correction - 2026-10-12
The previous migration-pending statements are historical. Current read-only verification reports the configured database is up to date with all 12 repository migrations applied. `npm run db:preflight` passes with 1 active ADMIN, 0 duplicate quota groups, and latest schema model reachability. Production deployment, backup/restore, and post-deploy smoke verification remain separate rollout steps.
## Worktree Handoff Status - 2026-10-13

- Phase 1 cleanup: completed.
- Phase 2 code audit and `staff/requests` hardening: completed.
- Phase 3 quality gate: completed locally; typecheck, lint, 75 unit tests, and production build passed.
- Phase 4 staging: Security & DB Core candidate staged as 28 files; no commit created.
- Phase 5 documentation: this handoff update records the current state.
- Remaining work: review and stage Backend/API, Frontend/Shared UI, and Tests/Documentation groups separately; production readiness and deployment gates remain distinct from local verification.
