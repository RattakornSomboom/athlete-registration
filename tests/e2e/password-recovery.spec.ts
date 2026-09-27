import { expect, test } from "@playwright/test";

test.use({ baseURL: process.env.PASSWORD_RECOVERY_BASE_URL || "http://localhost:3137" });

test("reset rejects passwords over 72 UTF-8 bytes and submits a valid password", async ({ page }) => {
  const submissions: unknown[] = [];
  await page.route("**/api/auth/reset-password**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { valid: true, email: "athlete@example.com" } });
      return;
    }
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ json: { message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" } });
  });

  await page.goto("/reset-password?token=test-token");
  const password = page.getByLabel(/^รหัสผ่านใหม่/);
  const confirmation = page.getByLabel(/^ยืนยันรหัสผ่านใหม่/);
  const submit = page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true });
  await password.fill("ก".repeat(25));
  await confirmation.fill("ก".repeat(25));
  await expect(submit).toBeDisabled();
  expect(submissions).toHaveLength(0);

  await password.fill("ก".repeat(24));
  await confirmation.fill("ก".repeat(24));
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("heading", { name: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" })).toBeVisible();
  expect(submissions).toEqual([{
    token: "test-token",
    password: "ก".repeat(24),
    confirmPassword: "ก".repeat(24),
  }]);
  await expect(page.getByText(/หากบัญชีถูกระงับ/)).toBeVisible();
});

test("changing the token in the same page clears the previous valid form", async ({ page }) => {
  await page.route("**/api/auth/reset-password**", async (route) => {
    const token = new URL(route.request().url()).searchParams.get("token");
    await route.fulfill(token === "valid-token"
      ? { json: { valid: true, email: "athlete@example.com" } }
      : { status: 400, json: { error: "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่" } });
  });
  await page.goto("/reset-password?token=valid-token");
  await page.getByLabel(/^รหัสผ่านใหม่/).fill("previous-password");
  await page.evaluate(() => window.history.pushState(null, "", "/reset-password?token=invalid-token"));
  await expect(page.getByRole("link", { name: "ขอลิงก์ตั้งรหัสผ่านใหม่", exact: true })).toBeVisible();
  await expect(page.getByLabel(/^รหัสผ่านใหม่/)).toHaveCount(0);
  await expect(page.getByText("athlete@example.com", { exact: false })).toHaveCount(0);
});

test("forgot password keeps confirmation generic and shows validation errors", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/auth/forgot-password", async (route) => {
    attempts += 1;
    await route.fulfill(attempts === 1
      ? { status: 400, json: { error: "กรุณาตรวจสอบข้อมูลที่ส่งมา", fieldErrors: { email: "รูปแบบอีเมลไม่ถูกต้อง" } } }
      : { json: { message: "หากอีเมลนี้มีบัญชีอยู่ในระบบ เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ให้" } });
  });
  await page.goto("/forgot-password");
  await page.getByLabel("อีเมล", { exact: false }).fill("unknown@example.com");
  await page.getByRole("button", { name: "ส่งลิงก์ตั้งรหัสผ่านใหม่" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "รูปแบบอีเมลไม่ถูกต้อง" })).toBeVisible();
  await page.getByRole("button", { name: "ส่งลิงก์ตั้งรหัสผ่านใหม่" }).click();
  await expect(page.getByText("ตรวจสอบกล่องจดหมายของคุณ")).toBeVisible();
  await expect(page.getByText(/หากอีเมลนี้มีบัญชีอยู่ในระบบ/)).toBeVisible();
  await expect(page.getByText(/15 นาที/)).toBeVisible();
});
