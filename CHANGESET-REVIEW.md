# Changeset Review & Release Staging Plan (T07)
**ระบบ:** ระบบบริหารจัดการการแข่งขันกีฬา มหาวิทยาลัยพะเยา (University Sports Competition Management System)<br>
**วันที่ตรวจสอบ:** 2026-09-28<br>
**สถานะ:** ✅ **AUDITED & READY FOR RELEASE COMMIT**

---

## 1. วัตถุประสงค์และการประเมิน (Overview)
รายงานนี้จัดทำขึ้นเพื่อตรวจสอบ จัดกลุ่ม และเตรียม Staging สำหรับ Release Commit ตามแนวทางใน `AGENTS.md`, `TODO-CODEX.md` (T07), และ `docs/RELEASE_RUNBOOK.md` โดยครอบคลุมการตรวจสอบความปลอดภัย การตัด Role ที่ไม่ใช้งาน (`SUPERADMIN`, `DEV`), การแก้ไขช่องโหว่ความปลอดภัยระดับสูง (CLUB scope data leakage, CSV formula injection), การจัดระเบียบ Storage bucket สู่ Private, และการจัดทำเอกสารหลักฐานผลการทดสอบอิสระ

---

## 2. การจำแนกรายการไฟล์ (File Categorization)

### 2.1 ไฟล์ที่นำเข้า Commit (Files to Commit)

#### ก. โครงสร้างฐานข้อมูลและการย้ายข้อมูล (Database & Migrations)
- `prisma/schema.prisma`: ตัด enum `SUPERADMIN`, เพิ่ม `User.clubId` nullable relation, เพิ่ม unique index สำหรับ `SportQuota` `(competitionId, sport)`
- `prisma/migrations/20260926010000_release_roles_quota/migration.sql`: สคริปต์ migration แปลงบทบาท SUPERADMIN สู่ ADMIN และปรับ schema

#### ข. ความปลอดภัย นโยบายสิทธิ์ และไลบรารีระบบ (Core Security & Services)
- `lib/application-query.ts`: กำหนด scope ใบสมัคร โดยตัด `{ rosterItem: null }` ออกสำหรับ `CLUB` ทำให้เห็นเฉพาะใบสมัครของชมรมตนเองเท่านั้น
- `lib/document-service.ts`: บังคับความปลอดภัยการอ่านเอกสาร `canReadDocument()` สำหรับ `CLUB` ต้องมี roster ในชมรมเท่านั้น
- `lib/export-helpers.ts`: ป้องกัน CSV formula injection (OWASP single-quote prefix) สำหรับ client-side export
- `lib/account-service.ts`: การจัดการบัญชีผู้ใช้, self-protection, last-admin protection, และ audit log แบบ atomic
- `lib/athlete-document-policy.ts`: นโยบายเอกสารนักกีฬาและการตรวจสอบการครอบครองเอกสาร
- `lib/athlete-profile-types.ts`: TypeScript types สำหรับข้อมูลโปรไฟล์นักกีฬา
- `lib/audit-service.ts`: บริการบันทึกเหตุการณ์ความปลอดภัย (Audit Log)
- `lib/auth.ts`: ตรวจสอบสถานะบัญชี, จัดการ token และ role verification
- `lib/password-reset.ts`: ตรรกะโทเคนรีเซ็ตรหัสผ่าน 15 นาที, single-use token, rate limit 60s
- `lib/password-reset-delivery.ts`: บริการส่งอีเมลรีเซ็ตรหัสผ่านแบบ secure
- `lib/validation.ts`: ตรวจสอบ payload ข้อมูลฝั่งเซิร์ฟเวอร์แบบเข้มงวด
- `lib/phase4-client.ts`, `lib/phase4-policy.ts`, `lib/phase4-server.ts`, `lib/snapshot-store.ts`, `lib/analytics-server.ts`, `lib/analytics.ts`: บริการประมวลผลสถิติ, snapshot, และ client state

#### ค. API Routes
- `app/api/admin/users/`: CRUD ผู้ใช้งาน, การเปลี่ยนบทบาท, ระงับ/เปิดใช้งานบัญชี, และ admin password reset
- `app/api/applications/`: การส่งใบสมัครแบบ serializable transaction, ตรวจสอบสิทธิ์ดูรายละเอียด, และดาวน์โหลดเอกสารผ่าน signed URL
- `app/api/auth/`: การเข้าสู่ระบบ, ลงทะเบียน, ลืมรหัสผ่าน, รีเซ็ตรหัสผ่าน (ตัด `dev-login`)
- `app/api/documents/`: อัปโหลดเอกสารส่วนตัวสู่ private bucket และสร้าง temporary signed URL 60 วินาที
- `app/api/export/applications/route.ts`: API สำหรับ export CSV พร้อม UTF-8 BOM และ formula injection guard
- `app/api/staff/`: การอนุมัติใบสมัครโดยตรง, การประกาศผล (publish), สถิติ, และการตั้งค่า
- `app/api/competitions/`: การจัดการการแข่งขันโดย ADMIN เท่านั้น
- `proxy.ts`: Middleware ตรวจสอบเส้นทาง, ตัดสิทธิ์ dev/superadmin และบังคับ 403 Forbidden

