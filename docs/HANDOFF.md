# Task Status: ✅ Completed

## Data Reset Performed (นิสิต, Team-Official, Club)
- ลบข้อมูลในฐานข้อมูล PostgreSQL เรียบร้อยแล้วผ่าน atomic transaction
- ยอดคงเหลือของกลุ่มเป้าหมายใน DB:
  - นิสิต (User ATHLETE): 0
  - เจ้าหน้าที่ทีม (User TEAM_OFFICIAL): 0
  - ชมรม (Club & User CLUB): 0
  - ประวัตินักกีฬา (AthleteProfile): 0
  - ใบสมัครแข่งขันและข้อมูลย่อย (Application, SportEntry, CompetitionResult, StatusHistory): 0
  - ใบสมัครเจ้าหน้าที่ทีม (OfficialApplication, OfficialEvent): 0
  - บัญชีรายชื่อชมรม (ClubRoster, RosterItem, RosterEvent): 0
  - ข้อมูลชมรมอื่นๆ (Activity, ClubRequest, Coach, TrainingProgram, TrainingReport): 0
  - เอกสารส่วนบุคคลเป้าหมาย (PrivateDocument บทบาท ATHLETE, TEAM_OFFICIAL, CLUB): 0
- บัญชี ADMIN (1) และ STAFF (1) รวมทั้งข้อมูลการแข่งขัน (Competition) ยังคงอยู่ครบถ้วน

## Changes Made
1. ซ่อนช่องรับเอกสาร "ใบผ่านการอบรม UP Academy", "ผลการทดสอบสมรรถภาพทางกาย" และ "หนังสือรับรองกรณีไม่มีชมรม" จากหน้าจอ (UI) และแบบฟอร์มของระบบทั้งหมดชั่วคราว
2. เพิ่มตัวแปร `ATHLETE_VISIBLE_DOCUMENT_FIELDS` ใน `lib/athlete-document-policy.ts` เพื่อใช้กำหนดรายการเอกสารที่แสดงผลและรับข้อมูลใหม่ โดยตัดรายการทั้ง 3 รายการข้างต้นออก
3. แก้ไข `app/athlete/[id]/page.tsx` และ `app/staff/applications/[clubId]/[competitionId]/page.tsx` ให้วนลูปแสดงผลรายการเอกสารจากตัวแปรแบบ Visible แทนที่จะแสดงเอกสารทั้งหมด
4. อัปเดต `app/api/club/competitions/[id]/route.ts` ให้ส่งข้อมูลกลับเฉพาะช่องเอกสารที่กำหนดแสดงผล เพื่อซ่อนรายการชั่วคราวในฝั่งชมรม
5. คงตัวแปร `ALL_ATHLETE_DOCUMENT_FIELDS` เดิมและการทำงานภายใน (เช่น การตรวจสอบสิทธิ์ดาวน์โหลดใน API `[id]/documents/[field]`) ไว้ตามเดิมเพื่อให้ฐานข้อมูลไม่พังและเอกสารที่มีอยู่แล้วในระบบสามารถตรวจสอบ/ใช้งานได้ตามปกติ (Backwards compatibility)
6. เพิ่มตัวแปร `REQUIRED_EVIDENCE_ITEMS` ใน `lib/evidence-verification.ts` โดยยกเว้น `FITNESS_TEST` ชั่วคราว และปรับปรุง `assertEvidenceAllPassed` ใน `lib/evidence-verification-service.ts` ให้ตรวจสอบเฉพาะรายการหลักฐานที่จำเป็น ทำให้การส่งบัญชีรายชื่อของชมรมผ่านหน้า `/club/review` ไม่ติดปัญหา "ผลทดสอบสมรรถภาพทางกาย (รอตรวจ)"
7. ปรับปรุงการตรวจสอบ "ผลงานการแข่งขันย้อนหลัง" (`COMPETITION_HISTORY`) ใน `assertEvidenceAllPassed`, `hasVerifiedResults` และ `collectPublicationProblems`:
   - หากผู้สมัครมีผลงานการแข่งขันที่อยู่ในเกณฑ์ไม่เกิน 2 ปีก่อนปีแข่งขัน (`evaluateResultRecency.passed === true`) และสถานะยังเป็น `PENDING` (ยังไม่ได้ถูกปฏิเสธ) ระบบจะอนุโลมให้ผ่านเกณฑ์การส่งบัญชีรายชื่อ, เกณฑ์ความพร้อมระดับทีม (Team Readiness) และการประกาศผล (Publication Gate) ได้ทันทีโดยไม่ติดค้าง "รอตรวจ"
8. แก้ไขปัญหา `POST /api/staff/applications/announce` เกิด 409 ใน `lib/publication-gate.ts`:
   - ปรับการตรวจสอบปัญหาการประกาศผลให้ใช้ `REQUIRED_EVIDENCE_ITEMS` และเกณฑ์ประวัติผลงาน 2 ปีข้างต้น ทำให้เจ้าหน้าที่สามารถประกาศผลในหน้า `/staff/selection` ได้อย่างราบรื่น
9. เชื่อมโยงข้อมูลผลการทดสอบสมรรถภาพทางกายรายบุคคล (Fitness Test Results):
   - เพิ่มการส่งข้อมูล `fitnessTestResult` ใน `app/api/staff/applications/route.ts`
   - แสดงสถานะผลการทดสอบสมรรถภาพและคะแนนรวมบนการ์ดนักกีฬาและในหน้าต่างรายละเอียด (Modal) ของหน้า `/staff/applications/[clubId]/[competitionId]` เพื่อให้เจ้าหน้าที่ตรวจสอบผลสมรรถภาพของนักกีฬาแต่ละรายได้อย่างชัดเจน
10. เพิ่มปุ่มและหน้าต่างดูประวัติผลงานการแข่งขันกีฬาที่ผ่านมาในฝั่งชมรมและเจ้าหน้าที่ (Staff):
   - ที่หน้า `/club/review`: เพิ่มปุ่ม `👁️ ดูผลงาน (X)` ในคอลัมน์ผลงาน พร้อม Modal แสดงรายการผลงาน
   - ที่หน้า `/club/competitions/[id]`: เพิ่มปุ่ม `🏆 ผลงาน (X)` บนการ์ดผู้สมัครแต่ละคนเพื่อให้กดเปิดดูประวัติผลงานพร้อมลิงก์ดาวน์โหลด/ดูไฟล์หลักฐานแนบได้ทันที
   - ที่หน้า `/staff/applications/[clubId]/[competitionId]`: เพิ่มปุ่ม `🏆 ผลงาน (X)` บนการ์ดผู้สมัคร และเพิ่มลิงก์ `ดูหลักฐาน` ของผลงานแต่ละรายการใน Modal รายละเอียด เพื่อให้เจ้าหน้าที่สามารถเปิดดูหลักฐานผลงานได้สะดวกรวดเร็ว
