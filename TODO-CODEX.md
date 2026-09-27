# TODO และ Prompt สำหรับงานเก็บรายละเอียด

จัดเตรียมวันที่ 20 กันยายน 2026 สำหรับ repository `D:\BBN\athlete-registration`

รายการนี้เป็นงานที่รอดำเนินการ ไม่ใช่ผลตรวจรับ งานรอบก่อนมีหลักฐาน unit 12/12, integration 32/32, TypeScript/build ผ่าน และ lint 0 errors / 8 warnings แต่ Codex ต้องตรวจสถานะใหม่ก่อนเริ่มแต่ละงาน

## วิธีใช้

ทำตามลำดับ T01–T07 โดยคัดลอก prompt ของงานที่ต้องการไปยัง Codex ที่เปิด repository นี้อยู่ แต่ละ prompt อ้างอิงข้อกำหนดร่วมในไฟล์นี้ จึงไม่ต้องคัดลอกเอกสารทั้งหมด

หากต้องการให้ทำสามงานเล็กต่อเนื่อง ใช้ prompt นี้:

```text
อ่าน AGENTS.md และ TODO-CODEX.md ใน D:\BBN\athlete-registration แล้วดำเนินการ T01, T02, T03 ตามลำดับให้ครบ ลงมือแก้และตรวจรับจริงตามข้อกำหนดร่วม รักษางานเดิมใน working tree และไม่ขยายไปงานอื่น รันชุดตรวจรวมหลังสามงานเสร็จได้เพื่อลดการรันซ้ำ อัปเดต checkbox เฉพาะงานที่มีหลักฐานผ่านแล้ว พร้อมบันทึกผลใน TEST-REPORT.md ไม่ commit, push หรือ deploy
```

## ข้อกำหนดร่วมทุกงาน

- อ่าน `AGENTS.md`, `README.md`, `TEST-REPORT.md` และตรวจ `git status`/diff ก่อนทำงาน รักษาการแก้ไขเดิมทั้ง tracked และ untracked
- ก่อนแก้ Next.js ให้อ่านคู่มือที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ไม่เปลี่ยน schema/config หรือเพิ่ม dependency เว้นแต่จำเป็นกับงานนั้นและอธิบายเหตุผล
- ห้ามปิดกฎ lint/strict หรือเติม suppression เพื่อทำให้ผ่าน ไม่ใช้ type assertion กว้าง ๆ แทนการตรวจข้อมูล
- คง dev/superadmin/dev-login ระหว่างงานเก็บรายละเอียด ห้ามขยาย bypass หรือถือว่าชื่อโฟลเดอร์ทำให้ถูกตัดออกจาก production build
- ก่อนส่งงานแก้โค้ด รัน `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` และตรวจ flow/สิทธิ์ที่กระทบตาม AGENTS.md ไม่ต้องเพิ่ม unit tests ที่เพียงทวนการลบ unused code หรือเปลี่ยนข้อความ
- Integration/browser ที่เขียนข้อมูลต้องมี `TEST_BASE_URL`, `TEST_DATABASE_URL`, `TEST_ALLOW_WRITE=yes` ชัดเจน ยืนยันว่าปลายทางเป็นฐานทดสอบและตรงกับ server ห้ามตั้ง TEST_DATABASE_URL จาก DATABASE_URL อัตโนมัติเพียงเพราะเชื่อมต่อได้ ห้ามใช้ production
- Fixture ต้องระบุ ID และล้างเฉพาะของรอบนั้น รวมไฟล์ Storage; ปิดเฉพาะ test server ที่เปิดเอง ห้ามล้างทั้งฐานหรือใช้ reset/db:push แทน migration
- ห้ามเปิดเผย/commit secrets, `.env`, session cookies, connection strings, ข้อมูลส่วนบุคคล หรือบัญชี fixture ที่ยังใช้ได้
- เก็บหลักฐานรอบใหม่ใน `test-results/polish-Txx-*` ไม่เขียนทับ log ย้อนหลัง อัปเดต TEST-REPORT.md ให้แยกผลรอบเก่ากับรอบใหม่ ไม่ใช้จำนวน tests เป็นเปอร์เซ็นต์ coverage และไม่อ้างว่าผ่านหากยังไม่ได้รัน
- ถ้าทดสอบไม่ได้ ให้ระบุสิ่งที่ทำแล้ว สาเหตุที่ตรวจไม่ได้ และสิ่งที่ต้องมีเพื่อทดสอบต่อ ไม่ติ๊กงานเสร็จ ไม่ commit/push/deploy เว้นแต่ prompt ระบุชัด

