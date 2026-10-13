import { test, expect } from "@playwright/test";

test.describe("Admin User Management API & Integration", () => {
  test("TC-NEG-01: GET /api/admin/users ปฏิเสธเมื่อไม่มีการเข้าสู่ระบบ (401)", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("TC-NEG-02: GET /api/admin/users คืน 400 เมื่อระบุ limit เกิน 100", async ({ request }) => {
    // ใช้คุกกี้จำลองหรือ token ของผู้ดูแลระบบ
    const adminCookie = process.env.E2E_ADMIN_TOKEN;
    test.skip(!adminCookie, "ต้องระบุ E2E_ADMIN_TOKEN ในสภาพแวดล้อมเพื่อทดสอบการอนุญาต");

    const res = await request.get("/api/admin/users?limit=200", {
      headers: { cookie: `token=${adminCookie}` },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("จำนวนรายการไม่ถูกต้อง");
  });

  test("TC-NEG-03: GET /api/admin/users/[id] คืน 404 เมื่อไม่พบผู้ใช้งาน", async ({ request }) => {
    const adminCookie = process.env.E2E_ADMIN_TOKEN;
    test.skip(!adminCookie, "ต้องระบุ E2E_ADMIN_TOKEN ในสภาพแวดล้อมเพื่อทดสอบ");

    const res = await request.get("/api/admin/users/cuid-not-found-9999", {
      headers: { cookie: `token=${adminCookie}` },
    });
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.error).toContain("ไม่พบผู้ใช้งาน");
  });

  test("TC-POS-01: GET /api/admin/users ดึงข้อมูลผู้ใช้สำเร็จและไม่เปิดเผยรหัสผ่าน", async ({ request }) => {
    const adminCookie = process.env.E2E_ADMIN_TOKEN;
    test.skip(!adminCookie, "ต้องระบุ E2E_ADMIN_TOKEN ในสภาพแวดล้อมเพื่อทดสอบ");

    const res = await request.get("/api/admin/users?page=1&limit=5", {
      headers: { cookie: `token=${adminCookie}` },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("totalPages");

    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).not.toHaveProperty("password"); // ตรวจสอบความปลอดภัย: ห้ามคืน hash รหัสผ่าน
    }
  });

  test("TC-UI-01: หน้า /admin/users มีการป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต", async ({ page }) => {
    // ผู้ใช้ทั่วไปที่ไม่ได้ล็อกอินจะถูก middleware ดีดกลับไปยังหน้า login
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });
});