import { api, body, STAFF } from "@/lib/phase4-server";
import { deleteResult, updateResult, withValidation } from "@/lib/excellence-service";
import { resultId, validateResultUpdateInput } from "@/lib/excellence-validation";

type RouteParams = { params: Promise<{ resultId: string }> };

// PUT /api/staff/excellence/results/{resultId} — แก้เวลา/รายการ/วันที่/รอบของผลที่บันทึกไว้
export async function PUT(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async () => withValidation(async () => {
    const id = resultId((await params).resultId);
    return updateResult(id, validateResultUpdateInput(await body(request)));
  }));
}

// DELETE /api/staff/excellence/results/{resultId} — ลบผลที่คีย์ผิด
export async function DELETE(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async () => withValidation(async () => deleteResult(resultId((await params).resultId))));
}
