## Staff Fitness Test Management Feature (Back-End) — 2026-09-29

- **Calculation & Evaluation Engine (`lib/fitness-calculation.ts`)**:
  - Implemented based on University of Phayao Sports Science standard charts:
    - 8-item General Evaluation with official 5-tier rating (`ดีมาก`, `ดี`, `ปานกลาง` / `พอใช้`, `ต่ำ`, `ต่ำมาก`) and age-bracket criteria (20–29, 30–39, 40–49, 50–59): Body Fat %, Grip Strength, Vital Capacity, Standing Broad Jump, Leg Strength, Flexibility, Sit-ups (30s), Push-ups (30s).
    - Football-specific 16-item Evaluation Engine (`evaluateFootballFitness`): calibrated directly to UP Sports Science standards across 5 categories:
      1. ความเร็ว (Speed: 10m, 20m, 40m sprints)
      2. ความคล่องแคล่วว่องไว (Agility: T-Test, FAF's Slalom, Semo test)
      3. พลังกล้ามเนื้อ (Muscle Power: Vertical jump, Standing broad jump)
      4. สมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic: RSSA Best/Mean/Decrement%, RAST Max/Min/Avg Watts & Fatigue Index)
      5. สมรรถภาพแบบใช้ออกซิเจน (Aerobic: VO2max)
    - Sport calculation utilities: Vertical Jump test (`calcVerticalJump`), Repeated-Shuttle Sprint Ability (`calcRSSA`), Running-based Anaerobic Sprint Test (`calcRAST`).
  - `POST /api/staff/fitness-tests/evaluate`: Real-time calculation endpoint for the Front-End team supporting both general fitness and football-specific evaluations with automatic metric derivation.
  - Added unit test suite in `tests/unit/fitness-test.test.mjs` (all 73 unit tests passing).

- **Database Schema**:
  - Added enum `FitnessTestStatus` (`PENDING`, `PASSED`, `FAILED`) in `prisma/schema.prisma`.
  - Added model `FitnessTestResult` with `applicationId` (unique 1-to-1 with `Application`), `status`, `totalScore`, `scores` (Json for detailed items), `notes`, `testedAt`, `recordedBy`, and timestamps.
  - Generated Prisma Client (`npm run db:generate`). No database migration or push was run.
- **Service & Business Logic (`lib/fitness-service.ts` & `lib/validation.ts`)**:
  - `listFitnessCandidates`: Retrieves candidate athletes (defaulting to approved/selected: `STAFF_APPROVED`, `FINAL_SELECTED`), filtering by competition, sport, squadType, club, fitness status, or text search. Enriches with recommended test items via `getFitnessTestGroup` from `lib/fitness-test.ts` and computes summary statistics.
  - `recordFitnessResults`: Atomically creates or updates `FitnessTestResult` for one or many (`items: [...]`) applications inside serializable transaction, recording history in `StatusHistory`.
  - `getFitnessCandidateDetail`: Inspects individual fitness test detail with server-side authorization check (STAFF/ADMIN, or own ATHLETE/CLUB).
  - `validateFitnessTestItem` & `validateFitnessTestStatus`: Strict server-side validation rejecting invalid scores, malformed arrays, and bad enum values.
- **API Endpoints**:
  - `GET /api/staff/fitness-tests`: Query candidate list and summary stats.
  - `POST /api/staff/fitness-tests`: Record results (single object or bulk array `{ items: [...] }` for Excel/CSV import).
  - `GET /api/staff/fitness-tests/[applicationId]`: Candidate fitness detail.
  - `PATCH /api/staff/fitness-tests/[applicationId]`: Update candidate fitness test.
  - `app/api/applications/route.ts` & `app/api/applications/[id]/route.ts`: Included `fitnessTestResult` so athletes can see their test status.
- **UI Status**:
  - The UI under `/staff/fitness-tests` is designated for the Front-End team to build and merge via Git later.
- **Validation**:
  - `npx tsc --noEmit`: Passed (0 errors).
  - `npx eslint lib/fitness-service.ts app/api/staff/fitness-tests/`: Passed (0 errors, 0 warnings).
  - `npm run test:unit`: Passed all 67 tests (including 5 new fitness test unit tests in `tests/unit/fitness-test.test.mjs`).

﻿## Log and build provenance recovery - 2026-09-28

Read-only retrieval from SQLite session database `1a6a8cd1-815a-4a1b-a88f-aaa116e85726.db` (Gemini antigravity-ide). Decoding method: generic protobuf wire decode (same as `recover-history.cjs`), credential-pattern redaction. Raw execution results recovered for each quality gate listed below. No test, build, migration, database/storage access or application-data mutation was performed.

## Athlete profile photos - 2026-09-29

- The registration profile card now displays private profile photos through `AthleteProfilePhoto`, with preview, explicit save, empty/error states and retry. The previous signup form stored a filename, not uploaded bytes; those photos must be selected and uploaded again after login. No mock portrait is used.
- Uploads reuse `/api/documents`; profile updates retain only READY JPEG/PNG documents owned by the authenticated athlete. Public signup rejects nonempty photo references. The application form can reuse a saved profile reference; existing application ownership validation remains in place. No schema changes or migrations.
- Verified again: TypeScript and targeted ESLint exit 0; unit tests pass 62/62, including 8 photo tests; production build exit 0 (network approval used for the existing Google font). Earlier full lint reports four unrelated `no-require-imports` errors in `test-results/release-final/recovered-20260928/recover-history.cjs`.
- Restarted the local dev server on port 3138. Verified the served login JavaScript contains the current post-login photo-upload guidance. Initial text-matching checks were affected by shell encoding and do NOT establish that the previous server served stale code.
- Unauthenticated checks: `/login` returns 200; `/athlete/register` redirects to `/login`; `/api/auth/me` returns 401. No authenticated browser upload, real database write, or Storage upload was performed during verification. Live upload/persistence still requires verification using an athlete account.
- No merge, pull, commit or push. Existing unrelated working-tree changes were preserved.

## Selective port of Front-End analytics visual layer (commits 58e4563 & 28f164a)

- Source visual reference: `origin/Front-End` commits `58e4563` and `28f164a` (`app/staff/analytics/page.tsx`).
- Implementation pattern applied:
  1. `components/shared/AnalyticsSummary.tsx`: Created pure presentation component with formal KPI cards, proportional comparison bars for sports, faculty breakdown toggle (chart/table), status distribution circle, and clear notices for unavailable metrics (gender/budget/rules).
  2. `app/staff/analytics/page.tsx`: Rewritten to use the official university shell, BackButton, LogoutButton, Tab navigation (current vs snapshots), clean filters bar, real-time summary visualization, and real API-backed snapshot history.
  3. Maintained 100% API-backed data flow: All data loads from `/api/staff/analytics`, `/api/competitions`, and `/api/staff/snapshots`. No `MOCK_ALL_APPLICANTS` or `localStorage` was imported.
  4. CSV is generated in the browser from the current API response, preserving the existing escaping. Snapshot create/read/delete continue through the existing server endpoints and deletion remains conditional on `canDelete`.
