# ระบบลงทะเบียนนักกีฬา

Next.js 16 / React 19 / Prisma 7 / PostgreSQL สำหรับนักกีฬา ชมรม กองกิจการนิสิต และเจ้าหน้าที่ทีม

## การทำงานใน CI (Continuous Integration)

ระบบได้ตั้งค่า GitHub Actions CI ไว้ที่ `.github/workflows/ci.yml` สำหรับตรวจสอบเมื่อมี Push หรือ Pull Request
ในการรัน `npm run db:generate` และ `npm run build` บน CI นั้น ระบบจำเป็นต้องอ้างอิง Environment variables พื้นฐาน
แต่เนื่องจาก CI เป็นเพียงการตรวจสอบโค้ด ไม่ได้เชื่อมระบบภายนอกจริง จึงใช้ **ค่า Dummy** แทนใน Workflow (เช่น `postgresql://dummy:dummy@localhost:5432/dummy`, `dummy-secret` ฯลฯ)
เพื่อให้กระบวนการทำงานและตรวจสอบความถูกต้องสมบูรณ์ได้โดยไม่จำเป็นต้องแนบ Credentials จริง

## เริ่มพัฒนา

ใช้ Node.js 22.18+ (ทดสอบด้วย 25.9) และตั้งค่าไฟล์ `.env` ที่ไม่ commit:

