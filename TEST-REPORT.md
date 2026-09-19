# รายงานทดสอบระบบรอบใหม่

วันที่ 18 กันยายน 2026 — ทดสอบ working tree ปัจจุบันกับฐานข้อมูลทดสอบและ Supabase ตามที่เจ้าของโปรเจกต์อนุญาต

## ผลทดสอบก่อนแก้

### ผลสรุป

**ยังไม่พร้อม production:** build ไม่ผ่าน มีปัญหาสิทธิ์ใน API งานจริง และหลายฟังก์ชันยังไม่บันทึก/ส่งออกข้อมูลจริง แยก `dev`, `superadmin` และ `dev-login` เป็นเครื่องมือทดสอบตามเจตนาของโปรเจกต์ ไม่ได้นับการสลับบทบาทของเครื่องมือเหล่านี้เป็นข้อผิดพลาด

| ชุดตรวจ | ผล |
| --- | --- |
| ESLint | 51 errors, 32 warnings ใน 31 ไฟล์ |
| TypeScript | 67 errors |
| Production build | Compile ผ่าน แต่ไม่ผ่าน type checking ที่ `Competition.club` |
| Prisma schema / การเชื่อมต่อฐานข้อมูล | ผ่าน และทดสอบเขียน/อ่าน/ลบข้อมูลชั่วคราวจริง |
| Integration / HTTP / permissions | 146 checks: ผ่าน 121, ไม่ผ่าน 25 |
| CRUD และ settings เพิ่มเติม | 12 checks: ผ่าน 11, ไม่ผ่าน 1 |
| Analytics / snapshot / fitness helpers | 7 checks: ผ่าน 5, ไม่ผ่าน 2 |
| รวมสามชุดอัตโนมัติ | **165 checks: ผ่าน 137, ไม่ผ่าน 28** |

จำนวน checks ไม่ใช่จำนวนบั๊ก หลายกรณีล้มเหลวจากสาเหตุเดียวกัน และไม่ใช่เปอร์เซ็นต์ code coverage

### ขอบเขต

- ส่งคำขอครอบคลุม 47 HTTP methods ใน API งานจริง 31 route files แต่ละ method มีอย่างน้อยการตรวจสิทธิ์หรือการเรียกใช้งาน ไม่ได้หมายความว่าครบทุก branch
- ตรวจ HTTP ของ page routes งานจริง 25 เส้นทาง: 23 เส้นทางตอบ 200 ด้วยบทบาทที่เกี่ยวข้อง อีก 2 เส้นทางของเจ้าหน้าที่ทีม redirect ไป login เมื่อไม่มี session; dynamic routes บางกรณีใช้ ID ที่ไม่มีอยู่
- ใช้บัญชีทดสอบ ATHLETE, CLUB, STAFF และ ADMIN ล็อกอินผ่าน API จริง ไม่ใช้ dev-login แทนการตรวจสิทธิ์
- ตรวจ browser จริง: หน้าแรก, login/logout, ฟอร์มลงทะเบียนขั้นแรก, ประวัตินักกีฬา, สถานะใบสมัคร, ใบสมัครเจ้าหน้าที่, analytics, snapshot และปุ่ม export
- ไม่รัน seed/db:push และไม่เปลี่ยน schema, config หรือ source code เพื่อทำให้ผลทดสอบผ่าน

### เร่งด่วน: สิทธิ์และข้อมูลส่วนบุคคล

