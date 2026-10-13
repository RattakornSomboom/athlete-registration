import assert from "node:assert/strict";
import test from "node:test";
import { mapOfficialRecordToApplication } from "../../lib/team-official-store.ts";
import { canReviewOfficial, officialProfileValid, EDITABLE_OFFICIAL } from "../../lib/phase4-policy.ts";

test("EDITABLE_OFFICIAL allows editing during submitted/returned/draft/rejected states and locks once approved", () => {
  assert.ok(EDITABLE_OFFICIAL.includes("SUBMITTED"));
  assert.ok(EDITABLE_OFFICIAL.includes("DRAFT"));
  assert.ok(EDITABLE_OFFICIAL.includes("CLUB_REJECTED"));
  assert.ok(EDITABLE_OFFICIAL.includes("STAFF_REJECTED"));
  assert.ok(!EDITABLE_OFFICIAL.includes("CLUB_APPROVED"));
  assert.ok(!EDITABLE_OFFICIAL.includes("STAFF_APPROVED"));
});

test("officialProfileValid validates complete profile and nationalId format", () => {
  const validProfile = {
    firstName: "สมชาย",
    lastName: "ใจดี",
    nationalId: "1234567890123",
    nationality: "ไทย",
    birthDate: "1985-05-15",
    addressNo: "99/1",
    subDistrict: "แม่กา",
    district: "เมืองพะเยา",
    province: "พะเยา",
    postalCode: "56000",
    phone: "0812345678",
    email: "somchai@example.com",
    workplace: "คณะวิทยาศาสตร์",
    workPosition: "อาจารย์",
    previousCount: "2",
    appliedPosition: "coach",
    appliedPositionOther: "",
  };

  assert.equal(officialProfileValid(validProfile), true);

  // Invalid 12-digit national ID
  assert.equal(officialProfileValid({ ...validProfile, nationalId: "123456789012" }), false);

  // Missing required field: workplace
  assert.equal(officialProfileValid({ ...validProfile, workplace: "" }), false);

  // Position is "other" but appliedPositionOther is empty
  assert.equal(officialProfileValid({ ...validProfile, appliedPosition: "other", appliedPositionOther: "" }), false);

  // Position is "other" with valid description
  assert.equal(officialProfileValid({ ...validProfile, appliedPosition: "other", appliedPositionOther: "นักกายภาพบำบัด" }), true);
});

test("canReviewOfficial enforces review stage permissions for CLUB and STAFF", () => {
  assert.equal(canReviewOfficial("CLUB", "SUBMITTED"), true);
  assert.equal(canReviewOfficial("CLUB", "CLUB_APPROVED"), false);
  assert.equal(canReviewOfficial("STAFF", "SUBMITTED"), false);
  assert.equal(canReviewOfficial("STAFF", "CLUB_APPROVED"), true);
  assert.equal(canReviewOfficial("ADMIN", "CLUB_APPROVED"), true);
  assert.equal(canReviewOfficial("ATHLETE", "SUBMITTED"), false);
  assert.equal(canReviewOfficial("TEAM_OFFICIAL", "SUBMITTED"), false);
});

test("mapOfficialRecordToApplication maps submitted application and detects returned documents", () => {
  const rawRecord = {
    id: "app-official-1",
    userId: "user-1",
    clubId: "club-football",
    competitionId: "comp-1",
    version: 1,
    status: "SUBMITTED",
    profile: {
      firstName: "วิชาญ",
      lastName: "ชัยชนะ",
      nationalId: "1569900123456",
      appliedPosition: "manager",
    },
    documents: {
      plan: "doc-plan-1",
      idCard: "doc-id-1",
    },
    documentNames: {
      "doc-plan-1": "training-plan-2026.pdf",
      "doc-id-1": "id-card.jpg",
    },
    club: {
      id: "club-football",
      name: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
      sport: "ฟุตบอล",
    },
    competition: {
      id: "comp-1",
      name: "กีฬาบุคลากรและนิสิต ประจำปี 2569",
    },
    events: [],
    createdAt: new Date().toISOString(),
  };

  const app = mapOfficialRecordToApplication(rawRecord);
  assert.equal(app.stage, "submitted_to_club");
  assert.equal(app.documents.length, 2);
  const planDoc = app.documents.find(d => d.field === "plan");
  assert.equal(planDoc?.filename, "training-plan-2026.pdf");
  assert.equal(planDoc?.clubStatus, "pending");

  // Fallback to default name when documentNames is omitted
  const appWithoutDocNames = mapOfficialRecordToApplication({
    ...rawRecord,
    documentNames: undefined,
  });
  const planWithoutName = appWithoutDocNames.documents.find(d => d.field === "plan");
  assert.equal(planWithoutName?.filename, "เอกสารแนบ");

  // When club reviews and returns a document:
  const rawWithReturn = {
    ...rawRecord,
    events: [
      {
        action: "DOCUMENT_REVIEWED",
        actorId: "club-user-1",
        reason: "แผนการซ้อมยังไม่ระบุตารางเวลาชัดเจน",
        payload: {
          documents: rawRecord.documents,
          documentReview: {
            field: "plan",
            documentId: "doc-plan-1",
            status: "return",
          },
        },
      },
    ],
  };

  const appWithReturn = mapOfficialRecordToApplication(rawWithReturn);
  assert.equal(appWithReturn.stage, "club_returned");
  const returnedPlan = appWithReturn.documents.find(d => d.field === "plan");
  assert.equal(returnedPlan?.clubStatus, "returned");
  assert.equal(returnedPlan?.clubComment, "แผนการซ้อมยังไม่ระบุตารางเวลาชัดเจน");
});
