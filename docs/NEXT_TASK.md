# Current Task

## Status
Release implementation added on 2026-09-26. Follow-up on 2026-09-27: 44 unit tests and local checks passed; the complete isolated-test integration suite passed 39/39. Browser ADMIN configuration, ATHLETE submission, STAFF review/publication, ATHLETE final result and filtered CSV download were verified. The user confirmed XLSX downloads normally in the browser follow-up; workbook contents remain unverified. Club-stage wording now uses recorded club decisions/history instead of inferring approval from STAFF/final status; follow-up checks pass with 46 unit tests. Live Gmail recovery was user-verified with limits documented in `docs/HANDOFF.md`. Production database/storage cutover, legacy-file privacy and production email readiness remain open. See `docs/RELEASE_RUNBOOK.md`.

[ ] Production readiness pending — test-environment integration and browser evidence are recorded above and in `docs/HANDOFF.md`; outstanding verification and production cutover gates must close before release. Checked feature items describe code behavior, not proof of production readiness.

## Objective
ระบบลืมรหัสผ่านและตั้งรหัสผ่านใหม่ (Forgot Password & Reset Password) และระบบจัดการบัญชีเจ้าหน้าที่/ผู้ดูแลระบบ (Staff & Admin Account Management) สำหรับมหาวิทยาลัยพะเยา

