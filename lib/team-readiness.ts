export const TEAM_VERIFIED_RATIO = 0.5;
export const MIN_APPROVED_ACTIVITIES = 1;

export type TeamReadiness = {
  isTeamSport: boolean;
  total: number;
  verifiedCount: number;
  requiredCount: number;
  shortfall: number;
  percent: number;
  passed: boolean;
  message: string;
};

/** A quota with more than one starter is treated as a team sport. */
export const isTeamSport = (maxStarters: number | null | undefined) => (maxStarters ?? 0) > 1;

export function evaluateTeamReadiness(total: number, verifiedCount: number, teamSport: boolean): TeamReadiness {
  if (!teamSport) {
    return { isTeamSport: false, total, verifiedCount, requiredCount: 0, shortfall: 0, percent: total ? (verifiedCount / total) * 100 : 0, passed: true, message: "กีฬาประเภทบุคคล ไม่ต้องตรวจเกณฑ์ผลงานระดับทีม" };
  }
  const requiredCount = Math.ceil(total * TEAM_VERIFIED_RATIO);
  const shortfall = Math.max(0, requiredCount - verifiedCount);
  const percent = total ? (verifiedCount / total) * 100 : 0;
  const passed = total > 0 && shortfall === 0;
  const message = total === 0
    ? "ยังไม่มีนักกีฬาในบัญชีรายชื่อ"
    : passed
      ? `นักกีฬาที่มีผลงานรับรอง ${verifiedCount}/${total} คน (${percent.toFixed(1)}%) ผ่านเกณฑ์ขั้นต่ำ 50%`
      : `ยังขาดนักกีฬาที่มีผลงานรับรองอีก ${shortfall} คน (ตอนนี้ ${verifiedCount}/${total} คน = ${percent.toFixed(1)}% ต้องไม่น้อยกว่า 50%)`;
  return { isTeamSport: true, total, verifiedCount, requiredCount, shortfall, percent, passed, message };
}
