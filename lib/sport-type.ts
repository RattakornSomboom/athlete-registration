export type SportType = "TEAM" | "INDIVIDUAL";

function normalizeSportName(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

export const MAX_INDIVIDUAL_SPORT_ENTRIES = 4;

export const DEFAULT_SPORT_TYPE_BY_NAME: Record<string, SportType> = {
  "กรีฑา": "INDIVIDUAL",
  "กีฬาทางน้ำ": "INDIVIDUAL",
  "วอลเลย์บอล": "TEAM",
  "เทควันโด": "INDIVIDUAL",
  "มวยไทยสมัครเล่น": "INDIVIDUAL",
  "ฟุตบอล": "TEAM",
  "บาสเกตบอล": "TEAM",
  "เปตอง": "INDIVIDUAL",
  "แบดมินตัน": "INDIVIDUAL",
  "เทเบิลเทนนิส": "INDIVIDUAL",
  "เทนนิส": "INDIVIDUAL",
  "ฟุตซอล": "TEAM",
  "ยูโด": "INDIVIDUAL",
  "คาราเต้": "INDIVIDUAL",
  "ยูยิตสู": "INDIVIDUAL",
  "อีสปอร์ต": "TEAM",
  "เซปักตะกร้อ": "TEAM",
  "หมากรุก": "INDIVIDUAL",
};

const TEAM_SPORT_KEYWORDS = [
  "ฟุตบอล",
  "ฟุตซอล",
  "บาสเกตบอล",
  "วอลเลย์บอล",
  "อีสปอร์ต",
  "เซปักตะกร้อ",
] as const;

const INDIVIDUAL_SPORT_KEYWORDS = [
  "กรีฑา",
  "กีฬาทางน้ำ",
  "ว่ายน้ำ",
  "แบดมินตัน",
  "เทเบิลเทนนิส",
  "เทนนิส",
  "เปตอง",
  "ยูโด",
  "คาราเต้",
  "ยูยิตสู",
  "เทควันโด",
  "มวยไทย",
  "หมากรุก",
] as const;

function matchesSportKeyword(sportName: string, keywords: readonly string[]) {
  const normalized = normalizeSportName(sportName);
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function getSportType(sportName: string, configured?: SportType | null): SportType {
  if (configured) return configured;
  const normalized = normalizeSportName(sportName);
  const configuredType = DEFAULT_SPORT_TYPE_BY_NAME[normalized as keyof typeof DEFAULT_SPORT_TYPE_BY_NAME];
  if (configuredType) return configuredType;
  if (matchesSportKeyword(sportName, TEAM_SPORT_KEYWORDS)) return "TEAM";
  if (matchesSportKeyword(sportName, INDIVIDUAL_SPORT_KEYWORDS)) return "INDIVIDUAL";
  return "INDIVIDUAL";
}

export function isTeamSport(sportName: string, configured?: SportType | null) {
  return getSportType(sportName, configured) === "TEAM";
}

export function isIndividualSport(sportName: string, configured?: SportType | null) {
  return getSportType(sportName, configured) === "INDIVIDUAL";
}

export function getSportEntryLimit(sportName: string, configured?: SportType | null) {
  return getSportType(sportName, configured) === "TEAM" ? 1 : MAX_INDIVIDUAL_SPORT_ENTRIES;
}

export function isSportEntryCountAllowed(sportName: string, count: number, configured?: SportType | null) {
  return count >= 1 && count <= getSportEntryLimit(sportName, configured);
}