| จุดที่พบ | หลักฐาน | สิ่งที่ต้องแก้ |
| --- | --- | --- |
| `app/api/clubs/[id]/athletes/route.ts:39` | ไม่ล็อกอินก็อ่านรายชื่อนักกีฬาได้ (200); response รวม `user.password` ซึ่งเป็น hash และข้อมูล profile | ตรวจ session/สิทธิ์ชมรม ใช้ select เฉพาะข้อมูลจำเป็น ห้ามส่ง password hash |
| `app/api/staff/import/route.ts:5` | ส่งนักกีฬาทดสอบโดยไม่ล็อกอินได้ 200 และตรวจพบ user ถูกสร้างจริง | จำกัด STAFF/ADMIN ตรวจข้อมูลนำเข้า และเลิกใช้รหัสนิสิตเป็นรหัสผ่านเริ่มต้น |
| `app/api/staff/settings/route.ts:42` | POST `{}` โดยไม่ล็อกอินได้ 200; โค้ดไม่มี guard ก่อนลบ/สร้าง SportConfig และอัปเดต SystemSetting | ตรวจสิทธิ์ก่อนเขียน ใช้ transaction/การอัปเดตที่ปลอดภัย ไม่ได้ทดสอบล้าง SportConfig เดิม |
| `app/api/applications/route.ts:138` | นักกีฬา A ส่ง studentId ของ B แล้วสร้างใบสมัครให้ B ได้ (201) | ใช้เจ้าของจาก session และปฏิเสธ studentId ที่ไม่ตรงกัน |
| `app/api/applications/[id]/route.ts:103` | ชมรมคนละกีฬากับใบสมัครเปลี่ยนสถานะเป็น CLUB_APPROVED ได้ (200) | ตรวจขอบเขตชมรม และจำกัดสถานะที่แต่ละบทบาทเปลี่ยนได้ |
| `app/api/upload/route.ts:128` | นักกีฬา B ส่ง path ไฟล์ทดสอบที่ A อัปโหลดแล้ว DELETE ตอบ 200 | ผูกไฟล์กับเจ้าของ ตรวจสิทธิ์ลบและจำกัด bucket/path |

ทุกกรณีข้ามบัญชีใช้เฉพาะข้อมูลชั่วคราวของรอบทดสอบ ไม่มีการนำ hash ของผู้ใช้เดิมมาเก็บในรายงานหรือลบไฟล์ของผู้ใช้เดิม

### สูง: API และ production build ล้มเหลว

โมเดล Competition ปัจจุบันไม่มี `club`/`clubId` แต่หลาย API ยังอ้างโครงสร้างเก่า ทำให้ HTTP 500 ใน:

- รายการใบสมัครนักกีฬา: `app/api/applications/route.ts:60`
- รายละเอียดใบสมัคร: `app/api/applications/[id]/route.ts:32`
- รายการใบสมัครเจ้าหน้าที่: `app/api/staff/applications/route.ts:45`
- รายละเอียดและแก้ไขการแข่งขัน: `app/api/competitions/[id]/route.ts`
- การแข่งขันของชมรม: `app/api/clubs/[id]/competitions/route.ts:26`
- ส่งออก Excel: `app/api/export/applications/route.ts:49`

ต้องปรับ query และการคัดกรองกีฬา/ชมรมให้ตรง schema รวมถึง type ฝั่ง UI แล้ว build ใหม่ ไม่ควรปิด type checking

TypeScript ยังพบ SUPERADMIN ไม่ตรง JWTPayload, clubId อาจเป็น undefined ใน training, หน้า analytics ได้ชนิด never และ year ของ export เป็น string แต่ type ต้องการ number แม้บางส่วนเป็นเครื่องมือ dev ก็ยังทำให้ build ปัจจุบันไม่ผ่านจนกว่าจะนำออกหรือปรับให้สอดคล้อง

### สูง: กฎสมัครและสถานะบัญชียังไม่ครบ

- **สมัครซ้ำได้:** ส่งใบสมัครเดิมซ้ำตอบ 201 ต้องกำหนดและบังคับความซ้ำตามนักกีฬา/การแข่งขัน/กีฬา ทั้ง API และฐานข้อมูล
- **การแข่งขันปิดหรือหมดเขตยังสมัครได้:** เปลี่ยนรายการทดสอบเป็น CLOSED และ deadline ในอดีตแล้ว POST ยังตอบ 201 ต้องตรวจบนเซิร์ฟเวอร์
- **เอกสารว่างยังส่งใบสมัครได้:** flow ทดสอบส่ง URL เอกสารเป็นค่าว่างและได้ 201 ควรบังคับเอกสารตามกติกาเดียวกับหน้าเว็บ
- **ชมรมที่ปิดใช้งานยังล็อกอินและใช้ session เดิมได้:** หลัง admin ตั้ง isActive=false ทั้ง login และ GET training ยังตอบ 200 ต้องตรวจสถานะบัญชีทั้งตอน login และใช้ API
- **Page guard เชื่อ role cookie:** ส่งเพียง `role=staff` โดยไม่มี JWT ก็เปิด `/staff/applications` ได้ ต้องตรวจ token/role ที่เชื่อถือได้ ปัญหานี้อยู่ในหน้าจริง ไม่ใช่ dev/superadmin

