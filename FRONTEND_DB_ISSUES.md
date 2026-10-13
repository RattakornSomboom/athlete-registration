# Detailed Issues Report: Frontend ↔ Backend ↔ Database Consistency

## Resolution update — 2026-10-02

All ten findings below have been addressed in the working tree. These original findings are retained as the audit baseline, not as an assertion that the current code still has these defects. Local typecheck, lint, all 113 unit tests (including 20 new regression cases), and production build pass. See docs/HANDOFF.md for the fix mapping and verification scope. Live database/Storage integration and deployment remain UNVERIFIED.

This document contains full details for all 10 issues identified during the comprehensive audit.
Issues are classified into CRITICAL, HIGH, MEDIUM, and LOW according to system impact.

---

# CRITICAL ISSUES

## Issue: FE-DB-005
- **ID:** FE-DB-005
- **Severity:** CRITICAL
- **Category:** Enum Value & Contract Mismatch (HTTP 400 Failure)
- **Route:** `/staff/requests`
- **File:** `app/staff/requests/page.tsx`
- **Line:** 75
- **Frontend:**
```ts
const handleAction = async (id: string, status: "approved" | "rejected") => {
  ...
  body: JSON.stringify({ status, rejectedReason: rejectReason[id] })
}
```
- **Backend/API:**
```ts
const { status, rejectedReason } = body;
if (status !== "APPROVED" && status !== "REJECTED") {
  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}
```
- **Database:** Prisma Enum RequestStatus { PENDING, APPROVED, REJECTED }
- **Problem:** Frontend ส่งค่าสถานะเป็นตัวพิมพ์เล็ก ("approved" / "rejected") แต่ Backend ตรวจสอบด้วยตัวพิมพ์ใหญ่ ("APPROVED" / "REJECTED")
- **Expected:** Frontend ส่งสถานะเป็นตัวพิมพ์ใหญ่ตาม Prisma enum
- **Actual:** Backend ตอบกลับ HTTP 400 Invalid status ทุกครั้งที่เจ้าหน้าที่กดอนุมัติหรือไม่อนุมัติ
- **Impact:** เจ้าหน้าที่ไม่สามารถอนุมัติหรือปฏิเสธคำร้องพิเศษได้ ฟีเจอร์ใช้งานไม่ได้โดยสิ้นเชิงในระบบจริง
- **Recommended Fix:** แก้ไขใน app/staff/requests/page.tsx ให้ส่ง status.toUpperCase() หรือส่ง "APPROVED" / "REJECTED"

---

## Issue: FE-DB-001
- **ID:** FE-DB-001
- **Severity:** CRITICAL
- **Category:** Authentication Scope & Foreign Key Lookup Failure
- **Route:** `/club/activities, /club/activities/new`
- **File:** `app/api/activities/route.ts`
- **Line:** 20
- **Frontend:**
```ts
หน้ากิจกรรมของชมรมคาดหวังดึงและสร้างกิจกรรมของชมรมที่กำลังล็อกอิน
```
- **Backend/API:**
```ts
if (session?.role === "CLUB") {
  clubId = session.id;
}
const club = await prisma.club.findUnique({
  where: { id: session.id },
  select: { id: true }
});
if (!club) return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
```
- **Database:** model Activity { clubId String, club Club @relation(...) }
- **Problem:** ในบัญชีชมรมประเภทผู้ใช้ทั่วไป (User-based Club Login) ค่า session.id คือ User.id ในขณะที่รหัสชมรมคือ session.clubId ทำให้การค้นหาด้วย where: { id: session.id } ได้ผลลัพธ์เป็น null
- **Expected:** ใช้ session.clubId ในการอ้างอิงชมรม เช่นเดียวกับโมดูลอื่นๆ เช่น /api/club/rosters และ /api/club/training
- **Actual:** POST /api/activities ตอบกลับ 404 ไม่พบชมรม และ GET /api/activities ค้นหาด้วย user.id ทำให้ไม่พบกิจกรรมของชมรม
- **Impact:** ชมรมที่ล็อกอินด้วยบัญชีผู้ใช้ไม่สามารถดูหรือสร้างกิจกรรมชมรมได้
- **Recommended Fix:** แก้ไขใน app/api/activities/route.ts ให้ใช้ session.clubId แทน session.id

---


# HIGH ISSUES

