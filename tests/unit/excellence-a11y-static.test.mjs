import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// ตรวจโครงสร้างด้านการเข้าถึงและการพิมพ์ของหน้า Excellence จากซอร์ส (ไม่ต้องรันเบราว์เซอร์)
// การตรวจจริงด้วย axe อยู่ที่ tests/e2e/excellence-a11y.spec.ts

const root = path.resolve(import.meta.dirname, "../..");
const read = file => readFileSync(path.join(root, file), "utf8");

function walk(dir) {
  return readdirSync(path.join(root, dir)).flatMap(name => {
    const relative = path.posix.join(dir, name);
    return statSync(path.join(root, relative)).isDirectory() ? walk(relative) : [relative];
  });
}

const pageFiles = walk("app/staff/excellence").filter(file => file.endsWith("page.tsx"));
const excellenceFiles = [
  ...walk("app/staff/excellence").filter(file => file.endsWith(".tsx")),
  ...readdirSync(path.join(root, "components/shared")).filter(name => /^Excellence.*\.tsx$/.test(name)).map(name => `components/shared/${name}`),
];

test("there are five Excellence pages and the shared components are covered", () => {
  assert.equal(pageFiles.length, 5);
  assert.ok(excellenceFiles.length >= 9);
});

test("meaningful text never uses slate-300/400 (contrast below 4.5:1); disabled and placeholder variants are exempt", () => {
  for (const file of excellenceFiles) {
    const offenders = [...read(file).matchAll(/(?<![:\w-])text-slate-(?:300|400)\b/g)];
    assert.equal(offenders.length, 0, `${file} uses low-contrast text colour`);
  }
});

test("every data table has a caption for screen readers", () => {
  for (const file of excellenceFiles) {
    const source = read(file);
    const tables = (source.match(/<table\b/g) ?? []).length;
    const captions = (source.match(/<caption\b/g) ?? []).length;
    assert.equal(captions, tables, `${file}: ${tables} tables but ${captions} captions`);
  }
});

test("loading skeletons respect reduced motion", () => {
  for (const file of excellenceFiles) {
    const source = read(file);
    const pulses = (source.match(/animate-pulse/g) ?? []).length;
    const calm = (source.match(/motion-reduce:animate-none/g) ?? []).length;
    assert.equal(calm, pulses, `${file}: animate-pulse without motion-reduce`);
  }
});

test("the app has exactly one main landmark with a skip link target, and Page does not add another", () => {
  const layout = read("app/layout.tsx");
  assert.equal((layout.match(/<main\b/g) ?? []).length, 1);
  assert.ok(layout.includes('href="#main-content"') && layout.includes('id="main-content"'));
  assert.equal((read("components/shared/Phase4UI.tsx").match(/<main\b/g) ?? []).length, 0);
});

test("every Excellence route sets its own page title through route metadata", () => {
  const dirs = ["app/staff/excellence", "app/staff/excellence/results", "app/staff/excellence/heatmap", "app/staff/excellence/benchmarks", "app/staff/excellence/[applicationId]"];
  const titles = dirs.map(dir => {
    const file = `${dir}/layout.tsx`;
    assert.ok(existsSync(path.join(root, file)), `${file} missing`);
    const match = /title:\s*"([^"]+)"/.exec(read(file));
    assert.ok(match, `${file} has no metadata title`);
    assert.ok(match[1].endsWith("SMED"), `${file} title should end with SMED`);
    return match[1];
  });
  assert.equal(new Set(titles).size, titles.length, "page titles must be unique");
});

test("print setup: every page sets the paper layout, and the app chrome is hidden in print", () => {
  for (const file of pageFiles) assert.ok(read(file).includes("<PrintSetup />"), `${file} missing PrintSetup`);
  assert.ok(read("components/shared/AppNav.tsx").includes("print:hidden"));
  assert.ok(read("components/shared/ExcellenceUI.tsx").includes("@page"));
});

test("form controls on the batch sheet and benchmark grid carry an accessible name", () => {
  for (const file of ["app/staff/excellence/results/page.tsx", "app/staff/excellence/benchmarks/page.tsx"]) {
    const source = read(file);
    assert.ok(/aria-label=\{/.test(source), `${file} inputs need aria-label`);
  }
  const forms = read("components/shared/ExcellenceForms.tsx");
  assert.ok(forms.includes("aria-label={title}") && forms.includes("focus()"), "forms must be labelled and take focus when opened");
});