11. เพิ่ม Input Validation สำหรับ Register Step 2 (บันทึกข้อมูลส่วนตัว + redirect) ใน `app/login/page.tsx`:
   - เพิ่มฟังก์ชัน `validateProfileForm()` ตรวจสอบความถูกต้องของข้อมูลทุกช่อง (ชื่อ-นามสกุล, คณะ, สาขา, ระดับการศึกษา, ชั้นปี, ภาคเรียน, เลขบัตรประชาชน 13 หลัก, วันเดือนปีเกิดไม่เป็นอนาคต, เบอร์โทรศัพท์ 9-10 หลัก, เกรดเฉลี่ย 0.00-4.00, ที่อยู่, รหัสไปรษณีย์ 5 หลัก)
   - จัดการ State `profileErrors` แสดงข้อความแจ้งเตือนข้อผิดพลาดใต้ช่องกรอกแต่ละฟิลด์พร้อมขอบสีแดง (Red border / focus ring) และลบ error อัตโนมัติเมื่อผู้ใช้แก้ไขข้อมูล
   - ทำความสะอาดและแปลงข้อมูลก่อนส่ง API (Trim ข้อมูล, แปลง `studentLevel` เป็น uppercase, ตัดขีดในเลขบัตรประชาชนและเบอร์โทรศัพท์)
   - รองรับการแสดงผลข้อผิดพลาดระดับฟิลด์ที่ส่งกลับมาจากเซิร์ฟเวอร์ (`data.fieldErrors`)
   - เพิ่มการตรวจสอบความถูกต้องฝั่งเซิร์ฟเวอร์ใน `validateProfile` (`lib/validation.ts`) ครอบคลุมเลขบัตรประชาชน, เบอร์โทรศัพท์, รหัสไปรษณีย์ และช่วงเกรดเฉลี่ย
12. ปรับปรุงคอมโพเนนต์ [ThaiDateInput.tsx](components/shared/ThaiDateInput.tsx):
   - นำแถวข้อความแนะนำและปุ่มเลือกปฏิทินระบบ (`<div class="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">`) ที่อยู่ใต้ Dropdown วัน/เดือน/ปี พ.ศ. ออก เพื่อจัดระเบียบหน้าแบบฟอร์มให้สะอาดตาและมีความสูงของช่องกรอกข้อมูลเสมอกับคอลัมน์ข้างเคียง
   - คงการรองรับ `id` และ `name` ผ่าน `<input type="hidden" />` เพื่อให้เข้ากันได้กับฟอร์มและการอ้างอิงเดิม
13. ปรับปรุงการกรอกและจัดรูปแบบเกรดเฉลี่ย (GPA & GPAX):
   - ตรวจสอบยืนยันโครงสร้างระบบ: ระบบใช้ช่องกรอกข้อความเดี่ยวช่องเดียว (`<input />`) พิมพ์ตัวเลขพร้อมจุดทศนิยม 2 ตำแหน่งตามผลการเรียนจริงใน Transcript
   - เพิ่มการกรองใน `onChange` ให้รับเฉพาะตัวเลขและจุดทศนิยม ป้องกันการพิมพ์จุดซ้ำซ้อน (`3..5` หรือ `3.2.5`) และจำกัดความยาวสูงสุด 4 ตัวอักษร
   - เพิ่มฟังก์ชัน `onBlur` จัดรูปแบบเป็นทศนิยม 2 ตำแหน่งให้อัตโนมัติ (เช่น หากพิมพ์ `3` จะเปลี่ยนเป็น `3.00`, พิมพ์ `3.5` จะเปลี่ยนเป็น `3.50`) ทั้งใน [app/login/page.tsx](app/login/page.tsx) และ [components/shared/AthleteProfileEditModal.tsx](components/shared/AthleteProfileEditModal.tsx)
14. เพิ่มช่องเลือก "คำนำหน้าชื่อ" (Title) และ "เพศ" (Gender) ในระบบ:
   - เพิ่มช่องเลือกคำนำหน้าชื่อ (`นาย`, `นางสาว`, `นาง`) และเพศ (`ชาย`, `หญิง`) ใน [app/login/page.tsx](app/login/page.tsx) และ [components/shared/AthleteProfileEditModal.tsx](components/shared/AthleteProfileEditModal.tsx)
   - มีระบบ Auto-selection: เมื่อเลือก "นาย" จะเลือกเพศ "ชาย" ให้อัตโนมัติ และเมื่อเลือก "นางสาว" หรือ "นาง" จะเลือกเพศ "หญิง" ให้อัตโนมัติ โดยผู้ใช้ยังสามารถปรับเปลี่ยนเพศได้
   - ในการบันทึกข้อมูล: นำคำนำหน้าชื่อไปรวมไว้ด้านหน้าของ `firstName` (เช่น `นายสมชาย`, `นางสาวสมหญิง`) เพื่อส่งบันทึกลงในฟิลด์ `firstName` ของฐานข้อมูลโดยตรง ทำให้ไม่ต้องเปลี่ยนแปลง Schema ของฐานข้อมูลเดิม (No DB migration needed)
   - ในการแก้ไขข้อมูล: ดึงคำนำหน้าชื่อเดิมออกจาก `firstName` มาแสดงในช่อง Dropdown ให้อัตโนมัติ
   - ปรับปรุงการส่งออกข้อมูล CSV ใน [app/staff/applications/[clubId]/[competitionId]/page.tsx](app/staff/applications/[clubId]/[competitionId]/page.tsx) และ [components/shared/OfficialReview.tsx](components/shared/OfficialReview.tsx) ให้ใช้ `detectGenderFromName` ตรวจจับคำนำหน้าจากชื่อจริงเพื่อแสดงผลคอลัมน์ "เพศ" เป็น "ชาย" หรือ "หญิง" ในไฟล์ CSV แทนเครื่องหมาย "-" เดิม
15. ระบบแจ้งเตือนและบล็อกคุณสมบัติไม่ผ่านเกณฑ์ (อายุเกิน 28 ปีตาม กกมท.) ตั้งแต่ขั้นตอนสมัครและเข้าสู่ระบบ:
   - **การแจ้งเตือน Real-time บนแบบฟอร์มสมัคร ([app/login/page.tsx](app/login/page.tsx))**: คำนวณอายุและเกณฑ์คุณสมบัติทันทีเมื่อเลือกวันเดือนปีเกิด แสดงกล่องสถานะคุณสมบัติเบื้องต้น (ผ่าน/ไม่ผ่าน) พร้อมคำนวณอายุตามปีมหกรรมกีฬาและจำนวนครั้งที่สมัคร
   - **บล็อกการลงทะเบียน**: หากอายุเกิน 28 ปี (เช่น 29 ปี) ระบบจะแสดงข้อความเตือนสีแดงเด่นชัด ปิดใช้งานปุ่มบันทึก (Disabled button: "ไม่สามารถลงทะเบียนได้ (อายุเกินเกณฑ์ กกมท.)") และบล็อกการกดส่งข้อมูล
   - **ตรวจสอบฝั่ง Server-side ใน [app/api/auth/register/route.ts](app/api/auth/register/route.ts)**: ตรวจสอบ `evaluateAge` หากอายุเกิน 28 ปี จะ Reject ด้วย 400 Bad Request
   - **บล็อกการเข้าสู่ระบบใน [app/api/auth/login/route.ts](app/api/auth/login/route.ts)**: หากบัญชีนักกีฬา (ATHLETE) มีอายุเกินเกณฑ์ 28 ปีตามระเบียบ กกมท. ระบบจะปฏิเสธการเข้าสู่ระบบด้วย 403 Forbidden พร้อมส่งข้อความแจ้งเตือนให้แสดงบนหน้า Login ทันที