#### ง. หน้าจอผู้ใช้งาน (UI Pages & Components)
- `app/admin/`: หน้าจัดการการแข่งขัน, หน้าจัดการผู้ใช้งาน, หน้าจัดการชมรม
- `app/athlete/`: หน้าลงทะเบียนนักกีฬา, หน้าติดตามสถานะ (แสดงผล "เจ้าหน้าที่พิจารณาโดยตรง" อย่างถูกต้อง)
- `app/forgot-password/` & `app/reset-password/`: หน้าขอลืมรหัสผ่านและตั้งรหัสผ่านใหม่
- `app/staff/`: หน้าพิจารณาใบสมัคร, ค้นหา, หน้ารายละเอียดผู้สมัคร, หน้าประกาศผล, หน้าสถิติ
- `components/shared/CompetitionManagement.tsx`: คอมโพเนนต์จัดการการแข่งขันสำหรับ ADMIN
- `components/shared/StaffReview.tsx`: คอมโพเนนต์พิจารณาและส่งออก XLSX ครบ 12 คอลัมน์ภาษาไทย
- `components/shared/LogoutButton.tsx`: คอมโพเนนต์ออกจากระบบ
- `app/layout.tsx`: ภาษาไทย `lang="th"` และชื่อระบบทางการ

#### จ. สคริปต์ตรวจสอบและเครื่องมือ Release (Scripts & Automation)
- `scripts/release-preflight.mjs`: ตรวจสอบความพร้อมของฐานข้อมูลก่อน cutover (0 duplicate quota, active admins)
- `scripts/setup-private-storage.mjs`: ตั้งค่า bucket `athlete-private` และแปลง `athlete-docs` เป็น private
- `scripts/record-cutover-evidence.mjs`: ทดสอบและบันทึกหลักฐาน storage cutover และ real legacy file access
- `scripts/verify-xlsx-workbook.mjs`: สร้างและตรวจสอบความถูกต้องของ workbook XLSX จริง (12 คอลัมน์ภาษาไทย)
- `scripts/regression-ui-fixtures.mjs`: เตรียม fixture สำหรับทดสอบ UI regression

#### ฉ. ชุดการทดสอบ (Test Suites & Configs)
- `tests/unit/`: ชุดทดสอบยูนิต 50 รายการ (`release.test.mjs`, `admin-users.test.mjs`, `athlete-status.test.mjs`, `password-reset.test.mjs`, `password-reset-delivery.test.mjs`)
- `tests/integration/`: ชุดทดสอบบูรณาการ 39 รายการ (`release-core.test.mjs`, `account-smoke.test.mjs`, `competition-status-gate.test.mjs`, `phase4.test.mjs`, `phase5.test.mjs`)
- `tests/helpers/` & `tests/e2e/`: เครื่องมือช่วยทดสอบและ E2E test scripts
- `playwright.config.ts`: การตั้งค่า Playwright สำหรับ E2E

#### ช. เอกสารโครงการ (Documentation)
- `docs/HANDOFF.md`: รายละเอียดการส่งมอบงาน, ผลการตรวจสอบ และการแก้ไขช่องโหว่ความปลอดภัย
- `docs/NEXT_TASK.md`: รายการงานและข้อกำหนดระบบ
- `docs/RELEASE_RUNBOOK.md`: คู่มือและขั้นตอนการ Release ระบบ
- `AGENTS.md`: ข้อกำหนดและแนวทางการพัฒนาระบบ
- `README.md`: คำอธิบายโครงการ, การติดตั้ง และคำแนะนำ CI
- `TEST-REPORT.md`: บันทึกผลการทดสอบตามลำดับ
- `PROJECT_CONTEXT.md`: สรุปบริบทสถาปัตยกรรมและโครงสร้างสำหรับรับงานต่อ
- `TODO-CODEX.md`: บันทึกสถานะงาน T01–T07

