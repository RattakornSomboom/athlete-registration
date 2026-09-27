# สร้าง PROJECT_CONTEXT.md สำหรับทำงานต่อ

สร้างเอกสารภาษาไทยที่ราก repository โดยสรุปจากโค้ดและหลักฐานปัจจุบัน ไม่บันทึกประวัติสนทนา รหัสผ่าน หรือค่า environment ที่เป็นความลับ

## เนื้อหาที่จะบันทึก

1. **Architecture:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4; API routes เชื่อม PostgreSQL ผ่าน Prisma 7 และใช้ Supabase Storage สำหรับเอกสาร
2. **Decisions:** Snapshot เก็บ PostgreSQL; Analytics ไม่สร้างข้อมูลสมมติ; บัญชีชมรมส่งพร้อมเอกสารแล้วล็อก; เจ้าหน้าที่ทีมผ่านชมรมก่อนเจ้าหน้าที่; คงเครื่องมือ dev ระหว่างพัฒนา
3. **Coding conventions:** TypeScript strict, indentation 2 spaces, double quotes, semicolons, alias `@/`, naming ตาม AGENTS.md; ห้ามปิด lint/strict เพื่อหลบข้อผิดพลาด
4. **Database/schema:** ความสัมพันธ์ User/Profile/Application/Competition/SportQuota, ClubRoster/RosterItem, OfficialApplication, PrivateDocument และ AnalyticsSnapshot; unique constraints และสถานะสำคัญ; Competition ไม่มี relation `club`
5. **Authentication/authorization:** JWT ใน cookie `token`, ตรวจบัญชีและ role ปัจจุบันจาก DB, page guard ใน `proxy.ts`, ตรวจสิทธิ์ซ้ำใน API; ไม่ใช้ cookie `role` หรือ localStorage เป็นหลักฐานสิทธิ์
6. **ไฟล์สำคัญ:** ระบุ schema/migrations, auth/proxy, validation, transaction/error helpers, API สมัคร, UI request helpers, tests, README และ TEST-REPORT พร้อมหน้าที่แต่ละกลุ่ม
7. **งานเสร็จและหลักฐาน:** Phase 4/5, การแก้หน้า detail crash ด้วย nullable `rosterClub`, และกฎรับสมัครเฉพาะ `OPEN`; แยกผลทดสอบที่ยืนยันแล้วจากการอ่านโค้ด
8. **งานค้าง:** ตรวจ tests กรณีไม่มี deadline, แก้ตัวเลขรายงาน 31 ให้ตรง log 30, ตรวจผล lint ใหม่ และเตรียม production/UAT ภายหลัง

## ความถูกต้องของสถานะ

- ระบุวันที่ตรวจและอ้างไฟล์หลักฐาน แทนการประกาศว่าทุก Phase เสร็จทั้งหมด
- ขณะนี้มีการแก้ไฟล์เพิ่มเติมใน working tree จึงระบุ **23 errors / 9 warnings เป็นผล lint รอบก่อน** จนกว่าจะตรวจผลใหม่
- ไม่อ้างว่าชุดทดสอบเก่ารับรองการแก้ที่เกิดภายหลัง
- เก็บการแก้และไฟล์ที่มีอยู่ทั้งหมด ไม่ reset หรือเปลี่ยนโค้ดระบบในงานเอกสารนี้

## เกณฑ์รับงาน

มี `PROJECT_CONTEXT.md` ครบหัวข้อที่ร้องขอ กระชับและใช้รับงานต่อได้จริง พาธอ้างอิงมีอยู่จริง ไม่มี secret และระบุชัดว่างานใดเสร็จ งานใดยังต้องตรวจยืนยัน