16. เพิ่มฟังก์ชันการลบบัญชีผู้ใช้งาน (Delete User) พร้อมระบบยืนยัน 2 ขั้นตอน (2-Step Confirmation):
   - **เพิ่มปุ่ม "ลบ" ในตารางจัดการผู้ใช้งาน ([app/admin/users/page.tsx](app/admin/users/page.tsx))**: อยู่ในคอลัมน์การจัดการของแต่ละแถว
   - **ระบบยืนยันความปลอดภัย 2 ขั้นตอน (2-Step Confirmation Modal)**:
     - **ขั้นตอนที่ 1/2 (ตรวจสอบข้อมูลและรับทราบผลกระทบ)**: แสดงรายละเอียดบัญชีที่จะลบ (ชื่อ, อีเมล, รหัสนิสิต, บทบาท) พร้อมสรุปผลกระทบที่จะเกิดขึ้นเมื่อลบ (ข้อมูลประวัติ, ใบสมัคร, เอกสารแนบจะถูกลบถาวร) มีปุ่ม "ยกเลิก" และ "ดำเนินการต่อ (ขั้นตอนที่ 2) →"
     - **ขั้นตอนที่ 2/2 (ยืนยันความปลอดภัยขั้นสุดท้าย)**: กำหนดให้ผู้ดูแลระบบต้องพิมพ์คำว่า `DELETE` ในกล่องข้อความ และติ๊กถูกที่กล่องข้อความยอมรับผลกระทบ ปุ่ม "ยืนยันลบบัญชีถาวร" สีแดงจึงจะเปิดใช้งานเพื่อป้องกันการเผลอลบโดยไม่ตั้งใจ
   - **Backend API ปลอดภัยสมบูรณ์ (`DELETE /api/admin/users/[id]`)**:
     - ตรวจสอบสิทธิ์เฉพาะผู้ดูแลระบบ (ADMIN)
     - ป้องกันการลบบัญชีตนเอง (`target.id !== session.id`)
     - ป้องกันการลบบัญชี Admin คนสุดท้ายของระบบ
     - จัดการลบข้อมูลที่เกี่ยวข้องแบบ Atomic Transaction (ลบ `RosterItem`, `OfficialApplication`, `AnalyticsSnapshot`, `PrivateDocument` และ `User` ที่เชื่อมโยงกับ `AthleteProfile` และ `Application` แบบ Cascade)
     - บันทึกประวัติการลบลงใน Audit Log (`DELETE_USER`) พร้อมรายละเอียดบัญชีที่ถูกลบ
17. แก้ไขปัญหาแจ้งเตือนสีแดงกะพริบ/ค้างบนหน้ารับสมัครนักกีฬา (`app/athlete/register/page.tsx`):
   - **สาเหตุ**: ระหว่างที่หน้ารีโหลดหรือกำลังดึงข้อมูล (`resource.loading === true`) ตัวแปร `studentProfile` ยังเป็น `undefined` ส่งผลให้ฟังก์ชัน `evaluateGpax(undefined)` ประเมินว่าไม่พบข้อมูล GPAX และเงื่อนไขการแจ้งเตือนสิทธิ์แสดงผลทันทีโดยไม่มี Loading guard ทำให้กล่องข้อความสีแดง `⚠️ ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน: ไม่พบข้อมูลผลการเรียนสะสม (GPAX)` ปรากฏขึ้นมาขณะกด Reload
   - **การแก้ไข**:
     - เพิ่ม Guard ครอบคลุมการแสดงผลส่วนแบบฟอร์มและการแจ้งเตือนคุณสมบัติ (`!resource.loading && studentProfile`) ทำให้ไม่แสดงกล่องเตือนใด ๆ ระหว่างกำลังโหลดข้อมูล
     - ปรับเงื่อนไขการแจ้งเตือน GPAX ให้แสดงข้อความสีแดง "ไม่มีสิทธิ์" เฉพาะกรณีที่นักกีฬามีข้อมูล GPAX ในระบบจริงและมีค่าน้อยกว่า 2.00 (`studentProfile.gpaCumulative && !isGpaxEligible`) หากยังไม่มีข้อมูล GPAX (และไม่ได้รับการยกเว้น) จะแสดงกล่องสีส้มแนะนำให้กด "แก้ไขข้อมูลนิสิต" แทน

18. ปรับปรุงการจัดวางผังหน้าต่าง (Layout) แก้ไขข้อมูลส่วนตัวใน [AthleteProfileEditModal.tsx](components/shared/AthleteProfileEditModal.tsx) ให้มีความเหมาะสมและสวยงาม:
   - **แถวที่ 1 (2 คอลัมน์)**: รหัสประจำตัวนิสิต (Disabled) คู่กับ เลขบัตรประจำตัวประชาชน
   - **แถวที่ 2 (4 คอลัมน์)**: คำนำหน้าชื่อ (นาย/นางสาว/นาง), เพศ (ชาย/หญิง), ชื่อจริง, นามสกุล เรียงต่อกันอย่างสมมาตร
   - **แถวที่ 3 (2 คอลัมน์)**:
     - ฝั่งซ้าย: วันเดือนปีเกิด (`ThaiDateInput` พร้อมโหมด `compact`) มีความกว้าง 50% ทำให้ช่อง Dropdown วัน, เดือน, ปี (พ.ศ.) กว้างพอดี ไม่บีบตัวอักษรชื่อเดือน
     - ฝั่งขวา (2 คอลัมน์ย่อย): สัญชาติ และ เบอร์โทรศัพท์ติดต่อ เติมเต็มพื้นที่อย่างสมบูรณ์โดยไม่มีช่องว่างตกค้าง

19. เพิ่มคำนำหน้าชื่อ/เพศ และ Input Validation สำหรับแบบฟอร์มขึ้นทะเบียนเจ้าหน้าที่ทีม (`app/team-official/register/page.tsx`):
   - เพิ่มช่องเลือกคำนำหน้าชื่อ (`นาย (Mr)`, `นางสาว (Miss)`, `นาง (Mrs)`) และเพศ (`ชาย (male)`, `หญิง (female)`) พร้อมระบบ Auto-selection (เลือก "นาย" → "ชาย", เลือก "นางสาว"/"นาง" → "หญิง") โดยผู้ใช้ยังเปลี่ยนเพศเองได้
   - แสดงคำเตือนแบบไม่บล็อกเมื่อคำนำหน้าชื่อกับเพศที่เลือกไม่สอดคล้องกัน
   - ในการบันทึก: ต่อคำนำหน้าเข้ากับ `firstName` ก่อนส่งลงฐานข้อมูล (เช่น `นายสมชาย`) จึงไม่ต้องแก้ Prisma Schema หรือรัน Migration
   - ในการแก้ไขใบสมัครเดิม: แยกคำนำหน้าเดิมออกจาก `firstName` มาแสดงใน Dropdown อัตโนมัติ และกันการต่อคำนำหน้าซ้ำ (idempotent)
   - เพิ่มการตรวจสอบความถูกต้องระดับช่อง (Field-level Input Validation) แทนการปิดปุ่มนำส่งแบบรวม: ตรวจช่องบังคับทุกช่อง, เลขบัตรประชาชน 13 หลัก, วันเกิดไม่เป็นอนาคต, รหัสไปรษณีย์ 5 หลัก, เบอร์โทรศัพท์รูปแบบ `0XXXXXXXXX`, รูปแบบอีเมล, จำนวนครั้ง 0-999, เอกสารบังคับ และการยอมรับข้อตกลง
   - แสดงข้อความข้อผิดพลาดใต้ช่องพร้อมขอบสีแดง (`aria-invalid`) สรุปจำนวนรายการที่ต้องแก้ไข และกดเพื่อเลื่อนไปยังช่องนั้นได้ ส่วนปุ่มนำส่งจะทำงานเสมอแล้วรายงานผลการตรวจสอบ (เดิมปุ่มถูก disable ทำให้ผู้ใช้ไม่ทราบสาเหตุ) การตรวจฝั่งเซิร์ฟเวอร์ใน `officialProfileValid` ยังคงทำงานซ้ำอีกชั้น