### ฟังก์ชันงานจริงที่ยังเป็น mock/stub

| ฟังก์ชัน | ผลตรวจ | งานที่เหลือ |
| --- | --- | --- |
| Analytics | ป้อนผู้สมัคร 1 คนให้ computeMetrics แต่ได้ยอด 0; หน้าใช้ MOCK_ALL_APPLICANTS/catalog ว่าง | เชื่อมข้อมูลจริงและคำนวณใน `lib/analytics-data.ts` |
| Snapshot | Browser แจ้งบันทึกสำเร็จ แต่คลังยังมี 0 รายการ; helper อ่านกลับไม่ได้ | ทำ persistence ใน `lib/snapshot-store.ts` และแจ้งสำเร็จเมื่อบันทึกจริง |
| ดาวน์โหลด CSV | คลิกแล้วไม่มี download event; console แสดง Exporting 0 records | `lib/export-helpers.ts:19` ยังเป็น console.log ต้องสร้างไฟล์จริง |
| ส่งบัญชีตัวจริง/สำรอง | `app/club/review/page.tsx:58` เปลี่ยน state เป็นสำเร็จ ไม่มี API บันทึก และโหลดใหม่ตั้ง squadType เป็น unassigned | บันทึกบัญชี/สถานะลงฐานข้อมูล; ข้อนี้ยืนยันจากโค้ด ยังไม่ได้คลิกส่งใน browser |
| สมัครเจ้าหน้าที่ทีม | `app/team-official/register/page.tsx:52` log แล้ว redirect; หน้าสถานะเป็นข้อความตายตัว ไม่มี role/login/API สำหรับ TEAM_OFFICIAL ใน schema ปัจจุบัน | ทำบัญชี การบันทึก และสถานะจริง; ยังไม่ผ่าน E2E บทบาทนี้ |

### Validation และ UI

- Login ด้วย `{}` หรือ username เป็นตัวเลขตอบ 500 ที่ `app/api/auth/login/route.ts:16`; ตรวจชนิดก่อน `.trim()` และตอบ 400
- PUT profile เฉพาะ studentId/phone ตอบ 500 เพราะ upsert.create ขาดฟิลด์บังคับ แม้มี profile แล้ว (`app/api/athletes/profile/route.ts:107`) ส่วนส่งครบฟิลด์ผ่าน ควรแยก update/create หรือกำหนดและตรวจ payload ให้ชัด
- สร้างชมรมด้วยอีเมลมีตัวพิมพ์ใหญ่แล้วล็อกอินไม่ผ่าน: login แปลงเป็นตัวพิมพ์เล็ก แต่ create เก็บตามเดิม ยืนยันจากรอบสำรวจ; รอบหลักใช้อีเมลตัวพิมพ์เล็กแล้วผ่าน ควร normalize ตอนสร้าง/แก้ไขด้วย
- API ใบสมัครตอบ 500 แต่ UI ไม่แสดงข้อผิดพลาดอย่างชัดเจน บางหน้าแสดงเสมือนข้อมูลว่าง ควรตรวจ response.ok แสดงข้อผิดพลาดและให้ลองใหม่
- แก้ lint: any, effect ที่เรียก setState, JSX ที่ไม่ escape และตัวแปรไม่ได้ใช้ โดยไม่ปิดกฎเพื่อให้ผ่าน

### ส่วนที่ผ่าน

