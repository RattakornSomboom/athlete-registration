export const APPROVED = ["STAFF_APPROVED", "FINAL_SELECTED"];
export const PENDING = ["SUBMITTED", "CLUB_APPROVED"];
export const REJECTED = ["CLUB_REJECTED", "STAFF_REJECTED"];
export const EDITABLE_OFFICIAL = ["DRAFT", "CLUB_REJECTED", "STAFF_REJECTED"];
export const PROFILE_FIELDS = ["firstName", "lastName", "nationalId", "nationality", "birthDate", "addressNo", "subDistrict", "district", "province", "postalCode", "phone", "email", "workplace", "workPosition", "previousCount", "appliedPosition", "appliedPositionOther"] as const;
export const REQUIRED_PROFILE = ["firstName", "lastName", "nationalId", "birthDate", "addressNo", "subDistrict", "district", "province", "postalCode", "phone", "email", "workplace", "workPosition", "appliedPosition"] as const;
export const DOCUMENT_FIELDS = ["plan", "idCard", "photo", "nameChange"] as const;
export function officialProfileValid(profile: Record<string, string>) {
  return REQUIRED_PROFILE.every(k => !!profile[k]?.trim())
    && /^\d{13}$/.test(profile.nationalId)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    && Number.isFinite(Date.parse(profile.birthDate))
    && new Date(profile.birthDate) <= new Date()
    && ["manager", "coach", "assistant_coach", "other"].includes(profile.appliedPosition)
    && (profile.appliedPosition !== "other" || !!profile.appliedPositionOther?.trim());
}
export function canReviewOfficial(role: string, status: string) {
  return role === "CLUB" ? status === "SUBMITTED"
    : ["STAFF", "ADMIN", "SUPERADMIN"].includes(role) && status === "CLUB_APPROVED";
}
export function withinQuota(main: number, reserve: number, maxMain: number, maxReserve: number) {
  return main >= 0 && reserve >= 0 && main <= maxMain && reserve <= maxReserve;
}

