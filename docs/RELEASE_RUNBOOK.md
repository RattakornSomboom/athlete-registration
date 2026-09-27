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