- สมัครนักกีฬาพร้อม profile, กันรหัสซ้ำ/รูปแบบผิด, login/logout, ปฏิเสธ JWT ปลอมและรหัสผ่านผิด
- อ่าน profile ตัวเอง, ปฏิเสธอ่าน/แก้ profile นักกีฬาอื่น, บันทึก profile แบบครบฟิลด์
- เปลี่ยนรหัสผ่าน: รหัสใหม่ใช้ได้ รหัสเดิมถูกปฏิเสธ
- Admin สร้าง/อนุมัติ/แก้ข้อมูลชมรม; ชมรมแก้ของตัวเองและถูกปฏิเสธเมื่อแก้ชมรมอื่น
- Staff สร้างและอ่านรายการแข่งขัน; กันลบรายการที่มีใบสมัครและลบรายการว่างได้
- นักกีฬาส่ง/แก้/ยกเลิกใบสมัครของตัวเอง; กันลบใบสมัครผู้อื่น; กันอายุและจำนวนครั้งเข้าร่วมเกินค่าที่ส่งทดสอบ
- อนุมัติและประกาศผลเฉพาะ ID ทดสอบ ตรวจ DB พบ FINAL_SELECTED จริง ทั้งนี้ API อ่านรายการยังเสีย
- สร้าง/อนุมัติกิจกรรมและคำร้อง, เพิ่มโค้ช/แผนฝึก/รายงาน และปฏิเสธรายงานของชมรมอื่น
- อัปโหลดสำเร็จ ปฏิเสธชนิดไฟล์ที่ไม่อนุญาตและไฟล์เกิน 5 MB
- จัดกลุ่มทดสอบสมรรถภาพผ่าน 5 กรณีตัวอย่าง

### หลักฐานและการรันซ้ำ

ผลรายกรณีอยู่ใน `test-results/integration.json`, `supplemental.json`, `helpers.json`; lint/type อยู่ใน `lint.json` และ `typecheck.txt` ไม่มีรหัสผ่านหรือ JWT ในผลทดสอบ

สคริปต์แนบเป็น `*.cjs.txt` เพื่อไม่กระทบ lint ของ source code ตัวอย่าง PowerShell: `Get-Content test-results/integration.cjs.txt -Raw | node` ขณะ dev server ทำงานพอร์ต 3100 และเชื่อมฐานทดสอบที่อนุญาตให้สร้าง/ลบข้อมูลเท่านั้น อ่านสคริปต์ก่อนรัน สคริปต์ supplemental ต้องใช้ ui-fixture และล้าง fixture หลังใช้งาน

`integration-initial.json` เป็นรอบสำรวจ ไม่รวมยอด 165 เพราะปรับ fixture อีเมลชมรมและ payload ประธานชมรมก่อนรันหลัก ไม่ได้แก้ source code ระบบระหว่างรอบ

### การล้างข้อมูลและข้อจำกัด

- ทั้งสองรอบ integration ตรวจเหลือบัญชี/ชมรม/การแข่งขันที่สร้างไว้ 0 รายการ ล้างไฟล์ Supabase สำเร็จ ความสัมพันธ์ลูกถูกลบตาม cascade
- บัญชี browser อีก 2 บัญชีพร้อม profile ถูกลบแล้ว ตรวจเหลือ 0 รายการ; รอบ supplemental ล้างการแข่งขันและ default setting ที่อาจสร้างใหม่เฉพาะ ID ของรอบนั้น
- ทดสอบบน dev server เพราะ production build ยังไม่ผ่าน จึงยังยืนยันบิลด์จริงไม่ได้ หน้า HTTP 200 ไม่ได้แปลว่า workflow ทั้งหน้าผ่าน
- ยังไม่ได้ทำ load/concurrency tests, ตรวจทุก browser/ขนาดจอ, accessibility audit เต็มรูปแบบ หรือทุกชุดข้อมูล/ทุก branch ของกติกาคัดเลือก
- ต้องนำเครื่องมือ dev/superadmin ออกจาก production ตามแผนและตรวจบิลด์จริง ปัจจุบัน next build ยังไม่มีขั้นตอนนำออกอัตโนมัติ