## รายการงาน

| ทำแล้ว | ID | งาน | เกณฑ์ตรวจรับหลัก |
| --- | --- | --- | --- |
| [x] | T01 | เก็บ 8 lint warnings | ทั้ง repository เหลือ 0 errors / 0 warnings โดยพฤติกรรมเดิมยังทำงาน |
| [x] | T02 | ชื่อระบบและภาษาเอกสาร | title/description เป็นชื่อระบบจริง และ HTML ใช้ภาษาไทย |
| [x] | T03 | ลบ mock ที่ไม่ใช้และแยก type | ไม่มี runtime mock ที่ระบุเหลือ และฟอร์มสมัครยังทำงาน |
| [x] | T04 | เพิ่ม CI พื้นฐาน | workflow ตรวจ lint/type/unit/build พร้อมวิธีตั้งค่าและหลักฐาน validation |
| [ ] | T05 | Browser และ accessibility | มีผลทดสอบตามหน้าจอ/บทบาท พร้อมแก้ข้อผิดพลาดในขอบเขต UI |
| [ ] | T06 | วัดโหลดและทดสอบพร้อมกัน | มีสคริปต์ที่ควบคุมเป้าหมาย/โหลด/cleanup และรายงาน baseline จริง |
| [x] | T07 | Review และจัดชุดส่งงาน | มีรายการไฟล์/กลุ่ม commit/ผลตรวจ โดยไม่มี secret หรือ artifact ที่ไม่ควรส่ง |

## T01 — เก็บ lint warnings

หลักฐานปัจจุบัน `lint-text.txt` ระบุ 8 warnings ใน 5 ไฟล์: training (`router`, `loading`), competitions (`useRouter`), staff requests (`refreshData`), settings (`err` สองจุด), superadmin (`useState`, `router`)

```text
ทำ T01 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

รัน lint ใหม่เพื่อยืนยัน warnings ปัจจุบัน แล้วแก้ unused imports/variables/functions ให้เหลือ 0 errors / 0 warnings ทั้ง repository จุดเริ่มต้นคือ app/club/training/page.tsx, app/staff/competitions/page.tsx, app/staff/requests/page.tsx, app/staff/settings/page.tsx และ app/superadmin/page.tsx

ตรวจการใช้งานจริงก่อนลบ: state loading ที่ไม่ถูกอ่านให้ลบทั้ง state และ setter ที่ไม่มีผลต่อ UI; refreshData ที่ไม่มีผู้เรียกให้ลบ ไม่เพิ่ม network request เพียงเพื่อให้ตัวแปรถูกใช้; catch ที่ไม่ใช้ error ให้ใช้ optional catch binding รักษาการโหลดข้อมูล การ refresh หลังบันทึก และ cleanup ของ effects ห้ามลบเครื่องมือ dev/superadmin หรือปิดกฎ lint

รันชุดตรวจตามข้อกำหนดร่วม ตรวจหน้าที่กระทบทั้งโหลดสำเร็จและโหลดล้มเหลว เก็บหลักฐานและอัปเดตรายงาน/checkbox T01 เมื่อผ่านจริง สรุปไฟล์ที่เปลี่ยนและผลตรวจ
```

## T02 — Metadata และภาษาไทย

`app/layout.tsx` ยังมี title/description จาก starter และ `lang="en"`

```text
ทำ T02 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

แก้ metadata ของ root layout ให้ title เป็น "ระบบลงทะเบียนนักกีฬา | มหาวิทยาลัยพะเยา" และ description เป็น "ระบบลงทะเบียนและคัดเลือกนักกีฬามหาวิทยาลัยพะเยา สำหรับนักศึกษา ชมรมกีฬา และเจ้าหน้าที่" เปลี่ยน html lang เป็น "th" ใช้ Metadata API ตามเอกสาร Next.js ที่ติดตั้ง ตรวจ metadata ของหน้าอื่นว่า override แล้วเกิดข้อความ starter ค้างหรือไม่

คง font/layout/navigation เดิม ไม่สร้างโลโก้หรือออกแบบหน้าใหม่ ไม่ใส่ canonical URL, metadataBase หรือโดเมนที่ยังไม่ได้รับการยืนยัน

รันชุดตรวจตามข้อกำหนดร่วม ตรวจ HTML ที่ render จริงว่ามี title, description และ lang ถูกต้อง และหน้า login/หน้าที่มีสิทธิ์ยังแสดงภาษาไทยปกติ เก็บหลักฐาน อัปเดตรายงานและ checkbox T02
```