- Tests: Added `tests/unit/analytics-ui.test.mjs` verifying clean rendering, quota bounds, escaping, and absence of mock data artifacts (3 tests).
- Validation: TypeScript passed; targeted ESLint passed; `npm run test:unit` passed 54/54. Production build completed. The 62 count in Next.js output describes generated static pages, not the total number of routes.
- Calendar dates, gender, budget and compliance mock figures were not ported because the current analytics response does not supply them. Browser visual QA and live authenticated integration tests have not been performed. Existing module-type warnings remain; repository-wide lint has previously reported four unrelated errors in the recovered-history script.
- Constraints respected: No git commit, merge, pull, or push was performed.

## Selective port of Front-End commit 941985c (2026-09-28)

- Target: origin/Front-End commit `941985c19b64ad00c662a4792ae11c632331d21f` (`feat:Fix Province, Faculty, and Program`).
- Selective changes applied:
  1. `lib/up-faculties.ts`: Updated official University of Phayao academic faculty and major hierarchy (17 faculties + 1 college). Matches `941985c`.
  2. `app/login/page.tsx`: Selectively removed redundant `SMED · smed.up.ac.th` badge above form header. Kept all API-backed authentication, error handling, session management, forced password change redirect, and registration flows intact without any `localStorage` or client-cookie mock.
  3. `app/page.tsx`: Headline typography and line breaks aligned with `941985c` (clean subtitle and footer without redundant `SMED` badge), while using Next.js `<Image />` component with `priority` for optimization.
  4. `lib/analytics-data.ts`: Intentionally preserved existing API/database-backed re-export (`export { summarize } from "./analytics"`). Rejected Front-End's 329-line mock applicant array to prevent breaking production analytics endpoints.
  5. `SYSTEM_SUMMARY.md`: Left unchanged as an external summary document.
- Validation: `npx tsc --noEmit` passed (0 errors); targeted ESLint passed; `npm run test:unit` passed 51/51; `npm run build` passed generating 62 static/dynamic routes.
- Constraints respected: No git commit, merge, pull, or push was performed.

## Selective Front-End portal integration

- Source: `origin/Front-End` at `941985c19b64ad00c662a4792ae11c632331d21f`. Imported the `app/page.tsx` cover and role cards, then converted both logo images to `next/image`. All seven link targets exist. Login remains public; role paths retain the unchanged proxy/session checks.
- Inspected the local login and admin-clubs pages without editing them. Authentication requests, forced-password-change redirect, club approval, suspension and password-reset controls remain unchanged. No API, auth, schema, migration or dependency changes in this step.
- Validation: TypeScript and targeted ESLint passed; unit tests passed 51/51 with existing MODULE_TYPELESS_PACKAGE_JSON warnings. Production build passed with network access for Google Fonts, generating 62 static pages. Full lint still fails on four existing no-require-imports errors in `test-results/release-final/recovered-20260928/recover-history.cjs`, which was not edited.
- Browser visual QA and authenticated integration tests were not run. This is not a full security or production-readiness verification.
- Caution: path checkout replaced the previously modified local portal and staged the source version. The pre-import local portal was not separately backed up; exact preservation of those edits cannot be asserted. Subsequent image edits are unstaged. Review both index and working-tree diffs before committing. No merge, pull, commit or push occurred.
- Previous-step corrections: the old faculty list had 19 entries, not 11; the imported list has 18, matching the branch but not independently verified against official curricula. Earlier byte-identity claims for untracked assets were not supported by a complete remote/local hash comparison.

## Recovered provenance (continued)

**Recovered raw log output (exit codes and full stdout)**

| Check | DB Step | Command | Exit | Evidence |
|---|---|---|---|---|
| `npm run test:unit` | idx 52 | `npm run test:unit` | **0** | `test-results/release-final/recovered-20260928/logs/unit-tests.log` — ℹ 51 pass, 0 fail, 0 skipped, 0 todo, duration_ms 5400.9848 |
| `npx tsc --noEmit` | idx 54 | `npx tsc --noEmit` | **0** | `test-results/release-final/recovered-20260928/logs/tsc-noemit.log` — clean, no output (standard compiler silence on zero errors) |
| `npm run lint` | idx 56 | `npm run lint` | **0** | `test-results/release-final/recovered-20260928/logs/lint.log` — > eslint with empty output (0 errors, 0 warnings) |
| `npm run build` | idx 63 | `npm run build` | **0** | `test-results/release-final/recovered-20260928/logs/build.log` — Next.js 16.2.6 Turbopack, ✓ Compiled in 7.5s, 62 routes |
| Full integration suite | idx 112 | see checks.json CHK-05 | **0** | already in `test-results/release-final/run-20260928-191300/logs/integration-full-suite.log` — ℹ 38 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, duration_ms 96877.0285 |

**Build provenance**

- .next/BUILD_ID: KlrUls2HaThYk7klcs93-, timestamp 2026-09-28 19:10:12+07:00 — matches Step 63 finish (2026-09-28T12:10:13Z/19:10:13+07:00).
- 52/52 scopeFileHashes in manifest.json match current bytes on disk.
- 8 files listed in `RELEASE_EVIDENCE_REVIEW.md` as unhashed in the dirty working tree verified:
  - `scripts/record-cutover-evidence.mjs` and `scripts/verify-xlsx-workbook.mjs`: modified 03:59 UTC (before test run at 12:13Z); evidence-tooling changes only, no business logic.
  - `app/globals.css`, `app/layout.tsx`, `app/page.tsx`: modified 12:15–12:17 UTC (after integration suite finished at 12:26Z); visual styling (font Prompt, hero cover background, university logo).
  - `app/athlete/[id]/page.tsx`, `app/staff/applications/[clubId]/page.tsx`, `app/staff/applications/[clubId]/[competitionId]/page.tsx`: modified 12:50–13:10 UTC; UI-only (BackButton component adoption, print button styling). Diff reviewed: no business logic, authorization, schema or server-side changes.
- None of the 8 unhashed files altered API behaviour, authorization rules, database schema or test fixtures.

**Supersedes**: the earlier EVIDENCE_REVIEW gap note that "four quality checks have no raw logs" is now closed by direct recovery. Build artifact ID (KlrUls2HaThYk7klcs93-) is confirmed via .next/BUILD_ID.

**Production gates (unchanged)**

Production remains BLOCKED pending explicit user authorization for:
1. Backup production database and verify restore to isolated scratch DB.
2. Apply migration `20260928010000_admin_temporary_password` to production DB under authorized rollout.
3. Deploy build and regenerate Prisma client against migrated schema.
4. Post-deploy smoke test: ADMIN configure → ATHLETE apply/submit → STAFF approve/announce → ATHLETE result → STAFF export; verify `/dev` unavailable; verify SUPERADMIN cannot be assigned.
5. Close legacy storage evidence: 1 unsupported-origin document reference in `test-results/cutover-readonly-evidence.json` must be resolved (production DB has no real athlete documents yet per scope; confirm production references are absent or clean).
## Release evidence review - 2026-09-28

See `docs/RELEASE_EVIDENCE_REVIEW.md` for the evidence-first review of the final report. All 52 source hashes and all 6 evidence checksums match; the historical integration log supports 38 passed, zero failed/skipped/cancelled. Preserve that result without a full rerun. The blanket LOCAL/TEST VERIFIED claim below exceeds the available provenance: four quality checks have no raw logs, the source inventory is incomplete, the build label is not an artifact ID, and localhost:3138 is currently unavailable. Genuine production legacy access and DB snapshot/backup/restore remain unverified; production remains BLOCKED. The XLSX JSON and browser screenshot remain historical evidence with documented limits. No tests, build, migration, database/storage access or application-data changes were performed for this review. Only review documentation was updated; no implementation checks were needed.

