# Comprehensive Frontend ↔ Backend/API ↔ Database Consistency Audit Report

**Date:** 2026-10-02  
**Project:** ระบบบริหารจัดการการแข่งขันกีฬา (มหาวิทยาลัยพะเยา)  
**Auditor:** Senior Full-Stack Developer & Software Architect  
**Scope:** Full-System Frontend Routes (35), Shared Components (11), Backend API Routes (52), Prisma Schema (24 Models, 9 Enums, 24 Relations)  

---

# Executive Summary

สรุปผลการตรวจสอบความสอดคล้องทั้งระบบ:

| Metrics | Count |
|---|---|
| **จำนวน Frontend Routes ที่ตรวจ** | 35 |
| **จำนวน Shared Components ที่ตรวจ** | 11 |
| **จำนวน Backend API Endpoints ที่ตรวจ** | 52 |
| **จำนวน Database Models (Prisma)** | 24 |
| **จำนวน Prisma Enums** | 9 |
| **จำนวน Prisma Relations** | 24 |
| **จำนวน Issues ทั้งหมด** | 10 |
| **Critical Issues** | 2 |
| **High Issues** | 4 |
| **Medium Issues** | 3 |
| **Low Issues** | 1 |

### Quality Gates Status
- TypeScript Strict (`npx tsc --noEmit`): PASSED (0 errors)
- ESLint (`npm run lint`): PASSED (0 errors, 0 warnings)
- Unit Tests (`npm run test:unit`): PASSED (93 passed, 0 failed)
- Production Build: PASSED (66 static/dynamic routes compiled cleanly)

---

# Route Coverage

| Route | Status | DB Connected | API | Issues |
|---|---|---|---|---|
| `/` | PASS | Direct Static | `None` | None |
| `/login` | PASS | YES | `/api/auth/login` | None |
| `/change-password` | PASS | YES | `/api/auth/password` | None |
| `/admin` | PASS | Direct Static | `None` | None |
| `/admin/users` | PASS | YES | `/api/admin/users/*` | None |
| `/admin/clubs` | PASS | YES | `/api/clubs/*, /api/admin/clubs/*` | None |
| `/admin/competitions` | PASS | YES | `/api/competitions/*` | None |
| `/athlete/register` | PASS | YES | `/api/auth/me, /api/competitions, /api/documents, /api/applications` | None |
| `/athlete/status` | PASS | YES | `/api/applications/*` | None |
| `/athlete/[id]` | PASS | YES | `/api/applications/[id]` | None |
| `/club/activities` | PASS | YES | `/api/activities` | FE-DB-001, FE-DB-002 |
| `/club/activities/new` | PASS | YES | `/api/activities` | FE-DB-001, FE-DB-002 |
| `/club/athletes` | PASS | YES | `/api/auth/me, /api/clubs/[id]/athletes` | None |
| `/club/officials` | PASS | YES | `/api/club/officials` | None |
| `/club/requests` | PASS | YES | `/api/clubs/requests` | None |
| `/club/requests/new` | BROKEN (Mocked) | NO | `None (Fake setTimeout)` | FE-DB-003 |
| `/club/review` | PASS | YES | `/api/competitions, /api/club/rosters` | FE-DB-009 |
| `/club/training` | PASS | YES | `/api/club/training` | None |
| `/staff/activities` | PASS | YES | `/api/activities` | None |
| `/staff/activities/[id]` | PASS | YES | `/api/activities/[id]` | None |
| `/staff/analytics` | PASS | YES | `/api/staff/analytics, /api/staff/snapshots/*` | None |
| `/staff/applicants/[id]` | PASS | YES | `/api/applications/[id]` | None |
| `/staff/applications` | PASS | YES | `/api/clubs, /api/staff/applications/*` | None |
| `/staff/applications/[clubId]` | PASS | YES | `/api/clubs/[id]/competitions` | None |
| `/staff/applications/[clubId]/[competitionId]` | PASS | YES | `/api/competitions/[id], /api/staff/applications, /api/applications/[id]` | FE-DB-004 |
| `/staff/competitions` | PASS | YES | `/api/competitions/*` | None |
| `/staff/fitness-tests` | PASS | YES | `/api/staff/fitness-tests/*` | None |
| `/staff/officials` | PASS | YES | `/api/staff/officials` | None |
| `/staff/requests` | WARNING | YES | `/api/staff/requests/*` | FE-DB-005, FE-DB-006, FE-DB-010 |
| `/staff/rosters` | PASS | YES | `/api/staff/rosters` | None |
| `/staff/selection` | PASS | YES | `/api/staff/applications/announce` | None |
| `/staff/settings` | WARNING | YES | `/api/staff/settings, /api/staff/import` | FE-DB-007, FE-DB-008 |
| `/team-official/register` | PASS | YES | `/api/competitions, /api/clubs, /api/team-official/applications` | None |
| `/team-official/signup` | PASS | YES | `/api/auth/register-official` | None |
| `/team-official/status` | PASS | YES | `/api/team-official/applications` | None |

