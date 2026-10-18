import { api, body, STAFF } from "@/lib/phase4-server";
import { deleteRetest, updateRetest, withValidation } from "@/lib/excellence-service";
import { retestId, validateRetestDeleteInput, validateRetestInput } from "@/lib/excellence-validation";

type RouteParams = { params: Promise<{ retestId: string }> };

// PUT /api/staff/excellence/retests/{retestId} — แก้ผลทดสอบซ้ำ (ต้องส่ง applicationId และ revision ล่าสุด)
export async function PUT(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async session => withValidation(async () => {
    const id = retestId((await params).retestId);
    return updateRetest(id, validateRetestInput(await body(request)), session.id);
  }));
}

// DELETE /api/staff/excellence/retests/{retestId} — ยกเลิกผลทดสอบซ้ำที่คีย์ผิด (body: applicationId, revision)
export async function DELETE(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async () => withValidation(async () => {
    const id = retestId((await params).retestId);
    return deleteRetest(id, validateRetestDeleteInput(await body(request)));
  }));
}
