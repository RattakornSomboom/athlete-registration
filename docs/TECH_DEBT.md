# Known Issues และ Technical Debt

ที่มา: การ onboarding ด้วยการอ่านโค้ด (ไม่ได้รัน test/build). สถานะ "ยืนยัน" = เห็นในโค้ดโดยตรง

## ความปลอดภัย
| # | ปัญหา | สถานะ | ไฟล์ |
|---|---|---|---|
| 1 | ไม่มี rate limit / lockout ที่ login, register | ยืนยัน (grep ไม่พบ) | `app/api/auth/login/route.ts`, `register/route.ts` |
| 2 | Login ตอบ "ไม่พบบัญชีผู้ใช้" แยกจากรหัสผิด (user enumeration) | ยืนยัน | `app/api/auth/login/route.ts` |
| 3 | `GET /api/clubs` สาธารณะ คืน email ชมรม (ใช้เป็น username login) | ยืนยัน | `app/api/clubs/route.ts` |
| 4 | ไม่พบ security headers/CSRF token | ยืนยัน (ไม่มีใน `next.config.ts`) | `next.config.ts` |
| 5 | `xlsx@0.18.5` อาจมี CVE ที่ทราบ | **ยังไม่ตรวจ** รัน `npm audit` | `package.json` |
| 6 | `getSession` query DB ทุก request (รวม middleware) | ยืนยัน | `lib/auth.ts` |
| 7 | JWT 24 ชม. ไม่มี revoke list (เพิกถอนผ่านเปลี่ยนรหัส/isActive) | ยืนยัน | `lib/auth.ts` |

## สถาปัตยกรรม / ข้อมูล
- route 2 สไตล์ (`api()` vs try/catch เอง) ข้อความ/สถานะ error ไม่สม่ำเสมอ
- Excellence เก็บใน JSON `scores._excellence.v2` ต้องตรวจว่า `lib/fitness-service.ts` / `fitness-import-service.ts` ไม่เขียนทับ (มี unit test ใน `excellence-validation.test.mjs`)
- ผลแข่ง Excellence ใช้ `CompetitionMatch` (sport `กรีฑา`, `division` = รหัสรายการ เช่น `100m`, `longJump`): ลู่ = `eventType` TIMED + `timeSeconds`, ลาน = `eventType` RANKING + `score` (เมตร) ตรวจแล้วยังไม่มีโค้ดส่วนอื่นใช้ตารางนี้ และ service กรองด้วย sport + eventType ที่ตรงกับ `division` เสมอ ถ้าระบบจัดการแข่งขันอื่นจะใช้ TIMED/RANKING ของกรีฑาด้วย ต้องกำหนดรหัส `division` ใหม่ไม่ให้ชน
- `SystemSetting` key `ATHLETICS_TRACK_BENCHMARKS` ชื่อเดิมแต่ใช้เก็บเป้าทั้งลู่และลาน (ฟิลด์ `target`; รุ่นแรกเป็น `targetSeconds` อ่านต่อได้) ยังไม่ได้เปลี่ยนชื่อเพราะต้องย้ายข้อมูล
- ค่าคงที่รายการกรีฑา/สถานีซ้ำกันใน `lib/excellence-athletics.ts` และ `lib/excellence-validation.ts` เพราะ node unit test import runtime ข้ามไฟล์ไม่ได้ มี test ตรวจว่าตรงกัน
- `StatusHistory.status` เป็น String; สถานะยืนยัน/สละสิทธิ์ derive จากข้อความ
- `Application` มีคอลัมน์ไฟล์ non-null ที่ UI ซ่อนไว้
- `lib/athlete-profile.ts` ใช้ localStorage เป็น mock (มี TODO) ยังไม่ยืนยันว่าถูกเรียกใช้อยู่
- `lib/club-store.ts`, `lib/team-official-store.ts` ยังไม่ยืนยันว่าเป็นข้อมูลจริงหรือ helper ฝั่ง client
- `lib/real-fitness-data.ts` ฝังข้อมูลจากไฟล์ Excel ในโค้ด (ตรวจว่ามีข้อมูลบุคคลหรือไม่)
- ไฟล์ใหญ่ควรแยก: `app/login/page.tsx` (1,376), `app/club/competitions/[id]/page.tsx` (1,297), `lib/fitness-calculation.ts` (1,028), `app/team-official/register/page.tsx` (1,096)
- Next 16 เตือนว่า convention `middleware` เลิกใช้ (ใช้ `proxy`)

## การทดสอบ / เอกสาร
- ไม่มี `tests/integration/` ทั้งที่ `docs/HANDOFF.md` และ `docs/ARCHITECTURE.md` อ้างถึง
- E2E มี `tests/e2e/login.spec.ts` ไฟล์เดียว
- `README.md` เป็นเทมเพลต create-next-app
- `docs/ARCHITECTURE.md` บอกว่าใช้ Server Components เป็นหลัก แต่หน้า UI ส่วนใหญ่เป็น client component
- `HANDOFF.md` / `NEXT_TASK.md` ซ้ำกัน; เอกสาร audit ที่รากซ้ำกับ `docs/PROJECT_CONTEXT.md`
- `HANDOFF.md` ระบุว่ามีการลบข้อมูลใน DB — ยืนยันว่าเป็น DB ใดก่อนทดสอบที่เขียนข้อมูล