20. แยกตรรกะคำนำหน้าชื่อ/เพศออกเป็นโมดูลกลาง `lib/thai-name-title.ts` (`splitTitleFromName`, `combineTitleWithFirstName`, `genderFromTitle`, `NAME_TITLE_OPTIONS`, `NAME_GENDER_OPTIONS`) และนำมาใช้ร่วมกันใน `app/team-official/register/page.tsx` และ `components/shared/AthleteProfileEditModal.tsx` แทนโค้ดที่ซ้ำกัน พร้อมเพิ่ม `title`/`gender` เข้า `validate()` ของ Modal ให้ตรงกับป้ายบังคับ (`*`) ที่แสดงอยู่
21. เพิ่ม Unit Test `tests/unit/thai-name-title.test.mjs` ครอบคลุมการแยก/ต่อคำนำหน้า (รวมกรณี `นางสาว` ต้องถูกตัดก่อน `นาง`), ความสามารถทำงานซ้ำโดยไม่ต่อคำนำหน้าซ้อน, การแมปเพศอัตโนมัติ และ round-trip ของชื่อที่บันทึกแล้ว
22. เพิ่มการกรองและแสดงผลประเภทกีฬาและรุ่นตามเพศของนักศึกษาในหน้าสมัคร (`app/athlete/register/page.tsx`):
   - เพิ่มฟังก์ชัน `detectAthleteGender` และ `getGenderLabel` ใน `lib/thai-name-title.ts` ตรวจจับเพศจากคำนำหน้าของนักศึกษา (`นาย`, `นางสาว`, `นาง`, `น.ส.`, ฯลฯ)
   - เพิ่มฟังก์ชัน `filterCategoriesByGender`, `filterDivisionsByGender` และอัปเดต `getSportConfig(sportName, gender)` ใน `lib/sports-categories.ts` เพื่อกรองประเภทกีฬา (เช่น ชายเดี่ยว/คู่ชาย/ทีมชาย vs หญิงเดี่ยว/คู่หญิง/ทีมหญิง) และรุ่นน้ำหนักกีฬาต่อสู้ (`combatDivisionsMale` vs `combatDivisionsFemale`) ตามเพศของนักศึกษา โดยคงประเภทผสม (`คู่ผสม`, `ผลัดผสม`) และประเภทกลางไว้
   - ในการ์ดข้อมูลประวัตินักศึกษา: แสดงข้อมูล "เพศ" (ชาย/หญิง) อย่างชัดเจน
   - ในขั้นตอนที่ 2 (ชนิดกีฬาและรายการ): เพิ่มป้ายกำกับ "แสดงเฉพาะประเภทสำหรับเพศ..." และกรองตัวเลือกใน Dropdown "เลือกประเภท" และ "เลือกรุ่น" ให้สอดคล้องกับเพศของนิสิตโดยอัตโนมัติ
   - เพิ่ม Unit Tests ใน `tests/unit/sports-categories.test.mjs` และ `tests/unit/thai-name-title.test.mjs` ตรวจสอบความถูกต้องของการกรองประเภทและรุ่นตามเพศ