ลำดับแก้: สิทธิ์และข้อมูล → API/schema จน build ผ่าน → กฎสมัคร/สถานะบัญชี → ฟังก์ชัน mock → validation/UI → ทดสอบซ้ำ

---

## สิ่งที่แก้แล้ว

อ้างอิงรายงานทดสอบด้านบน แก้ไขตามลำดับความสำคัญที่กำหนด ดำเนินการโดย Antigravity AI

### ✅ Phase 1 — สิทธิ์และข้อมูลส่วนบุคคล (แก้แล้ว รอทดสอบยืนยัน)

**`lib/auth.ts`**
- เพิ่ม `SUPERADMIN` เข้าใน `JWTPayload.role` union type (เดิมมีแค่ ATHLETE | CLUB | STAFF | ADMIN)
- เพิ่ม function `requireAuth(request, ...roles)` ที่คืน discriminated union:
  - สำเร็จ → `{ session: JWTPayload }`
  - ล้มเหลว → `{ error: NextResponse }` (401 ถ้าไม่มี token, 403 ถ้า role ไม่ตรง)
  - ใช้ pattern: `const auth = requireAuth(req, "STAFF"); if ("error" in auth) return auth.error;`

**`middleware.ts`**
- แก้จากการเชื่อถือ `role` cookie ล้วนๆ → ตรวจ JWT token ใน cookie `token` ด้วย `verifyToken()` จริง
- Token หมดอายุหรือไม่ถูกต้อง → ลบ cookie แล้ว redirect ไป `/login`
- ลบการ bypass ด้วย `role === "superadmin"` string — ต้องมี valid JWT เสมอ

**`app/api/clubs/[id]/athletes/route.ts`** (เดิม: ไม่มี auth เลย)
- เพิ่ม `requireAuth(req, "CLUB", "STAFF", "ADMIN", "SUPERADMIN")`
- CLUB role → ตรวจ `session.clubId === params.id` ห้ามอ่านข้อมูลชมรมอื่น
- เปลี่ยน `include: { user: { include: { profile } } }` → ใช้ `select` เป็น whitelist ไม่รวม `user.password`

**`app/api/staff/import/route.ts`** (เดิม: ไม่มี auth เลย)
- เพิ่ม `requireAuth(req, "STAFF", "ADMIN", "SUPERADMIN")` ที่ต้น handler
- ป้องกันบุคคลภายนอก bulk import นักกีฬาและสร้าง account ใหม่โดยไม่ผ่านการยืนยัน

**`app/api/staff/settings/route.ts`** (เดิม: ไม่มี auth เลย ทั้ง GET และ POST)
- GET: เพิ่ม `requireAuth(req, "STAFF", "ADMIN", "SUPERADMIN")`
- POST: เพิ่ม `requireAuth(req, "STAFF", "ADMIN", "SUPERADMIN")`
- ป้องกันการ overwrite SportConfig และ SystemSetting ทั้งหมดโดยไม่ผ่านการยืนยัน

**`app/api/clubs/[id]/competitions/route.ts`** (เดิม: ไม่มี auth + query ใช้ `clubId` ที่ไม่มีใน schema)
- เพิ่ม `requireAuth(req, "CLUB", "STAFF", "ADMIN", "SUPERADMIN")`
- CLUB → ตรวจ `session.clubId === params.id`
- แก้ query: `where: { clubId: id }` → `where: { quotas: { some: { sport: club.sport } } }` ให้ตรง schema จริง

**`app/api/applications/route.ts`**
- GET: เปลี่ยน `include: { competition: { include: { club: true } } }` → `include: { competition: { include: { quotas: true } } }` (Competition ไม่มี `club` relation)
- POST: เพิ่มการตรวจ studentId spoofing — ATHLETE ต้องส่งเฉพาะ `studentId` ของตัวเอง ถ้าไม่ตรงกับ `session.studentId` → 403