#### ซ. หลักฐานผลการตรวจสอบ (Test Results & Evidence Artifacts)
- `test-results/cutover-evidence.json`: หลักฐาน Preflight, Prisma Migrate Status, Bucket Privacy, และ Legacy File Live Tests
- `test-results/full-integration-suite.json`: หลักฐานผลการรัน Integration Tests 39/39 รายการ
- `test-results/xlsx-verification.json`: หลักฐานการตรวจสอบไฟล์ XLSX 12 คอลัมน์ภาษาไทย
- `test-results/staff-export-actual.xlsx`: ไฟล์ทดสอบจริงที่ผ่านการวิเคราะห์ไบนารี
- `test-results/*-integration.json`: รายงานผลทดสอบแยกแต่ละ suite (account-smoke, competition-status-gate, phase4, phase5, release-core)
- `test-results/browser-*`: ภาพหลักฐานและ fixture การทดสอบเบราว์เซอร์

---

### 2.2 ไฟล์ที่คัดออกและไม่นำเข้า Commit (Excluded / Ignored Files)

| ไฟล์ / ไดเรกทอรี | เหตุผลที่ไม่ commit | การจัดการ |
|---|---|---|
| `.env`, `.env.local`, `.env.release-test` | มี Credentials, Database URL และ Secrets จริง | ละเว้นโดย `.gitignore` (`.env*`) |
| `/tmp/` | ไฟล์ PDF ชั่วคราวจากการรันเทสต์ในอดีต | ละเว้นโดย `.gitignore` (`/tmp/`) |
| `/playwright-results/` | Artifact ชั่วคราวจากการรัน E2E browser | ละเว้นโดย `.gitignore` (`/playwright-results/`) |
| `lint-results.json`, `lint-text.txt`, `lint.json` | Log ชั่วคราวจากการรัน ESLint ก่อนหน้า | ละเว้นโดย `.gitignore` (`lint*.json`, `lint*.txt`) |
| `.next/`, `*.tsbuildinfo`, `next-env.d.ts` | Build artifacts และแคชคอมไพเลอร์ | ละเว้นโดย `.gitignore` |

---

## 3. ผลการตรวจสอบคุณภาพและความปลอดภัย (Quality & Security Audit)

### 3.1 การตรวจสอบข้อมูลลับ (Secrets & Credentials Audit)
- ตรวจสอบด้วย Regex Pattern ครอบคลุม Connection String, JWT Token, API Key: **ไม่พบ Credentials หรือ Connection String รั่วไหลใน Source Code, Scripts, หรือ JSON Artifacts** (Database URL ใน `cutover-evidence.json` ได้รับการ sanitize เป็น `postgresql://***:***@...`)
- `.env` และ `.env.release-test` มีสถานะ Ignored อย่างสมบูรณ์ ไม่ปรากฏใน git index หรือ status

### 3.2 ผลการทดสอบทางเทคนิค (Technical Verification Results)
| การทดสอบ | ผลการตรวจสอบ | หมายเหตุ |
|---|---|---|
| **TypeScript** (`npx tsc --noEmit`) | ✅ **PASS** | Exit code 0, 0 errors |
| **ESLint** (`npm run lint`) | ✅ **PASS** | Exit code 0, 0 errors, 0 warnings |
| **Unit Tests** (`npm run test:unit`) | ✅ **PASS** (50/50) | ผ่านครบ 50 การทดสอบ (มี non-blocking Node typeless package warning) |
| **Production Build** (`npm run build`) | ✅ **PASS** | คอมไพล์สำเร็จครบ 65 routes |
| **Integration Suite** (`npm run test:integration`) | ✅ **PASS** (39/39) | ผ่านครบ 39 การทดสอบบน isolated test environment (106.6s) |
| **Git Diff Check** (`git diff --check`) | ✅ **PASS** | ไม่มี whitespace errors หรือ merge conflict markers |

---

## 4. แผนการจัดชุด Commit (Commit Strategy)

นำเสนอเป็น Release Commit แบบครบวงจร (Unified Release Commit):

```text
feat(release): University sports registration system production release

- Fix CLUB scope data leakage in application queries, detail route, and document reads
- Fix CSV formula injection via OWASP single-quote prefix and add UTF-8 BOM
- Align XLSX export to 12 Thai header columns matching CSV field order
- Enforce private Supabase storage for athlete-private and legacy athlete-docs buckets
- Remove legacy SUPERADMIN and DEV roles/routes; enforce ADMIN as system authority
- Add password reset with single-use expirable tokens and anti-enumeration
- Add user management with self and last-admin protection
- Verify integration suite (39/39) and unit regression tests (50/50)
- Add verification evidence artifacts, runbooks, and handoff documentation
```