## Testing Performed
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run test:unit`: 50/50 tests passed (เพิ่ม 6 tests ใน `tests/unit/sports-categories.test.mjs` และ 2 tests ใน `tests/unit/thai-name-title.test.mjs`)
- `npm run build`: passed (all 67 static and dynamic routes compiled successfully)
- ทดสอบจริงบนเบราว์เซอร์ (`/athlete/register`): ตรวจสอบการแสดงผลเพศ "ชาย", ป้ายคัดกรองตามเพศชาย และ Dropdown ของ เซปักตะกร้อ, เปตอง, วอลเลย์บอล, บาสเกตบอล, ฟุตซอล แสดงเฉพาะประเภทสำหรับเพศชายและประเภทผสมถูกต้อง ไม่แสดงประเภทหญิง

## UI Adjustments for Competition Management
- Redesigned components/shared/CompetitionManagement.tsx to match system theme (gradients, layout, shadows).
- Enhanced Sport Quotas: Changed sport dropdown to <input list> with <datalist> to support typing custom sports or selecting from 17 defaults.
- Added clear table headers for sport quotas and an auto-calculated 'Total' column (starters + substitutes) as a distinct UI badge.
- Splitted deadline into Registration Start Date (startDate, maps to createdAt via validation mapping to avoid DB migrations) and End Date (deadline).
- Passed all unit tests and lint checks.


23. แก้ไข Bug เมนูดรอปดาวน์ "ชนิดกีฬา" ในหน้า /staff/competitions (แก้ไข / จัดการโควตา):
   - เดิมใช้ HTML5 `<datalist>` ซึ่งมี Bug ของเบราว์เซอร์ Chromium ในหน้า Modal ที่มี `overflow-y-auto` และ CSS backdrop filter ทำให้เมนูตัวเลือกชนิดกีฬาหลุดลอยไปแสดงผิดตำแหน่งที่มุมบนซ้ายของหน้าต่าง
   - แทนที่ด้วยคอมโพเนนต์ `SportCombobox` แบบ Custom ใน [components/shared/CompetitionManagement.tsx](components/shared/CompetitionManagement.tsx):
     - รองรับการพิมพ์ค้นหาชนิดกีฬาแบบเรียลไทม์ และรองรับการพิมพ์เพื่อเพิ่มชนิดกีฬาใหม่ (Add custom sport) ได้ทั้งจากการกดเลือก "+ เพิ่ม ..." หรือการพิมพ์ข้อความแล้วเลื่อนโฟกัส
     - รวมรายการชนิดกีฬาทั้งหมดจาก `DEFAULT_SPORTS` (17 ชนิดกีฬาเริ่มต้น), ชนิดกีฬาที่มีอยู่ในการแข่งขันทั้งหมด และชนิดกีฬาที่เพิ่มในตารางโควตาปัจจุบัน
     - ปรับตำแหน่งการแสดงผลอัตโนมัติ (เปิดลงด้านล่าง หรือสลับเปิดขึ้นด้านบนหากอยู่ใกล้ขอบล่างของหน้าต่าง)
     - รองรับการควบคุมด้วยคีย์บอร์ด (ArrowUp, ArrowDown, Enter, Escape, Tab) และการคลิกภายนอกเพื่อปิดเมนู
     - นำ `overflow-hidden` ออกจากคอนเทนเนอร์ของตารางโควตาและเพิ่ม z-index ให้แถวที่กำลังโฟกัส (`focus-within:z-30`) เพื่อให้เมนูดรอปดาวน์แสดงผลได้อย่างถูกต้องไม่ถูกตัดขอบ


24. เปลี่ยนการแจ้งเตือนหน้า /staff/competitions จากเบราว์เซอร์ alert() เป็น In-app Toast และ Alert Banner:
   - นำ `alert()` เดิมทั้งหมดใน [components/shared/CompetitionManagement.tsx](components/shared/CompetitionManagement.tsx) ออก
   - เพิ่มระบบ Toast Notification ลอยมุมขวาบน (`fixed top-4 sm:top-6 sm:right-6 z-[100]`) แสดงผลเมื่อบันทึกข้อมูลสำเร็จ มีไอคอนเครื่องหมายถูกสีเขียว, ข้อความ "บันทึกข้อมูลการแข่งขันสำเร็จ" และปุ่มปิด พร้อมระบบนับเวลาปิดอัตโนมัติ (auto-dismiss 4.5 วินาที)
   - เพิ่ม Alert Banner สีแดงด้านบนแบบฟอร์มใน Modal แสดงผลเมื่อตรวจสอบข้อมูลไม่ผ่าน (เช่น ชื่อการแข่งขันว่าง, วันที่สิ้นสุดไม่ถูกต้อง, โควตากีฬาว่างก่อนเปิดรับสมัคร หรือข้อผิดพลาดจากเซิร์ฟเวอร์) พร้อมเลื่อนจอไปยังข้อความแจ้งเตือน (`formRef.current?.scrollTo({ top: 0, behavior: "smooth" })`) โดยไม่บล็อกหน้าจอด้วย native alert


25. เพิ่มการแจ้งเตือนระบุบัญชีผู้ใช้ใหม่ (New Users) และตัวกรองวันที่สมัครในหน้า /admin/users:
   - ไฮไลต์แถวด้วยพื้นหลังสีเหลืองอ่อนและแถบสีเหลืองที่ขอบซ้าย สำหรับผู้ใช้งานที่เพิ่งสมัครเข้ามาในระบบภายใน 1 วันล่าสุด โดยไม่แสดงป้ายข้อความเพิ่มเติม
   - แทนที่ตัวเลขสถิติเดิมในกล่อง Overview Stats ด้านบนตาราง ด้วย **"ผู้ใช้ใหม่ในหน้านี้ (1 วัน)"**
   - เพิ่มแถบเครื่องมือ **`DateFilterBar`** (กรองตามวันที่สมัคร/วันที่สร้างบัญชี) ให้ผู้ดูแลระบบสามารถเลือกวันที่เริ่มต้นและสิ้นสุด รวมถึงมีทางลัดเลือกช่วงเวลา (เช่น วันนี้, 7 วันล่าสุด, เดือนนี้, ปีนี้) ได้อย่างสะดวก
   - อัปเดต API `GET /api/admin/users` ให้รองรับพารามิเตอร์ `startDate` และ `endDate` สำหรับกรองวันที่ในระดับฐานข้อมูล
   - นำกล่องแจ้งเตือนข้อมูลบัญชีของตนเองออกตามความต้องการเพื่อให้หน้าจอสะอาดตา (ระบบป้องกันการจัดการบัญชีตนเองจากหลังบ้านยังคงทำงานอยู่ตามปกติ)



## Sport Master Data & Quota Integrity Fix
- **สาเหตุของปัญหา**: ฐานข้อมูลมีชื่อชมรมเป็น `ฟุลบอล` (สะกดด้วย ล ลิง) ขณะที่โควตาแข่งขันเก็บเป็น `ฟุตบอล` ทำให้เมื่อหน้า `/club/competitions` query เทียบชื่อกีฬาตรงตัว ระบบจึงไม่พบรายการแข่งขัน
- **การแก้ไขและป้องกันการเกิดซ้ำ (Strict Master List)**:
  1. สร้าง Master Data ชนิดกีฬา `SUPPORTED_SPORTS` และฟังก์ชัน `canonicalSportName()` ใน `lib/sports.ts`
  2. ยกเลิกการอนุญาตให้พิมพ์เพิ่มชนิดกีฬาอิสระ (Custom Sport) ในหน้าจัดการโควตา `/staff/competitions` (`components/shared/CompetitionManagement.tsx`) โดยเปลี่ยนเป็น dropdown จาก Master Data
  3. ปรับฟอร์มเพิ่มชมรมในหน้า `/admin/clubs` ให้เลือกชนิดกีฬาจาก Master Data เท่านั้น
  4. เพิ่ม Server-side Validation ใน `lib/validation.ts` (`competitionInput`), `app/api/clubs/route.ts` และ `app/api/clubs/[id]/route.ts` เพื่อบังคับและ normalize ค่าชนิดกีฬาผ่าน `canonicalSportName`
  5. อัปเดตข้อมูลชมรมในฐานข้อมูลจาก `ฟุลบอล` ให้เป็น `ฟุตบอล`
  6. เพิ่ม Unit tests ใน `tests/unit/sports.test.mjs` เพื่อทดสอบการรับค่ามาตรฐานและการปฏิเสธชื่อสะกดผิด/custom sport (53/53 tests passed)

## Dynamic Sport Dropdown Fix — 2026-10-08
- แก้ `components/shared/CompetitionManagement.tsx`: เปลี่ยน native `datalist` ที่กรองตามค่าปัจจุบันในโหมดแก้ไข เป็น controlled dropdown ที่แสดงกีฬาทั้งหมดเสมอ และมีตัวเลือก `+ เพิ่มชนิดกีฬาใหม่` สำหรับกรอกชื่อใหม่
- เพิ่ม `app/api/sports/route.ts` เพื่อรวมรายชื่อ SportConfig, ชมรม และโควตาเป็นรายการกีฬาที่ใช้งานได้
- เพิ่ม `lib/sport-service.ts` เพื่อสร้าง SportConfig อัตโนมัติแบบ normalize เมื่อบันทึกโควตาหรือชมรมที่มีกีฬาใหม่
- Seed ค่าเริ่มต้น 18 ชนิดกีฬาใน SportConfig แล้ว
- ตรวจแล้ว: `npx tsc --noEmit`, `npm run test:unit` (53/53), `npm run lint`, และ `npm run build` ผ่าน โดย build แสดงเฉพาะคำเตือน middleware convention เดิมของ Next.js

## Staff Profile API — 2026-10-08
- เพิ่ม `GET` และ `PUT /api/staff/profile` สำหรับ `STAFF` และ `ADMIN` โดยอ้างอิง `session.id` เท่านั้น
- PUT แก้ไขได้เฉพาะ `email`; ใช้ Zod strict validation, trim/lowercase, จำกัด 254 ตัวอักษร และปฏิเสธ mass-assignment fields
- ใช้ Prisma `select` เฉพาะ `id`, `email`, `role`, `createdAt`, `updatedAt`; ไม่ส่ง password หรือข้อมูล sensitive
- เพิ่ม regression tests ใน `tests/unit/staff-profile.test.mjs`; unit tests ทั้งหมดผ่าน 58/58, typecheck และ lint ผ่าน
- Production build ผ่านสมบูรณ์ และตรวจพบ route `/api/staff/profile` ใน build output


## Club Profile API Hardening — 2026-10-09
- เพิ่ม `GET /api/clubs/[id]` รองรับการดูโปรไฟล์ชมรมสำหรับ `ADMIN` หรือเจ้าของชมรม (`session.clubId === id`) ป้องกัน 405 Method Not Allowed
- เพิ่ม Zod strict validation ใน `clubProfileInput` (`lib/staff-profile-validation.ts`) ป้องกัน Mass Assignment และตัดฟิลด์แปลกปลอม (เช่น password, role)
- เพิ่ม ID format check ในระดับ route ป้องกันค่า ID ผิดปกติ
- เพิ่ม regression tests ใน `tests/unit/club-profile-validation.test.mjs` (ผ่าน 4/4)
- ตรวจสอบความสมบูรณ์: `npm run test:unit` (62/62 ผ่าน), `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm run build` (ผ่านสมบูรณ์)

21. ติดตั้งและทดสอบชุด Playwright E2E Integration Suite สำหรับระบบยืนยันตัวตน (/login):
   - เพิ่ม devDependencies @playwright/test พร้อมดาวน์โหลด browser binaries (Chromium, Firefox, WebKit)
   - เพิ่ม scripts ใน package.json: "test:e2e": "playwright test" และ "test:e2e:ui": "playwright test --ui"
   - สร้างการตั้งค่า playwright.config.ts รองรับ auto webServer กับ Next.js บนพอร์ต 3000
   - สร้างชุดทดสอบที่ 	ests/e2e/login.spec.ts ครอบคลุม UI controls, HTML5 required validation, ข้อความแจ้งเตือนเมื่อ credential ผิดพลาด (ตรวจสอบ HTTP 401 และกล่อง alert), การตรวจสอบ payload ว่างบน POST /api/auth/login, และการตั้งค่า HttpOnly cookie
   - ตรวจสอบความถูกต้องด้วย 
pm run test:e2e, 
pm run test:unit, 
px tsc --noEmit, 
pm run lint และ 
pm run build ทั้งหมดผ่านสมบูรณ์# Handoff Note: Competition Settings Refactoring

- **Feature**: Refactored the /staff/settings page to allow managing configuration and criteria independently for each competition year/edition.
- **Why**: Competition rules, GPAX requirements, age limits, and participation quotas can change yearly. It's unsafe to have one global setting overwrite historical records or break backward compatibility.
- **Implementation**:
  - The UI now features a dynamic interface for staff to select, create, or clone year criteria (e.g., 2568).
  - Admins can configure general info (host, region, dates) and strict rules (GPAX, Age limit, Max Participations for Bachelor/Graduate).
  - Saved as a JSON object under the COMPETITION_EDITIONS_CONFIG key in the SystemSetting table. No Prisma schema changes or migrations were needed, strictly adhering to the database rules.
  - Backward compatibility is maintained for legacy schedule settings.
  - The core logic in lib/rule-checker.ts was enhanced to dynamically accept custom parameters for age, GPAX, and max participation limits per competition edition while defaulting to the legacy hardcoded TUG 52 rules.
- **Verification**:
  - Type checking (
px tsc --noEmit) passes with 0 errors.
  - Linting (
pm run lint) passes.
  - All 62 unit tests pass. Unicode rules inside lib/rule-checker.ts were correctly preserved using UTF-8 No BOM.

## Update: Sports Inclusion / Toggle per Competition Year
- **Feature**: Added capability to enable/disable (เปิด-ปิด) specific sports for each competition year edition independently.
- **UI**:
  - In /staff/settings, section "2. ชนิดกีฬาที่เปิดแข่งขันประจำปี (Sports Inclusion)" shows interactive pill badges for each sport.
  - Active sports are highlighted with emerald badges and "(เปิด)"; inactive sports are dimmed with "(ปิด)".
  - Includes real-time search/filter for sports and quick buttons to "เปิดทั้งหมด" / "ปิดทั้งหมด".
  - Shows total count of active sports in the header and in the summary sidebar card.
  - When creating or cloning a year edition, the sport configuration is cloned seamlessly.
- **API**:
  - GET /api/staff/settings: returns llSports containing the aggregated sports catalog from all system sources.
  - GET /api/sports: now supports optional query param ?year=... to filter available sports down to only those enabled for that competition year. Backward compatibility fully preserved when year is omitted or when all sports are open.

## Update: Separate Sport Inclusions for Qualifier vs. Main Rounds
- **Feature**: Decoupled sports configuration between **รอบคัดเลือก (Qualifier Round)** and **รอบมหกรรม (Main Tournament)** for each competition year edition.
- **Context**: In university games, the sports contested in regional qualifying rounds (typically team/ball sports like Football, Futsal, Volleyball, Basketball, Petanque) differ significantly from sports that advance directly to the main tournament (such as Athletics, Swimming, Martial Arts, Esports, etc.).
- **UI (/staff/settings)**:
  - Added interactive round switch tabs:
    1. **รอบคัดเลือก (Qualifier)** (with blue accent & badge count)
    2. **รอบมหกรรม (Main Tournament)** (with purple accent & badge count)
  - Staff can toggle sports independently for each round.
  - The right-hand summary card now displays both counts:
    - กีฬาคัดเลือก (Qualifier): X / Total ชนิด
    - กีฬามหกรรม (Main): Y / Total ชนิด
- **API (/api/sports)**:
  - Accepts ?round=qualifier and ?round=main alongside ?year=....
  - Filters to enabledSportsQualifier or enabledSportsMain respectively.
  - Retains full backward compatibility with fallback logic.

## Staff Analytics UI & Quota Summary Polish — 2026-10-11
- Refactored /staff/analytics current selection tab and components/shared/AnalyticsSummary.tsx to streamline operational hierarchy without modifying underlying API, auth, or schema rules.
- **KPI Metrics**: Enhanced summary cards with status accents, formatted Thai numbers, and clearer context for unique athletes vs. applications and quota fill rates.
- **Quota Overview**: Replaced repetitive progress cards with a consolidated quota fulfillment table showing applications, approved counts, progress bars, fill percentages, and badge shortfall statuses.
- **Filter Bar**: Added an explicit section header and an enabled/disabled "ล้างตัวกรอง" button for clearing filters back to defaults quickly.
- **Workflow & Layout**:
  - Removed full-width promotional banner for Fitness within the current selection tab to keep analytics focused.
  - Converted the large snapshot creation form into a collapsible <details> panel to prevent crowding out operational metrics.
  - Added direct quick links to /staff/applications and /staff/selection so staff can drill down immediately.
  - Cleaned up placeholder notices regarding missing APIs.
- **Verification**:
  - cmd /c "npx tsc --noEmit" passed with 0 errors.
  - cmd /c "npx eslint app/staff/analytics/page.tsx components/shared/AnalyticsSummary.tsx" passed with 0 errors.
  - cmd /c "npm run test:unit" passed (62/62 tests passed).
  - Production build compiled successfully (
pm.cmd run build), generating 71 static/dynamic routes including /staff/analytics.
## Staff Fitness Dashboard UX Refactor — 2026-10-11
- Refactored components/shared/StaffFitnessSection.tsx without changing fitness parsing, import, matching, or data-source logic.
- Added sport-scoped KPI cards for total athletes, pass rate, strong results (ดี/ดีมาก), and follow-up queue.
- Separated primary actions from import-data management; destructive reset actions now live inside a secondary disclosure menu.
- Added clearer sport context, imported-data handling, unified search/filter toolbar, and a reusable clear-filter action.
- Grouped the results table header into athlete data, กกมท. test stations, and assessment results; added sticky left identity columns for horizontal scrolling.
- Verification: 
px tsc --noEmit, targeted ESLint for StaffFitnessSection.tsx, and 
pm run test:unit (62/62) passed. Production build compiled successfully through TypeScript; Next.js still reports the existing middleware convention warning.
## Sport Type & Registration Rules (Phases 1 & 2) — 2026-10-12
- เพิ่ม Enum `SportType` (`TEAM`, `INDIVIDUAL`) และฟิลด์ `sportType` ใน `SportConfig` (default: `INDIVIDUAL`) พร้อม migration file `prisma/migrations/20261012010000_sport_type/migration.sql` (ยังไม่รัน migrate กับ DB ตาม core rules)
- เพิ่ม Helper กลาง `lib/sport-type.ts` สำหรับจำแนกประเภทกีฬา (`isTeamSport`, `isIndividualSport`, `getSportEntryLimit`, `isSportEntryCountAllowed`) โดยมี default mapping ชนิดกีฬาเดิมทั้งหมด (ฟุตบอล, บาสเกตบอล, ฟุตซอล, วอลเลย์บอล, อีสปอร์ต, เซปักตะกร้อ เป็น TEAM; กรีฑา, ว่ายน้ำ, แบดมินตัน ฯลฯ เป็น INDIVIDUAL)
- กฎจำนวนรายการ: กีฬาแบบทีมเลือกได้ 1 รายการต่อใบสมัคร, กีฬาแบบเดี่ยวเลือกได้สูงสุด 4 รายการ
- ปรับฟอร์มลงทะเบียนนักกีฬา `app/athlete/register/page.tsx`:
  - ซ่อมตำแหน่ง JSX Step 2 ให้ render ถูกต้อง
  - เมื่อเลือกกีฬาแบบทีมและมีรายการแล้ว จะซ่อนฟอร์มและปุ่มเพิ่มประเภท/รุ่น พร้อมแสดงแถบแจ้งเตือนเงื่อนไขกีฬาแบบทีม
  - กีฬาแบบเดี่ยวสามารถเลือกเพิ่มได้ตามเพดานสูงสุด 4 รายการ พร้อมปุ่มลบรายการ
- Server-side Validation ใน `POST /api/applications` และ `PUT /api/applications/[id]`:
  - ตรวจสอบ `sportEntries.length` กับ `getSportEntryLimit(sport)` ปฏิเสธด้วย HTTP 400 ทันทีหากกีฬาแบบทีมส่งมาเกิน 1 รายการ
- ผลการทดสอบ:
  - Unit tests: ผ่านครบ 66 tests (`npm run test:unit`)
  - Typecheck: ผ่าน 0 errors (`npx tsc --noEmit`)
  - ESLint: ผ่านสำหรับไฟล์ที่เกี่ยวข้อง 0 errors
  - Build notes: `next build` ติดการดาวน์โหลดภายนอกของ Google Fonts Prompt ตามสภาพแวดล้อมเครือข่ายเดิมที่ระบุไว้ในเอกสาร
## Sport Type Workflow, Quotas, Export & Match Structure (Phases 3 & 4) — 2026-10-12
- **แก้ไขปัญหา JSX และ Hooks ในหน้าตั้งค่ากีฬา (`app/staff/sports-config/page.tsx`)**:
  - แก้ไขปัญหาตัวแปร `selectSport` ถูกเรียกใช้ก่อนประกาศ (Declaration order / immutability)
  - ปรับการโหลดข้อมูลใน `useEffect` ให้ใช้ pattern asynchronous cleanup ป้องกัน cascading renders
  - เพิ่มการเลือกประเภทกีฬา (`currentSportType`: `TEAM` / `INDIVIDUAL`) ใน state, ฟอร์ม และส่งไปยัง API
  - แสดง Badge ป้ายกำกับ "ทีม" / "บุคคล" ในรายการชนิดกีฬา
- **API ตั้งค่าชนิดกีฬา (`app/api/staff/sport-categories/route.ts` & `app/api/sport-categories/route.ts`)**:
  - กำจัด `any` types ทั้งหมดโดยใช้ `CustomSportConfig` type-safe definition
  - ปรับปรุงการบันทึก `SportConfig` โดยใช้ transaction ตรวจสอบชื่อกีฬา (`findFirst`) ก่อนสร้างหรืออัปเดต เพื่อความปลอดภัยของข้อมูล
  - รวมค่า `sportType` จากฐานข้อมูลและการตั้งค่าระบบส่งกลับไปยัง client
- **จัดการโควตาการแข่งขัน (`components/shared/CompetitionManagement.tsx`, `lib/validation.ts`, `prisma/schema.prisma`)**:
  - เพิ่มฟิลด์ `maxEntriesPerAthlete` และ `maxEntriesPerEvent` ในโมเดล `SportQuota`
  - สร้างไฟล์ migration ที่เตรียมไว้ `prisma/migrations/20261012020000_sport_quota_and_matches/migration.sql` (ไม่ได้รัน migration กับฐานข้อมูลจริงตามกฎข้อบังคับ)
  - รัน `npm run db:generate` อัปเดต Prisma Client
  - ปรับปรุงหน้า `CompetitionManagement`:
    - กีฬาแบบทีม: กำหนดตัวจริง (`maxStarters`) และตัวสำรอง (`maxSubstitutes`) พร้อมยอดรวมทั้งทีม
    - กีฬาแบบเดี่ยว: กำหนดโควตาสูงสุดต่อนักกีฬา 1 คน (`maxEntriesPerAthlete`) และโควตารวมต่อประเภทย่อย (`maxEntriesPerEvent`) พร้อมป้าย "กีฬาเดี่ยว"
    - ดึงการตั้งค่า `sportType` จากระบบอัตโนมัติ
- **ระบบ Roster & Workflow ฝั่งชมรมและเจ้าหน้าที่**:
  - `app/club/review/page.tsx`:
    - กีฬาประเภททีม: แสดงและคัดเลือกเป็นตัวจริง (`main`) และตัวสำรอง (`reserve`)
    - กีฬาประเภทเดี่ยว: แสดงและคัดเลือกเป็น "ผ่านการคัดเลือก" (`selected`) พร้อมจัดกลุ่ม Start List ตาม Category / Division
    - เพิ่มปุ่มส่งออกรายงาน: ส่งออกเป็น "Team Sheet (CSV)" สำหรับกีฬาแบบทีม และ "Start List (CSV)" สำหรับกีฬาแบบเดี่ยว
  - `components/shared/StaffRosterReview.tsx` & `app/club/tracking/page.tsx`:
    - ปรับการแสดงผลและนับจำนวนให้รองรับทั้ง `main`, `reserve`, และ `selected` ("ผ่านการคัดเลือก")
  - `lib/roster-service.ts`:
    - ตรวจสอบโควตาสำหรับกีฬาแบบเดี่ยวโดยใช้ `maxEntriesPerAthlete` และ `maxEntriesPerEvent` (พร้อม fallback ไปยัง `maxStarters`/`maxSubstitutes`)
  - `lib/publication-gate.ts`:
    - แยกการตรวจสอบเกณฑ์ความพร้อมระดับทีม (Team Readiness 50%) ให้ทำเฉพาะกีฬาแบบทีมเท่านั้น โดยไม่กีดกันกีฬาประเภทบุคคล
- **ระบบส่งออกรายงานและโครงสร้างผลการแข่งขันในอนาคต (Phase 4)**:
  - เพิ่มฟังก์ชัน `exportTeamSheetToCSV` และ `exportStartListToCSV` ใน `lib/export-helpers.ts` พร้อมรองรับ UTF-8 BOM และป้องกัน Formula Injection
  - เพิ่มโมเดลและโครงสร้างข้อมูลเตรียมพร้อมสำหรับผลการแข่งขันในอนาคตใน `prisma/schema.prisma`:
    - `enum CompetitionEventType` (`TEAM_MATCH`, `INDIVIDUAL_MATCH`, `RANKING`, `TIMED`)
    - `model CompetitionMatch` (รองรับการแข่งขันทั้งแบบทีม vs ทีม, บุคคล vs บุคคล, และการจัดอันดับ/จับเวลา)
    - `model CompetitionMatchEntry` (รองรับคะแนน, เวลา, อันดับ, ผลชนะ/แพ้ ทั้งระดับชมรมและรายบุคคล)
- **การตรวจสอบความถูกต้อง (Verification)**:
  - `npx tsc --noEmit`: ผ่าน 0 errors
  - `npx eslint`: ผ่าน 0 errors และ 0 warnings บนทุกไฟล์ที่เกี่ยวข้อง
  - `npm run test:unit`: ผ่านครบทุก 69 unit tests (เพิ่มการทดสอบสำหรับ sport-type override และ export-helpers)

## Prisma Migration Recovery - 2026-10-12
- Root cause: migration `20261005010000_application_club_membership` contained a UTF-8 BOM before the first SQL statement, causing PostgreSQL error 42601 at `ALTER` and Prisma P3009.
- Repaired the migration as BOM-free UTF-8 and made the pre-existing `Application.clubId`, composite index, and foreign-key creation safe to re-run without deleting data.
- Marked the failed migration attempt rolled back with Prisma Migrate, then deployed `20261005010000_application_club_membership`, `20261012010000_sport_type`, and `20261012020000_sport_quota_and_matches` successfully.
- Verified `SportQuota.maxEntriesPerAthlete`, `SportQuota.maxEntriesPerEvent`, the application membership index, and competition match tables in the target database.
- Regenerated Prisma Client and successfully executed the same nested `application.findMany` query used by `GET /api/applications`; Prisma P2022 is resolved.
- Verification:
  - `npx tsc --noEmit`: passed (0 errors)
  - `npm run lint`: passed (0 errors, 0 warnings)
  - `npm run test:unit`: passed all 69 unit tests
  - Database schema: verified columns `SportQuota.maxEntriesPerAthlete`, `SportQuota.maxEntriesPerEvent`, index `Application_clubId_competitionId_idx`, and tables `CompetitionMatch` / `CompetitionMatchEntry` in the target PostgreSQL database
  - Build note: `npm run build` still fails solely on downloading the external Google Font `Prompt` in sandboxed/restricted network environments, matching the existing baseline documented above.

## Offline production build fix - 2026-10-12
- Removed the `next/font/google` Prompt import from `app/layout.tsx`; restricted build environments no longer need to download Google Fonts during compilation.
- Kept Prompt as the first CSS font choice with system Thai fallbacks in `app/globals.css`.
- Verification: `npx tsc --noEmit` passed, `npm run lint` passed with 0 errors and 0 warnings, `npm run build` passed, and `npm run test:unit` passed all 69 tests.

## Migration readiness correction - 2026-10-12
- Read-only `prisma migrate status` against the configured Supabase PostgreSQL database reports `Database schema is up to date!` with all 12 repository migrations applied, including `20261012020000_sport_quota_and_matches`.
- Added `scripts/release-preflight.mjs` as the read-only database preflight referenced by the release runbook. It checks active ADMIN availability, duplicate `SportQuota` groups, and reachability of the latest schema models.
- Added `db:preflight` and `db:status` npm scripts. The preflight passed: 1 active ADMIN, 0 duplicate quota groups, and latest models readable.
- Earlier notes saying the latest migrations were unapplied are historical and superseded by this verification. No migration or `db:push` was run in this check.

## Environment configuration hard hardening - 2026-10-12
- Enforced strict server-only loading and validation via `lib/server-env.ts` for `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PRIVATE_DOCUMENT_BUCKET`.
- Added `import "server-only";` guards to `lib/auth.ts`, `lib/prisma.ts`, and `lib/supabase-admin.ts` to block accidental bundling into client components.
- Added `npm run env:check` (`scripts/check-env.mjs`) to validate required host variables, prevent placeholder secrets, enforce HTTPS on Supabase origins, and verify anon key isolation without printing secrets.
- Added unit test `tests/unit/server-env.test.mjs` verifying fast failure on missing or whitespace environment variables.
- Verification: `npx tsc --noEmit` passed, `npm run lint` passed with 0 errors and 0 warnings, `npm run test:unit` passed all 71 unit tests, `npm run env:check` passed, and `npm run build` completed successfully.
## Staff Requests Quality Gate - 2026-10-13
- Completed the `staff/requests` flow audit and implementation hardening: server-side STAFF/ADMIN authorization now consistently uses the shared `api` guard, the UI supports status and date filtering, load/action errors, trimmed rejection reasons, and displays rejection reasons to staff and clubs.
- Added `lib/staff-request-validation.ts` as a pure validation seam for reviewer roles and approve/reject input normalization.
- Added `tests/unit/staff-request-validation.test.mjs` covering STAFF/ADMIN authorization policy, approval clearing an old rejection reason, rejection reason trimming, invalid status, blank reason, and the 5,000-character limit.
- Verification: `npx tsc --noEmit` passed, `npm run lint` passed with 0 errors and 0 warnings, `npm run test:unit` passed all 75 tests, and `npm run build` passed.
- Build note: Next.js reports the existing middleware file convention as deprecated in favor of proxy; this is a warning only and does not fail the build.
## Phase 5 Handoff Update - 2026-10-13

### Completed in this worktree
- Phase 1 cleanup completed: removed `temp_page.txt` and `tmp_writer.js`; ignored `/test-results/`, `/playwright-report/`, and `/.freebuff/`.
- Phase 2 implementation audit completed for `staff/requests`: added status/date filtering, load and action error handling, rejection-reason display, input limits, and server-side authorization consistency.
- Phase 3 quality gate completed: `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` (75 passed), and `npm run build` passed locally.
- Added `lib/staff-request-validation.ts` and `tests/unit/staff-request-validation.test.mjs` for reviewer-role and approve/reject decision validation.
- Phase 4 staging started: the Security & DB Core candidate is staged (28 files); no commit has been created.

### Current handoff state
- The worktree contains a larger pre-existing application changeset spanning backend APIs, Prisma, services, frontend pages, shared components, tests, and documentation.
- Only the Security & DB Core group is staged. Backend/API, frontend/shared UI, and tests/documentation remain unstaged for separate review and staging.
- The production build emits a non-blocking Next.js warning that the `middleware` convention is deprecated in favor of `proxy`.

### Next safe action
- Review the staged Security & DB Core diff, then stage the remaining groups separately. Create commits only after explicit approval.
