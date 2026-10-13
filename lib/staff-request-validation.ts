export const STAFF_REQUEST_REVIEW_ROLES = ["STAFF", "ADMIN"] as const;

export function canReviewStaffRequest(role: string | null | undefined): boolean {
  return role === "STAFF" || role === "ADMIN";
}

export class StaffRequestInputError extends Error {
  readonly status = 400;
}

export type StaffRequestDecision = {
  status: "APPROVED" | "REJECTED";
  rejectedReason: string | null;
};

export function normalizeStaffRequestDecision(input: Record<string, unknown>): StaffRequestDecision {
  if (input.status !== "APPROVED" && input.status !== "REJECTED") {
    throw new StaffRequestInputError("Invalid status");
  }

  if (input.status === "APPROVED") {
    return { status: "APPROVED", rejectedReason: null };
  }

  if (typeof input.rejectedReason !== "string" || !input.rejectedReason.trim() || input.rejectedReason.length > 5000) {
    throw new StaffRequestInputError("Invalid rejection reason");
  }

  return { status: "REJECTED", rejectedReason: input.rejectedReason.trim() };
}