## T03 — ลบ mock ที่ไม่ใช้และแยก type

การค้นหาล่าสุดพบ `lib/api.ts` เป็น mock login ที่ไม่มีผู้เรียก ส่วน `lib/athlete-profile.ts` ถูกอ้างอิงแบบ type-only จากหน้าสมัคร ต้องตรวจใหม่ก่อนลบ

```text
ทำ T03 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

ค้นหาการใช้ lib/api.ts และทุก export ของ lib/athlete-profile.ts ทั้ง repository รวม tests/scripts ก่อนแก้ หากยืนยันว่า apiLogin ไม่มีผู้เรียก ให้ลบ lib/api.ts ย้าย AthleteProfile type ไป lib/athlete-profile-types.ts โดยรักษารูปแบบ type เดิม และเปลี่ยน import type ทุกจุดให้ใช้ไฟล์ใหม่

ลบ saveAthleteProfile, getAthleteProfile, hasAthleteProfile, calcBirthYearCE และไฟล์ lib/athlete-profile.ts เฉพาะหลังยืนยันว่าไม่มี runtime caller หากพบ caller ที่ยังจำเป็น ให้รักษาพฤติกรรมและรายงานสิ่งที่พบ ไม่เปลี่ยนไปใช้ backend โดยเดาสัญญา API และไม่ลบ localStorage keys ของระบบอื่น

อัปเดตเอกสารอธิบายสถานะปัจจุบันที่ยังกล่าวว่า helpers เหล่านี้ถูกใช้งาน โดยรักษาประวัติผลทดสอบเก่า รันชุดตรวจตามข้อกำหนดร่วม ตรวจหน้าสมัครนักกีฬาว่าโหลด profile จาก API และกรอก/ส่งข้อมูลได้ตามเดิม ยืนยันว่าไม่มี import ค้าง เก็บหลักฐานและอัปเดต checkbox T03
```

## T04 — CI พื้นฐาน

ยังไม่พบ `.github/workflows/` ในการตรวจครั้งนี้ งานนี้สร้าง workflow ใน repository; การเปิดใช้งานบน remote และตั้ง secrets เป็นอีกขั้นหนึ่ง

```text
ทำ T04 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

ตรวจ git remote และ CI เดิมก่อน หาก repository ใช้ GitHub และยังไม่มี CI ให้เพิ่ม .github/workflows/ci.yml สำหรับ push, pull_request และ workflow_dispatch ใช้ runner Ubuntu, Node.js 22.18 ขึ้นไปในสาย 22, npm cache ตาม package-lock และ permissions contents: read ยกเลิกงานเก่าเมื่อ branch เดิมมี run ใหม่ ตรวจเวอร์ชัน actions จากแหล่งทางการก่อนเลือก

ลำดับตรวจคือ npm ci, npm run db:generate, npm run lint -- --max-warnings=0, npx tsc --noEmit, npm test และ npm run build งานนี้ทำหลัง T01 แล้ว ไม่ใส่ integration/DB migration/deploy ใน workflow พื้นฐาน ไม่ส่ง secrets ให้ PR ที่ไม่ trusted และไม่ใช้ pull_request_target เพื่อรันโค้ด PR

ตรวจว่า generate/build ต้องมี env ใดบ้าง ใช้ค่า dummy ที่ไม่ใช่ credential จริงเฉพาะกรณีไม่มีการเชื่อมระบบภายนอก และอธิบายชื่อ/หน้าที่ไว้ใน README ห้ามเอา .env ของเครื่องขึ้น CI ห้ามปิด type checking หรือเปลี่ยน font เพื่อหลบ build failure ถ้ามีปัญหา network ให้รายงานตรง ๆ

ตรวจ syntax ของ YAML และรันคำสั่งชุดเดียวกันในเครื่อง เก็บผลที่ตรวจได้ อธิบายข้อจำกัดระหว่าง local validation กับ remote CI run ถ้า remote ไม่ใช่ GitHub ให้รายงาน provider ที่พบก่อนสร้างไฟล์ผิดระบบ ส่งมอบ workflow/README ที่ตรวจได้โดยไม่ push หรืออ้างว่า remote CI ผ่านแล้ว
```