## Issue: FE-DB-003
- **ID:** FE-DB-003
- **Severity:** HIGH
- **Category:** Missing API Integration / Fake Client-Side Submission
- **Route:** `/club/requests/new`
- **File:** `app/club/requests/new/page.tsx`
- **Line:** 32
- **Frontend:**
```ts
const handleSubmit = async () => {
  setLoading(true);
  try {
    console.log("submit request", { ...form, document: document?.name });
    await new Promise((r) => setTimeout(r, 800));
    router.push("/club/requests");
  } finally { setLoading(false); }
};
```
- **Backend/API:**
```ts
POST /api/clubs/requests มีอยู่จริงและรับ { title, reason, documentUrl }
```
- **Database:** model ClubRequest { title, reason, documentUrl, status, rejectedReason }
- **Problem:** ฟอร์มสร้างคำร้องพิเศษของชมรมใช้ setTimeout จำลองการส่งข้อมูลแบบ Fake/Mock โดยไม่ได้อัปโหลดเอกสารและไม่ได้เรียก POST /api/clubs/requests จริง รวมทั้งฟอร์มมีฟิลด์ advisorName ที่ไม่มีในฐานข้อมูล
- **Expected:** อัปโหลดไฟล์เอกสารไปยังระบบเอกสารส่วนตัว แล้วเรียก fetchJson("/api/clubs/requests", { method: "POST", body: ... })
- **Actual:** ข้อมูลไม่ได้ถูกบันทึกลงฐานข้อมูลจริง แสดงเฉพาะใน console และ redirect กลับหน้าเดิม
- **Impact:** ชมรมเข้าใจว่าส่งคำร้องสำเร็จแล้ว แต่ไม่มีข้อมูลในระบบและเจ้าหน้าที่มองไม่เห็นคำร้อง
- **Recommended Fix:** เชื่อมต่อการอัปโหลดเอกสารจริงและเรียก POST /api/clubs/requests

---

## Issue: FE-DB-006
- **ID:** FE-DB-006
- **Severity:** HIGH
- **Category:** Authorization Guard Mismatch
- **Route:** `/staff/requests`
- **File:** `app/api/staff/requests/[id]/route.ts`
- **Line:** 9
- **Frontend:**
```ts
หน้าจอเปิดให้ทั้ง STAFF และ ADMIN เข้าใช้งานได้
```
- **Backend/API:**
```ts
// GET อนุญาต STAFF และ ADMIN
if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) return 403;

// PUT จำกัดเฉพาะ STAFF
if (!session || session.role !== "STAFF") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```
- **Database:** Prisma Role ADMIN และ STAFF
- **Problem:** ผู้ดูแลระบบ (ADMIN) สามารถดูรายการคำร้องได้ แต่ถูกปฏิเสธสิทธิ์ด้วย HTTP 403 เมื่อต้องการอนุมัติหรือปฏิเสธคำร้อง
- **Expected:** ทั้ง STAFF และ ADMIN มีสิทธิ์ในการอนุมัติหรือปฏิเสธคำร้องของชมรม
- **Actual:** ADMIN โดน 403 Forbidden ไม่สามารถดำเนินการคำร้องได้
- **Impact:** ผู้ดูแลระบบสูงสุดไม่สามารถช่วยจัดการหรือแทรกแซงคำร้องพิเศษของชมรมได้
- **Recommended Fix:** แก้เงื่อนไขใน PUT ให้รองรับ ADMIN: if (!session || !["STAFF", "ADMIN"].includes(session.role))

---

## Issue: FE-DB-007
- **ID:** FE-DB-007
- **Severity:** HIGH
- **Category:** Endpoint Hardcoded Rejection / UI Button Inoperable
- **Route:** `/staff/settings`
- **File:** `app/staff/settings/page.tsx:249 & app/api/staff/settings/route.ts:31`
- **Line:** 249
- **Frontend:**
```ts
ปุ่ม 'บันทึกข้อมูล' (handleSave) เรียก POST /api/staff/settings ส่ง { sports, schedule }
```
- **Backend/API:**
```ts
export async function POST(request: Request) {
  const auth = await requireAuth(request as NextRequest, "ADMIN");
  if ("error" in auth) return auth.error;
  return NextResponse.json({ error: "ตั้งค่ากีฬาและกำหนดการผ่านหน้าการแข่งขัน" }, { status: 409 });
}
```
- **Database:** SportConfig, SystemSetting
- **Problem:** ฟังก์ชันบันทึกข้อมูลในหน้า Staff Settings ถูก Backend ปฏิเสธด้วย HTTP 409 เสมอ แต่ในหน้าจอ Frontend ยังคงแสดงฟอร์มและปุ่มบันทึกให้ผู้ใช้กด
- **Expected:** ซ่อนหรือแปลงส่วนตั้งค่ากีฬาให้เป็น Read-Only พร้อมลิงก์ไปหน้าการแข่งขัน หรือเปิดให้บันทึกจริง
- **Actual:** ผู้ใช้งานกรอกข้อมูลและกดบันทึก จะได้รับแจ้งเตือน Alert บันทึกไม่สำเร็จ เสมอ
- **Impact:** สร้างความสับสนและส่งผลต่อประสบการณ์การใช้งานของเจ้าหน้าที่
- **Recommended Fix:** ปรับหน้า /staff/settings ให้แสดงเป็นข้อมูลอ้างอิง หรือส่งต่อไปจัดการที่ /admin/competitions

