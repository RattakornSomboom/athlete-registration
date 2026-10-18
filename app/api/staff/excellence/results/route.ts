import { api, body, STAFF } from "@/lib/phase4-server";
import { recordResult, withValidation } from "@/lib/excellence-service";
import { validateResultInput } from "@/lib/excellence-validation";

// POST /api/staff/excellence/results — บันทึกเวลาแข่งขันกรีฑาประเภทลู่
export async function POST(request: Request) {
  return api(request, STAFF, async () => withValidation(async () => recordResult(validateResultInput(await body(request)))));
}
