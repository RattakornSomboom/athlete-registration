import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { summarize } from "../../lib/analytics.ts";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../components/shared/AnalyticsSummary.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const componentModule = { exports: {} };
new Function("require", "module", "exports", compiled)(
  specifier => require(specifier === "@/lib/phase4-client" ? "../../lib/phase4-client.ts" : specifier),
  componentModule,
  componentModule.exports,
);
const Summary = componentModule.exports.default;
const render = data => renderToStaticMarkup(React.createElement(Summary, { data }));

test("analytics UI renders empty API summaries without fake counts or invalid widths", () => {
  const html = render(summarize([], []));
  assert.match(html, /ยังไม่มีใบสมัครตรงกับตัวกรองนี้/);
  assert.match(html, /ยังไม่มีข้อมูลจาก API/);
  assert.doesNotMatch(html, /NaN|Infinity|MOCK_ALL_APPLICANTS/);
});

test("analytics UI preserves distinct-athlete counts and bounded bars above quota", () => {
  const row = { id: "one", userId: "athlete", studentId: "12345678", firstName: "Example", lastName: "Athlete", faculty: "คณะทดสอบ", sport: "กีฬาทดสอบ", status: "STAFF_APPROVED", squadType: "main" };
  const summary = summarize([row, { ...row, id: "two" }], [{ sport: row.sport, maxStarters: 1, maxSubstitutes: 0 }]);
  assert.equal(summary.metrics.totalApplications, 2);
  assert.equal(summary.metrics.uniqueAthletes, 1);
  const html = render(summary);
  assert.match(html, /นักกีฬาไม่ซ้ำ \(คน\)/);
  assert.match(html, /200\.0%/);
  assert.match(html, /คณะทดสอบ/);
  for (const match of html.matchAll(/style="width:([\d.]+)%"/g)) {
    assert.ok(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
});

test("analytics UI handles quotas without applicants and escapes faculty text", () => {
  const html = render(summarize([], [{ sport: "<script>sport</script>", maxStarters: 0, maxSubstitutes: 0 }]));
  assert.match(html, /ยังไม่มีโควตา/);
  assert.match(html, /&lt;script&gt;sport&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|NaN|Infinity/);
});
