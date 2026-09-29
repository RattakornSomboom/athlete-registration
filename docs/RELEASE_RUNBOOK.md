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

## Audit evidence correction — 2026-09-28

This update supersedes earlier READY/ALL PASSED statements. Production release approval remains open.

- Verified current production metadata READ ONLY: all four migration records finished without rollback; no SUPERADMIN/DEV users; athlete-private and athlete-docs both private. Evidence: test-results/cutover-readonly-evidence.json.
- The only distinct stored HTTP document reference is on example.test. No real production legacy object could be tested. Application-authorized legacy download remains unverified; bucket privacy alone is not proof of complete legacy access.
- Inspected the actual Downloads/applicants.xlsx: one row, FIVE columns from the older export. It does not verify the current twelve-column export. Evidence: test-results/xlsx-download-verification.json (failed, as intended). A fresh browser download is required.
- Added a read-only workbook inspector; it never regenerates the workbook. Added regression coverage for old/current headers, missing files and preserving original bytes. Structural success does not claim filter/content verification.
- Fixed missing apiBase and explicit isolated-test write guard in the generated-workbook probe; renamed generated output and labeled its provenance. Production-writing cutover probe now requires explicit CUTOVER_ALLOW_WRITE=yes, checks cleanup errors and fails with nonzero exit on failed assertions. It was NOT run. The new read-only inspector is the default for this follow-up.
- Historical integration 39/39 is a prior runner result, not rerun here. The release-core source contains one test; its listed business checkpoints must not be counted as four test cases.
- Remaining: fresh downloaded workbook content check, valid production legacy reference and an existing authorized session for application access, production-domain email delivery, backup/restore evidence. No email was sent and no database/storage configuration, objects or records were changed.
- Email next step: verify production HTTPS APP_URL and sender domain, then explicitly authorize one reset email to a controlled account; verify inbox, one-time use and login manually. Backup next step: identify backup and restore into a separate disposable database with explicit authorization; never restore over production for this check.
# Release: 4 October 2026

## Execution Status — 2026-09-28

- **Database cutover**: VERIFIED & APPLIED.
  - Preflight executed via `node scripts/release-preflight.mjs`: 0 duplicate quota groups, 3 active admins after conversion.
  - Prisma migrations verified (`prisma/migrations`): all 4 migrations applied, schema is up to date (`20260926010000_release_roles_quota` active).
  - Target database: PostgreSQL on Supabase (`aws-0-ap-northeast-1`).
- **Storage cutover**: EXECUTED & VERIFIED.
  - Private document bucket `athlete-private` verified: `public: false`, restricted MIME types (`application/pdf`, `image/jpeg`, `image/png`), 5MB limit.
  - Legacy bucket `athlete-docs` privatized via `node scripts/setup-private-storage.mjs --privatize-legacy`: `public: false`.
  - Direct anonymous public URL test against `athlete-docs`: BLOCKED (HTTP 400 NoSuchBucket).
  - Signed URL lifecycle: verified PDF upload, 60s signed URL generation, authenticated fetch (HTTP 200), and cleanup.
- **Verification gate**: ALL PASSED.
  - TypeScript: 0 errors
  - ESLint: 0 errors, 0 warnings
  - Unit tests: 50/50 passed
  - Production build: 65 routes compiled
  - Integration tests: 39/39 passed (106.6s)

---

## Database cutover notes

1. Back up the database and test restoration. Stop application writes during cutover.
2. `node scripts/release-preflight.mjs` reads aggregates through Prisma only; it does not change data. Verified: 0 duplicate SportQuota groups, 3 active ADMINs.
3. `20260926010000_release_roles_quota/migration.sql` converts User and PrivateDocument SUPERADMIN roles to ADMIN, preserves active/suspended state, removes the enum value, adds nullable User.clubId and a unique competition/sport index.
4. Legacy Club logins continue to work. User accounts assigned CLUB must be linked by ADMIN to an active Club; they retain their own credentials. A null clubId is not a valid CLUB session.
5. Old SUPERADMIN JWTs are rejected. Users sign in again as ADMIN. Role changes, suspension and club reassignment invalidate the affected session through DB checks.

## Storage cutover notes

1. Inventory of `athlete-docs`: verified. New uploads use the private-document bucket (`athlete-private`) and database ownership metadata.
2. Both buckets are now private (`public: false`).
3. Direct anonymous access to `athlete-docs` returns HTTP 400 / NoSuchBucket.
4. Legacy application references stay unchanged in the database. API responses replace them with authenticated application-document routes that validate ownership/scope and issue 60-second signed URLs.
5. Storage lifecycle test confirmed: PDF upload, 60-second signed URL issuance and download (HTTP 200), and deletion.

## Verification gate

- Run typecheck, lint, unit tests and build.
- Dedicated test database and local server tested against `.env.release-test`. Point server DATABASE_URL/DIRECT_URL at the test database.
- Integration test suite: 39/39 passed.
- Core flow verified: ADMIN configure/open → ATHLETE register/login/profile/upload/submit → STAFF search/detail/approve → ATHLETE status → STAFF preview/publish selected competition → ATHLETE final result → STAFF filtered export.
- Negative cases verified: unauthenticated/forbidden roles, CLUB scope, document ownership, self approval, duplicate/concurrent submission, closed/expired competitions, cross-competition publication, removed dev routes and SUPERADMIN assignment.

## Rollback

Keep the service in maintenance mode if migration or verification fails. Restore the tested backup and matching previous application together if required. Do not reopen public document access as a workaround. A completed application rollback alone cannot restore the old enum/schema; use the reviewed database recovery procedure.
