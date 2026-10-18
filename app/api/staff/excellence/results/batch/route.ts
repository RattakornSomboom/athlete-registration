import { api, body, STAFF } from "@/lib/phase4-server";
import { recordResultsBatch, withValidation } from "@/lib/excellence-service";
import { validateBatchResultInput } from "@/lib/excellence-validation";

// POST /api/staff/excellence/results/batch — บันทึกผลหลายคนพร้อมกัน (รายการเดียว วันเดียว รอบเดียว)
// ทั้งชุดสำเร็จหรือไม่ก็ไม่บันทึกเลย; ผลที่ซ้ำกับของเดิมถูกข้ามและรายงานใน skipped
export async function POST(request: Request) {
  return api(request, STAFF, async () => withValidation(async () => recordResultsBatch(validateBatchResultInput(await body(request)))));
}
