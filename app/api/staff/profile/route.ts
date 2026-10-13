import { api, body, ensure, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { getStaffProfile, updateStaffProfileEmail } from "@/lib/staff-profile";
import { staffProfileInput } from "@/lib/validation";

export async function GET(request: Request) {
  return api(request, STAFF, async (session) => {
    const profile = await getStaffProfile(session.id, prisma);
    ensure(profile, "ไม่พบบัญชีผู้ใช้", 404);
    return { profile };
  });
}

export async function PUT(request: Request) {
  return api(request, STAFF, async (session) => {
    const { email } = staffProfileInput(await body(request));
    const profile = await updateStaffProfileEmail(session.id, email, prisma);

    return {
      message: "อัปเดตข้อมูลสำเร็จ",
      profile,
    };
  });
}
