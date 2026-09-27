# Implementation Handoff

## Security Audit Corrections & Scope Fixes — 2026-09-28

- **CLUB Scope Security Fix (High)**:
  - Addressed vulnerability in [lib/application-query.ts](file:///d:/BBN/athlete-registration/lib/application-query.ts): removed `{ rosterItem: null }` branch for `CLUB` role. CLUB users can now only query and export applications strictly rostered to their club (`rosterItem: { roster: { clubId } }`).
  - Addressed vulnerability in [lib/document-service.ts](file:///d:/BBN/athlete-registration/lib/document-service.ts): updated `canReadDocument()` so CLUB users cannot access retained documents of unrostered applications in the same sport; strictly requires `rosterItem: { roster: { clubId: club.id } }`.
  - Addressed vulnerability in [app/api/applications/[id]/route.ts](file:///d:/BBN/athlete-registration/app/api/applications/[id]/route.ts): updated GET handler to reject unrostered applications (`rosterItem === null`) and applications belonging to other clubs with HTTP 403.
- **CSV Formula Protection & UTF-8 BOM**:
  - Fixed formula injection regex replacement in [app/api/export/applications/route.ts](file:///d:/BBN/athlete-registration/app/api/export/applications/route.ts) to safely prepend "'" without corrupting cells starting with `=`, `+`, `-`, `@`. Added UTF-8 BOM (`\uFEFF`) prefix for proper Thai text display in Excel.
  - Added formula injection protection to client-side helper [lib/export-helpers.ts](file:///d:/BBN/athlete-registration/lib/export-helpers.ts), which is actively utilized in [app/staff/applications/[clubId]/[competitionId]/page.tsx](file:///d:/BBN/athlete-registration/app/staff/applications/[clubId]/[competitionId]/page.tsx) (verified NOT dead code).
- **Export Column Alignment (CSV & XLSX)**:
  - Aligned [components/shared/StaffReview.tsx](file:///d:/BBN/athlete-registration/components/shared/StaffReview.tsx) XLSX export to output all 12 core application fields matching [app/api/export/applications/route.ts](file:///d:/BBN/athlete-registration/app/api/export/applications/route.ts) in identical order (Application ID, Student ID, First Name, Last Name, Faculty, Major, Phone, Competition, Sport, Category, Status, Submitted At).
  - Standardized CSV to use English headers (for interoperability and data pipeline ingestion) and XLSX to use Thai headers (for administrative and executive reporting).
- **Regression Tests & Verification**:
  - Added 4 unit regression tests in [tests/unit/release.test.mjs](file:///d:/BBN/athlete-registration/tests/unit/release.test.mjs) testing `applicationWhere()`, `canReadDocument()`, and GET `application/[id]` for CLUB scope rejection.
  - Verified: `npx tsc --noEmit` passed (0 errors), `npm run lint` passed (0 errors, 0 warnings), `npm run test:unit` passed (50/50 passed; Node `[MODULE_TYPELESS_PACKAGE_JSON]` runtime warnings observed and documented), `npm run build` passed (65 routes compiled).
  - Integration tests re-run and verified: passed all 5 test files (39 passed, 0 failed, 0 skipped, 106.6s) using `.env.release-test` with isolated test DB and local test server at localhost:3138. TEST_ALLOW_WRITE was enabled only during the test run and safely restored to 'no'.
  - Verifiable artifacts recorded:
    - [test-results/cutover-evidence.json](file:///d:/BBN/athlete-registration/test-results/cutover-evidence.json): Database preflight (0 duplicate quotas, 3 active admins), Prisma migrate status (4 migrations applied, schema up to date), bucket metadata, and real legacy file tests (anonymous public URL blocked HTTP 400, authorized owner access HTTP 302 -> 200 valid PDF, unauthorized athlete access rejected HTTP 404/401).
    - [test-results/xlsx-verification.json](file:///d:/BBN/athlete-registration/test-results/xlsx-verification.json) & [test-results/staff-export-actual.xlsx](file:///d:/BBN/athlete-registration/test-results/staff-export-actual.xlsx): verified 12 columns in Thai headers matching CSV, row count, Thai text encoding, status label translation, and date formatting.
    - [test-results/full-integration-suite.json](file:///d:/BBN/athlete-registration/test-results/full-integration-suite.json): full integration results covering all 5 suites (39/39 passed, 106.6s) with dedicated suite artifacts ([account-smoke-integration.json](file:///d:/BBN/athlete-registration/test-results/account-smoke-integration.json), [competition-status-gate-integration.json](file:///d:/BBN/athlete-registration/test-results/competition-status-gate-integration.json), [phase4-integration.json](file:///d:/BBN/athlete-registration/test-results/phase4-integration.json), [phase5-integration.json](file:///d:/BBN/athlete-registration/test-results/phase5-integration.json), [release-core-integration.json](file:///d:/BBN/athlete-registration/test-results/release-core-integration.json)).
  - Quality verification: TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; unit tests passed (50/50) with non-blocking Node module-type warnings; Next.js build passed (65 routes).
  - Working tree state: contains uncommitted working tree changes. Must stage and create a clean release commit before final deployment.
  - Overall release status: **CONDITIONAL READY (CODE READY — PENDING RELEASE COMMIT)**.

## Athlete club-stage correction — 2026-09-27

- Fixed the athlete status tracker: STAFF approval/rejection or final selection alone no longer implies club approval. The current club decision or latest club event in the existing chronological history determines the club result.
- Applications without a roster club or recorded club decision show "เจ้าหน้าที่พิจารณาโดยตรง" with neutral styling. Roster-backed submitted applications remain pending; advanced legacy records without club evidence show "ไม่พบประวัติการพิจารณาชมรม" rather than inventing approval.
- Added regression tests for direct STAFF flows, recorded approval/rejection, retained history without a current club, and missing legacy history.
- Verified: typecheck, lint, 46 unit tests and production build passed. The initial sandbox build could not fetch Google Fonts; the authorized network retry passed. No database/API/schema changes or migrations. This correction was not rechecked in the live browser; earlier browser screenshot shows the pre-fix wording.
- This supersedes the club-stage wording follow-up below. XLSX workbook contents and production gates remain open.


## Full integration and browser verification — 2026-09-27

This section supersedes earlier pending full-suite/browser verification notes. Production readiness remains open.

- Ran all five integration files with the existing serial runner against `.env.release-test` and localhost:3138: **39 passed, 0 failed, 0 skipped**, duration 112435 ms. Test writes were enabled only for this isolated test workflow; no migration or storage configuration change was performed.
- Browser: ADMIN created `Browser Core 1790455070687`, year 2569, qualifier, deadline 3 October 2026 18:00 local, football with starter/substitute quotas 11/5 and age limit 28, OPEN. The saved competition appeared in the list.
- Browser: the fixture ATHLETE selected that competition, no club, supervisor, football/team men/open division, and attached seven synthetic files including the no-club document. Submission navigated to the persisted status page.
- Browser: STAFF searched student ID `95071709`, selected the competition, approved the SUBMITTED application directly, previewed exactly one approved applicant and published. The UI refreshed to the published state.
- Browser: ATHLETE signed in again and saw the final selected result and review/publication history. Evidence: `test-results/browser-core-result.png`. Application: `cmujekjzd00079gc76u3x2fa1`; competition: `cmuiuqxwk002lb8c7w27k3z8q`.
- Browser CSV export with student, competition, football and FINAL_SELECTED filters downloaded successfully. Its contents contain exactly the matching applicant and status, with the expected competition/column mapping.
- XLSX follow-up: after instructions to retry in a normal browser, the user confirmed the download works normally. This is user-reported download evidence; workbook row contents have not yet been confirmed. The earlier in-app browser attempt showed success without an observed download event or file, with no console error.
- UI observation: the athlete progress indicator says the club stage passed even for this no-club, directly STAFF-reviewed application. The final result/history are correct; the club-stage wording needs follow-up.
- Test users/profiles were seeded via Prisma, so this browser run does not cover public account registration/profile entry. Those API paths are covered by the passing integration suite. Test fixtures remain for visual review; do not use the synthetic documents as real athlete records.
- Only verification documentation was changed in this follow-up; application code was not changed. Earlier typecheck/lint/build and 44-unit-test evidence remains the latest code-check result.
- Remaining release gates: XLSX workbook content verification, club-stage UI wording, and separately authorized production database/storage cutover (including legacy-file privacy), production sender/domain delivery and operational release checks.

## Live password recovery verification — 2026-09-27

This update supersedes earlier statements that no live email verification has occurred. Verification used the isolated test database and local development server at localhost:3138, with the existing Resend delivery implementation.

- The assistant created a test ATHLETE account and requested recovery through the application API (HTTP 200). HTTP success alone was not treated as delivery evidence.
- The user confirmed receipt in the real Gmail inbox, successful password reset, and successful login with the new password.
- On reopening the same emailed link, the user reported: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" and "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่". This confirms rejection of the used link in the manual browser flow.
- Inbox receipt and browser results are user-reported evidence, not independently observed browser automation. No passwords, API keys or reset tokens are recorded here.
- Follow-up manual evidence: the user confirmed that the previous password was rejected and the new password worked. After instructions to wait 16 minutes without using the next link, the user reported an invalid/expired-link screen; elapsed time was not independently measured, and its secondary message was generic.
- Suspended-account follow-up: the assistant temporarily set the test ATHLETE account inactive; after the reset/login instructions the user reported "บัญชีถูกระงับการใช้งาน". A subsequent database read confirmed isActive=false. The assistant then restored isActive=true as planned. Reset completion during this suspended interval was not independently observed.
- Still outstanding: production sender/domain delivery, a full integration-suite rerun after the regression fixes, and the full browser core flow. These manual reports do not establish production readiness.
- Test accounts created during recovery testing remain in the test database; no production migration, storage change or deployment was performed in this verification.

## Integration regression follow-up

- Fixed STAFF/ADMIN club filters to return 404 for nonexistent clubs. CLUB missing scope and inactive clubs remain forbidden (403); scope intersections are unchanged.
- Recovery page HTTP smoke accepts both the production Suspense loading shell and the development missing-token state.
- Added regression coverage for missing/inactive clubs across ADMIN, STAFF and CLUB.
- Verified in this follow-up: 44 unit tests passed; typecheck, lint and production build passed. Build required network access for Google Fonts.
- Re-ran account-smoke and phase5 against the existing local test server with `.env.release-test`: 15 tests passed, none failed/skipped. The initial sandbox attempt could not connect to PostgreSQL (EACCES); the authorized network retry passed.
- The user supplied an earlier release-core pass and full-suite result of 36 passed / 3 failed (two root failures, now fixed). The complete integration suite has not been rerun after these fixes; live email, browser flow and production cutover remain outstanding.
- No migration, environment-file change or bucket configuration change was made in this follow-up. Phase5 created and cleaned up its test fixtures.

## Release implementation — 2026-09-26

This section supersedes the account-only readiness notes below. Release code is implemented locally; **production readiness is still pending database/storage cutover and live end-to-end verification**. Pre-existing workspace edits were preserved. No database migration, db:push, storage configuration, real email or deployment was performed.

### Implemented

- Removed /dev, /superadmin and dev-login. Authentication rejects removed roles and the legacy dev identity; current account/club state is checked on the server. Authenticated forbidden page access returns 403.
- ADMIN-only competition mutations; CLUB scope intersects export filters. Staff import (account creation) is ADMIN-only. SportConfig writes are frozen for this release.
- Added ADMIN competition configuration using the existing form, including deadline, status, sports and quotas. Server rejects duplicate sports/invalid numeric/date input and removal of sports with existing applicants.
- User CLUB accounts explicitly link to an active Club via nullable User.clubId. Legacy Club credentials continue to work. Self/last-admin protection and atomic account audit are retained. Changing the club association invalidates the old session.
- Athlete uploads use private documents and server-assigned owners; submitted documents are retained. Reads issue short-lived signed URLs after authorization. Legacy application URLs are served through authenticated application-document routes only after confirming the legacy bucket is private. No automatic file deletions/moves.
- Application submission validates current identity, competition state/deadline, sport membership, numeric/nested input, owned documents and duplicates inside a serializable transaction. Public registration validates profile/password and rejects privileged role input.
- STAFF can review submitted applications directly as required by NEXT_TASK while retaining the submitted-roster guard for existing roster-backed applications. Review commits before success; UI fetches current data afterward.
- Search by name/student ID and filters by competition/sport/status. Publication requires competitionId plus the exact previewed applicationIds; mixed, stale, duplicate or non-approved IDs fail without publication.
- Selection page reuses the scoped preview/review UI. Athlete sees persisted status/result. Analytics includes status filtering and competition breakdown; CSV/XLSX use filtered authorized data.

### API changes

- POST/PATCH /api/competitions are ADMIN-only. POST defaults to CLOSED; OPEN requires at least one sport. Deadline uses ISO date-time with an explicit timezone. PATCH accepts deadline and quotas.
- PATCH /api/admin/users/[id]/role accepts clubId when assigning CLUB. A valid active club is required; internal account creation remains STAFF/ADMIN/TEAM_OFFICIAL. CLUB logins through User use their own password and linked club scope.
- POST /api/documents supports ATHLETE; store the returned ID as /api/documents/{id}/download in the existing application document fields. Arbitrary/public URL submissions are rejected. Legacy /api/upload delegates to private documents and cannot delete arbitrary storage paths.
- GET /api/staff/applications/announce?competitionId=... previews approvals. POST requires { competitionId, applicationIds }; missing scope is rejected.
- Application POST rejects client userId/status. Closed/expired competition remains 400; duplicate/concurrency conflicts return 409. Locked application edits return 409.

### Local verification

- npx prisma validate: passed. Prisma Client regenerated locally; this does not apply a migration.
- npx tsc --noEmit: passed.
- npm run test:unit: 43 passed, including route tests using actual handlers with mocked database/storage boundaries. Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings remain. An intentional commit-failure test logs a handled error.
- npm run lint: final check passed with no errors/warnings.
- npm run build: final build passed with network permission for Google Fonts.
- TEST_BASE_URL=http://localhost:3138 node --test tests/integration/account-smoke.test.mjs: 6 passed against the final production build; no database writes. Includes removed dev routes, private document authentication, account guards and malformed recovery inputs.
- npm run test:integration: attempted; all 5 suites stopped at their configuration guards. TEST_DATABASE_URL, TEST_BASE_URL and TEST_ALLOW_WRITE are absent. This is NOT a live core-flow pass.
- Added guarded release-core integration coverage for configure/register/profile/upload/apply/review/publish/result/export, plus updated existing fixtures for private documents and scoped publication. It has not run against a real test database/storage project.
- Authenticated browser/visual verification has not run against the new schema. The earlier account UI test results below are historical.

### Outstanding before release

1. Review and explicitly authorize database cutover. Migration 20260926010000_release_roles_quota converts legacy roles, adds User.clubId and enforces unique SportQuota. New application queries require the migrated schema; do not deploy against the old schema. Duplicate quotas must be resolved deliberately before migration.
2. Review and explicitly apply storage privacy/policy changes, including the legacy athlete-docs bucket. Verify anonymous public URLs no longer work and authorized old/new files can be read. App-level checks alone cannot make existing storage objects private.
3. Configure a dedicated test database/server and isolated test Storage, then run the full integration/core smoke suite. Do not reuse the production database as a test fixture target.
4. Configure APP_URL, RESEND_API_KEY and PASSWORD_RESET_FROM_EMAIL and verify real email arrival/reset. No live email test was possible with the present configuration.
5. See [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) for preflight, cutover, verification and rollback. No new dependencies were added in this release implementation.


## Current verification — 2026-09-26

Implementation reviewed and local checks passed; production readiness remains pending email configuration and dedicated database integration testing. This section supersedes completion/security/test claims in the historical handoff below.

### Parallel agent work
- A: fixed recovery UI password byte validation, 15-minute copy, token-change state reset, responsive dialogs, native admin forms, and server-side list pagination/search/filter integration.
- B: fixed token claims/expiry/secret handling, conditional single-use password updates, current email binding, boolean/filter validation, admin hierarchy and shared account policy; added configurable server-side Resend delivery and transactional independent audit events.
- C: completed final combined integration review after A/B implementation freeze; no blocking UI/API contract mismatch found. Added production HTTP smoke coverage.
- Main: reviewed repository/dependencies first, coordinated ownership without overwriting pre-existing work, fixed strict fixture types in existing E2E tests, and ran final checks. No schema changes, migrations, database fixture writes or real emails were performed.

### Verification
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed, no errors or warnings.
- `npm run build`: passed; Google Fonts required network permission outside sandbox.
- `npm run test:unit`: 26 passed. Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings remain.
- `TEST_BASE_URL=http://localhost:3137 node --test tests/integration/account-smoke.test.mjs`: 4 passed against the production server. Covers rendering/redirects, malformed inputs and unauthenticated APIs; no valid account/database writes.
- `npx playwright test tests/e2e/password-recovery.spec.ts --project="Desktop Chromium" --project="Mobile Chromium" --reporter=line`: 6 passed. API responses are mocked; tests cover UTF-8 password boundaries, successful form submission, token navigation and forgot-password messages. Browser launch required sandbox escalation. Runner reports an environment NO_COLOR/FORCE_COLOR warning.
- Authenticated account CRUD, live STAFF authorization, real email delivery, and database concurrency were not exercised end-to-end: TEST_DATABASE_URL/TEST_ALLOW_WRITE and mail configuration are absent. Unit tests call the production account policy; they do not prove database isolation.

### Changed files in this work session
- `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/admin/users/page.tsx`: UI fixes described above.
- `lib/password-reset.ts`, `lib/password-reset-delivery.ts`, `lib/audit-service.ts`, `lib/validation.ts`: token/delivery/audit/policy validation.
- `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`: safe public responses and conditional password writes.
- `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`, `app/api/admin/users/[id]/reset-password/route.ts`: typed list queries, authorization/policy and delivery handling.
- `tests/unit/admin-users.test.mjs`, `tests/unit/password-reset.test.mjs`, `tests/unit/password-reset-delivery.test.mjs`: real policy/token and mocked transport regressions.
- `tests/integration/account-smoke.test.mjs`, `tests/e2e/password-recovery.spec.ts`, `tests/e2e/main-flow.spec.ts`: smoke/browser coverage and strict fixture types.
- `docs/PASSWORD_RESET_DELIVERY.md`, `docs/HANDOFF.md`, `docs/NEXT_TASK.md`: deployment requirements and accurate verification status.

### Remaining limitations
- Configure `APP_URL`, `RESEND_API_KEY`, and `PASSWORD_RESET_FROM_EMAIL`; verify sender and delivery with an authorized test account. See [delivery setup](PASSWORD_RESET_DELIVERY.md).
- Public response content is uniform, but synchronous provider work can still reveal timing differences. The 60-second rate limiter is process-local, not shared across instances.
- External email delivery and database audit cannot be atomic without a durable outbox; successful provider acceptance can precede an audit failure.
- Audit events now use separate `SystemSetting` keys prefixed `audit_logs:`; legacy `audit_logs` data is preserved.

## Historical handoff (superseded by current verification above)

## Status
Ready for Review / Completed

## Tasks Completed
1. **Forgot Password & Reset Password (ระบบลืมรหัสผ่านและตั้งรหัสผ่านใหม่)**
2. **Staff & Admin Account Management (ระบบจัดการบัญชีเจ้าหน้าที่และผู้ดูแลระบบ)** สำหรับมหาวิทยาลัยพะเยา
3. **Automated Browser and Accessibility Testing (การทดสอบเบราว์เซอร์และการเข้าถึง)**

---

## 1. Forgot Password & Reset Password Feature

### Architecture & Security Decisions
- **Reuse Existing Authentication Architecture**: ต่อยอดจากระบบ Custom JWT (`jose`) + `bcryptjs` เดิม โดยไม่ต้องสร้างตารางใหม่ ไม่ต้องพึ่งพา external auth provider และไม่มีการแก้ schema (`prisma/schema.prisma` ไม่ถูกแตะต้อง)
- **Token Invalidation Pattern (Single-use & Expirable)**:
  - โทเคนลงนามด้วย HMAC SHA-256 (`JWT_SECRET`) มีอายุ 15 นาที
  - ภายใน payload บรรจุ `tokenVersion` ที่คำนวณจาก `passwordHash.slice(-10) + "_" + updatedAt.getTime()`
  - เมื่อผู้ใช้เปลี่ยนรหัสผ่านสำเร็จ ค่า `password` และ `updatedAt` ในฐานข้อมูลจะเปลี่ยนทันที ส่งผลให้ token เดิมกลายเป็นโมฆะ (invalid) ทันที ไม่สามารถนำกลับมาใช้ซ้ำได้ (Single-use) แม้ยังไม่หมดอายุก็ตาม
- **Strict Anti-Enumeration Protection**:
  - Endpoint `POST /api/auth/forgot-password` ส่งคืนข้อความสำเร็จเหมือนกันเสมอ: `"หากอีเมลนี้มีบัญชีอยู่ในระบบ เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ให้"`
  - ป้องกันไม่ให้ attacker ค้นหาหรือตรวจสอบว่ามีอีเมลใดลงทะเบียนในระบบบ้าง
  - ใช้ `crypto.timingSafeEqual` และ response delay เพื่อป้องกัน timing attacks
- **Preserving Account Status**:
  - เมื่อบัญชีที่ถูกระงับ (`isActive: false` / `SUSPENDED`) ตั้งรหัสผ่านใหม่สำเร็จ ระบบจะอัปเดตเฉพาะรหัสผ่าน แต่จะคงสถานะ `isActive: false` ไว้อย่างเดิม ไม่ถูกเปิดใช้งานโดยอัตโนมัติ
- **Rate Limiting**:
  - ป้องกัน brute-force และ spam request ด้วย in-memory rate limiter จำกัด 1 คำขอ ต่อ 60 วินาที ต่ออีเมล
- **Password Policy Enforcement**:
  - ตรวจสอบทั้ง client-side และ server-side: ความยาวอย่างน้อย 8 ตัวอักษร, ไม่เกิน 72 ไบต์ (ขีดจำกัดของ bcrypt), รหัสผ่านและยืนยันรหัสผ่านต้องตรงกัน
- **Audit Logging**:
  - บันทึกการขอรีเซ็ตรหัสผ่าน (`PASSWORD_RESET_REQUESTED`), การตั้งรหัสผ่านใหม่สำเร็จ (`PASSWORD_RESET_COMPLETED`) และแอดมินส่งลิงก์รีเซ็ต (`ADMIN_SENT_PASSWORD_RESET`)
  - **ห้ามบันทึก plaintext password หรือ reset token** ลงใน log เด็ดขาด
- **Admin Recovery**:
  - ในหน้า `/admin/users` มีปุ่ม "รีเซ็ตรหัส" เพื่อให้ Admin ส่งลิงก์ตั้งรหัสผ่านใหม่ให้ผู้ใช้ได้ โดยที่ Admin ไม่สามารถดูหรือดึงรหัสผ่านเดิมของผู้ใช้ได้

### API Endpoints
- `POST /api/auth/forgot-password`: รับ `{ email }`, ส่งคืน anti-enumeration message (ใน dev mode มี `resetUrl` เพื่อความสะดวกในการทดสอบ)
- `GET /api/auth/reset-password?token=...`: ตรวจสอบความถูกต้องของ token (valid, expired, already used)
- `POST /api/auth/reset-password`: รับ `{ token, password, confirmPassword }`, ตรวจสอบ token, แฮชรหัสผ่านใหม่ และบันทึกลง DB
- `POST /api/admin/users/[id]/reset-password`: แอดมินสร้างลิงก์รีเซ็ตรหัสผ่านให้ผู้ใช้ พร้อมบันทึก Audit Log

### Frontend Pages & Components
- `/forgot-password`: หน้ากรอกอีเมลสำหรับขอรีเซ็ตรหัสผ่าน พร้อม UI ภาษาไทย, กล่องยืนยัน anti-enumeration และปุ่มกลับหน้าเข้าสู่ระบบ
- `/reset-password?token=...`: หน้าตั้งรหัสผ่านใหม่ รองรับ Suspense, ตรวจสอบ token อัตโนมัติ, ช่องกรอกรหัสผ่านพร้อมปุ่ม toggle แสดง/ซ่อน, checklist ตรวจสอบความยาวและความตรงกันแบบ real-time
- `/login`: เพิ่มลิงก์ "ลืมรหัสผ่าน?" นำทางไปยัง `/forgot-password`
- `/admin/users`: เพิ่มปุ่ม "รีเซ็ตรหัส" ในตารางรายชื่อผู้ใช้ พร้อม Modal ยืนยันการส่งลิงก์รีเซ็ตรหัสผ่าน

---

## 2. Staff & Admin Account Management Feature

### Completed Highlights
1. **Admin Authorization Foundation**:
   - บังคับใช้ server-side authorization ที่เข้มงวดผ่าน `api(request, ["ADMIN", "SUPERADMIN"], ...)` และ `getSession()` โดยตรวจสอบ JWT พร้อมกับข้อมูลบัญชีจริงในฐานข้อมูล PostgreSQL
   - คำขอนอกสิทธิ์จะถูกปฏิเสธด้วย `401 Unauthorized` และ `403 Forbidden`
   - ป้องกันการปลอมแปลง role ผ่าน client-side cookie หรือ localStorage อย่างสมบูรณ์

2. **Backend User Management APIs**:
   - `GET /api/admin/users`: ค้นหา (ชื่อ-นามสกุล, รหัสนิสิต, อีเมล), กรองตามสิทธิ์ (Role), กรองตามสถานะ (Status: ACTIVE / INACTIVE / SUSPENDED) พร้อมระบบแบ่งหน้า (pagination)
   - `POST /api/admin/users`: สร้างบัญชีผู้ใช้งานภายใน (STAFF, ADMIN, TEAM_OFFICIAL) พร้อมตรวจสอบความถูกต้องของอีเมล, จองอีเมลระดับ transaction ผ่าน `reserveEmail()` เพื่อป้องกัน race condition, แฮชรหัสผ่านด้วย `bcryptjs` (10 rounds) และบันทึก Audit Log
   - `GET /api/admin/users/[id]`: เรียกดูรายละเอียดข้อมูลบัญชีผู้ใช้งานรายบุคคล
   - `PATCH /api/admin/users/[id]`: อัปเดตข้อมูลพื้นฐาน (ชื่อ, อีเมล, เบอร์โทร), เปลี่ยนสิทธิ์ (Role), ปรับสถานะการใช้งาน (isActive) พร้อมตรวจสอบความปลอดภัย
   - `PATCH /api/admin/users/[id]/role`: Endpoint เฉพาะสำหรับการเปลี่ยนบทบาทสิทธิ์
   - `PATCH /api/admin/users/[id]/status`: Endpoint เฉพาะสำหรับการระงับหรือเปิดใช้งานบัญชี

3. **Admin Self-Protection & Last-Admin Safeguards**:
   - **Self-suspension prevention**: ป้องกันไม่ให้ Admin ระงับบัญชีของตนเอง
   - **Self-demotion prevention**: ป้องกันไม่ให้ Admin ลดสิทธิ์หรือปลดบทบาท Admin ของตนเอง
   - **Last active Admin protection**: ป้องกันไม่ให้ระงับหรือลดสิทธิ์ Admin บัญชีสุดท้าย เพื่อป้องกันระบบ lockout อย่างเด็ดขาด
   - **Athlete ID requirement**: ป้องกันไม่ให้เปลี่ยนสิทธิ์เป็น `ATHLETE` หากผู้ใช้ไม่มีรหัสนิสิต (`studentId`)
   - **Public registration guard**: ล็อกสิทธิ์ฝั่งเซิร์ฟเวอร์ ไม่รับหรือเชื่อถือ role จาก client payload

4. **Admin Frontend Interface (`/admin/users`)**:
   - หน้าจอจัดการผู้ใช้สไตล์สอดคล้องกับระบบเดิม (Tailwind CSS 4, Google Fonts, การจัดวางสอดคล้องกับ `/admin/clubs` และระบบกองกิจฯ)
   - สรุปจำนวนผู้ใช้ทั้งหมด, เปิดใช้งาน, ระงับการใช้งาน, เจ้าหน้าที่และแอดมิน
   - ตารางแสดงรายการผู้ใช้งาน พร้อม badge สีแสดงบทบาทและสถานะ
   - Modal สำหรับเพิ่มผู้ใช้ใหม่, แก้ไขข้อมูลพื้นฐาน, ยืนยันเปลี่ยนสิทธิ์ และยืนยันระงับ/เปิดใช้งานบัญชี

---

## Files Changed

### Files Created
- `lib/password-reset.ts`: โมดูลสร้างและตรวจสอบ Reset Token (Single-use hash version), Rate limiter, Password validation
- `app/forgot-password/page.tsx`: หน้า UI ลืมรหัสผ่าน
- `app/reset-password/page.tsx`: หน้า UI ตั้งรหัสผ่านใหม่
- `app/api/auth/forgot-password/route.ts`: API endpoint ขอรีเซ็ตรหัสผ่าน (Anti-enumeration)
- `app/api/auth/reset-password/route.ts`: API endpoint ตรวจสอบและตั้งรหัสผ่านใหม่
- `app/api/admin/users/[id]/reset-password/route.ts`: API endpoint สำหรับแอดมินส่งลิงก์รีเซ็ตรหัสผ่าน
- `tests/unit/password-reset.test.mjs`: Unit tests สำหรับ Password Reset workflow
- `lib/audit-service.ts`: โมดูลบันทึก Audit Log ระดับ transaction
- `app/admin/users/page.tsx`: หน้า UI การจัดการผู้ใช้งาน (Admin Users Management)
- `app/admin/page.tsx`: หน้า root ของ admin ที่ redirect ไปยัง `/admin/users`
- `app/api/admin/users/[id]/role/route.ts`: Endpoint เฉพาะสำหรับเปลี่ยนสิทธิ์
- `app/api/admin/users/[id]/status/route.ts`: Endpoint เฉพาะสำหรับเปลี่ยนสถานะบัญชี
- `tests/unit/admin-users.test.mjs`: Unit tests สำหรับการตรวจสอบข้อมูล, กฎความปลอดภัย และเงื่อนไข Last-admin

### Files Modified
- `app/login/page.tsx`: เพิ่มลิงก์ "ลืมรหัสผ่าน?"
- `lib/audit-service.ts`: เพิ่ม enum สำหรับ `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `ADMIN_SENT_PASSWORD_RESET`
- `lib/account-service.ts`: รองรับ `ownUserId` สำหรับตรวจสอบความซ้ำซ้อนของอีเมล
- `lib/validation.ts`: เพิ่ม validation helpers สำหรับ User management
- `app/api/admin/users/route.ts`: ปรับปรุง GET และ POST
- `app/api/admin/users/[id]/route.ts`: ปรับปรุง GET และ PATCH
- `app/admin/clubs/page.tsx`: เพิ่มแท็บนำทาง
- `app/superadmin/page.tsx`: เพิ่มลิงก์นำทาง

---

## Validation & Quality Checks
- `npm run test:unit`: ผ่านทั้งหมด 22 tests (17 admin-users tests + 5 password-reset tests, 0 failed)
- `npx tsc --noEmit`: ผ่านทั้งหมด (0 errors)
- `npm run lint`: ผ่านทั้งหมด (0 errors, 0 warnings)
- `npm run build`: สร้าง production bundle สำเร็จสมบูรณ์ 67/67 routes static/dynamic compiled cleanly

---

## Database Changes
- **No schema changes**: ไม่มีการแก้ไข `prisma/schema.prisma` หรือรัน migration ใดๆ ใช้งานโครงสร้างเดิม 100% ตามข้อกำหนด

---

## 3. Automated Browser and Accessibility Testing (T05)

### Completed Highlights
- **E2E Automation**: Created `tests/e2e/main-flow.spec.ts` using Playwright to test all critical authentication and routing paths for 5 core user roles (Athlete, Club, Staff, Admin, Team Official).
- **Accessibility Auditing**: Integrated `@axe-core/playwright` to run accessibility checks on key pages and dashboards.
- **Fixed A11y Violations**:
  - `landmark-one-main`: Added `<main>` tag to `app/layout.tsx` to properly wrap all application content in a region landmark.
  - `color-contrast`: Fixed contrast ratios for text components in `app/athlete/register/page.tsx` (`text-slate-500`) and `components/shared/LogoutButton.tsx` (`text-red-700`).
- **Responsive Validations**: Verified horizontal scroll behaviors for data tables (`overflow-x-auto`) across Desktop and Mobile viewports.
- **Documentation**: Generated `TEST-REPORT.md` with execution details and findings.

## Remaining Work
- ไม่มี — งานพัฒนาและการทดสอบทั้งหมดเสร็จสมบูรณ์ พร้อมส่งมอบ

## Known Issues
- ไม่มี
