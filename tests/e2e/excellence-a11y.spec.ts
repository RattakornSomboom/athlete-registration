import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect, type BrowserContext } from "@playwright/test";

// ตรวจการเข้าถึงของหน้า Excellence ด้วย axe-core (WCAG 2.2 AA + best practice) ทุกหน้า ในโหมดสาธิต (ไม่เขียนข้อมูล)
// axe-core มากับ eslint-config-next อยู่แล้ว ไม่เพิ่ม dependency; บัญชีทดสอบอ่านจาก env เหมือน excellence-access.spec.ts
// ใช้บัญชี STAFF ก่อน ถ้าไม่มีใช้ ADMIN ไม่ตั้งค่าทั้งคู่ = ข้าม

const AXE = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
const PAGES = [
  "/staff/excellence?demo=true",
  "/staff/excellence/results?demo=true",
  "/staff/excellence/heatmap?demo=true",
  "/staff/excellence/benchmarks?demo=true",
  "/staff/excellence/demo-2?demo=true",
];

type AxeResult = { violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] };

function account(): { role: string; username: string; password: string } | null {
  for (const role of ["STAFF", "ADMIN"]) {
    const username = process.env[`E2E_${role}_USERNAME`];
    const password = process.env[`E2E_${role}_PASSWORD`];
    if (username && password) return { role, username, password };
  }
  return null;
}

test.describe("Excellence accessibility (axe)", () => {
  let context: BrowserContext | null = null;

  test.beforeAll(async ({ browser }, testInfo) => {
    const credentials = account();
    if (!credentials || !existsSync(AXE)) return;
    context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const login = await context.request.post("/api/auth/login", { data: { username: credentials.username, password: credentials.password } });
    expect(login.ok(), `เข้าสู่ระบบด้วยบัญชี ${credentials.role} ไม่สำเร็จ ตรวจค่า env E2E_${credentials.role}_*`).toBe(true);
  });

  test.afterAll(async () => {
    await context?.close();
    context = null;
  });

  test.beforeEach(() => {
    test.skip(!existsSync(AXE), "ไม่พบ axe-core ใน node_modules");
    test.skip(!account(), "ไม่ได้ตั้งค่า E2E_STAFF_* หรือ E2E_ADMIN_*");
  });

  for (const url of PAGES) {
    test(`หน้า ${url} ไม่มี violation และมีชื่อหน้าเฉพาะ`, async () => {
      const page = await (context as BrowserContext).newPage();
      try {
        await page.goto(url);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // รอให้ข้อมูลโหลดเสร็จ (หน้าทั้งหมดแสดงหัวข้อระดับ 2 อย่างน้อยหนึ่งหัวข้อเมื่อโหลดเสร็จ)
        await expect(page.locator("h2").first()).toBeVisible();
        await page.addScriptTag({ path: AXE });
        const result = await page.evaluate(async () => {
          const axe = (window as unknown as { axe: { run: (context: Document, options: object) => Promise<AxeResult> } }).axe;
          return axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
        });
        const summary = result.violations.map(violation => `${violation.id} (${violation.impact}) × ${violation.nodes.length}: ${violation.nodes.slice(0, 2).map(node => node.target.join(" ")).join(" | ")}`);
        expect(summary, "axe violations").toEqual([]);
        await expect(page).toHaveTitle(/สู่ความเป็นเลิศ · SMED/);
        expect(await page.locator("main").count(), "ต้องมี main เดียว").toBe(1);
      } finally {
        await page.close();
      }
    });
  }
});