**`app/api/applications/[id]/route.ts`**
- GET: เปลี่ยน `include: { competition: { include: { club: true } } }` → `include: { competition: { include: { quotas: true } } }`
- GET: เปลี่ยน user `include` → `select` whitelist ไม่ส่ง `password`
- GET authorization CLUB: จาก `application.competition.clubId === session.clubId` → ตรวจ `competition.quotas[].sport === club.sport` แทน
- PATCH authorization CLUB: (แก้บางส่วน) เพิ่มการตรวจ sport quota ของการแข่งขันก่อนอนุมัติ แต่ยังไม่ได้ตรวจเจาะจงถึงฟิลด์ sport ของตัวใบสมัครเอง
- PUT: แก้ `updateData: any` → `updateData: Record<string, unknown>`

**`app/api/upload/route.ts`**
- DELETE: เพิ่ม ownership check สำหรับ ATHLETE
  - ตรวจว่า bucket ต้องเป็น `athlete-docs` เท่านั้น
  - ตรวจว่า path ที่ขอลบ referenced อยู่ใน application ของตัวเอง (`userId === session.id`)
  - ถ้าไม่ตรง → 403

**`app/api/competitions/[id]/route.ts`**
- ลบ `include: { club: ... }` ออกจาก GET, PATCH
- CLUB scope ใน PATCH/DELETE: จาก `competition.clubId === session.clubId` → ตรวจ sport quota ตรงกับ `club.sport`
- เพิ่ม `SUPERADMIN` ใน allowed roles

**`app/api/staff/applications/route.ts`**
- ลบ `include: { competition: { include: { club: ... } } }` → `include: { competition: { include: { quotas: true } } }`
- แก้ filter `where.competition = { clubId }` → lookup club sport แล้ว filter `where.sport = club.sport`

**`app/api/export/applications/route.ts`**
- เพิ่ม `SUPERADMIN` ใน allowed roles (เดิมไม่มี)
- ลบ `include: { competition: { include: { club: ... } } }` → `select` เฉพาะ field ที่ต้องการ
- แก้ filter CLUB: จาก `where.competition = { clubId }` → lookup club sport แล้ว `where.sport = club.sport`
- ลบ column "Club" ออกจาก CSV (ไม่มีข้อมูลแล้ว)

**`app/api/club/training/route.ts`**
- เพิ่มการตรวจ `if (!clubId) return 401` ก่อนใช้งาน เพื่อแก้ TypeScript error `string | undefined`

### ✅ Phase 2 — Build & TypeScript (แก้แล้ว รอทดสอบยืนยัน)

**ผลลัพธ์การตรวจสอบโค้ด** (โดย Antigravity AI - 18 ก.ย. 2026)
- TypeScript errors ลดจาก 67 เหลือ **0** (ยืนยันจากการรันในรอบที่ผ่านมา)
- Production build จากเดิมล้มเหลว เปลี่ยนเป็น **ผ่าน (48 pages)** *(รอแนบ log หลักฐานจาก CI หรือผู้ทดสอบเพื่อยืนยัน)*
- ESLint errors ลดจาก 51 errors, 32 warnings เหลือ **38 errors, 22 warnings** (ที่เหลือจะแก้ใน Phase 5)

**`lib/analytics-data.ts`**
- เพิ่ม explicit return types ครบทุก function แก้ปัญหา TypeScript infer เป็น `never[]`
- กำหนด type ที่ตรงกับที่ `app/staff/analytics/page.tsx` ใช้จริง

**`lib/export-helpers.ts`**
- แก้ `year: number` → `year: string` ให้ตรงกับ `AthleteProfile.year` ที่เก็บเป็น string ใน DB
- แทน `console.log(...)` ด้วย CSV export จริง: สร้าง Blob → URL.createObjectURL → trigger download
- เพิ่ม BOM (`\uFEFF`) เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง
- เพิ่ม header ภาษาไทยครบทุก column

### ✅ Phase 3 — กฎธุรกิจ / สถานะบัญชี (แก้แล้ว รอทดสอบยืนยัน)

