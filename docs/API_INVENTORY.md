# API Inventory

สร้างจาก grep ของ `api(request, ...)`, `requireAuth(...)`, `getSession(...)` ใน `app/api/**/route.ts`
คอลัมน์ "ตัวตรวจสิทธิ์" คือสิ่งที่พบในไฟล์ ไม่ใช่การรับรองว่าครบ ให้เปิดไฟล์ยืนยันก่อนแก้
`STAFF` = STAFF+ADMIN (`lib/phase4-server.ts`)

| Endpoint | ตัวตรวจสิทธิ์ที่พบ |
|---|---|
| auth/login, register, register-official, logout | ไม่ต้อง login (logout/register ยังไม่ได้ยืนยันรายละเอียด) |
| auth/me | getSession |
| auth/password | getSession(allowPasswordChange) |
| applications, applications/[id], …/decision, …/documents/[field] | ATHLETE เป็นหลัก; [id] และ documents อ่านโดย CLUB/STAFF ตามขอบเขต |
| athletes/profile | ATHLETE (+CLUB/STAFF ตามขอบเขต) |
| documents (POST), documents/[id], documents/[id]/download, upload | CLUB/TEAM_OFFICIAL/ATHLETE อัปโหลด; อ่านด้วย `canReadDocument` |
| club/athletes/[id], club/competitions, club/competitions/[id] | CLUB (PATCH [id] ยังเปิด STAFF/ADMIN บางส่วน) |
| club/officials, club/rosters | CLUB |
| club/training | getSession (ตรวจ role CLUB ในโค้ด) |
| clubs (GET) | **สาธารณะ** (ADMIN เห็นข้อมูลเพิ่ม) |
| clubs (POST), clubs/[id] | ADMIN (+CLUB แก้โปรไฟล์ตนเอง) |
| clubs/[id]/athletes, clubs/[id]/competitions | CLUB (เฉพาะ clubId ตนเอง), STAFF, ADMIN |
| clubs/requests, activities, activities/[id] | CLUB; STAFF/ADMIN ตรวจ/ดู |
| admin/users, admin/users/[id], …/role, …/status, …/reset-password | ADMIN |
| admin/clubs/[id]/approve, president, reset-password | ADMIN |
| competitions, competitions/[id] (GET) | **สาธารณะ** |
| competitions (POST), competitions/[id] (PATCH/DELETE) | STAFF (DELETE ใช้ ADMIN) |
| sport-categories (GET) | **สาธารณะ** |
| sports | CLUB/STAFF/ADMIN (GET), STAFF (POST) |
| export/applications | CLUB, STAFF, ADMIN |
| stats/dashboard | STAFF |
| staff/applications, announce, import, [id]/evidence | STAFF (evidence ใช้ REVIEWERS) |
| staff/import, staff/sport-categories | requireAuth STAFF, ADMIN |
| staff/settings | STAFF, ADMIN (บาง action เฉพาะ ADMIN) |
| staff/requests, staff/requests/[id] | STAFF_REQUEST_REVIEW_ROLES |
| staff/rosters, officials, profile, snapshots*, analytics | STAFF |
| staff/fitness-tests, [applicationId], evaluate, import | STAFF |
| staff/excellence (GET ภาพรวม), [applicationId] (GET), results (POST), benchmarks (GET/PUT), plans (POST), retests (POST) — `?demo=true` อ่านชุดสาธิต, เขียนชุดสาธิตได้ 400 | STAFF |
| team-official/applications | TEAM_OFFICIAL |

## รูปแบบมาตรฐาน
- 401 ยังไม่ login · 403 ไม่มีสิทธิ์ · 400 validation (`fieldErrors`) · 404 ไม่พบ · 409 conflict/version/ข้อมูลซ้ำ
- route ใหม่ใช้ `api()` ไม่ควรเขียน try/catch ซ้ำ