## T05 — Browser และ accessibility

งานนี้ตรวจ UI ที่มีอยู่และแก้ปัญหาการเข้าถึง/การแสดงผล ไม่ใช้เป็นงานสร้างฟีเจอร์คำร้องหรือไฟล์แนบที่ยังไม่เสร็จ

```text
ทำ T05 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ ใช้ browser tools/skill ที่มีจริงและอ่านคำแนะนำก่อนใช้

ทดสอบ production build ในเครื่อง ด้วยบัญชี fixture ที่มีสิทธิ์ ATHLETE, CLUB, STAFF, ADMIN และ TEAM_OFFICIAL ตรวจหน้าหลัก: login, ฟอร์มสมัครและสถานะนักกีฬา, club/review, club/training, staff/applications, staff/analytics, staff/rosters, admin/clubs และหน้าสมัคร/สถานะเจ้าหน้าที่ทีม

ตรวจ desktop 1440x900 และ mobile 390x844 บน Chromium และตรวจ flow หลัก login/กรอกฟอร์ม/ดูสถานะบน browser engine ที่สองถ้ามี ตรวจ keyboard Tab/Shift+Tab/Enter/Escape, focus ที่มองเห็นได้, label และ accessible name, ข้อความ error, loading/empty state, zoom 200%, dialog focus และตารางที่เลื่อนได้โดยไม่ทำให้ทั้งหน้า overflow

แก้เฉพาะ UI/accessibility ที่พบจริงและอยู่ในขอบเขต ไม่เปลี่ยนกฎธุรกิจหรือสิทธิ์เพียงเพื่อให้ UI ผ่าน หากพบฟีเจอร์ที่ยังไม่เชื่อม API ให้แยกเป็น issue พร้อมหลักฐาน ไม่ขยายไปทำฟีเจอร์นั้น ใช้ข้อมูล fixture และปิดบังข้อมูลส่วนตัวในภาพ/screenshots

เพิ่ม automated browser tests เฉพาะ flow สำคัญที่ป้องกัน regression ได้ หากต้องเพิ่ม dependency ให้ใช้ devDependency และอธิบายเหตุผล เก็บตาราง page/role/viewport/browser/result และภาพก่อน–หลังเมื่อแก้ UI รายงานรายการที่ไม่ได้ทดสอบตามจริง รันชุดตรวจตามข้อกำหนดร่วมและล้าง fixture ก่อนส่งงาน
```

## T06 — Load/concurrency baseline

ชุด integration เดิมมี concurrency ของ roster บางกรณีแล้ว งานนี้เพิ่มหลักฐานโหลดและจุดเสี่ยงที่ยังไม่ครอบคลุม ไม่กล่าวว่าระบบไม่เคยทดสอบ concurrency เลย

```text
ทำ T06 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

ตรวจ integration tests ที่มีอยู่ แล้วสร้างสคริปต์ load/concurrency แบบ opt-in สำหรับ localhost และฐานทดสอบที่ยืนยันแล้ว โดยแยกจาก npm test และ integration ปกติ ต้องระบุ TEST_BASE_URL, TEST_DATABASE_URL, TEST_ALLOW_WRITE=yes และยืนยันฐานปลายทางก่อนเขียน ห้ามยิงโหลด production หรือ Supabase project ที่ยังไม่ยืนยันว่าเป็น test

ใช้บัญชีและข้อมูล fixture ที่ติด tag/IDs ของรอบทดสอบ อ่านรายการแข่งขัน รายการใบสมัคร และ analytics ตามสิทธิ์ เก็บ baseline ที่ concurrency 1 แล้ว 5 ระดับละ 30 วินาที จำกัดไม่เกิน 5 requests/second รวมทั้งงาน ตั้ง timeout และหยุดเมื่อพบ 5xx ต่อเนื่อง 3 ครั้ง ไม่ทำ file-upload load และไม่เพิ่มระดับโหลดเอง

แยกทดสอบ correctness ด้วยคำขอพร้อมกันขนาดเล็ก: สมัครรายการเดียวกันสองคำขอต้องไม่สร้างใบสมัครซ้ำ ตรวจ roster quota race ที่มีอยู่ และตรวจ race ระหว่างส่งใบสมัครกับปิดการแข่งขันโดยเก็บลำดับเวลา/ผล DB ชัดเจน ผลที่ timing ไม่ชัดเจนให้รายงาน inconclusive ไม่อ้างว่าทดสอบ race ผ่านแล้ว

รายงานจำนวนคำขอ success/error rate, p50/p95 latency, เงื่อนไขเครื่อง/ข้อมูล/concurrency และผล cleanup ไม่กำหนด SLO หรือรับรอง capacity จาก baseline เล็กนี้ หากพบปัญหาให้บันทึก reproduction และข้อเสนอแยก ไม่แก้ transaction/schema/infra เป็นงานแฝง รัน checks ที่เหมาะกับสคริปต์และชุดตรวจตาม AGENTS.md เก็บ log ใหม่และคู่มือรันซ้ำ
```