---

## Issue: FE-DB-008
- **ID:** FE-DB-008
- **Severity:** HIGH
- **Category:** Architecture Inconsistency / Deprecated Import Endpoint
- **Route:** `/staff/settings`
- **File:** `app/staff/settings/page.tsx`
- **Line:** 153
- **Frontend:**
```ts
ฟังก์ชัน handleImport ส่งข้อมูลไปยัง /api/staff/import
```
- **Backend/API:**
```ts
POST /api/staff/import สร้างเฉพาะ User และ Profile แต่ไม่สร้าง Application หรือ FitnessTestResult
```
- **Database:** โมเดล User, AthleteProfile, Application, Competition
- **Problem:** ระบบมี Endpoint นำเข้าใหม่ที่สมบูรณ์คือ /api/staff/applications/import แต่ในหน้า Staff Settings ยังมี UI เก่าที่ยิงเข้า Endpoint เก่าที่ทำงานไม่ครบถ้วน
- **Expected:** การนำเข้าข้อมูลนักกีฬาควรชี้ไปยังระบบนำเข้าหลักที่ผูกการแข่งขันและโควตากีฬาครบถ้วน
- **Actual:** การนำเข้าผ่านหน้านี้ทำให้นักกีฬาไม่มีใบสมัครในการแข่งขันและไม่ปรากฏในระบบตรวจสอบ
- **Impact:** ข้อมูลนักกีฬาที่นำเข้ากลายเป็นข้อมูลลอย ไม่สามารถใช้แข่งขันจริงได้
- **Recommended Fix:** เปลี่ยนปุ่มนำเข้าในหน้า Settings ให้เปิด Modal หรือลิงก์ไปยัง /staff/applications

---


# MEDIUM ISSUES

## Issue: FE-DB-002
- **ID:** FE-DB-002
- **Severity:** MEDIUM
- **Category:** Silent Data Loss & Missing Model Fields
- **Route:** `/club/activities/new`
- **File:** `app/club/activities/new/page.tsx`
- **Line:** 28
- **Frontend:**
```ts
ฟอร์มมีช่องกรอก participants และช่องแนบไฟล์ documents / images โดย isValid บังคับ form.participants
```
- **Backend/API:**
```ts
POST /api/activities รับเฉพาะ title, description, date, location, status
```
- **Database:** model Activity { id, clubId, title, description, date, location, status, rejectionReason, createdAt }
- **Problem:** ข้อมูลผู้เข้าร่วม (participants) และไฟล์รูปภาพ/เอกสารที่ผู้ใช้เลือก ไม่ได้ถูกส่งไปบันทึกและไม่มีฟิลด์รองรับในฐานข้อมูล
- **Expected:** หากต้องการเก็บเอกสารและจำนวนผู้เข้าร่วม ควรเพิ่มฟิลด์ใน Activity และอัปโหลดไฟล์จริง หรือหากไม่ต้องการให้ตัดช่องกรอกออกจาก UI
- **Actual:** ผู้ใช้เลือกไฟล์และกรอกข้อมูล แต่ข้อมูลหลุดหายไปอย่างเงียบๆ โดยไม่มีการแจ้งเตือน
- **Impact:** ชมรมสูญเสียหลักฐานการจัดกิจกรรมโดยไม่รู้ตัว
- **Recommended Fix:** เพิ่มฟิลด์ใน Activity หรือตัด input ที่ไม่ได้บันทึกออกจากหน้าจอ

---