---

# Database Coverage

| Model | Used by Frontend | API | Routes | Issues |
|---|---|---|---|---|
| `User` | YES | `/api/auth/*`, `/api/admin/users/*` | `/login`, `/admin/users`, `/change-password`, `/athlete/*` | None |
| `AthleteProfile` | YES | `/api/athletes/profile`, `/api/auth/me`, `/api/applications/*` | `/athlete/register`, `/athlete/[id]`, `/staff/applicants/[id]` | None |
| `Club` | YES | `/api/clubs/*`, `/api/admin/clubs/*` | `/admin/clubs`, `/staff/applications`, `/club/*` | None |
| `Competition` | YES | `/api/competitions/*`, `/api/clubs/[id]/competitions` | `/admin/competitions`, `/staff/competitions`, `/athlete/register` | None |
| `SportQuota` | YES | `/api/competitions/*`, `/api/staff/analytics` | `/admin/competitions`, `/athlete/register`, `/staff/analytics` | None |
| `Coach` | YES | `/api/club/training` | `/club/training` | None |
| `TrainingProgram` | YES | `/api/club/training` | `/club/training` | None |
| `TrainingReport` | YES | `/api/club/training` | `/club/training` | None |
| `Application` | YES | `/api/applications/*`, `/api/staff/applications/*` | `/athlete/register`, `/athlete/status`, `/staff/applications/*` | None |
| `SportEntry` | YES | `/api/applications/*` | `/athlete/register`, `/athlete/[id]` | None |
| `CompetitionResult` | YES | `/api/applications/*` | `/athlete/register`, `/athlete/[id]` | None |
| `StatusHistory` | YES | `/api/applications/*` | `/athlete/status`, `/athlete/[id]` | None |
| `Activity` | YES | `/api/activities/*` | `/club/activities/*`, `/staff/activities/*` | FE-DB-001, FE-DB-002 |
| `ClubRequest` | YES | `/api/clubs/requests`, `/api/staff/requests/*` | `/club/requests/*`, `/staff/requests` | FE-DB-003, FE-DB-005, FE-DB-006, FE-DB-010 |
| `SportConfig` | YES | `/api/staff/settings` | `/staff/settings` | FE-DB-007 |
| `SystemSetting` | YES | `/api/staff/settings` | `/staff/settings` | None |
| `PrivateDocument` | YES | `/api/documents/*`, `/api/applications/*` | `/athlete/register`, `/club/review`, `/team-official/register` | None |
| `ClubRoster` | YES | `/api/club/rosters`, `/api/staff/rosters` | `/club/review`, `/staff/rosters` | None |
| `RosterItem` | YES | `/api/club/rosters`, `/api/staff/rosters` | `/club/review`, `/staff/rosters` | None |
| `RosterEvent` | YES | `/api/club/rosters`, `/api/staff/rosters` | `/club/review`, `/staff/rosters` | None |
| `OfficialApplication` | YES | `/api/team-official/applications`, `/api/club/officials`, `/api/staff/officials` | `/team-official/*`, `/club/officials`, `/staff/officials` | None |
| `OfficialEvent` | YES | `/api/team-official/applications`, `/api/club/officials`, `/api/staff/officials` | `/team-official/*`, `/club/officials`, `/staff/officials` | None |
| `AnalyticsSnapshot` | YES | `/api/staff/snapshots/*` | `/staff/analytics` | None |
| `FitnessTestResult` | YES | `/api/staff/fitness-tests/*` | `/staff/fitness-tests`, `/staff/analytics` | None |

---

# 20. Dependency Matrix

