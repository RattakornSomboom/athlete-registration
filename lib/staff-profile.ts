import type { Prisma, PrismaClient } from "@prisma/client";

export const STAFF_PROFILE_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type StaffProfile = Prisma.UserGetPayload<{ select: typeof STAFF_PROFILE_SELECT }>;

type StaffProfileClient = Pick<PrismaClient, "user">;

export function staffProfileOutput(user: StaffProfile): StaffProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getStaffProfile(userId: string, client: StaffProfileClient) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: STAFF_PROFILE_SELECT,
  });
  return user ? staffProfileOutput(user) : null;
}

export async function updateStaffProfileEmail(userId: string, email: string, client: StaffProfileClient) {
  const user = await client.user.update({
    where: { id: userId },
    data: { email },
    select: STAFF_PROFILE_SELECT,
  });
  return staffProfileOutput(user);
}