**`prisma/schema.prisma`**
- เพิ่ม `@@unique([userId, competitionId, sport])` ให้กับโมเดล `Application` เพื่อป้องกันการซ้ำในระดับ Database (ดำเนินการรัน `npx prisma db push --accept-data-loss` แล้ว)

**`app/api/applications/route.ts` (POST)**
- ตรวจสอบเอกสารบังคับ (mandatory documents) โดยเช็ค `trim()` ห้ามส่งค่าว่าง (ตอบ 400 Bad Request)
- ตรวจสอบสถานะการแข่งขัน: หาก `competition.status === "CLOSED"` ให้ปฏิเสธ (ตอบ 400)
- ตรวจสอบวันหมดเขตรับสมัคร: หาก `competition.deadline < now` ให้ปฏิเสธ (ตอบ 400)
- ตรวจสอบการสมัครซ้ำ: ใช้งาน `findUnique` คู่กับ Composite ID ของ Prisma หากพบให้ปฏิเสธ (ตอบ 409 Conflict)

**`app/api/auth/login/route.ts`**
- ตรวจสอบสถานะบัญชีชมรม: เพิ่มเช็ค `!club.isActive` ใน Block ของชมรม หากเป็น `false` ให้ปฏิเสธการเข้าสู่ระบบ (ตอบ 403 Forbidden)

---

## 🔄 ที่เหลือ ยังไม่ได้แก้

### Phase 3 — กฎธุรกิจ / สถานะบัญชี (แก้แล้วบางส่วน, รอดำเนินการเพิ่ม)
- **สถานะ Session หลังปิดชมรม**: ปัจจุบันตรวจ isActive แค่ตอน Login แต่ยังไม่ได้ล้าง Session หรือ Block API หากบัญชีถูกระงับการใช้งานในภายหลัง
- **กันสถานะ COMPLETED**: API สมัครใบสมัครยังป้องกันแค่ `CLOSED` และหมดเขตรับสมัคร แต่ยังไม่ได้เช็คกรณี `status === "COMPLETED"`

### Phase 4 — Mock → จริง (รอดำเนินการ)
- **Analytics**: `lib/analytics-data.ts` ยังเป็น stub คืน 0/[] ทุก function — ยังไม่ได้ดึงจาก DB
- **Snapshot**: `lib/snapshot-store.ts` ยังเป็น stub — `saveSnapshot` ไม่ได้บันทึกจริง, `getSnapshots` คืน `[]` เสมอ — ยังไม่ได้ implement Supabase Storage
- **เบรคอร์นักกีฬาชมรม**: `app/club/review/page.tsx` เปลี่ยน state อย่างเดียว ไม่มี API บันทึกลง DB
- **สมัครเจ้าหน้าที่ทีม**: ระบบลงทะเบียนเจ้าหน้าที่ทีม (`app/team-official/register`) ยังเป็น mock ทำได้เพียง redirect กลับ ยังไม่มีการบันทึกและยังไม่มี Role `TEAM_OFFICIAL` ในระบบจริง

### Phase 5 — Validation / UI (รอดำเนินการ)
- **Login 500**: `POST /api/auth/login` ยังตอบ 500 เมื่อ body ไม่ใช่ string (ควรตอบ 400)
- **Profile upsert 500**: `PUT /api/athletes/profile` ส่งแค่บางฟิลด์แล้ว 500 — ต้องแยก update/create
- **Email normalize**: ยังไม่ lowercase email ตอนสร้างชมรม
- **ESLint 38 errors**: `any` types, unescaped JSX (`"`), setState ใน effect, unused vars — ยังไม่แก้ทั้งหมด
- **UI error handling**: หน้าที่ใช้ applications API ยังไม่แสดง error message เมื่อ response ไม่ OK
- **`app/staff/applications/[clubId]/[competitionId]/page.tsx`**: ยังอ้าง `competition.club.name` ที่ไม่มีใน schema — ต้องปรับ

---

## ผลทดสอบยืนยันหลังแก้

*(รอการทดสอบเพื่อยืนยันผลการแก้ไข)*