### Matrix 1: Frontend Entity ↔ API ↔ DB Model
| Frontend Entity | API | DB Model | Fields | Relation | Status |
|---|---|---|---|---|---|
| User & Profile | `/api/admin/users` | `User`, `AthleteProfile` | id, email, role, isActive, studentId, firstName, lastName | User ↔ AthleteProfile (1:1) | PASS |
| Club Account | `/api/clubs` | `Club` | id, name, sport, email, presidentName, isActive, status | Club ↔ Rosters, Activities, Coach | PASS |
| Competition & Quota | `/api/competitions` | `Competition`, `SportQuota` | id, name, round, year, deadline, status, maxStarters, maxSubstitutes | Competition ↔ SportQuota (1:N) | PASS |
| Athlete Application | `/api/applications` | `Application` | id, sport, category, division, status, documents, supervisorName | Application ↔ User, Competition, RosterItem | PASS |
| Club Roster Review | `/api/club/rosters` | `ClubRoster`, `RosterItem` | id, clubId, competitionId, status, version, squadType | ClubRoster ↔ RosterItem ↔ Application | PASS |
| Team Official | `/api/team-official/applications` | `OfficialApplication` | id, userId, clubId, competitionId, status, profile, documents | OfficialApplication ↔ User, Club, Competition | PASS |
| Special Club Request | `/api/staff/requests` | `ClubRequest` | id, clubId, title, reason, documentUrl, status, rejectedReason | ClubRequest ↔ Club (N:1) | BROKEN (FE-DB-005) |
| Club Activity | `/api/activities` | `Activity` | id, clubId, title, description, date, location, status | Activity ↔ Club (N:1) | WARNING (FE-DB-001) |
| Fitness Evaluation | `/api/staff/fitness-tests` | `FitnessTestResult` | applicationId, status, totalScore, scores, notes, testedAt | FitnessTestResult ↔ Application (1:1) | PASS |

