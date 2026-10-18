import { api, body, STAFF } from "@/lib/phase4-server";
import { saveRetest, withValidation } from "@/lib/excellence-service";
import { validateRetestInput } from "@/lib/excellence-validation";

// POST /api/staff/excellence/retests — บันทึกผลทดสอบซ้ำ (ต้องส่ง revision ล่าสุด)
export async function POST(request: Request) {
  return api(request, STAFF, async session => withValidation(async () => saveRetest(validateRetestInput(await body(request)), session.id)));
}
