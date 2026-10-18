# Core Workflows

## 1. นักกีฬา: สมัคร → คัดเลือก → ยืนยันสิทธิ์
1. `POST /api/auth/register` ตรวจอายุ ≤ 28 → กรอกโปรไฟล์ (`AthleteProfile`)
2. `POST /api/applications` ตรวจ eligibility (`lib/athlete-eligibility.ts`, `lib/rule-checker.ts`), การแข่งขัน OPEN ก่อน deadline (`openCompetition`), สโมสร (`lib/application-club-service.ts`), เอกสาร (`lib/athlete-document-policy.ts`) → `SUBMITTED`
3. ชมรมตรวจ → `CLUB_APPROVED` / `CLUB_REJECTED` (`club/competitions/[id]`)
4. ชมรมจัด roster (`lib/roster-service.ts`): กีฬาทีม = main/reserve, กีฬาเดี่ยว = selected; ตรวจโควตา `SportQuota`; ส่ง → `ClubRoster.SUBMITTED` (ล็อก). ต้องผ่าน `assertEvidenceAllPassed` และ team readiness
5. เจ้าหน้าที่ตรวจหลักฐาน (`staff/applications/[id]/evidence`) → `STAFF_APPROVED`
6. ประกาศผล `staff/applications/announce` (GET ดูตัวอย่าง/ปัญหา, POST ประกาศ) ผ่าน `collectPublicationProblems` → `FINAL_SELECTED` + `StatusHistory`
7. นักกีฬา `applications/[id]/decision`: CONFIRM (ต้องรับทราบเงื่อนไข) หรือ DECLINE (ต้องมีเหตุผล แนบเอกสารได้) บันทึกใน `StatusHistory` เท่านั้น (`lib/athlete-decision-service.ts`)

## 2. เจ้าหน้าที่ทีม (TEAM_OFFICIAL)
สมัครบัญชี (`auth/register-official`) → กรอกใบสมัคร (`team-official/applications`, `OfficialApplication`, JSON profile/documents) → ประธานชมรมตรวจ (`club/officials`) → เจ้าหน้าที่อนุมัติ (`staff/officials`). ทุกการเปลี่ยนสถานะบันทึก `OfficialEvent` และตรวจ `version`

## 3. บัญชีและรหัสผ่าน
- ไม่มี email recovery. ADMIN ออกรหัสชั่วคราว (`admin/users/[id]/reset-password`, `admin/clubs/[id]/reset-password`) → `mustChangePassword = true` → middleware บังคับไป `/change-password` → `PUT /api/auth/password`
- เปลี่ยนรหัสผ่านทำให้ JWT เก่าใช้ไม่ได้ (`credentialVersion`)
- ระงับบัญชี (`isActive=false`) มีผลทันทีเพราะ `getSession` ตรวจ DB ทุกครั้ง
- ลบผู้ใช้: `DELETE /api/admin/users/[id]` (ADMIN, ห้ามลบตัวเอง/ADMIN คนสุดท้าย, atomic, บันทึก audit)

## 4. Fitness และสู่ความเป็นเลิศ (Excellence)
- นำเข้าผลสมรรถภาพจาก Excel (`staff/fitness-tests/import`, `lib/fitness-import-service.ts`) → `FitnessTestResult` (คง `_excellence` ไว้ด้วย `preserveExcellenceMetadata`)
- Excellence อยู่ที่หน้า `/staff/excellence` (ภาพรวม), `/staff/excellence/[applicationId]` (รายคน), `/staff/excellence/heatmap` (แผนที่จุดอ่อนทีม × สถานี), `/staff/excellence/benchmarks` (เป้าหมาย) เฉพาะกรีฑา ลู่ (เวลา) และลาน (ระยะ) ใบสมัครสถานะ `STAFF_APPROVED`/`FINAL_SELECTED`
- ลำดับงาน: ผลทดสอบสมรรถภาพ → จุดอ่อน (ระดับต่ำและต่ำมาก ตามเกณฑ์กลุ่ม 9) → แผนพัฒนาที่แต่ละข้อผูกกับสถานี → บันทึกผลแข่ง → ทดสอบซ้ำ (สถานีเทียบครั้งก่อน, ผลแข่งเทียบผลล่าสุดด้วย SWC; ทิศทาง: ลู่ น้อยกว่าดีกว่า, ลาน มากกว่าดีกว่า)
- สถานีของ Excellence = 11 รายการของเกณฑ์กลุ่ม 9 (key ตรงกับ `Group9TestKey`) ระดับมาจากข้อความที่บันทึกไว้ หรือคำนวณจากตัวเลขดิบใต้ key ของสถานีด้วย `rateGroup9Value` ตามเพศของนักกีฬา (service ส่ง rater เข้า `extractStationRatings`)
- Logic อยู่ใน `lib/excellence-athletics.ts` (pure), `excellence-validation.ts`, `excellence-service.ts`, ชุดสาธิต `excellence-demo.ts` (`?demo=true`, อ่านอย่างเดียว)

## 5. เอกสาร
อัปโหลด `POST /api/documents` (≤ 5 MB, PDF/JPEG/PNG ตรวจ signature) → Supabase private bucket path `ownerId/uuid` → `PrivateDocument` → ผูกกับใบสมัครแล้วตั้ง `retained`. ดาวน์โหลดผ่าน route ที่ตรวจสิทธิ์เท่านั้น (`canReadDocument`)