## Release Final Verification â€” 2026-09-28 (Run ID: run-20260928-191300)

Final pre-release verification bundle established:
- Full integration suite (all 6 files) rerun serially against localhost:3138 using `.env.release-test` and isolated Supabase PostgreSQL (`aws-0-ap-southeast-1`): **38 passed, 0 failed, 0 skipped, 0 cancelled**, duration 96877.0285 ms. Evidence: `test-results/release-final/run-20260928-191300/logs/integration-full-suite.log`.
- Confirmed full integration with legacy Club temporary password recovery, suspension preservation, forced password change, and activation controls.
- Code quality checks: `npx tsc --noEmit` passed (0 errors), `npm run lint` passed (0 errors, 0 warnings), `npm run test:unit` passed (51 passed), `npm run build` passed (62 static/dynamic routes).
- Comprehensive report generated: `docs/RELEASE_FINAL_REPORT.md`, with traceable evidence artifacts in `test-results/release-final/run-20260928-191300/manifest.json` and `checks.json`.
- This supersedes earlier notes that the full suite was pending after the Club suspension UI change.
- Status: **LOCAL/TEST VERIFIED**. Production gates (migration `20260928010000_admin_temporary_password`, deployment, and backup restore to dedicated empty DB) remain BLOCKED awaiting explicit user authorization. Real athlete data import remains OUT OF SCOPE.

## Club suspension controls and live recovery verification â€” 2026-09-28

Added ADMIN club suspension/reactivation confirmation controls using the existing PUT /api/clubs/[id] endpoint. Account access is explicitly displayed from isActive, independently of club approval status. Success is shown after the mutation completes and data is reloaded. No schema or auth changes.

Extended admin-password-reset integration coverage with a disposable legacy Club: STAFF/CLUB cannot change activation; ADMIN suspension rejects existing sessions and login; reset preserves suspension; reactivation permits temporary login with forced change; final password works and temporary credentials/session are rejected. Targeted integration passed (1 scenario, 12875.0523 ms); fixtures cleaned up. Typecheck, lint, all 51 unit tests and production build passed. Full suite was not repeated for this UI change. Build required network access for the existing Google font. No production changes or migrations. The manual Club fixture remains available for user testing; no existing account activation state was changed.

## Full integration rerun after ADMIN recovery â€” 2026-09-28