## T07 — Review และจัดชุดส่งงาน

มี dirty working tree และ untracked artifacts จากหลายรอบ งานนี้เตรียมรายการตรวจและการจัด commit ไม่ใช่คำสั่งให้ stage ทุกไฟล์

```text
ทำ T07 ตาม TODO-CODEX.md ใน D:\BBN\athlete-registration อ่าน AGENTS.md และข้อกำหนดร่วมก่อนลงมือ

ตรวจ git status, diff และ untracked files ทั้งหมด แยก source/tests/docs/test evidence/build artifacts/temporary fixtures โดยไม่เดาว่าไฟล์ที่ไม่รู้จักเป็นขยะ ตรวจ secrets, ข้อมูลส่วนบุคคล, cookies, connection strings และบัญชี fixture ในไฟล์ที่จะเสนอให้ส่ง ห้ามพิมพ์ค่าลับลง output

สร้าง CHANGESET-REVIEW.md ระบุไฟล์ที่จะเก็บ ไฟล์ที่ควรไม่ส่งพร้อมเหตุผล กลุ่ม commit ที่แนะนำและข้อความ feat:/fix: ตามแนวทาง repository รวมถึงผลตรวจและสิ่งที่ยังไม่ได้ยืนยัน รักษาการแก้ไขจากงานอื่น ไม่ลบหรือย้อนไฟล์เพียงเพราะไม่ได้อยู่ในงานปัจจุบัน ไม่ย้าย .env หรือ artifact ไป commit

ตรวจผลทดสอบว่าอ้างอิง code/build ของรอบใด แยกผลย้อนหลังกับผลล่าสุดและตรวจยอด scenario/parent/cleanup ไม่บวกข้ามรอบให้เป็นผลรันเดียวกัน ปรับเอกสารล่าสุดเมื่อมีหลักฐานตรงเท่านั้น

ตรวจ diff --check และรันชุดตรวจที่ยังขาดสำหรับ source ปัจจุบัน สรุปว่าพร้อม commit กลุ่มใดและติดข้อใด ห้าม git add, commit, push, เปิด PR หรือ deploy ในงานนี้
```

## งานฟังก์ชันและเตรียม production ที่แยกออกไป

รายการต่อไปนี้พบจาก status review ก่อนหน้า ต้องตรวจยืนยันใหม่เมื่อรับงาน และไม่ได้ถูกสั่งให้ทำโดย prompts T01–T07:

- [ ] นำ dev/superadmin/dev-login และทางลัดที่เกี่ยวข้องออกเมื่อเตรียมเผยแพร่ แล้วทดสอบ production ว่าเข้า route และออก token ไม่ได้
- [ ] เชื่อมฟอร์มคำร้องพิเศษให้บันทึก/อัปโหลดจริง และแก้สัญญา status ระหว่าง UI กับ API
- [ ] บันทึกผู้เข้าร่วม หมายเหตุ เอกสาร และภาพของกิจกรรมให้ครบตามฟอร์ม
- [ ] ยืนยันนโยบายการเปิดอ่านกิจกรรม แล้วปรับ API authorization ให้ตรงนโยบาย
- [ ] กำหนดและบังคับกติกาการส่งใบสมัครพร้อมกับการปิดการแข่งขัน พร้อม transaction/concurrency tests ที่เหมาะสม

การทำ TODO เก็บรายละเอียดครบไม่ได้ยืนยันว่าพร้อม production โดยอัตโนมัติ