- `DATABASE_URL`: PostgreSQL สำหรับ runtime
- `DIRECT_URL`: PostgreSQL สำหรับ Prisma CLI
- `JWT_SECRET`: secret ฝั่ง server
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Storage ฝั่ง server
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser
- `PRIVATE_DOCUMENT_BUCKET`: optional; ค่าเริ่มต้น `athlete-private` ต้องต่างจาก `athlete-docs`

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run storage:private
npm run dev
```

ห้ามให้ client อ่าน service-role key หรือใช้ public bucket สำหรับเอกสาร Phase 4 สคริปต์ storage สร้าง bucket แบบ private และหยุดหากชื่อที่กำหนดเป็น public; ไม่แก้ policy ของ bucket เดิม

## Migration และข้อมูลเดิม

มี baseline `20260919000000_baseline`, migration Phase 4 และสถานะเปิด/ปิดบัญชี:

- **ฐานใหม่ว่าง:** ใช้ `npm run db:migrate` เพื่อลงทั้งหมดตามลำดับ
- **ฐานเดิมที่ยังไม่มี migration history:** สำรองข้อมูล ตรวจปลายทาง `DIRECT_URL`, ตรวจ schema ด้วย `npx prisma db pull --print` และเทียบกับ SQL ใน baseline ให้ตรงก่อน ใช้ `npx prisma migrate resolve --applied 20260919000000_baseline` เฉพาะเมื่อยืนยันว่าฐานมี schema baseline อยู่แล้ว จากนั้น `npm run db:migrate`
- ฐานทดสอบปัจจุบันผ่านการตรวจ diff ก่อน baseline และลง migration แล้ว ห้าม resolve ซ้ำหรือใช้ `migrate reset` / `--accept-data-loss`
- ไม่มีการสร้างบัญชีชมรม ประวัติส่ง หรือประวัติอนุมัติย้อนหลังให้ข้อมูลเดิม

## Phase 4

- เจ้าหน้าที่ทีมสร้างบัญชีที่ `/team-official/signup` แล้ว login ด้วยอีเมล เลือกการแข่งขัน/ชมรมที่ `/team-official/register`; ดูผลที่ `/team-official/status`
- ชมรมจัดบัญชีที่ `/club/review` และพิจารณาเจ้าหน้าที่ทีมที่ `/club/officials`
- กองกิจฯ ตรวจ/ส่งคืนบัญชีที่ `/staff/rosters`, พิจารณาเจ้าหน้าที่ทีมที่ `/staff/officials`, ดูสถิติและ snapshot ที่ `/staff/analytics`
- ตัวจริง/สำรองต้องมาจากบัญชีชมรม หลังส่งแก้ผ่าน API เดิมไม่ได้ กองกิจฯ ต้องส่งคืนก่อนแก้ และส่งคืนไม่ได้หลังมีผล FINAL_SELECTED
- เอกสาร PDF/JPEG/PNG ≤ 5 MB เปิดด้วย signed URL อายุ 60 วินาที ไฟล์ที่เคยส่งแล้วเก็บเป็นประวัติและลบผ่านผู้สมัครไม่ได้
- API ใช้ session และสถานะบัญชีจริง; `proxy.ts` ใช้ Node.js runtime ของ Next.js 16 สำหรับ route guard
- Snapshot เก็บเฉพาะยอดรวมใน PostgreSQL พร้อมตัวกรอง/ผู้บันทึก/รุ่นข้อมูล ไม่เก็บข้อมูลนักกีฬารายคน

## ตรวจสอบและทดสอบซ้ำ

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Integration tests เรียก HTTP จริงและเขียน fixture ลง PostgreSQL/Storage จึงต้องเปิด server ที่เชื่อม **ฐานทดสอบเดียวกัน** ก่อน เช่น `npm run dev -- --port 3100`

PowerShell (เติม connection string ของฐานทดสอบใน terminal ของตนเอง ไม่ใส่ใน Git):

```powershell
$env:TEST_BASE_URL = "http://localhost:3100"
$env:TEST_DATABASE_URL = "<PostgreSQL test connection string>"
$env:TEST_ALLOW_WRITE = "yes"
npm run test:integration
```

ใช้ `.env` สำหรับ Supabase/JWT ที่ตรงกับ server ตัว runner รับเฉพาะ localhost และไม่มี database fallback; fixture ใช้ชื่อสุ่มและเก็บ ID สำหรับล้างข้อมูลเฉพาะรอบใน `finally` หาก cleanup ล้มเหลว ตรวจ `test-results/phase4-fixtures.json` และจัดการเฉพาะ ID ที่ระบุ ห้ามล้างทั้งฐาน ผลล่าสุดอยู่ใน `test-results/phase4-integration.json`

## Build และขอบเขตงาน

`npm run build` แล้ว `npm start` สำหรับตรวจ production mode ในเครื่อง งานนี้ไม่ deploy และยังคงเครื่องมือ dev/superadmin ตามข้อตกลง Build ไม่ได้นำ route เหล่านี้ออกอัตโนมัติ ต้องจัดการก่อนเผยแพร่จริง ไม่รวมระบบงบประมาณ เกณฑ์กีฬาใหม่ หรือการส่งอีเมล ดูผลตรวจและข้อจำกัดใน `TEST-REPORT.md`

## Regression Phase 4 + Phase 5

สำหรับยืนยัน production mode ในเครื่อง ใช้ `npm run build` แล้ว `npm start -- --port 3101` กำหนด `TEST_BASE_URL=http://localhost:3101` พร้อม `TEST_DATABASE_URL` ที่ตรงกับ server และ `TEST_ALLOW_WRITE=yes` จากนั้นรัน `npm run test:integration` (Phase 4: 15 สถานการณ์, Phase 5: 8 สถานการณ์, Competition Status Gate: 6 สถานการณ์; runner นับ parent อีก 3 รวม 32 tests)

Browser smoke ใช้ `node scripts/regression-ui-fixtures.mjs create` หลังตั้งตัวแปรฐานทดสอบข้างต้น; บัญชีชั่วคราวใช้รหัสผ่าน `Fixture!Ui2026` และอีเมล/ID ใน `test-results/regression-ui-fixtures.json` ตรวจ login, สถานะ/รายละเอียดทั้งมีและไม่มีบัญชีชมรม, ตัวกรอง/empty/error/retry ของเจ้าหน้าที่, Analytics/Snapshot และฟอร์มเปลี่ยนประธานเมื่ออีเมลชนกัน เมื่อจบรัน `node scripts/regression-ui-fixtures.mjs cleanup` ซึ่งล้างเฉพาะ ID ใน manifest ห้ามใช้กับ production หรือปล่อยบัญชีทดสอบค้างไว้

หลักฐานรอบล่าสุด: `test-results/regression-validation.json` ระบุ revision/source hashes/build ID, `regression-integration.txt` เก็บผล HTTP และ `regression-ui.json` ระบุ browser checks/cleanup; อ่านข้อจำกัดใน TEST-REPORT.md
