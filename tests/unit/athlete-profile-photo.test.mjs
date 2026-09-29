import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { documentId, documentReference } from "../../lib/athlete-document-policy.ts";
import { parseJsonObject, REQUIRED_PROFILE_FIELDS, validateProfile, ValidationError } from "../../lib/validation.ts";

const require = createRequire(import.meta.url);

function loadModule(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    specifier => Object.hasOwn(mocks, specifier) ? mocks[specifier] : require(specifier),
    loaded, loaded.exports,
  );
  return loaded.exports;
}

const Photo = loadModule("../../components/shared/AthleteProfilePhoto.tsx", {
  "@/lib/athlete-document-policy": { documentId, documentReference },
  "@/lib/http-client": { fetchJson: () => { throw new Error("No network in unit tests"); } },
  "@/components/shared/RequestState": { useRequestAction: () => ({ busy: false, error: "", success: "" }) },
}).default;

test("profile photo does not render legacy filenames, arbitrary URLs or mock images", () => {
  for (const photoUrl of [null, "photo.jpg", "https://example.com/private-photo.jpg", "data:image/png;base64,test", "/api/documents/other/download?redirect=evil"]) {
    const html = renderToStaticMarkup(React.createElement(Photo, { studentId: "12345678", name: "Test Athlete", photoUrl, onSaved() {} }));
    assert.doesNotMatch(html, /<img|DEFAULT_MOCK_PHOTO|_next\/image/);
    assert.match(html, /ยังไม่มีรูปถ่ายที่บันทึกไว้/);
    assert.match(html, /type="file"/);
  }
});

test("profile photo uses the authenticated download route, without image optimization", () => {
  const html = renderToStaticMarkup(React.createElement(Photo, {
    studentId: "12345678", name: "<Test Athlete>", photoUrl: documentReference("photo-one"), onSaved() {},
  }));
  assert.match(html, /src="\/api\/documents\/photo-one\/download\?v=0"/);
  assert.match(html, /alt="รูปถ่ายของ &lt;Test Athlete&gt;"/);
  assert.doesNotMatch(html, /_next\/image|ยังไม่มีรูปถ่ายที่บันทึกไว้/);
});

function profileRoute(document = {}, session = { id: "athlete-one", studentId: "12345678", role: "ATHLETE" }) {
  const calls = { retained: 0, saved: [] };
  const stored = { id: "photo-one", ownerId: "athlete-one", ownerRole: "ATHLETE", purpose: "ATHLETE", state: "READY", mimeType: "image/png", ...document };
  function ensure(condition, message, status = 400) {
    if (!condition) throw Object.assign(new Error(message), { status });
  }
  const tx = {
    user: { findUnique: async () => ({ id: "athlete-one", studentId: "12345678", profile: {} }) },
    privateDocument: { updateMany: async ({ where, data }) => {
      calls.retained++;
      assert.deepEqual(data, { retained: true });
      const matches = Object.entries(where).every(([key, expected]) => key === "mimeType" ? expected.in.includes(stored[key]) : stored[key] === expected);
      return { count: matches ? 1 : 0 };
    } },
    athleteProfile: { update: async ({ data }) => { calls.saved.push(data); return data; } },
  };
  const route = loadModule("../../app/api/athletes/profile/route.ts", {
    "@prisma/client": { Prisma: { DbNull: null } },
    "@/lib/prisma": { prisma: {} },
    "@/lib/validation": { validateProfile },
    "@/lib/athlete-document-policy": { documentId },
    "@/lib/phase4-server": {
      ensure, STAFF: ["STAFF", "ADMIN"], string: value => value,
      body: request => request.json(), atomic: action => action(tx),
      api: async (request, roles, action) => {
        ensure(session, "Not authenticated", 401);
        ensure(roles.includes(session.role), "Not authorized", 403);
        return action(session);
      },
    },
  });
  return { calls, put: fields => route.PUT(new Request("http://localhost/api/athletes/profile", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: "12345678", ...fields }),
  })) };
}

test("profile update retains only the owner's ready JPEG/PNG and saves the reference", async () => {
  for (const mimeType of ["image/jpeg", "image/png"]) {
    const { calls, put } = profileRoute({ mimeType });
    const photoUrl = documentReference("photo-one");
    await put({ photoUrl });
    assert.equal(calls.retained, 1);
    assert.deepEqual(calls.saved, [{ photoUrl }]);
  }
});

test("profile update rejects another owner's document, PDF, wrong role/purpose, and unavailable documents", async () => {
  for (const document of [{ ownerId: "other" }, { ownerRole: "CLUB" }, { purpose: "OFFICIAL" }, { state: "DELETING" }, { state: "DELETED" }, { mimeType: "application/pdf" }, { id: "missing" }]) {
    const { calls, put } = profileRoute(document);
    await assert.rejects(put({ photoUrl: documentReference("photo-one") }), { status: 403 });
    assert.deepEqual(calls.saved, []);
  }
});

test("profile update rejects arbitrary photo sources before accessing document storage", async () => {
  for (const photoUrl of ["photo.jpg", "https://example.com/photo.png", "data:image/png;base64,test"]) {
    const { calls, put } = profileRoute();
    await assert.rejects(put({ photoUrl }), { status: 400 });
    assert.equal(calls.retained, 0);
    assert.deepEqual(calls.saved, []);
  }
});

test("photo guard leaves ordinary partial profile updates and clearing a photo intact", async () => {
  const { calls, put } = profileRoute();
  await put({ firstName: "Updated" });
  await put({ photoUrl: null });
  assert.equal(calls.retained, 0);
  assert.deepEqual(calls.saved, [{ firstName: "Updated" }, { photoUrl: null }]);
});

test("profile photo mutation keeps the athlete-only and student ownership guards", async () => {
  for (const session of [null, { id: "staff", studentId: "12345678", role: "STAFF" }, { id: "other", studentId: "87654321", role: "ATHLETE" }]) {
    const { calls, put } = profileRoute({}, session);
    await assert.rejects(put({ photoUrl: documentReference("photo-one") }), { status: session ? 403 : 401 });
    assert.equal(calls.retained, 0);
    assert.deepEqual(calls.saved, []);
  }
});

test("public signup cannot attach another user's document or a filename as a profile photo", async () => {
  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const unexpected = () => { throw new Error("Must reject before hashing or database access"); };
  const { POST } = loadModule("../../app/api/auth/register/route.ts", {
    "@/lib/public-account": { publicUser: unexpected },
    "@/lib/account-service": { reserveEmail: unexpected },
    "@/lib/phase4-server": {
      ApiError, atomic: unexpected,
      ensure: (condition, message, status = 400) => { if (!condition) throw new ApiError(status, message); },
    },
    "@/lib/validation": { parseJsonObject, validateProfile, ValidationError },
    "@prisma/client": { Prisma: {} },
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "bcryptjs": { default: { hash: unexpected } },
  });
  const profile = Object.fromEntries(REQUIRED_PROFILE_FIELDS.map(field => [field, field === "birthDate" ? "2003-01-01" : "Test"]));
  for (const photoUrl of ["photo.jpg", documentReference("other-users-photo"), "https://example.com/photo.png"]) {
    const response = await POST(new Request("http://localhost/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "12345678", password: "test-password", profile: { ...profile, photoUrl } }),
    }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /เข้าสู่ระบบก่อนอัปโหลดรูปถ่าย/);
  }
});