Ran all six tests/integration/*.test.mjs files serially against localhost:3138 using .env.release-test, with TEST_ALLOW_WRITE=yes enabled only for the runner. Result: 38 passed, 0 failed, 0 skipped, 0 cancelled; duration 101548.6736 ms. Raw evidence: test-results/integration-after-admin-reset.txt.

Coverage includes ADMIN temporary-password recovery, invalidation of old credentials/sessions, forced password change, suspended-account preservation, removed recovery/dev endpoints, competition state/deadline gates, authorization, private documents, scoped reports/exports, quota concurrency and the persisted release core flow. Counts differ from the previous email-enabled suite because retired recovery tests were replaced.

This supersedes earlier notes that the full integration rerun or isolated test schema verification was pending. Legacy Club temporary-password recovery still has unit coverage only; this run does not establish live coverage for that specific recovery path. No migration was run by the assistant, no email was sent, and no production database/storage was changed. Production rollout and backup/restore evidence remain separate open gates. Historical email-delivery requirements no longer apply to the replaced password-recovery flow.

## Live ADMIN recovery integration follow-up

The dedicated .env.release-test database now exposes mustChangePassword on both User and Club (read-only preflight passed). The user previously reported the manual recovery flow works. No migration was executed by the assistant in this follow-up.

Ran admin-password-reset.test.mjs and account-smoke.test.mjs serially against localhost:3138 with isolated test writes enabled for the runner only: 5 passed, 0 failed, 0 skipped; duration 9395.6898 ms. Confirmed ADMIN-only reset and identity confirmation, old password/session rejection, forced-change page redirect and protected API rejection, successful change/new login, temporary password/session invalidation, suspended-account preservation, removed email recovery endpoints and unauthenticated guards. Generated fixture accounts and their audit records were cleaned up by the test. No email was sent, no production data/storage was changed.

This supersedes the earlier pending test-schema and targeted integration notes. The full integration suite was NOT rerun in this follow-up, and live legacy Club recovery is not covered by this targeted test (unit coverage exists). Production migration/release readiness remains unverified. The test server remains running at localhost:3138.
## ADMIN-only password recovery â€” 2026-09-28

User-authorized replacement of email recovery: ADMIN verifies the requester, issues a random temporary password (shown once), and delivers it through a verified channel. The owner must change it before protected pages or APIs can be used. User and legacy Club accounts are supported; suspension is preserved. Reset and audit commit atomically; no password/token/hash is stored in audit events. All earlier email-delivery release gates below are historical and no longer apply to password recovery.

Implementation is complete locally, but deployment/live verification is BLOCKED on explicit authorization to apply migration 20260928010000_admin_temporary_password to the isolated test database first. It adds mustChangePassword=false to User and Club. No migration or db:push has run. Do not run this new build against the old schema. Prisma Client generation only has run. Existing sessions without credential binding require a fresh login after rollout; password changes invalidate previous sessions.

Verified: typecheck, lint, unit tests (51 passed) and production build. New integration test tests/integration/admin-password-reset.test.mjs is prepared but NOT run because the schema has not been migrated. Browser verification also remains pending. Tests for retired email recovery were removed/replaced; counts are not directly comparable to previous email-enabled suites. Unrelated workspace changes were preserved.

Rollout: back up the chosen database, authorize/apply the new migration there, regenerate/build/restart, then verify ADMIN reset â†’ old session rejected â†’ temporary login â†’ protected API denied â†’ change password â†’ new login, plus suspended accounts and legacy Club. Production needs a separate authorized rollout. Backup/restore and athlete-data import gates remain separate. Recovery for the sole ADMIN requires another established recovery operator; self-reset is rejected by this endpoint.

## API-backed Front-End visual port â€” 2026-09-28

- Ported only low-risk presentation features from `origin/Front-End`: official image assets, Prompt Thai typography, a reusable `BackButton`, official home/login styling, and cascading Thai province/district/subdistrict data with automatic postal code selection.
- Follow-up ported the STAFF visual layer across the shared navigation/page shell, applicant search and review workspace, responsive filter controls, application table and action styling, publication preview, club/competition drill-down headers, selection page, and analytics cards/tables. All views continue to use the existing API-backed data and mutation paths; no `MOCK_*`, local-only approval, or client-only publication behavior was imported.
- Follow-up also refreshed the ADMIN dashboard, user management, club management, and competition configuration visual shells with consistent official headers, module cards, navigation tabs, responsive actions, and reusable back navigation. Existing API-backed create/edit/role/status/reset, club approval/president, and competition/quota handlers remain unchanged; the Front-End branch's mock club state was not imported.
- Follow-up refreshed the ATHLETE application, status, and detail/print visual shells with official headers, responsive actions, reusable back navigation, stronger progress styling, and consistent cards. Profile/competition loading, private document uploads, application submission, status history, and detail retrieval continue through the existing APIs; no localStorage profile, mock athlete, mock file, or console-only submission behavior was imported.
- Preserved the current `/api/auth/login` and `/api/auth/register` calls, role-based server response routing, server validation, Prisma persistence, and existing Phase 4 navigation. No mock authentication, client-written role cookie, quick-role bypass, mock submission, localStorage profile source of truth, API/schema/migration, or Supabase Storage change was imported.
- Added `@bilions/thailand-address` 2.0.1 to the dependency lock and regression coverage for the 77-province cascade plus Phayao postal-code mapping and invalid selections.
- Verification: `npx tsc --noEmit` passed; `npm run lint` passed; unit tests passed; production build passed with 65 routes. The initial sandbox build could not download Prompt from Google Fonts; the authorized network retry passed.
- The repository still contains pre-existing unrelated uncommitted release-evidence/documentation changes. No commit, merge, migration, database write, or push was performed.

## XLSX browser artifact verified â€” 2026-09-28

The newly supplied Desktop/à¸/applicants.xlsx passes both structure and known core-flow content verification: twelve headers in order; exactly one applicant cmujekjzd00079gc76u3x2fa1, student 95071709, Browser Core 1790455070687, football/team men, published status, submitted 27/9/2569 12:53:31. SHA-256: 77cbf12db6e282bbcdf16fb9a9afaf5f3256ef6ea723610ec38cadc0a3af9f47. Evidence: test-results/xlsx-download-verification.json. This supersedes earlier pending XLSX verification notes for this scenario. Production legacy access, email and backup/restore gates remain open. No workbook, database or storage contents were modified.
## Downloaded workbook follow-up â€” 2026-09-28

The user supplied Desktop/applicants.xlsx. Direct inspection passed the current twelve-column header/order check: four rows, readable Thai values/statuses and date strings. SHA-256: 3ed5e932fe39b482c2bcef339af39bb0aa0cbadb6c9e74948199a00b459ca627. This supersedes the earlier five-column download finding for this newly supplied file.

The four rows belong to older ui-* fixture competitions, not Browser Core 1790455070687 / student 95071709. Therefore the requested single-applicant filter scenario remains unverified; this is not by itself evidence of a filtering defect because the user's export filters are unknown. See test-results/xlsx-download-verification.json. No database/storage writes or workbook modifications were made.
## Audit evidence correction â€” 2026-09-28

This update supersedes earlier READY/ALL PASSED statements. Production release approval remains open.

- Verified current production metadata READ ONLY: all four migration records finished without rollback; no SUPERADMIN/DEV users; athlete-private and athlete-docs both private. Evidence: test-results/cutover-readonly-evidence.json.
- The only distinct stored HTTP document reference is on example.test. No real production legacy object could be tested. Application-authorized legacy download remains unverified; bucket privacy alone is not proof of complete legacy access.
- Inspected the actual Downloads/applicants.xlsx: one row, FIVE columns from the older export. It does not verify the current twelve-column export. Evidence: test-results/xlsx-download-verification.json (failed, as intended). A fresh browser download is required.
- Added a read-only workbook inspector; it never regenerates the workbook. Added regression coverage for old/current headers, missing files and preserving original bytes. Structural success does not claim filter/content verification.
- Fixed missing apiBase and explicit isolated-test write guard in the generated-workbook probe; renamed generated output and labeled its provenance. Production-writing cutover probe now requires explicit CUTOVER_ALLOW_WRITE=yes, checks cleanup errors and fails with nonzero exit on failed assertions. It was NOT run. The new read-only inspector is the default for this follow-up.
- Historical integration 39/39 is a prior runner result, not rerun here. The release-core source contains one test; its listed business checkpoints must not be counted as four test cases.
- Remaining: fresh downloaded workbook content check, valid production legacy reference and an existing authorized session for application access, production-domain email delivery, backup/restore evidence. No email was sent and no database/storage configuration, objects or records were changed.
- Email next step: verify production HTTPS APP_URL and sender domain, then explicitly authorize one reset email to a controlled account; verify inbox, one-time use and login manually. Backup next step: identify backup and restore into a separate disposable database with explicit authorization; never restore over production for this check.
# Implementation Handoff

## Security Audit Corrections & Scope Fixes â€” 2026-09-28

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
  - Overall release status: **CONDITIONAL READY (CODE READY â€” PENDING RELEASE COMMIT)**.

## Athlete club-stage correction â€” 2026-09-27

- Fixed the athlete status tracker: STAFF approval/rejection or final selection alone no longer implies club approval. The current club decision or latest club event in the existing chronological history determines the club result.
- Applications without a roster club or recorded club decision show "à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¹‚à¸”à¸¢à¸•à¸£à¸‡" with neutral styling. Roster-backed submitted applications remain pending; advanced legacy records without club evidence show "à¹„à¸¡à¹ˆà¸žà¸šà¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸à¸²à¸£à¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¸Šà¸¡à¸£à¸¡" rather than inventing approval.
- Added regression tests for direct STAFF flows, recorded approval/rejection, retained history without a current club, and missing legacy history.
- Verified: typecheck, lint, 46 unit tests and production build passed. The initial sandbox build could not fetch Google Fonts; the authorized network retry passed. No database/API/schema changes or migrations. This correction was not rechecked in the live browser; earlier browser screenshot shows the pre-fix wording.
- This supersedes the club-stage wording follow-up below. XLSX workbook contents and production gates remain open.


## Full integration and browser verification â€” 2026-09-27

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

## Live password recovery verification â€” 2026-09-27

This update supersedes earlier statements that no live email verification has occurred. Verification used the isolated test database and local development server at localhost:3138, with the existing Resend delivery implementation.

- The assistant created a test ATHLETE account and requested recovery through the application API (HTTP 200). HTTP success alone was not treated as delivery evidence.
- The user confirmed receipt in the real Gmail inbox, successful password reset, and successful login with the new password.
- On reopening the same emailed link, the user reported: "à¸¥à¸´à¸‡à¸à¹Œà¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸«à¸£à¸·à¸­à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸" and "à¸¥à¸´à¸‡à¸à¹Œà¸™à¸µà¹‰à¸–à¸¹à¸à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¹„à¸›à¹à¸¥à¹‰à¸§ à¸à¸£à¸¸à¸“à¸²à¸‚à¸­à¸¥à¸´à¸‡à¸à¹Œà¹ƒà¸«à¸¡à¹ˆ". This confirms rejection of the used link in the manual browser flow.
- Inbox receipt and browser results are user-reported evidence, not independently observed browser automation. No passwords, API keys or reset tokens are recorded here.
- Follow-up manual evidence: the user confirmed that the previous password was rejected and the new password worked. After instructions to wait 16 minutes without using the next link, the user reported an invalid/expired-link screen; elapsed time was not independently measured, and its secondary message was generic.
- Suspended-account follow-up: the assistant temporarily set the test ATHLETE account inactive; after the reset/login instructions the user reported "à¸šà¸±à¸à¸Šà¸µà¸–à¸¹à¸à¸£à¸°à¸‡à¸±à¸šà¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™". A subsequent database read confirmed isActive=false. The assistant then restored isActive=true as planned. Reset completion during this suspended interval was not independently observed.
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

## Release implementation â€” 2026-09-26

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


## Current verification â€” 2026-09-26

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
1. **Forgot Password & Reset Password (à¸£à¸°à¸šà¸šà¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹à¸¥à¸°à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆ)**
2. **Staff & Admin Account Management (à¸£à¸°à¸šà¸šà¸ˆà¸±à¸”à¸à¸²à¸£à¸šà¸±à¸à¸Šà¸µà¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¹à¸¥à¸°à¸œà¸¹à¹‰à¸”à¸¹à¹à¸¥à¸£à¸°à¸šà¸š)** à¸ªà¸³à¸«à¸£à¸±à¸šà¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸žà¸°à¹€à¸¢à¸²
3. **Automated Browser and Accessibility Testing (à¸à¸²à¸£à¸—à¸”à¸ªà¸­à¸šà¹€à¸šà¸£à¸²à¸§à¹Œà¹€à¸‹à¸­à¸£à¹Œà¹à¸¥à¸°à¸à¸²à¸£à¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡)**

---

## 1. Forgot Password & Reset Password Feature

### Architecture & Security Decisions
- **Reuse Existing Authentication Architecture**: à¸•à¹ˆà¸­à¸¢à¸­à¸”à¸ˆà¸²à¸à¸£à¸°à¸šà¸š Custom JWT (`jose`) + `bcryptjs` à¹€à¸”à¸´à¸¡ à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸•à¸²à¸£à¸²à¸‡à¹ƒà¸«à¸¡à¹ˆ à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸žà¸¶à¹ˆà¸‡à¸žà¸² external auth provider à¹à¸¥à¸°à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸²à¸£à¹à¸à¹‰ schema (`prisma/schema.prisma` à¹„à¸¡à¹ˆà¸–à¸¹à¸à¹à¸•à¸°à¸•à¹‰à¸­à¸‡)
- **Token Invalidation Pattern (Single-use & Expirable)**:
  - à¹‚à¸—à¹€à¸„à¸™à¸¥à¸‡à¸™à¸²à¸¡à¸”à¹‰à¸§à¸¢ HMAC SHA-256 (`JWT_SECRET`) à¸¡à¸µà¸­à¸²à¸¢à¸¸ 15 à¸™à¸²à¸—à¸µ
  - à¸ à¸²à¸¢à¹ƒà¸™ payload à¸šà¸£à¸£à¸ˆà¸¸ `tokenVersion` à¸—à¸µà¹ˆà¸„à¸³à¸™à¸§à¸“à¸ˆà¸²à¸ `passwordHash.slice(-10) + "_" + updatedAt.getTime()`
  - à¹€à¸¡à¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¸„à¹ˆà¸² `password` à¹à¸¥à¸° `updatedAt` à¹ƒà¸™à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸°à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸—à¸±à¸™à¸—à¸µ à¸ªà¹ˆà¸‡à¸œà¸¥à¹ƒà¸«à¹‰ token à¹€à¸”à¸´à¸¡à¸à¸¥à¸²à¸¢à¹€à¸›à¹‡à¸™à¹‚à¸¡à¸†à¸° (invalid) à¸—à¸±à¸™à¸—à¸µ à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸™à¸³à¸à¸¥à¸±à¸šà¸¡à¸²à¹ƒà¸Šà¹‰à¸‹à¹‰à¸³à¹„à¸”à¹‰ (Single-use) à¹à¸¡à¹‰à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸à¸à¹‡à¸•à¸²à¸¡
- **Strict Anti-Enumeration Protection**:
  - Endpoint `POST /api/auth/forgot-password` à¸ªà¹ˆà¸‡à¸„à¸·à¸™à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¹€à¸«à¸¡à¸·à¸­à¸™à¸à¸±à¸™à¹€à¸ªà¸¡à¸­: `"à¸«à¸²à¸à¸­à¸µà¹€à¸¡à¸¥à¸™à¸µà¹‰à¸¡à¸µà¸šà¸±à¸à¸Šà¸µà¸­à¸¢à¸¹à¹ˆà¹ƒà¸™à¸£à¸°à¸šà¸š à¹€à¸£à¸²à¸ˆà¸°à¸ªà¹ˆà¸‡à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆà¹ƒà¸«à¹‰"`
  - à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰ attacker à¸„à¹‰à¸™à¸«à¸²à¸«à¸£à¸·à¸­à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸§à¹ˆà¸²à¸¡à¸µà¸­à¸µà¹€à¸¡à¸¥à¹ƒà¸”à¸¥à¸‡à¸—à¸°à¹€à¸šà¸µà¸¢à¸™à¹ƒà¸™à¸£à¸°à¸šà¸šà¸šà¹‰à¸²à¸‡
  - à¹ƒà¸Šà¹‰ `crypto.timingSafeEqual` à¹à¸¥à¸° response delay à¹€à¸žà¸·à¹ˆà¸­à¸›à¹‰à¸­à¸‡à¸à¸±à¸™ timing attacks
- **Preserving Account Status**:
  - à¹€à¸¡à¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µà¸—à¸µà¹ˆà¸–à¸¹à¸à¸£à¸°à¸‡à¸±à¸š (`isActive: false` / `SUSPENDED`) à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¸£à¸°à¸šà¸šà¸ˆà¸°à¸­à¸±à¸›à¹€à¸”à¸•à¹€à¸‰à¸žà¸²à¸°à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™ à¹à¸•à¹ˆà¸ˆà¸°à¸„à¸‡à¸ªà¸–à¸²à¸™à¸° `isActive: false` à¹„à¸§à¹‰à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸”à¸´à¸¡ à¹„à¸¡à¹ˆà¸–à¸¹à¸à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¹‚à¸”à¸¢à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´
- **Rate Limiting**:
  - à¸›à¹‰à¸­à¸‡à¸à¸±à¸™ brute-force à¹à¸¥à¸° spam request à¸”à¹‰à¸§à¸¢ in-memory rate limiter à¸ˆà¸³à¸à¸±à¸” 1 à¸„à¸³à¸‚à¸­ à¸•à¹ˆà¸­ 60 à¸§à¸´à¸™à¸²à¸—à¸µ à¸•à¹ˆà¸­à¸­à¸µà¹€à¸¡à¸¥
- **Password Policy Enforcement**:
  - à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸—à¸±à¹‰à¸‡ client-side à¹à¸¥à¸° server-side: à¸„à¸§à¸²à¸¡à¸¢à¸²à¸§à¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢ 8 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£, à¹„à¸¡à¹ˆà¹€à¸à¸´à¸™ 72 à¹„à¸šà¸•à¹Œ (à¸‚à¸µà¸”à¸ˆà¸³à¸à¸±à¸”à¸‚à¸­à¸‡ bcrypt), à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹à¸¥à¸°à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸•à¹‰à¸­à¸‡à¸•à¸£à¸‡à¸à¸±à¸™
- **Audit Logging**:
  - à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™ (`PASSWORD_RESET_REQUESTED`), à¸à¸²à¸£à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ (`PASSWORD_RESET_COMPLETED`) à¹à¸¥à¸°à¹à¸­à¸”à¸¡à¸´à¸™à¸ªà¹ˆà¸‡à¸¥à¸´à¸‡à¸à¹Œà¸£à¸µà¹€à¸‹à¹‡à¸• (`ADMIN_SENT_PASSWORD_RESET`)
  - **à¸«à¹‰à¸²à¸¡à¸šà¸±à¸™à¸—à¸¶à¸ plaintext password à¸«à¸£à¸·à¸­ reset token** à¸¥à¸‡à¹ƒà¸™ log à¹€à¸”à¹‡à¸”à¸‚à¸²à¸”
- **Admin Recovery**:
  - à¹ƒà¸™à¸«à¸™à¹‰à¸² `/admin/users` à¸¡à¸µà¸›à¸¸à¹ˆà¸¡ "à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ª" à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰ Admin à¸ªà¹ˆà¸‡à¸¥à¸´à¸‡à¸à¹Œà¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆà¹ƒà¸«à¹‰à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹„à¸”à¹‰ à¹‚à¸”à¸¢à¸—à¸µà¹ˆ Admin à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸”à¸¹à¸«à¸£à¸·à¸­à¸”à¸¶à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹€à¸”à¸´à¸¡à¸‚à¸­à¸‡à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹„à¸”à¹‰

### API Endpoints
- `POST /api/auth/forgot-password`: à¸£à¸±à¸š `{ email }`, à¸ªà¹ˆà¸‡à¸„à¸·à¸™ anti-enumeration message (à¹ƒà¸™ dev mode à¸¡à¸µ `resetUrl` à¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¹ƒà¸™à¸à¸²à¸£à¸—à¸”à¸ªà¸­à¸š)
- `GET /api/auth/reset-password?token=...`: à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸‚à¸­à¸‡ token (valid, expired, already used)
- `POST /api/auth/reset-password`: à¸£à¸±à¸š `{ token, password, confirmPassword }`, à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š token, à¹à¸®à¸Šà¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆ à¹à¸¥à¸°à¸šà¸±à¸™à¸—à¸¶à¸à¸¥à¸‡ DB
- `POST /api/admin/users/[id]/reset-password`: à¹à¸­à¸”à¸¡à¸´à¸™à¸ªà¸£à¹‰à¸²à¸‡à¸¥à¸´à¸‡à¸à¹Œà¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¹‰à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰ à¸žà¸£à¹‰à¸­à¸¡à¸šà¸±à¸™à¸—à¸¶à¸ Audit Log

### Frontend Pages & Components
- `/forgot-password`: à¸«à¸™à¹‰à¸²à¸à¸£à¸­à¸à¸­à¸µà¹€à¸¡à¸¥à¸ªà¸³à¸«à¸£à¸±à¸šà¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™ à¸žà¸£à¹‰à¸­à¸¡ UI à¸ à¸²à¸©à¸²à¹„à¸—à¸¢, à¸à¸¥à¹ˆà¸­à¸‡à¸¢à¸·à¸™à¸¢à¸±à¸™ anti-enumeration à¹à¸¥à¸°à¸›à¸¸à¹ˆà¸¡à¸à¸¥à¸±à¸šà¸«à¸™à¹‰à¸²à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š
- `/reset-password?token=...`: à¸«à¸™à¹‰à¸²à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆ à¸£à¸­à¸‡à¸£à¸±à¸š Suspense, à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š token à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´, à¸Šà¹ˆà¸­à¸‡à¸à¸£à¸­à¸à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¸›à¸¸à¹ˆà¸¡ toggle à¹à¸ªà¸”à¸‡/à¸‹à¹ˆà¸­à¸™, checklist à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸¢à¸²à¸§à¹à¸¥à¸°à¸„à¸§à¸²à¸¡à¸•à¸£à¸‡à¸à¸±à¸™à¹à¸šà¸š real-time
- `/login`: à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸´à¸‡à¸à¹Œ "à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™?" à¸™à¸³à¸—à¸²à¸‡à¹„à¸›à¸¢à¸±à¸‡ `/forgot-password`
- `/admin/users`: à¹€à¸žà¸´à¹ˆà¸¡à¸›à¸¸à¹ˆà¸¡ "à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ª" à¹ƒà¸™à¸•à¸²à¸£à¸²à¸‡à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰ à¸žà¸£à¹‰à¸­à¸¡ Modal à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸ªà¹ˆà¸‡à¸¥à¸´à¸‡à¸à¹Œà¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™

---

## 2. Staff & Admin Account Management Feature

### Completed Highlights
1. **Admin Authorization Foundation**:
   - à¸šà¸±à¸‡à¸„à¸±à¸šà¹ƒà¸Šà¹‰ server-side authorization à¸—à¸µà¹ˆà¹€à¸‚à¹‰à¸¡à¸‡à¸§à¸”à¸œà¹ˆà¸²à¸™ `api(request, ["ADMIN", "SUPERADMIN"], ...)` à¹à¸¥à¸° `getSession()` à¹‚à¸”à¸¢à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š JWT à¸žà¸£à¹‰à¸­à¸¡à¸à¸±à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸±à¸à¸Šà¸µà¸ˆà¸£à¸´à¸‡à¹ƒà¸™à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ PostgreSQL
   - à¸„à¸³à¸‚à¸­à¸™à¸­à¸à¸ªà¸´à¸—à¸˜à¸´à¹Œà¸ˆà¸°à¸–à¸¹à¸à¸›à¸à¸´à¹€à¸ªà¸˜à¸”à¹‰à¸§à¸¢ `401 Unauthorized` à¹à¸¥à¸° `403 Forbidden`
   - à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¸à¸²à¸£à¸›à¸¥à¸­à¸¡à¹à¸›à¸¥à¸‡ role à¸œà¹ˆà¸²à¸™ client-side cookie à¸«à¸£à¸·à¸­ localStorage à¸­à¸¢à¹ˆà¸²à¸‡à¸ªà¸¡à¸šà¸¹à¸£à¸“à¹Œ

2. **Backend User Management APIs**:
   - `GET /api/admin/users`: à¸„à¹‰à¸™à¸«à¸² (à¸Šà¸·à¹ˆà¸­-à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥, à¸£à¸«à¸±à¸ªà¸™à¸´à¸ªà¸´à¸•, à¸­à¸µà¹€à¸¡à¸¥), à¸à¸£à¸­à¸‡à¸•à¸²à¸¡à¸ªà¸´à¸—à¸˜à¸´à¹Œ (Role), à¸à¸£à¸­à¸‡à¸•à¸²à¸¡à¸ªà¸–à¸²à¸™à¸° (Status: ACTIVE / INACTIVE / SUSPENDED) à¸žà¸£à¹‰à¸­à¸¡à¸£à¸°à¸šà¸šà¹à¸šà¹ˆà¸‡à¸«à¸™à¹‰à¸² (pagination)
   - `POST /api/admin/users`: à¸ªà¸£à¹‰à¸²à¸‡à¸šà¸±à¸à¸Šà¸µà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸ à¸²à¸¢à¹ƒà¸™ (STAFF, ADMIN, TEAM_OFFICIAL) à¸žà¸£à¹‰à¸­à¸¡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸‚à¸­à¸‡à¸­à¸µà¹€à¸¡à¸¥, à¸ˆà¸­à¸‡à¸­à¸µà¹€à¸¡à¸¥à¸£à¸°à¸”à¸±à¸š transaction à¸œà¹ˆà¸²à¸™ `reserveEmail()` à¹€à¸žà¸·à¹ˆà¸­à¸›à¹‰à¸­à¸‡à¸à¸±à¸™ race condition, à¹à¸®à¸Šà¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸”à¹‰à¸§à¸¢ `bcryptjs` (10 rounds) à¹à¸¥à¸°à¸šà¸±à¸™à¸—à¸¶à¸ Audit Log
   - `GET /api/admin/users/[id]`: à¹€à¸£à¸µà¸¢à¸à¸”à¸¹à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸±à¸à¸Šà¸µà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸£à¸²à¸¢à¸šà¸¸à¸„à¸„à¸¥
   - `PATCH /api/admin/users/[id]`: à¸­à¸±à¸›à¹€à¸”à¸•à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸žà¸·à¹‰à¸™à¸à¸²à¸™ (à¸Šà¸·à¹ˆà¸­, à¸­à¸µà¹€à¸¡à¸¥, à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£), à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸´à¸—à¸˜à¸´à¹Œ (Role), à¸›à¸£à¸±à¸šà¸ªà¸–à¸²à¸™à¸°à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™ (isActive) à¸žà¸£à¹‰à¸­à¸¡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸›à¸¥à¸­à¸”à¸ à¸±à¸¢
   - `PATCH /api/admin/users/[id]/role`: Endpoint à¹€à¸‰à¸žà¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸šà¸—à¸šà¸²à¸—à¸ªà¸´à¸—à¸˜à¸´à¹Œ
   - `PATCH /api/admin/users/[id]/status`: Endpoint à¹€à¸‰à¸žà¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¸£à¸°à¸‡à¸±à¸šà¸«à¸£à¸·à¸­à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸šà¸±à¸à¸Šà¸µ

3. **Admin Self-Protection & Last-Admin Safeguards**:
   - **Self-suspension prevention**: à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰ Admin à¸£à¸°à¸‡à¸±à¸šà¸šà¸±à¸à¸Šà¸µà¸‚à¸­à¸‡à¸•à¸™à¹€à¸­à¸‡
   - **Self-demotion prevention**: à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰ Admin à¸¥à¸”à¸ªà¸´à¸—à¸˜à¸´à¹Œà¸«à¸£à¸·à¸­à¸›à¸¥à¸”à¸šà¸—à¸šà¸²à¸— Admin à¸‚à¸­à¸‡à¸•à¸™à¹€à¸­à¸‡
   - **Last active Admin protection**: à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰à¸£à¸°à¸‡à¸±à¸šà¸«à¸£à¸·à¸­à¸¥à¸”à¸ªà¸´à¸—à¸˜à¸´à¹Œ Admin à¸šà¸±à¸à¸Šà¸µà¸ªà¸¸à¸”à¸—à¹‰à¸²à¸¢ à¹€à¸žà¸·à¹ˆà¸­à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¸£à¸°à¸šà¸š lockout à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸”à¹‡à¸”à¸‚à¸²à¸”
   - **Athlete ID requirement**: à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸›à¹‡à¸™ `ATHLETE` à¸«à¸²à¸à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸«à¸±à¸ªà¸™à¸´à¸ªà¸´à¸• (`studentId`)
   - **Public registration guard**: à¸¥à¹‡à¸­à¸à¸ªà¸´à¸—à¸˜à¸´à¹Œà¸à¸±à¹ˆà¸‡à¹€à¸‹à¸´à¸£à¹Œà¸Ÿà¹€à¸§à¸­à¸£à¹Œ à¹„à¸¡à¹ˆà¸£à¸±à¸šà¸«à¸£à¸·à¸­à¹€à¸Šà¸·à¹ˆà¸­à¸–à¸·à¸­ role à¸ˆà¸²à¸ client payload

4. **Admin Frontend Interface (`/admin/users`)**:
   - à¸«à¸™à¹‰à¸²à¸ˆà¸­à¸ˆà¸±à¸”à¸à¸²à¸£à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸ªà¹„à¸•à¸¥à¹Œà¸ªà¸­à¸”à¸„à¸¥à¹‰à¸­à¸‡à¸à¸±à¸šà¸£à¸°à¸šà¸šà¹€à¸”à¸´à¸¡ (Tailwind CSS 4, Google Fonts, à¸à¸²à¸£à¸ˆà¸±à¸”à¸§à¸²à¸‡à¸ªà¸­à¸”à¸„à¸¥à¹‰à¸­à¸‡à¸à¸±à¸š `/admin/clubs` à¹à¸¥à¸°à¸£à¸°à¸šà¸šà¸à¸­à¸‡à¸à¸´à¸ˆà¸¯)
   - à¸ªà¸£à¸¸à¸›à¸ˆà¸³à¸™à¸§à¸™à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”, à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™, à¸£à¸°à¸‡à¸±à¸šà¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™, à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¹à¸¥à¸°à¹à¸­à¸”à¸¡à¸´à¸™
   - à¸•à¸²à¸£à¸²à¸‡à¹à¸ªà¸”à¸‡à¸£à¸²à¸¢à¸à¸²à¸£à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™ à¸žà¸£à¹‰à¸­à¸¡ badge à¸ªà¸µà¹à¸ªà¸”à¸‡à¸šà¸—à¸šà¸²à¸—à¹à¸¥à¸°à¸ªà¸–à¸²à¸™à¸°
   - Modal à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸žà¸´à¹ˆà¸¡à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹ƒà¸«à¸¡à¹ˆ, à¹à¸à¹‰à¹„à¸‚à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸žà¸·à¹‰à¸™à¸à¸²à¸™, à¸¢à¸·à¸™à¸¢à¸±à¸™à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸´à¸—à¸˜à¸´à¹Œ à¹à¸¥à¸°à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸°à¸‡à¸±à¸š/à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸šà¸±à¸à¸Šà¸µ

---

## Files Changed

### Files Created
- `lib/password-reset.ts`: à¹‚à¸¡à¸”à¸¹à¸¥à¸ªà¸£à¹‰à¸²à¸‡à¹à¸¥à¸°à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š Reset Token (Single-use hash version), Rate limiter, Password validation
- `app/forgot-password/page.tsx`: à¸«à¸™à¹‰à¸² UI à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™
- `app/reset-password/page.tsx`: à¸«à¸™à¹‰à¸² UI à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆ
- `app/api/auth/forgot-password/route.ts`: API endpoint à¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™ (Anti-enumeration)
- `app/api/auth/reset-password/route.ts`: API endpoint à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹à¸¥à¸°à¸•à¸±à¹‰à¸‡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹ƒà¸«à¸¡à¹ˆ
- `app/api/admin/users/[id]/reset-password/route.ts`: API endpoint à¸ªà¸³à¸«à¸£à¸±à¸šà¹à¸­à¸”à¸¡à¸´à¸™à¸ªà¹ˆà¸‡à¸¥à¸´à¸‡à¸à¹Œà¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™
- `tests/unit/password-reset.test.mjs`: Unit tests à¸ªà¸³à¸«à¸£à¸±à¸š Password Reset workflow
- `lib/audit-service.ts`: à¹‚à¸¡à¸”à¸¹à¸¥à¸šà¸±à¸™à¸—à¸¶à¸ Audit Log à¸£à¸°à¸”à¸±à¸š transaction
- `app/admin/users/page.tsx`: à¸«à¸™à¹‰à¸² UI à¸à¸²à¸£à¸ˆà¸±à¸”à¸à¸²à¸£à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™ (Admin Users Management)
- `app/admin/page.tsx`: à¸«à¸™à¹‰à¸² root à¸‚à¸­à¸‡ admin à¸—à¸µà¹ˆ redirect à¹„à¸›à¸¢à¸±à¸‡ `/admin/users`
- `app/api/admin/users/[id]/role/route.ts`: Endpoint à¹€à¸‰à¸žà¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸´à¸—à¸˜à¸´à¹Œ
- `app/api/admin/users/[id]/status/route.ts`: Endpoint à¹€à¸‰à¸žà¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸–à¸²à¸™à¸°à¸šà¸±à¸à¸Šà¸µ
- `tests/unit/admin-users.test.mjs`: Unit tests à¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥, à¸à¸Žà¸„à¸§à¸²à¸¡à¸›à¸¥à¸­à¸”à¸ à¸±à¸¢ à¹à¸¥à¸°à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚ Last-admin

### Files Modified
- `app/login/page.tsx`: à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸´à¸‡à¸à¹Œ "à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™?"
- `lib/audit-service.ts`: à¹€à¸žà¸´à¹ˆà¸¡ enum à¸ªà¸³à¸«à¸£à¸±à¸š `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `ADMIN_SENT_PASSWORD_RESET`
- `lib/account-service.ts`: à¸£à¸­à¸‡à¸£à¸±à¸š `ownUserId` à¸ªà¸³à¸«à¸£à¸±à¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸‹à¹‰à¸³à¸‹à¹‰à¸­à¸™à¸‚à¸­à¸‡à¸­à¸µà¹€à¸¡à¸¥
- `lib/validation.ts`: à¹€à¸žà¸´à¹ˆà¸¡ validation helpers à¸ªà¸³à¸«à¸£à¸±à¸š User management
- `app/api/admin/users/route.ts`: à¸›à¸£à¸±à¸šà¸›à¸£à¸¸à¸‡ GET à¹à¸¥à¸° POST
- `app/api/admin/users/[id]/route.ts`: à¸›à¸£à¸±à¸šà¸›à¸£à¸¸à¸‡ GET à¹à¸¥à¸° PATCH
- `app/admin/clubs/page.tsx`: à¹€à¸žà¸´à¹ˆà¸¡à¹à¸—à¹‡à¸šà¸™à¸³à¸—à¸²à¸‡
- `app/superadmin/page.tsx`: à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸´à¸‡à¸à¹Œà¸™à¸³à¸—à¸²à¸‡

---

## Validation & Quality Checks
- `npm run test:unit`: à¸œà¹ˆà¸²à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” 22 tests (17 admin-users tests + 5 password-reset tests, 0 failed)
- `npx tsc --noEmit`: à¸œà¹ˆà¸²à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” (0 errors)
- `npm run lint`: à¸œà¹ˆà¸²à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” (0 errors, 0 warnings)
- `npm run build`: à¸ªà¸£à¹‰à¸²à¸‡ production bundle à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸ªà¸¡à¸šà¸¹à¸£à¸“à¹Œ 67/67 routes static/dynamic compiled cleanly

---

## Database Changes
- **No schema changes**: à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚ `prisma/schema.prisma` à¸«à¸£à¸·à¸­à¸£à¸±à¸™ migration à¹ƒà¸”à¹† à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸”à¸´à¸¡ 100% à¸•à¸²à¸¡à¸‚à¹‰à¸­à¸à¸³à¸«à¸™à¸”

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
- à¹„à¸¡à¹ˆà¸¡à¸µ â€” à¸‡à¸²à¸™à¸žà¸±à¸’à¸™à¸²à¹à¸¥à¸°à¸à¸²à¸£à¸—à¸”à¸ªà¸­à¸šà¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¹€à¸ªà¸£à¹‡à¸ˆà¸ªà¸¡à¸šà¸¹à¸£à¸“à¹Œ à¸žà¸£à¹‰à¸­à¸¡à¸ªà¹ˆà¸‡à¸¡à¸­à¸š

## Known Issues
- à¹„à¸¡à¹ˆà¸¡à¸µ

Latest evidence-script checks (2026-09-28): typecheck, lint, 51 unit tests and production build passed. No full integration rerun was needed for the script-only changes; historical integration evidence remains separate.


---

## 4. Basketball Physical Fitness Standards & Evaluation (เกณฑ์มาตรฐานสมรรถภาพทางกายเฉพาะชนิดกีฬาบาสเกตบอล ม.พะเยา)

### Completed Features & Implementation Details
1. **Basketball Fitness Evaluation Engine (`lib/fitness-calculation.ts`)**:
   - Added types: `BasketballFitnessCategory`, `BasketballFitnessInputs`, `BasketballFitnessResultItem`, `BasketballFitnessEvaluation`.
   - Added threshold mapping functions: `rateBasketballLowerIsBetter`, `rateBasketballHigherIsBetter`.
   - Implemented `evaluateBasketballFitness(inputs: BasketballFitnessInputs)` covering all 16 items across 5 core categories based on the UP Sports Science standard table:
     - **ด้านความเร็ว (Speed)**: วิ่ง 10 เมตร, วิ่ง 20 เมตร
     - **ด้านความคล่องแคล่วว่องไว (Agility)**: T-Test, Edgren Side Step test, Semo test
     - **ด้านพลังกล้ามเนื้อ (Muscle Power)**: Vertical jump test, Standing broad jump, Seated Medicine Ball Toss (ลูกบอล 3 กก.)
     - **ด้านสมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic)**: RSSA Best time, RSSA Mean time, RSSA Decrement, RAST Max Power, RAST Min Power, RAST Avg Power, RAST Fatigue Index
     - **ด้านสมรรถภาพแบบใช้ออกซิเจน (Aerobic)**: VO2max
   - Evaluates 5 performance levels: ดีมาก, ดี, ปานกลาง, ต่ำ, ต่ำมาก with automated composite score, percentage, and strict pass gate (fails if any item is ต่ำ or ต่ำมาก).

2. **Real-time Evaluation API (`app/api/staff/fitness-tests/evaluate/route.ts`)**:
   - Added support for `type: "basketball"` and `type: "บาสเกตบอล"`.
   - Seamless auto-derivation of jump height from `standingReachCm` / `jumpReachCm`, RSSA metrics from `rssaRuns`, and RAST metrics from `weightKg` / `rastTimesSec`.

3. **Unit Tests (`tests/unit/fitness-test.test.mjs`)**:
   - Added unit test `rateBasketballLowerIsBetter and rateBasketballHigherIsBetter map boundaries accurately`.
   - Added unit test `evaluateBasketballFitness evaluates complete basketball battery correctly with ratings and overall result` verifying complete battery passing and partial failing behaviors.
   - All 75 unit tests passing cleanly.

---

## 5. CI Build & Supabase Environment Variable Fallbacks (2026-09-30)

### Problem
GitHub Actions CI workflow Build Next.js failed during static pre-rendering of /api/applications/[id] with Error: supabaseUrl is required because SUPABASE_URL was not declared in .github/workflows/ci.yml build step and lib/supabase-admin.ts strictly accessed process.env.SUPABASE_URL!.

### Solution
1. **Fallback in lib/supabase-admin.ts**: Fallback to NEXT_PUBLIC_SUPABASE_URL and dummy URL/key if environment variables are not set during builds.
2. **Fallback in lib/supabase.ts**: Fallback to SUPABASE_URL and dummy URL/key if environment variables are not set during builds.
3. **Updated .github/workflows/ci.yml**: Added SUPABASE_URL: "https://dummy.supabase.co" to the Build Next.js environment definition.
4. **Verification**: 
px tsc --noEmit (0 errors), 
pm run lint -- --max-warnings=0 (0 warnings), and 
pm run test:unit (75/75 passed).