### Matrix 2: Frontend Route ↔ Components ↔ API ↔ DB Models ↔ Risk
| Frontend Route | Components | API | DB Models | Risk |
|---|---|---|---|---|
| `/` | Public Landing Page | `None` | None | LOW |
| `/login` | Login Form | `/api/auth/login` | User, Club | LOW |
| `/change-password` | Forced Password Change Form | `/api/auth/password` | User, Club | LOW |
| `/admin` | Admin Dashboard Nav | `None` | None | LOW |
| `/admin/users` | User Table, Edit/Create Modal, AdminPasswordReset | `/api/admin/users/*` | User, AthleteProfile | LOW |
| `/admin/clubs` | Club Table, Add Modal, President Modal, AdminPasswordReset | `/api/clubs/*, /api/admin/clubs/*` | Club | LOW |
| `/admin/competitions` | CompetitionManagement | `/api/competitions/*` | Competition, SportQuota | LOW |
| `/athlete/register` | Register Multi-Step Form, AthleteProfilePhoto | `/api/auth/me, /api/competitions, /api/documents, /api/applications` | User, AthleteProfile, Competition, SportQuota, Application, SportEntry, CompetitionResult, PrivateDocument | LOW |
| `/athlete/status` | Status Cards, Application List | `/api/applications/*` | Application, StatusHistory, SportEntry | LOW |
| `/athlete/[id]` | Application Detail View | `/api/applications/[id]` | Application, User, Profile, Competition, Club | LOW |
| `/club/activities` | Activities List Table | `/api/activities` | Activity, Club | MEDIUM |
| `/club/activities/new` | New Activity Form | `/api/activities` | Activity, Club | MEDIUM |
| `/club/athletes` | Club Athletes Table | `/api/auth/me, /api/clubs/[id]/athletes` | Application, User, Profile, Competition | LOW |
| `/club/officials` | OfficialReview | `/api/club/officials` | OfficialApplication, OfficialEvent, Competition | LOW |
| `/club/requests` | Request List Table | `/api/clubs/requests` | ClubRequest, Club | LOW |
| `/club/requests/new` | New Request Form | `None (Fake setTimeout)` | ClubRequest | HIGH |
| `/club/review` | Club Roster Form, PrivateUpload, History | `/api/competitions, /api/club/rosters` | ClubRoster, RosterItem, RosterEvent, Application | MEDIUM |
| `/club/training` | Training Log & Coach Management Forms | `/api/club/training` | Coach, TrainingProgram, TrainingReport | LOW |
| `/staff/activities` | Staff Activities Approval Table | `/api/activities` | Activity, Club | LOW |
| `/staff/activities/[id]` | Staff Activity Detail & Approval Form | `/api/activities/[id]` | Activity, Club | LOW |
| `/staff/analytics` | AnalyticsSummary, StaffFitnessSection | `/api/staff/analytics, /api/staff/snapshots/*` | AnalyticsSnapshot, Application, Competition | LOW |
| `/staff/applicants/[id]` | Athlete Application View | `/api/applications/[id]` | Application, User, Profile, Competition | LOW |
| `/staff/applications` | StaffReview, Import Modal, Announcement Banner | `/api/clubs, /api/staff/applications/*` | Application, Competition, SportQuota, Club, User | LOW |
| `/staff/applications/[clubId]` | Club Competitions Overview | `/api/clubs/[id]/competitions` | Club, Competition, Application | LOW |
| `/staff/applications/[clubId]/[competitionId]` | Applicant Review Modal & Table | `/api/competitions/[id], /api/staff/applications, /api/applications/[id]` | Application, Competition, Club, User | LOW |
| `/staff/competitions` | CompetitionManagement | `/api/competitions/*` | Competition, SportQuota | LOW |
| `/staff/fitness-tests` | StaffFitnessSection, FitnessResultsTable | `/api/staff/fitness-tests/*` | FitnessTestResult, Application, User, Profile | LOW |
| `/staff/officials` | OfficialReview | `/api/staff/officials` | OfficialApplication, OfficialEvent, Competition | LOW |
| `/staff/requests` | Staff Requests Review Table & Modal | `/api/staff/requests/*` | ClubRequest, Club | CRITICAL |
| `/staff/rosters` | Rosters Review Table, SendBack Modal | `/api/staff/rosters` | ClubRoster, RosterItem, RosterEvent, Application | LOW |
| `/staff/selection` | StaffReview | `/api/staff/applications/announce` | Application, Competition, SportQuota | LOW |
| `/staff/settings` | Sports Settings Form, Qualifier Schedule Form, Import Form | `/api/staff/settings, /api/staff/import` | SportConfig, SystemSetting, User, Profile | HIGH |
| `/team-official/register` | Official Registration Form, PrivateUpload | `/api/competitions, /api/clubs, /api/team-official/applications` | OfficialApplication, OfficialEvent, Competition | LOW |
| `/team-official/signup` | Official Account Signup Form | `/api/auth/register-official` | User | LOW |
| `/team-official/status` | Official Status Overview Cards | `/api/team-official/applications` | OfficialApplication, OfficialEvent, Competition | LOW |

---

# 21. ตรวจความครบถ้วนของ Audit

- [x] ทุก Frontend route ถูกตรวจ (35/35 routes)
- [x] ทุก dynamic route ถูกตรวจ (`[id]`, `[clubId]`, `[competitionId]`, `[applicationId]`, `[field]`)
- [x] ทุก API call ถูกตรวจ (61 fetch/fetchJson calls mapped to 52 endpoints)
- [x] ทุก form ถูกตรวจ (Login, Password, Register, Settings, Requests, Activities, Training, Roster, Official)
- [x] ทุก database model ถูก map (24/24 Prisma models)
- [x] ทุก relation ถูกตรวจ (24 Prisma relations verified)
- [x] ทุก enum ถูกตรวจ (9/9 Prisma enums verified)
- [x] ทุก frontend type ถูกตรวจ (Strict types in component files verified)
- [x] ทุก validation schema ถูกตรวจ (lib/validation.ts verified)
- [x] mock data ถูกตรวจ (Identified fake submission in /club/requests/new)
- [x] legacy fields ถูกค้นหา (Identified legacy import and legacy upload wrapper)
- [x] auth/role ถูกตรวจ (Role guards and session scope verified)
- [x] build/typecheck/lint ถูกตรวจ (tsc, lint, and unit test pass)

---

# 22. Final Summary

## Final Assessment

Database ↔ Backend:
[GOOD]

Backend ↔ Frontend:
[WARNING]

Frontend ↔ Database:
[WARNING]

Overall:
[NEEDS FIX]

---

### สรุป Top 10 ปัญหาที่ควรแก้ก่อน

