# รายงานการตรวจสอบขั้นสุดท้ายก่อน Release (Final Release Verification Report)
**ระบบบริหารจัดการการแข่งขันกีฬา มหาวิทยาลัยพะเยา (University Sports Competition Management System)**  
**วันที่ตรวจสอบ:** 28 กันยายน 2569 (2026-09-28)  
**Run ID:** `run-20260928-191300`  
**เป้าหมายการส่งมอบ:** Release ก่อนวันที่ 4 ตุลาคม 2569  

---

## 1. Verdict (ผลการตัดสินขั้นสุดท้าย)

> [!IMPORTANT]
> **สถานะโดยรวม:** **LOCAL/TEST VERIFIED (ผ่านการทดสอบสมบูรณ์บนสภาพแวดล้อม Isolated Test)**  
> **Production Status:** **BLOCKED / PENDING EXPLICIT AUTHORIZATION**  
> (ยังไม่รับรองความพร้อมระดับ Production เนื่องจากรอคำสั่งอนุมัติอย่างเป็นทางการในการรัน Migration บน Production DB, การจัดเตรียม Empty DB สำหรับ Backup/Restore, และการ Deploy)

- **Local & Test Verification:** ผ่าน 100% ครบทุกเกณฑ์คุณภาพ (TypeScript, ESLint, 51 Unit tests, Production Next.js Turbopack build 62 routes, และ Full Integration 6 ไฟล์ 38 tests ผ่านรวดเดียว 0 fail/skip)
- **Core Flow & Recovery:** ตรวจสอบผ่านทั้งระบบ Browser E2E, Automated Integration และการยืนยันของผู้ใช้งานในหน้าจัดการชมรม
- **Production Cutover Gates:** ยังคงเปิดอยู่ (Open Gates) ตามกฎความปลอดภัย โดยห้ามรันคำสั่ง Migration หรือ Deploy บน Production จนกว่าจะได้รับคำสั่งอนุญาตเป็นลายลักษณ์อักษร

---

## 2. Snapshot ที่ตรวจ (Verification Snapshot)

- **Git HEAD:** `2ef35d309bfd97ee6d48ef803876721fdc7d6d20`
- **วันเวลาที่ตรวจสอบ:** 28 กันยายน 2569 เวลา 19:13:00 - 20:13:00 (Asia/Bangkok, UTC+7)
- **สภาพแวดล้อม (Environment Label):** `release-test`
- **ฐานข้อมูลทดสอบ (Test Database):** PostgreSQL บน Supabase (`aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`) ซึ่งแยกอิสระจาก Production (`aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`)
- **ระบบจัดเก็บไฟล์ (Test Storage):** Supabase Storage (`athlete-private` และ `athlete-docs` ตั้งค่า `public: false`)
- **เซิร์ฟเวอร์ทดสอบ:** Next.js Production Build รันอยู่ที่ `http://localhost:3138` (PID 36824) เชื่อมต่อตรงกับ `.env.release-test`
- **Node.js / npm:** Node.js `v25.9.0` / npm `11.12.1`
- **Build Identifier:** `next-build-turbopack-62routes`
- **Working Tree Hashes & Manifest:** บันทึก SHA-256 ของซอร์สโค้ด, Schema, Tests และ Config รวม 48 ไฟล์ไว้ใน [`test-results/release-final/run-20260928-191300/manifest.json`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/manifest.json)

---

## 3. Changes (รายการไฟล์ที่แก้ไขและผลกระทบ)

การแก้ไขที่เกี่ยวข้องกับ Release นี้เป็นการปรับปรุงตามข้อกำหนดความปลอดภัยและการยกเลิกระบบ Email Recovery เดิมเพื่อเปลี่ยนมาใช้ ADMIN Temporary Password Recovery โดยรักษา uncommitted changes เดิมไว้ครบถ้วน:

1. **ระบบกู้คืนรหัสผ่านโดย ADMIN (ADMIN-only Temporary Password Recovery):**
   - **เพิ่ม:** [`lib/admin-password-reset.ts`](file:///d:/BBN/athlete-registration/lib/admin-password-reset.ts), [`app/api/admin/users/[id]/reset-password/route.ts`](file:///d:/BBN/athlete-registration/app/api/admin/users/[id]/reset-password/route.ts), [`app/api/admin/clubs/[id]/reset-password/route.ts`](file:///d:/BBN/athlete-registration/app/api/admin/clubs/[id]/reset-password/route.ts), [`components/shared/AdminPasswordReset.tsx`](file:///d:/BBN/athlete-registration/components/shared/AdminPasswordReset.tsx), [`app/change-password/page.tsx`](file:///d:/BBN/athlete-registration/app/change-password/page.tsx)
   - **นำออก (Superseded):** ถอดถอนระบบ Email reset เดิมอย่างถาวร (`app/api/auth/forgot-password`, `app/api/auth/reset-password`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `lib/password-reset.ts`, `lib/password-reset-delivery.ts`)
   - **ผลกระทบ:** ป้องกันปัญหาการพึ่งพา external email service, ADMIN ต้องยืนยันตัวตนผู้ขอก่อนออกรหัสชั่วคราวแบบสุ่ม, ยกเลิก session เดิมทันที, บังคับเปลี่ยนรหัสผ่านก่อนเข้าใช้งานส่วนอื่น และรักษาสถานะบัญชีระงับไว้อย่างเดิม
2. **ปุ่มระงับ/เปิดใช้งานชมรม (Club Suspension Control):**
   - **แก้ไข:** [`app/admin/clubs/page.tsx`](file:///d:/BBN/athlete-registration/app/admin/clubs/page.tsx) เรียกใช้ API เดิม [`app/api/clubs/[id]/route.ts`](file:///d:/BBN/athlete-registration/app/api/clubs/[id]/route.ts)
   - **ผลกระทบ:** ADMIN สามารถระงับหรือเปิดใช้งานชมรมได้โดยตรงจาก UI โดยแสดงสถานะแยกจากสถานะการอนุมัติชมรมอย่างชัดเจน
3. **การแยก Scope และความปลอดภัยของข้อมูล:**
   - **แก้ไข:** [`lib/application-query.ts`](file:///d:/BBN/athlete-registration/lib/application-query.ts), [`lib/document-service.ts`](file:///d:/BBN/athlete-registration/lib/document-service.ts)
   - **ผลกระทบ:** ล็อกสิทธิ์บทบาท `CLUB` ให้เข้าถึงได้เฉพาะใบสมัครที่สังกัดชมรมตนเองเท่านั้น ป้องกันการรั่วไหลของเอกสารนิสิตที่ยังไม่ได้จัดเข้าสังกัดชมรม

---

## 4. Requirement Matrix

| Requirement | Environment | Status | Evidence | Limitations / Notes |
|---|---|:---:|---|---|
| **ADMIN Temporary Password Recovery** (User & Legacy Club) | release-test | **PASS** | [`tests/integration/admin-password-reset.test.mjs`](file:///d:/BBN/athlete-registration/tests/integration/admin-password-reset.test.mjs) (Log: [`integration-full-suite.log`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/logs/integration-full-suite.log)) | สิทธิ์ ADMIN เท่านั้น, บังคับเปลี่ยนรหัส, รักษาสถานะระงับ |
| **Club Suspension / Activation Controls** | release-test | **PASS** | Integration test + User Confirmation ([`manual-club-recovery-fixture.json`](file:///d:/BBN/athlete-registration/test-results/manual-club-recovery-fixture.json)) | ผู้ใช้ยืนยันการกดปุ่มระงับ/เปิดใน UI จริง, Integration ครอบคลุม negative cases |
| **Browser Core Flow E2E** | release-test | **PASS** | [`test-results/release-final/run-20260928-191300/screenshots/browser-core-result.png`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/screenshots/browser-core-result.png) + [`release-core.test.mjs`](file:///d:/BBN/athlete-registration/tests/integration/release-core.test.mjs) | Flow: Configure → Submit → Review → Announce → Result → Export |
| **XLSX Export 12 คอลัมน์** | release-test | **PASS** | [`test-results/xlsx-download-verification.json`](file:///d:/BBN/athlete-registration/test-results/xlsx-download-verification.json) | ตรง 12 คอลัมน์ภาษาไทย, SHA-256 ตรง, กรองข้อมูลถูกต้อง |
| **Security & Role Guards** | release-test | **PASS** | [`tests/integration/account-smoke.test.mjs`](file:///d:/BBN/athlete-registration/tests/integration/account-smoke.test.mjs), [`phase5.test.mjs`](file:///d:/BBN/athlete-registration/tests/integration/phase5.test.mjs) | ปฏิเสธ unauthenticated (401), ปฏิเสธ STAFF/CLUB จัดการแข่ง (403), ลบ dev routes (404) |
| **Storage Privacy & Signed URLs** | release-test | **PASS** | [`test-results/cutover-readonly-evidence.json`](file:///d:/BBN/athlete-registration/test-results/cutover-readonly-evidence.json) + Integration | ถังเก็บไฟล์ `athlete-private` และ `athlete-docs` เป็น Private; Public URL ถูกบล็อก (400) |
| **Legacy Documents Access** | production / test | **N/A** | [`test-results/cutover-readonly-evidence.json`](file:///d:/BBN/athlete-registration/test-results/cutover-readonly-evidence.json) | ในฐานข้อมูลมีเพียง URL จำลอง `https://example.test` ไม่มีไฟล์จริงใน Bucket จึงระบุ N/A |
| **Database Backup & Restoration** | release-test | **BLOCKED** | Source manifest captured ([`manifest.json`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/manifest.json)) | ยังไม่มีฐานข้อมูลปลายทางที่ว่างแยกต่างหาก และยังไม่ได้รับคำสั่งอนุมัติให้ทำการ Restore |
| **Real Athlete Data Import** | production | **N/A** | เอกสารมอบหมายงาน | ข้อมูลนักกีฬาจริงยังอยู่ใน CSV/Drive ภายนอก ไม่อยู่ในขอบเขตรอบนี้ |
| **Production Deployment & Migration** | production | **BLOCKED** | [`docs/RELEASE_RUNBOOK.md`](file:///d:/BBN/athlete-registration/docs/RELEASE_RUNBOOK.md) | พร้อมทางเทคนิค รอคำสั่งอนุมัติจากผู้รับผิดชอบก่อนดำเนินการจริง |

---

## 5. Quality Checks (ผลการตรวจสอบคุณภาพโค้ดและการทดสอบ)

| Command | Exit Code | Result | Evidence / Duration |
|---|:---:|:---:|---|
| `npx tsc --noEmit` | **0** | **Passed** (0 errors) | ตรวจสอบประเภทข้อมูล TypeScript แบบ Strict สำเร็จ |
| `npm run lint` | **0** | **Passed** (0 errors, 0 warnings) | ตรวจสอบตามกฎ ESLint สำเร็จ |
| `npm run test:unit` | **0** | **Passed** (51/51 passed, 0 failed) | 5,400 ms ครอบคลุม 8 ไฟล์การทดสอบระดับ Unit |
| `npm run build` | **0** | **Passed** (Compiled successfully) | Next.js Turbopack build 62 routes static/dynamic |
| `Full Integration Suite` (6 ไฟล์รวด) | **0** | **Passed** (38/38 passed, 0 failed, 0 skipped) | 96,877 ms บันทึกที่ [`test-results/release-final/run-20260928-191300/logs/integration-full-suite.log`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/logs/integration-full-suite.log) |

### สรุปผล Full Integration Suite:
1. `account-smoke.test.mjs`: 4 passed (เส้นทาง dev ถูกถอดออก 404, mutation ต้องมี auth 401, email endpoints ถูกถอดออก 404, admin user APIs ป้องกันครบ)
2. `admin-password-reset.test.mjs`: 1 passed (ครอบคลุมทั้ง User และ legacy Club: ระงับสิทธิ์, ออกรหัสชั่วคราว, บล็อกการเข้าถึงขณะระงับ, บังคับเปลี่ยนรหัส, ปลดระงับ, ล็อกอินด้วยรหัสใหม่สำเร็จ)
3. `competition-status-gate.test.mjs`: 6 passed (ตรวจสถานะ OPEN, CLOSED, COMPLETED และกำหนดเวลา Deadline)
4. `phase4.test.mjs`: 15 passed (Roster, Draft, Quota, Private documents, Analytics snapshot, Official applications)
5. `phase5.test.mjs`: 8 passed (Validation, Profile, Club normalization, CLUB scope intersection)
6. `release-core.test.mjs`: 4 checkpoints ใน 1 test passed (E2E Core persistence flow: ADMIN configure → ATHLETE submit → STAFF review → Announce → Result → Export)

---

## 6. Browser Core Flow (ผลการทดสอบส่วนการทำงานหลักบนเบราว์เซอร์)

การทดสอบ Browser Core Flow ได้รับการตรวจสอบและบันทึกหลักฐานอย่างเป็นรูปธรรม:
1. **ADMIN Configure:** เข้าสู่ระบบ กำหนดการแข่งขัน `Browser Core 1790455070687` (ID: `cmuiuqxwk002lb8c7w27k3z8q`), ปี 2569, กีฬาฟุตบอล (ตัวจริง 11, ตัวสำรอง 5, อายุไม่เกิน 28), สถานะ `OPEN`
2. **ATHLETE Apply:** นิสิตทดสอบรหัส `95071709` เข้าสู่ระบบ เลือกการแข่งขัน แนบไฟล์สังเคราะห์ PDF 7 ไฟล์ และกดยืนยันการสมัคร ได้ Application ID: `cmujekjzd00079gc76u3x2fa1` สถานะเปลี่ยนเป็น `SUBMITTED`
3. **STAFF Review:** เจ้าหน้าที่ค้นหาจากรหัสนิสิตและอนุมัติใบสมัครโดยตรง สถานะปรับปรุงเป็น `STAFF_APPROVED`
4. **STAFF Publish:** พรีวิวผู้ผ่านการคัดเลือกเฉพาะการแข่งขันดังกล่าว และกดประกาศผล ระบบยืนยันการประกาศเฉพาะรายการที่เลือก (ไม่กระทบการแข่งขันอื่น)
5. **ATHLETE View Result:** นิสิตเข้าดูสถานะอีกครั้ง พบสถานะเปลี่ยนเป็น `FINAL_SELECTED` (ประกาศผลแล้ว) พร้อมประวัติการพิจารณาถูกต้อง
   - **หลักฐานภาพหน้าจอ:** [`test-results/release-final/run-20260928-191300/screenshots/browser-core-result.png`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/screenshots/browser-core-result.png)
6. **STAFF Export:** ส่งออกไฟล์ CSV และ XLSX แสดงคอลัมน์ 12 ช่องตรงตามมาตรฐานระบบ และมีแถวข้อมูลนิสิตที่ผ่านการคัดเลือกอย่างถูกต้อง (ตรวจสอบโครงสร้างและ SHA-256 ผ่านใน [`test-results/xlsx-download-verification.json`](file:///d:/BBN/athlete-registration/test-results/xlsx-download-verification.json))

---

## 7. Security, Recovery and Storage (การรักษาความปลอดภัยและการกู้คืน)

### Positive & Negative Cases ที่ได้รับการทดสอบ:
- **Role & Scope Authorization:**
  - ADMIN mutations ปฏิเสธ STAFF และ CLUB ด้วย HTTP 403
  - CLUB เข้าถึงได้เฉพาะใบสมัครที่ผูกกับชมรมตนเอง ไม่สามารถ override ด้วยการส่ง query หรือ competitionId ข้ามสังกัด
  - การประกาศผล (Announce) ใบสมัครข้ามการแข่งขันถูกปฏิเสธด้วย HTTP 409 พร้อมยกเลิก Transaction ทันที
  - ไม่อนุญาตให้นิสิตอนุมัติใบสมัครของตนเอง (Client self-approval ปฏิเสธด้วย HTTP 403)
- **Temporary Password Recovery Flow:**
  - ต้องระบุ `identityVerified: true` จาก ADMIN เท่านั้น (หากไม่มี ส่งคืน HTTP 400)
  - เซสชันเดิมของผู้ใช้จะถูกยกเลิกทันที (Token กลายเป็น 401 เมื่อนำไปเรียก API)
  - ผู้ใช้ที่มีสถานะถูกระงับ (`isActive: false`) เมื่อได้รับรหัสชั่วคราวแล้ว ยังคงถูกบล็อกการล็อกอินด้วย HTTP 403 (รักษาสถานะระงับอย่างเคร่งครัด)
  - เมื่อแอดมินเปิดใช้งาน (`isActive: true`) ผู้ใช้สามารถล็อกอินด้วยรหัสชั่วคราวได้ แต่ API ที่มีสิทธิ์คุ้มกันจะส่งคืน 401 และหน้าเว็บจะถูก redirect ไปยัง `/change-password` จนกว่าจะเปลี่ยนรหัสผ่านสำเร็จ
  - รหัสผ่านชั่วคราวและเซสชันชั่วคราวจะถูกยกเลิกทันทีหลังเปลี่ยนรหัสผ่านเสร็จสิ้น
- **Storage Privacy & Signed URLs:**
  - ตรวจสอบถังเก็บไฟล์ `athlete-private` และ `athlete-docs` บน Supabase Storage พบว่าเป็น `public: false`
  - การเข้าถึงโดยตรงแบบ Anonymous ไปยัง URL สาธารณะของไฟล์จะถูกบล็อก (HTTP 400)
  - การดาวน์โหลดเอกสารผ่านระบบต้องผ่านการตรวจสอบสิทธิ์ (Authentication & Ownership) และเซิร์ฟเวอร์จะออก Signed URL ที่มีอายุสั้นเพียง 60 วินาที

---

## 8. Backup / Restore Verification (การสำรองและกู้คืนข้อมูล)

### สรุปสถานะ:
- **ขั้นตอนการสำรองข้อมูล (Backup):** ตรวจสอบคำสั่งและโครงสร้างข้อมูลแล้ว
- **ขั้นตอนการกู้คืนข้อมูล (Restore):** **BLOCKED (ทดสอบระดับ Preflight บน Test DB เท่านั้น — ห้ามรันบน Production)**

### Manifest ของฐานข้อมูลต้นทาง (Test Environment Snapshot):
- **Database Host:** `aws-0-ap-southeast-1.pooler.supabase.com:5432` (Supabase PostgreSQL)
- **Migration Metadata:** ตรวจพบ Migration 5 รายการเสร็จสมบูรณ์ ไม่มีรายการ Rollback:
  1. `20260919000000_baseline`
  2. `20260919010000_phase4`
  3. `20260919020000_account_status`
  4. `20260926010000_release_roles_quota`
  5. `20260928010000_admin_temporary_password`
- **จำนวนแถวข้อมูลปัจจุบัน (Table Row Counts):**
  - `User`: 7, `AthleteProfile`: 1, `Club`: 1, `Competition`: 1, `SportQuota`: 1, `Application`: 1, `SportEntry`: 1, `StatusHistory`: 3, `PrivateDocument`: 7, `SystemSetting`: 30, อื่นๆ: 0
  - จำนวนโควตากีฬาซ้ำซ้อน: `0`
  - จำนวนผู้ดูแลระบบที่ใช้งานได้: `1`

### ความแตกต่างระหว่าง Database Backup กับ Storage Backup:
- **Database Backup:** เก็บ Schema, ผู้ใช้, ข้อมูลใบสมัคร, และประวัติสถานะ (กู้คืนผ่าน pg_dump / SQL restore)
- **Storage Backup:** เก็บไฟล์แนบจริงใน Bucket `athlete-private` และ `athlete-docs` (กู้คืนผ่าน Object Storage replication / sync)
- **ความสัมพันธ์:** ตาราง `PrivateDocument` มีความสัมพันธ์แบบ 1-to-1 กับไฟล์ใน Storage (บันทึก path และ hash) หากกู้คืนเฉพาะ DB โดยไม่มี Storage หรือ Storage ขาด sync ไฟล์ดาวน์โหลดจะไม่สามารถเปิดได้

### ข้อจำกัดและการปิดกั้น (Blocker):
- ในระบบยังไม่มีการจัดเตรียม Empty Database สำหรับทดสอบการ Restore ปลายทาง
- เพื่อป้องกันความเสี่ยงต่อข้อมูล จึงไม่อนุญาตให้รันคำสั่ง restore ทับฐานข้อมูลปัจจุบันจนกว่าจะมีคำสั่งอนุมัติระบุฐานข้อมูลปลายทางอย่างชัดเจน

---

## 9. Outstanding Items (สิ่งที่ยังค้างอยู่ก่อนเปิดใช้งานจริง)

1. **Production Database Cutover Authorization:**
   - **สิ่งที่ต้องการ:** คำสั่งอนุมัติให้ใช้คำสั่ง `npx prisma migrate deploy` สำหรับ migration `20260928010000_admin_temporary_password` บนฐานข้อมูล Production (`aws-0-ap-northeast-1`)
   - **ผู้รับผิดชอบ:** ทีม System Administrator / Project Owner
2. **Production Backup/Restore Dry-Run (Optional on Empty Staging DB):**
   - **สิ่งที่ต้องการ:** การจัดสรร Dedicated Empty Database เพื่อทดสอบคำสั่ง Restore ก่อนวัน Rollout จริง
   - **ผู้รับผิดชอบ:** Database Administrator
3. **การนำเข้าข้อมูลนักกีฬาจริง (Out of scope for this milestone):**
   - ข้อมูลยังอยู่นอกระบบในรูปแบบ CSV / Google Drive จะดำเนินการหลังจากระบบผ่านการ Release เข้าสู่รอบการรับสมัครจริง

---

## 10. Rollout / Rollback Plan (แผนการขึ้นระบบและการย้อนกลับ)

### A. ขั้นตอน Rollout (เมื่อได้รับคำสั่งอนุมัติ)
1. **Pre-flight Check:**
   - รัน `node scripts/release-preflight.mjs` เพื่อยืนยันว่าไม่มี duplicate quota groups และมี active admin อย่างน้อย 1 คน
2. **Database Backup:**
   - ทำ Snapshot สำรองฐานข้อมูล Production ก่อนเริ่มกระบวนการ
3. **Database Migration:**
   - รัน `npm run db:migrate` เพื่อ deploy migration `20260928010000_admin_temporary_password`
4. **Deploy Application Build:**
   - ติดตั้ง Production build ล่าสุด (`next build` พร้อม 62 routes)
5. **Post-deploy Smoke Verification:**
   - ตรวจสอบหน้า `/login` แสดงผลปกติ
   - ตรวจสอบหน้า `/change-password` ทำการ redirect ไป `/login` เมื่อไม่มีเซสชัน
   - ทดสอบล็อกอิน ADMIN ตรวจสอบหน้า `/admin/users` และ `/admin/clubs` แสดงปุ่มกู้คืนรหัสผ่านและปุ่มระงับชมรม

### B. ขั้นตอน Rollback (หากพบปัญหาวิกฤต)
1. นำระบบเข้าสู่ Maintenance Mode
2. ย้อนกลับ Application Build เป็นเวอร์ชันก่อนหน้า
3. กู้คืนฐานข้อมูลจาก Snapshot สำรองที่บันทึกไว้ก่อน Rollout
4. **ข้อควรระวัง:** ห้ามแก้ไข Bucket Storage กลับเป็น Public โดยเด็ดขาด

---

## 11. Evidence Reuse for Codex (แนวทางการใช้ประโยชน์จากหลักฐาน)

หลักฐานที่ได้รับการบันทึกในรอบนี้สามารถนำไปใช้อ้างอิงต่อได้โดยไม่ต้องรันซ้ำ:
1. **ผลการตรวจสอบคุณภาพโค้ด:** `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` (51 tests), `npm run build` — ใช้ได้ต่อเนื่องตราบใดที่ไม่มีการแก้ไขไฟล์ในซอร์สโค้ด
2. **ผลการทดสอบ Full Integration Suite (38 tests):** บันทึกไว้ที่ [`test-results/release-final/run-20260928-191300/logs/integration-full-suite.log`](file:///d:/BBN/athlete-registration/test-results/release-final/run-20260928-191300/logs/integration-full-suite.log) — ใช้ได้ต่อเนื่องจนกว่า Schema หรือ API Contract จะเปลี่ยนแปลง
3. **ผลการตรวจสอบ XLSX 12 คอลัมน์:** บันทึกที่ [`test-results/xlsx-download-verification.json`](file:///d:/BBN/athlete-registration/test-results/xlsx-download-verification.json) — ใช้ยืนยันโครงสร้างไฟล์ดาวน์โหลด
4. **รายการที่ต้องตรวจเพิ่มจริง ๆ เท่านั้นในอนาคต:**
   - การรัน Smoke Test สั้นๆ หลัง Deploy จริงบน Production
   - การทดสอบ Restore บน Empty Database เฉพาะเมื่อมีการจัดสรรฐานข้อมูลปลายทางเรียบร้อยแล้ว
