import { api, STAFF } from "@/lib/phase4-server";
import { getEntrySheet, isDemoRequest, withValidation } from "@/lib/excellence-service";
import { eventKey } from "@/lib/excellence-validation";

// GET /api/staff/excellence/entry-sheet?event=&demo=true — รายชื่อนักกีฬาที่รายการนี้เปิดสำหรับเพศของเขา พร้อมผลดีที่สุดเดิมและเป้า
export async function GET(request: Request) {
  return api(request, STAFF, async () => withValidation(async () => {
    const params = new URL(request.url).searchParams;
    return getEntrySheet(eventKey(params.get("event")), isDemoRequest(params));
  }));
}
