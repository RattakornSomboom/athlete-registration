import assert from "node:assert/strict";
import test from "node:test";
import { validateApplicationClub } from "../../lib/application-club-service.ts";
test("validates application club when matching sport and active club", async () => {
  const mockTx = {
    club: {
      findUnique: async ({ where }) => {
        if (where.id === "club-petanque") {
          return { id: "club-petanque", name: "ชมรมเปตอง มหาวิทยาลัยพะเยา", sport: "เปตอง", isActive: true };
        }
        return null;
      },
      count: async () => 0,
    },
  };

  const club = await validateApplicationClub(mockTx, {
    clubId: "club-petanque",
    sport: "เปตอง",
    sportEntries: [{ sport: "เปตอง" }],
    noClubFileUrl: null,
    supervisorName: null,
    supervisorPosition: null,
  });

  assert.equal(club?.id, "club-petanque");
  assert.equal(club?.name, "ชมรมเปตอง มหาวิทยาลัยพะเยา");
});

test("rejects when club sport does not match application sport", async () => {
  const mockTx = {
    club: {
      findUnique: async () => ({ id: "club-petanque", name: "ชมรมเปตอง มหาวิทยาลัยพะเยา", sport: "เปตอง", isActive: true }),
      count: async () => 0,
    },
  };

  await assert.rejects(
    () => validateApplicationClub(mockTx, {
      clubId: "club-petanque",
      sport: "ฟุตซอล",
      sportEntries: [{ sport: "ฟุตซอล" }],
      noClubFileUrl: null,
      supervisorName: null,
      supervisorPosition: null,
    }),
    /ชนิดกีฬาทุกรายการต้องตรงกับชมรมต้นสังกัด/
  );
});

test("requires noClubFileUrl and supervisor when no clubId", async () => {
  const mockTx = {
    club: {
      count: async () => 0,
    },
  };

  await assert.rejects(
    () => validateApplicationClub(mockTx, {
      clubId: null,
      sport: "กีฬาเอ็กซ์ตรีม",
      sportEntries: [],
      noClubFileUrl: null,
      supervisorName: null,
      supervisorPosition: null,
    }),
    /กรุณาเลือกชมรมต้นสังกัด หรือแนบหนังสือขออนุญาตกรณีไม่มีชมรม/
  );

  const res = await validateApplicationClub(mockTx, {
    clubId: null,
    sport: "กีฬาเอ็กซ์ตรีม",
    sportEntries: [],
    noClubFileUrl: "doc-123",
    supervisorName: "อ. สมชาย",
    supervisorPosition: "อาจารย์ที่ปรึกษา",
  });
  assert.equal(res, null);
});
