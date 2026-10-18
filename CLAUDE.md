@AGENTS.md

# Project Notes for Claude

รายละเอียดเชิงลึกอยู่ใน `docs/` อ่านเมื่อจำเป็น: `DATABASE.md`, `API_INVENTORY.md`, `WORKFLOWS.md`, `TECH_DEBT.md`, `ARCHITECTURE.md`
งานปัจจุบัน: `docs/NEXT_TASK.md` / ประวัติ: `docs/HANDOFF.md`

## Roles และพื้นที่หน้าเว็บ (ตรวจสิทธิ์ใน `middleware.ts` + `lib/auth.ts`)
- `ATHLETE` → `/athlete/*` | `CLUB` → `/club/*` | `STAFF` → `/staff/*` (+ `/admin/competitions`)
- `ADMIN` → `/admin/*` และ `/staff/*` | `TEAM_OFFICIAL` → `/team-official/*`
- ตัดสินสิทธิ์จาก JWT cookie `token` + ตรวจ DB ใน `getSession()` ทุกครั้ง ห้ามเชื่อ cookie `role`
- บัญชี CLUB มี 2 แบบ: `Club` รุ่นเก่า (`session.id === clubId`) และ `User` role CLUB ที่ผูก `clubId` อย่าทำให้แบบใดแบบหนึ่งพัง

## รูปแบบเขียน API (ใช้แบบเดียวกับ route ใหม่)
- ใช้ `api(request, roles, async session => ...)` จาก `lib/phase4-server.ts` (ตรวจ session/role, แปลง error เป็น JSON ภาษาไทย)
- เขียนข้อมูลใน `atomic(tx => ...)` (Serializable) และใช้ `ensure(cond, msg, status)` ตรวจเงื่อนไข
- ข้อมูลที่ถูกแก้พร้อมกัน (roster, official application) ใช้ฟิลด์ `version` เป็น optimistic lock
- Validate input ใน `lib/validation.ts` หรือ validator ของโมดูลนั้น (`lib/performance-validation.ts` ฯลฯ)
- ไฟล์แนบเก็บเป็น `PrivateDocument` และอ้างด้วย `/api/documents/{id}/download` ไม่เก็บ URL ตรง

## กฎธุรกิจที่กระทบหลายจุด (แก้ที่เดียวแล้วต้องตามแก้ที่อื่น)
- คุณสมบัตินักกีฬา: GPAX ≥ 2.00, อายุ ≤ 28 ปี (เทียบปีแข่งขัน), เข้าร่วมไม่เกิน 5 ครั้ง → `lib/rule-checker.ts`, `lib/athlete-eligibility.ts` (ใช้ซ้ำใน login, register, import, อนุมัติ, ประกาศผล)
- หลักฐานที่ต้องผ่าน: `REQUIRED_EVIDENCE_ITEMS` (`lib/evidence-verification.ts`) ยกเว้นผลสมรรถภาพชั่วคราว; ผลงานย้อนหลัง ≤ 2 ปีผ่อนปรน → ใช้ร่วมกันใน roster, team readiness, `lib/publication-gate.ts`
- เอกสาร UP Academy / ผลสมรรถภาพ / หนังสือไม่มีชมรม ถูก "ซ่อน" ใน UI (`ATHLETE_VISIBLE_DOCUMENT_FIELDS`) แต่ยังอยู่ใน schema และ API ห้ามลบ
- Excellence (`/staff/excellence`) = กรีฑาประเภทลู่เท่านั้น (เพศอ่านจาก `Application.category` "ลู่ (ชาย)/(หญิง)") แผนและผลทดสอบซ้ำเก็บใน `FitnessTestResult.scores._excellence.v2` (มี `revision` เป็น optimistic lock) เป้าเวลาแยกรายการ+เพศใน `SystemSetting` key `ATHLETICS_TRACK_BENCHMARKS` ผลเวลาใน `CompetitionMatch`(TIMED, `division` = รายการ) อย่าเขียนทับ `scores` ทั้งก้อน และห้ามลบ `_excellence`/`SPORT_BENCHMARKS` รุ่นเดิมที่ยังอยู่ใน DB

## ข้อควรระวัง
- Schema/migration: ห้ามรัน `db:push` / `prisma migrate` เอง ต้องได้รับคำสั่ง
- ข้อความ UI/error เป็นภาษาไทย
- ไม่มี email แจ้งเตือน; การกู้รหัสผ่านทำโดย ADMIN ออกรหัสชั่วคราว
- มีไฟล์ที่ยังไม่ commit จำนวนมาก (Excellence, fitness) ตรวจ `git status` ก่อนแก้
- `temp_clone/`, `tmp/`, `test-results/`, `playwright-workshop/` ไม่ใช่ซอร์สหลัก