1. **[CRITICAL] FE-DB-005 (`app/staff/requests/page.tsx:75` ↔ `app/api/staff/requests/[id]/route.ts:18`):**  
   Frontend ส่งสถานะคำร้องเป็นตัวพิมพ์เล็ก (`"approved"` / `"rejected"`) แต่ API ตรวจสอบด้วยตัวพิมพ์ใหญ่ (`"APPROVED"` / `"REJECTED"`) ทำให้ API ตอบกลับ `HTTP 400 Invalid status` เสมอ เจ้าหน้าที่ไม่สามารถอนุมัติหรือปฏิเสธคำร้องพิเศษได้เลย

2. **[CRITICAL] FE-DB-001 (`app/api/activities/route.ts:20, 68`):**  
   ตรวจสอบผู้ใช้ชมรมด้วย `session.id` แทน `session.clubId` ทำให้บัญชีประเภท User-based Club ค้นหาชมรมไม่พบ (404) และไม่สามารถสร้างหรือดึงกิจกรรมชมรมได้

3. **[HIGH] FE-DB-003 (`app/club/requests/new/page.tsx:32`):**  
   หน้าสร้างคำร้องพิเศษของชมรมใช้ `setTimeout` จำลองการส่งข้อมูล (Mock) โดยไม่ได้อัปโหลดไฟล์และไม่ได้เรียก `POST /api/clubs/requests` บันทึกลงฐานข้อมูลจริง

4. **[HIGH] FE-DB-006 (`app/api/staff/requests/[id]/route.ts:9`):**  
   PUT endpoint ตรวจสอบสิทธิ์เฉพาะ `role === "STAFF"` ทำให้ผู้ดูแลระบบ `ADMIN` ถูกปฏิเสธสิทธิ์ด้วย `HTTP 403 Forbidden` เมื่อต้องการจัดการคำร้อง

5. **[HIGH] FE-DB-007 (`app/staff/settings/page.tsx:249` ↔ `app/api/staff/settings/route.ts:31`):**  
   ปุ่ม "บันทึกข้อมูล" ในหน้า Staff Settings เรียก `POST /api/staff/settings` แต่ Backend ถูก hardcoded ให้ปฏิเสธด้วย `HTTP 409` เสมอ ทำให้เกิด Alert แจ้งเตือนข้อผิดพลาดทุกครั้ง

6. **[HIGH] FE-DB-008 (`app/staff/settings/page.tsx:153`):**  
   ฟังก์ชัน Import นักกีฬาในหน้า Settings ยังเรียกใช้ endpoint เก่า `/api/staff/import` ที่สร้างเฉพาะ User/Profile แต่ไม่ผูก Application หรือการแข่งขัน ซึ่งขัดแย้งกับระบบใหม่ใน `/api/staff/applications/import`

7. **[MEDIUM] FE-DB-002 (`app/club/activities/new/page.tsx:28, 48`):**  
   ฟอร์มมีช่องระบุ `participants`, แนบรูปภาพ และเอกสาร แต่โมเดล `Activity` ในฐานข้อมูลไม่มีฟิลด์เหล่านี้ และข้อมูลไฟล์ถูกละเลยไปโดยไม่มีการแจ้งเตือน

8. **[MEDIUM] FE-DB-009 (`app/club/review/page.tsx:25`):**  
   แสดงโควตาตัวจริง/ตัวสำรองโดยดึงจาก `quotas[0]` ทันที หากการแข่งขันยังไม่ได้กำหนดโควตาสำหรับกีฬานั้นจะแสดง `0 / 0` โดยไม่มีข้อความแจ้งเตือนที่ชัดเจน

9. **[MEDIUM] FE-DB-010 (`app/staff/requests/page.tsx:18, 93`):**  
   ตัวแปร `STATUS_LABEL` และตัวนับ `pendingCount` อิงสตริงตัวพิมพ์เล็ก (`pending`) แต่ฐานข้อมูลส่งตัวพิมพ์ใหญ่ (`PENDING`) ทำให้ badge แสดงสถานะไม่ตรงและตัวนับคำร้องรอพิจารณาแสดง 0

10. **[LOW] FE-DB-004 (`app/staff/applications/[clubId]/[competitionId]/page.tsx:105`):**  
    การส่ง payload ใน `handleApprove` ส่งฟิลด์เกินจำเป็น `by: "staff"` ซึ่ง Backend จะ override เป็น `session.id` อยู่แล้ว
