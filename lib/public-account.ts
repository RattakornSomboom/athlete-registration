import type { User, AthleteProfile, Club } from "@prisma/client";
export function publicUser(user: User & { profile: AthleteProfile | null }) {
  return { id:user.id, studentId:user.studentId, email:user.email, role:user.role, isActive:user.isActive, createdAt:user.createdAt, updatedAt:user.updatedAt, profile:user.profile };
}
export function publicClub(club: Club) {
  return { id:club.id, name:club.name, sport:club.sport, email:club.email, isActive:club.isActive, status:club.status, presidentName:club.presidentName, presidentPhone:club.presidentPhone, advisors:club.advisors, createdAt:club.createdAt };
}

