import { test, expect, type APIResponse, type BrowserContext } from "@playwright/test";

// ทดสอบสิทธิ์ของโมดูลสู่ความเป็นเลิศ (/staff/excellence และ /api/staff/excellence/*)
// บัญชีทดสอบอ่านจาก env เท่านั้น ไม่มีรหัสผ่านในโค้ด เช่น
//   E2E_STAFF_USERNAME / E2E_STAFF_PASSWORD
// บทบาทที่รองรับ: ATHLETE, CLUB, TEAM_OFFICIAL, STAFF, ADMIN (ข้ามเฉพาะบทบาทที่ไม่ได้ตั้งค่า)
// ทุก request ใช้ข้อมูลสาธิตหรือ body ที่ validate ไม่ผ่าน จึงไม่เขียนข้อมูลลงฐานข้อมูลแม้ guard จะพัง
// บัญชีต้องไม่ติดสถานะ mustChangePassword

type Role = "ATHLETE" | "CLUB" | "TEAM_OFFICIAL" | "STAFF" | "ADMIN";
const DENIED: Role[] = ["ATHLETE", "CLUB", "TEAM_OFFICIAL"];
const ALLOWED: Role[] = ["STAFF", "ADMIN"];

type Endpoint = { method: "GET" | "PUT" | "POST" | "DELETE"; path: string; data?: Record<string, never>; allowedStatus: number };

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/staff/excellence", allowedStatus: 200 },
  { method: "GET", path: "/api/staff/excellence?demo=true", allowedStatus: 200 },
  { method: "GET", path: "/api/staff/excellence/demo-1?demo=true", allowedStatus: 200 },
  { method: "GET", path: "/api/staff/excellence/benchmarks?demo=true", allowedStatus: 200 },
  // เขียน: ส่ง body ว่าง/รหัสสาธิต เพื่อให้ผ่านสิทธิ์แล้วได้ 400 (validation) และไม่มีการเขียนจริง
  { method: "PUT", path: "/api/staff/excellence/benchmarks", data: {}, allowedStatus: 400 },
  { method: "POST", path: "/api/staff/excellence/results", data: {}, allowedStatus: 400 },
  { method: "PUT", path: "/api/staff/excellence/results/demo-1-r1", data: {}, allowedStatus: 400 },
  { method: "DELETE", path: "/api/staff/excellence/results/demo-1-r1", allowedStatus: 400 },
  { method: "POST", path: "/api/staff/excellence/plans", data: {}, allowedStatus: 400 },
  { method: "POST", path: "/api/staff/excellence/retests", data: {}, allowedStatus: 400 },
];

const PAGES = ["/staff/excellence", "/staff/excellence?demo=true", "/staff/excellence/demo-1?demo=true", "/staff/excellence/benchmarks"];

function credentials(role: Role): { username: string; password: string } | null {
  const username = process.env[`E2E_${role}_USERNAME`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  return username && password ? { username, password } : null;
}

function send(context: BrowserContext, endpoint: Endpoint): Promise<APIResponse> {
  const options = endpoint.data ? { data: endpoint.data } : undefined;
  switch (endpoint.method) {
    case "GET": return context.request.get(endpoint.path);
    case "PUT": return context.request.put(endpoint.path, options);
    case "POST": return context.request.post(endpoint.path, options);
    case "DELETE": return context.request.delete(endpoint.path);
  }
}

test.describe("ไม่ได้เข้าสู่ระบบ", () => {
  for (const endpoint of ENDPOINTS) {
    test(`${endpoint.method} ${endpoint.path} → 401`, async ({ request }) => {
      const response = await (endpoint.method === "GET"
        ? request.get(endpoint.path)
        : request.fetch(endpoint.path, { method: endpoint.method, data: endpoint.data }));
      expect(response.status()).toBe(401);
    });
  }

  for (const path of PAGES) {
    test(`หน้า ${path} ถูกส่งไปหน้า login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

for (const role of [...DENIED, ...ALLOWED]) {
  const denied = DENIED.includes(role);

  test.describe(`บทบาท ${role} (${denied ? "ต้องถูกปฏิเสธ" : "ต้องเข้าได้"})`, () => {
    let context: BrowserContext | null = null;

    test.beforeAll(async ({ browser }, testInfo) => {
      const account = credentials(role);
      if (!account) return;
      const baseURL = testInfo.project.use.baseURL;
      context = await browser.newContext({ baseURL });
      const login = await context.request.post("/api/auth/login", { data: account });
      expect(login.ok(), `เข้าสู่ระบบด้วยบัญชี ${role} ไม่สำเร็จ (สถานะ ${login.status()}) ตรวจค่า env E2E_${role}_*`).toBe(true);
      const result = await login.json() as { role?: string; mustChangePassword?: boolean };
      expect(result.mustChangePassword, `บัญชี ${role} ต้องเปลี่ยนรหัสผ่านก่อน จึงใช้ทดสอบไม่ได้`).toBeFalsy();
      expect(String(result.role).toUpperCase(), `บัญชีใน env E2E_${role}_* ไม่ใช่บทบาท ${role}`).toBe(role);
    });

    test.afterAll(async () => {
      await context?.close();
      context = null;
    });

    test.beforeEach(() => {
      test.skip(!credentials(role), `ไม่ได้ตั้งค่า E2E_${role}_USERNAME / E2E_${role}_PASSWORD`);
    });

    for (const endpoint of ENDPOINTS) {
      test(`${endpoint.method} ${endpoint.path} → ${denied ? 403 : endpoint.allowedStatus}`, async () => {
        const response = await send(context as BrowserContext, endpoint);
        expect(response.status()).toBe(denied ? 403 : endpoint.allowedStatus);
        if (denied) expect(await response.json()).toHaveProperty("error");
      });
    }

    for (const path of PAGES) {
      test(`หน้า ${path} → ${denied ? "403" : "แสดงผลได้"}`, async () => {
        const page = await (context as BrowserContext).newPage();
        try {
          const response = await page.goto(path);
          if (denied) {
            expect(response?.status()).toBe(403);
          } else {
            expect(response?.status()).toBe(200);
            await expect(page).toHaveURL(new RegExp(path.split("?")[0].replace(/\//g, "\\/")));
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          }
        } finally {
          await page.close();
        }
      });
    }

    if (denied) {
      // ห้ามเชื่อ cookie role ที่ฝั่ง client ตั้งเอง (สิทธิ์ตัดสินจาก JWT + DB เท่านั้น)
      test("ปลอม cookie role=staff แล้วยังถูกปฏิเสธ", async ({}, testInfo) => {
        const baseURL = testInfo.project.use.baseURL as string;
        await (context as BrowserContext).addCookies([{ name: "role", value: "staff", url: baseURL }]);
        const api = await (context as BrowserContext).request.get("/api/staff/excellence?demo=true");
        expect(api.status()).toBe(403);
        const page = await (context as BrowserContext).newPage();
        try {
          const response = await page.goto("/staff/excellence");
          expect(response?.status()).toBe(403);
        } finally {
          await page.close();
        }
      });
    }
  });
}