## Issue: FE-DB-009
- **ID:** FE-DB-009
- **Severity:** MEDIUM
- **Category:** Array Index Assumption / Unhandled Empty State
- **Route:** `/club/review`
- **File:** `app/club/review/page.tsx`
- **Line:** 25
- **Frontend:**
```ts
const quota = view?.competition?.quotas[0];
<p>เลือกแล้ว: ตัวจริง {items.filter(i=>i.squadType==="main").length} / {quota?.maxStarters ?? 0} · สำรอง {items.filter(i=>i.squadType==="reserve").length} / {quota?.maxSubstitutes ?? 0}</p>
```
- **Backend/API:**
```ts
Backend กรอง quotas เฉพาะกีฬาของชมรม
```
- **Database:** model SportQuota
- **Problem:** หากการแข่งขันยังไม่ได้กำหนดโควตาสำหรับกีฬาของชมรม ตัวแปร quotas จะเป็น Array ว่าง ([]) ทำให้ quota เป็น undefined และแสดง 0 / 0
- **Expected:** ตรวจสอบว่ามีโควตาหรือไม่ หากไม่มีให้แสดงข้อความแจ้งเตือนที่ชัดเจน
- **Actual:** แสดงโควตา 0 / 0 โดยไม่มีคำแนะนำ ทำให้ชมรมไม่ทราบสาเหตุว่าทำไมส่งรายชื่อไม่ได้
- **Impact:** เกิดความสับสนในการใช้งานเมื่อกีฬาของตนเองยังไม่ได้เปิดโควตา
- **Recommended Fix:** เพิ่มการตรวจสอบ if (!quota) และแสดง Banner แจ้งเตือนชมรม

---

## Issue: FE-DB-010
- **ID:** FE-DB-010
- **Severity:** MEDIUM
- **Category:** Enum Display Case Mismatch
- **Route:** `/staff/requests`
- **File:** `app/staff/requests/page.tsx`
- **Line:** 18
- **Frontend:**
```ts
const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-800" },
};
const pendingCount = requests.filter((r) => r.status === "pending").length;
```
- **Backend/API:**
```ts
ส่งสถานะจากฐานข้อมูลตรงตาม Prisma Enum: PENDING, APPROVED, REJECTED
```
- **Database:** RequestStatus { PENDING, APPROVED, REJECTED }
- **Problem:** Frontend นิยามและตรวจสอบสถานะด้วยตัวพิมพ์เล็ก ทำให้ STATUS_LABEL["PENDING"] เป็น undefined และ pendingCount ได้ผลลัพธ์เป็น 0 เสมอ
- **Expected:** รองรับคีย์ตัวพิมพ์ใหญ่ตาม Prisma Enum หรือทำ toLowerCase() ก่อนจับคู่
- **Actual:** Badge แสดงสถานะไม่มีสไตล์ และตัวนับคำร้องรอพิจารณาแสดง 0 คำร้องเสมอ
- **Impact:** ตัวเลขสถิติบนหัวหน้าจอแสดงผลคลาดเคลื่อน
- **Recommended Fix:** ปรับปรุง STATUS_LABEL ให้รองรับคีย์ UPPERCASE และแปลงค่า status ก่อน filter

---


# LOW ISSUES

## Issue: FE-DB-004
- **ID:** FE-DB-004
- **Severity:** LOW
- **Category:** Redundant Parameter / Minor Contract Discrepancy
- **Route:** `/staff/applications/[clubId]/[competitionId]`
- **File:** `app/staff/applications/[clubId]/[competitionId]/page.tsx`
- **Line:** 105
- **Frontend:**
```ts
body: JSON.stringify({ status: "STAFF_APPROVED", label: "อนุมัติโดยเจ้าหน้าที่", by: "staff" })
```
- **Backend/API:**
```ts
statusHistory: { create: { status, label, by: session.id } }
```
- **Database:** model StatusHistory { by String }
- **Problem:** Frontend ส่งค่าสตริง by: "staff" ไปยัง API แต่ Backend ละเลยค่านั้นและแทนที่ด้วย session.id ซึ่งถูกต้องตามหลักความปลอดภัย
- **Expected:** ตัดฟิลด์ by ออกจาก Payload ฝั่ง Frontend เพื่อลดความซ้ำซ้อน
- **Actual:** Backend ละเลยฟิลด์ by อย่างปลอดภัย การทำงานไม่เสียหาย
- **Impact:** เป็น Technical Debt เล็กน้อย ไม่ส่งผลกระทบต่อการทำงาน
- **Recommended Fix:** ตัด by: "staff" ออกจาก body ที่ส่งไปยัง API

---
