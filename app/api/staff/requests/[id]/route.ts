import { prisma } from "@/lib/prisma";
import { ApiError, api, body, ensure } from "@/lib/phase4-server";
import {
  normalizeStaffRequestDecision,
  STAFF_REQUEST_REVIEW_ROLES,
  StaffRequestInputError,
} from "@/lib/staff-request-validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(request, STAFF_REQUEST_REVIEW_ROLES, async () => {
    const { id } = await params;
    let decision;
    try {
      decision = normalizeStaffRequestDecision(await body(request));
    } catch (error) {
      if (error instanceof StaffRequestInputError) {
        throw new ApiError(error.status, error.message);
      }
      throw error;
    }

    ensure(await prisma.clubRequest.findUnique({ where: { id }, select: { id: true } }), "ไม่พบคำร้อง", 404);
    const updatedRequest = await prisma.clubRequest.update({
      where: { id },
      data: decision,
    });
    return { request: updatedRequest };
  });
}