## Requirements (Forgot Password & Reset Password)
- [x] หน้า `/forgot-password`: กรอกอีเมล, ส่งคำขอ, ข้อความยืนยันแบบ anti-enumeration และปุ่มกลับหน้าเข้าสู่ระบบ
- [x] หน้า `/reset-password?token=...`: ตรวจสอบ token, ฟอร์มตั้งรหัสผ่านใหม่พร้อมปุ่มแสดง/ซ่อนรหัสผ่าน, รายการตรวจสอบนโยบายรหัสผ่านแบบ real-time
- [x] ลิงก์ "ลืมรหัสผ่าน?" ในหน้าเข้าสู่ระบบ (`/login`)
- [x] ป้องกัน User Enumeration: ไม่ว่าจะพบอีเมลหรือไม่ ระบบจะส่งข้อความตอบกลับแบบเดียวกัน
- [x] Single-use & Expirable Token: โทเคนใช้งานได้ครั้งเดียว มีอายุ 15 นาที และเป็นโมฆะทันทีเมื่อรหัสผ่านเปลี่ยน
- [x] Account Status Preservation: บัญชีที่ถูกระงับ (SUSPENDED) เมื่อตั้งรหัสผ่านใหม่แล้ว สถานะยังคงถูกระงับเหมือนเดิม ไม่ถูกเปิดใช้งานโดยอัตโนมัติ
- [x] Admin Recovery: แอดมินสามารถส่งลิงก์รีเซ็ตรหัสผ่านให้ผู้ใช้จากหน้า `/admin/users` ได้ โดยไม่สามารถเห็นรหัสผ่านเดิมของผู้ใช้
- [x] Password Policy: ขั้นต่ำ 8 ตัวอักษร, ไม่เกิน 72 ไบต์, ตรวจสอบความตรงกันทั้ง client และ server-side
- [x] Rate Limiting: จำกัดความถี่การขอรีเซ็ตรหัสผ่าน 60 วินาทีต่ออีเมล
- [x] Audit Logging: บันทึกเหตุการณ์ `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `ADMIN_SENT_PASSWORD_RESET` โดยไม่มีการบันทึก plaintext password หรือ reset token

## Requirements (Staff & Admin Account Management)
- [x] ดูรายชื่อผู้ใช้งานทั้งหมด พร้อมระบบค้นหาและตัวกรองตามสิทธิ์ (Role) และสถานะ (Status)
- [x] สร้างบัญชีผู้ใช้งานภายใน (STAFF, ADMIN, TEAM_OFFICIAL) พร้อมแฮชรหัสผ่านด้วย bcrypt
- [x] แก้ไขข้อมูลพื้นฐานของผู้ใช้งาน (ชื่อ, อีเมล, เบอร์โทรศัพท์)
- [x] เปลี่ยนสิทธิ์ของผู้ใช้งาน (Change Role)
- [x] ระงับการใช้งานและเปิดใช้งานบัญชี (Status Activation/Suspension)
- [x] ป้องกัน Admin ระงับบัญชีของตนเอง หรือลดสิทธิ์ Admin ของตนเอง (Self-protection)
- [x] ป้องกันการระงับหรือลดสิทธิ์ Admin บัญชีสุดท้ายในระบบ (Last-admin protection)
- [x] ป้องกันไม่ให้ Public registration กำหนดสิทธิ์ privileged roles (ADMIN, STAFF)
- [x] ป้องกันไม่ให้ STAFF เข้าถึงหน้าจัดการบัญชีหรือ API ของ Admin (403 Forbidden)
- [x] บันทึกการกระทำสำคัญทั้งหมดลงใน Audit Log แบบ atomic

## Relevant Area
- Frontend: `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/login/page.tsx`, `app/admin/users/page.tsx`, `app/admin/page.tsx`, `app/admin/clubs/page.tsx`, `app/superadmin/page.tsx`
- Backend: `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/admin/users/[id]/reset-password/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`, `app/api/admin/users/[id]/role/route.ts`, `app/api/admin/users/[id]/status/route.ts`
- Core Services: `lib/password-reset.ts`, `lib/audit-service.ts`, `lib/account-service.ts`, `lib/validation.ts`
- Tests: `tests/unit/password-reset.test.mjs`, `tests/unit/admin-users.test.mjs`

## Definition of Done
- [x] Feature implemented according to requirements
- [x] Code follows existing architecture
- [x] Type checking passes (`npx tsc --noEmit`)
- [x] Linting passes (`npm run lint`)
- [x] Validation and authorization are implemented server-side
- [x] Tests pass (`npm run test:unit`)
- [x] Build passes (`npm run build`)

# CODEX FOCUS — DEPLOY BEFORE 4/10/2569
## Goal
ทำระบบให้พร้อมใช้งานจริงและ Deploy ก่อน **4 October 2026**
เป้าหมายไม่ใช่ Feature Completeness
Core flow ที่ต้องผ่าน:
```text
ADMIN Configure
→ ATHLETE Apply
→ STAFF Review
→ STAFF Publish
→ ATHLETE View Result
```
ถ้า Core Flow ยังไม่ผ่าน **ห้ามเพิ่ม Feature ใหม่**

---

# Production Roles

เหลือเฉพาะ:

```text
ADMIN
STAFF
ATHLETE
CLUB
TEAM_OFFICIAL
```

นำออกจาก Production:

```text
SUPERADMIN
DEV
/dev
Dev Login
Dev Auth Bypass
```

`ADMIN` คือ Role สูงสุดของระบบ

ถ้ามีข้อมูล `SUPERADMIN` เดิม ให้เตรียม Strategy:

```text
SUPERADMIN → ADMIN
```

ก่อนลบ Role

อย่ารัน Database Migration เว้นแต่ได้รับคำสั่งโดยตรง

---

# Priority 0 — Remove SUPERADMIN / DEV

Search repository ทั้งหมด:

```text
SUPERADMIN
superadmin
DEV
/dev
dev-login
dev-user-id
```

ตรวจ:

- Prisma schema
- auth
- authorization
- API guards
- proxy/middleware
- pages
- navigation
- role selectors
- types/constants
- validation
- seed
- tests

Production ต้องไม่มี Dev authentication path

Test helper เก็บได้เฉพาะใน test infrastructure

---

# Priority 1 — Authorization

ใช้ Permission นี้สำหรับ Release:

| Capability | STAFF | ADMIN |
|---|---:|---:|
| View/Search Applicants | ✅ | ✅ |
| Approve/Reject | ✅ | ✅ |
| Publish Results | ✅ | ✅ |
| Analytics / Export | ✅ | ✅ |
| Create/Edit Competition | ❌ | ✅ |
| Sport / Quota / Deadline | ❌ | ✅ |
| Manage Users | ❌ | ✅ |
| Manage Clubs | ❌ | ✅ |
| Change Roles | ❌ | ✅ |

ทุก Protected API ต้องตรวจ Server-side:

```text
Authentication
→ Role
→ Ownership/Scope
→ Current State
→ Allowed Action
```

---

# Priority 2 — Security Blockers

ต้องแก้ก่อน Deploy:

- CLUB export ข้อมูลข้าม Scope ไม่ได้
- Document delete ต้องตรวจ Ownership
- CLUB ห้ามแก้ Global Competition
- Client ห้ามกำหนด approval status เอง
- Sensitive athlete documents ต้องไม่ Public
- Production ต้องไม่มี Dev Login/Auth bypass

---

# Priority 3 — ADMIN

ADMIN ต้องทำได้:

```text
Login
→ Manage Users
→ Manage Clubs
→ Manage Competition
→ Set Sport
→ Set Quota
→ Set Deadline
→ Open/Close Registration
```

User Management:

- Search / Filter
- Create / Edit
- Activate / Suspend
- Change Role
- Last ADMIN protection
- Self protection

Role selector มีเฉพาะ:

```text
ADMIN
STAFF
ATHLETE
CLUB
TEAM_OFFICIAL
```

---

# Priority 4 — Competition

ใช้:

```text
Competition + SportQuota
```

เป็น Source of Truth สำหรับ Release นี้

ADMIN ต้อง:

- Create Competition
- Edit Competition
- Set status
- Set deadline
- Set sports
- Set quotas
- Open/Close registration

ห้ามมี SportQuota ซ้ำใน Competition เดียว

ถ้า `SportConfig` ยังไม่เชื่อมกับ Registration จริง ให้ Freeze ไว้ก่อน

---

# Priority 5 — ATHLETE Minimal Flow

ทำเฉพาะ:

```text
Register
→ Login
→ Profile
→ View Competition
→ Apply
→ Upload
→ Submit
→ View Status
→ View Result
```

Server validation ขั้นต่ำ:

- required fields
- competition exists
- competition open
- deadline not passed
- sport belongs to competition
- numeric fields valid
- duplicate application blocked
- required documents present

ยังไม่ทำ:

- Draft
- Withdraw
- Correction
- Reapply
- Accept/Decline
- Notification
- Revision system

---

# Priority 6 — STAFF

STAFF ต้องทำได้:

```text
Applicant List
→ Search / Filter
→ Detail
→ Approve / Reject
→ Publish
→ Export
```

Filters ขั้นต่ำ:

- Name
- Student ID
- Competition
- Sport
- Status

Review action ต้อง:

1. Validate server-side
2. Persist DB จริง
3. Commit ก่อน return success
4. Refresh UI จากข้อมูลจริง
5. ไม่มี fake success

---

# Priority 7 — Result

Publication ต้อง Scope ด้วย Competition:

```text
STAFF
→ Select Competition
→ Preview Approved Applicants
→ Publish
```

ห้าม publish `STAFF_APPROVED` ทุก Competition รวมกัน

ATHLETE ต้องเห็น:

- Competition
- Sport
- Status
- Final Result

---

# Analytics / Export

ขั้นต่ำ:

```text
Total Applicants
Pending
Approved
Rejected
By Competition
By Sport
```

Filters:

```text
Competition
Sport
Status
```

Export CSV/XLSX ต้องตรวจ:

- scope
- competition
- sport
- status
- column mapping

---

# Do NOT Build Before Deploy

เลื่อนไปหลัง Release:

- Notification system
- Audit UI
- Import reconciliation ขั้นสูง
- Athlete drafts
- Correction workflow เต็มรูปแบบ
- Withdrawal
- Accept/Decline
- Reserve automation
- Special Request enhancement
- Activity enhancement
- Training enhancement
- Advanced blocker queue
- Major UI redesign
- Microservices
- Fixtures / scoring / tournament bracket

ยกเว้นต้องแก้เพื่อ Security หรือ Build/Deployment

---

# Codex Working Rules

ก่อนแก้:

1. Inspect implementation จริงก่อน
2. Reuse existing code
3. แก้เฉพาะ Scope ที่เกี่ยวข้อง
4. หลีกเลี่ยง unrelated refactor
5. ไม่เพิ่ม dependency ถ้าไม่จำเป็น
6. TypeScript strict
7. Validate input server-side
8. Authorization server-side
9. เพิ่ม regression test สำหรับ bug ที่แก้

---

# Execution Order

```text
1. Remove SUPERADMIN / DEV
2. Fix authorization/security
3. ADMIN core
4. Competition config
5. ATHLETE submit flow
6. STAFF review flow
7. Publish/result/export
8. Production hardening
```

---

# Definition of Done

## Roles

- [ ] ไม่มี SUPERADMIN ใน Production
- [ ] ไม่มี DEV Role
- [ ] ไม่มี `/dev` / Dev Login / Dev Auth bypass
- [ ] ADMIN เป็น Role สูงสุด

## ADMIN

- [ ] Manage Users
- [ ] Manage Clubs
- [ ] Manage Competition
- [ ] Sport / Quota / Deadline
- [ ] Open/Close Registration

## ATHLETE

- [ ] Register/Login
- [ ] Profile
- [ ] Apply
- [ ] Upload
- [ ] Submit
- [ ] View Status
- [ ] View Result

## STAFF

- [ ] Applicant List
- [ ] Search/Filter
- [ ] Detail
- [ ] Approve
- [ ] Reject
- [ ] Publish per Competition
- [ ] Analytics
- [ ] Export

## Security

- [ ] Scope authorization ถูกต้อง
- [ ] Document ownership ถูกต้อง
- [ ] Sensitive documents ไม่ Public
- [ ] Client self-approval ไม่ได้
- [ ] ไม่มี Dev auth ใน Production

## Quality

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] Core smoke test ผ่าน

---

# Core Smoke Test

```text
ADMIN login
→ Create Competition
→ Set Sport/Quota/Deadline
→ Open Registration

ATHLETE register/login
→ Complete Profile
→ Apply
→ Submit

STAFF login
→ Find Applicant
→ Review
→ Approve

ATHLETE
→ See updated status

STAFF
→ Publish selected Competition

ATHLETE
→ See final result

STAFF
→ Export

Verify unauthorized access is blocked
Verify duplicate application is blocked
Verify deadline enforcement
Verify /dev unavailable
Verify SUPERADMIN cannot be assigned
```

# Scope Gate

ก่อนทำ Task ใหม่ถามเพียง:

```text
ช่วยให้ ADMIN configure ระบบ,
ATHLETE สมัคร,
STAFF ตรวจ/ประกาศผล,
หรือช่วย Security/Deploy หรือไม่?
```

ถ้า `YES` → ทำ

ถ้า `NO` → เลื่อนไปหลัง Deploy
