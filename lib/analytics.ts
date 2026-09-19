export type AnalyticsRow = {
  id: string; userId: string; studentId: string | null; firstName: string; lastName: string;
  faculty: string; sport: string; status: string; squadType: string | null;
};
export type AnalyticsQuota = { sport: string; maxStarters: number; maxSubstitutes: number };
const approved = (s: string) => ["STAFF_APPROVED", "FINAL_SELECTED"].includes(s);
export function summarize(rows: AnalyticsRow[], quotas: AnalyticsQuota[]) {
  const passed = rows.filter(r => approved(r.status));
  const totalQuota = quotas.reduce((n, q) => n + q.maxStarters + q.maxSubstitutes, 0);
  const sports = [...new Set([...rows.map(r => r.sport), ...quotas.map(q => q.sport)])].sort().map(sport => {
    const applications = rows.filter(r => r.sport === sport);
    const quota = quotas.filter(q => q.sport === sport).reduce((n, q) => n + q.maxStarters + q.maxSubstitutes, 0);
    const count = applications.filter(r => approved(r.status)).length;
    return { sport, applications: applications.length, approved: count, quota, fillRate: quota ? count / quota * 100 : 0 };
  });
  const faculties = [...new Set(rows.map(r => r.faculty || "ไม่ระบุ"))].sort().map(faculty => ({
    faculty, applications: rows.filter(r => (r.faculty || "ไม่ระบุ") === faculty).length,
    approved: passed.filter(r => (r.faculty || "ไม่ระบุ") === faculty).length,
  }));
  const statuses = ["SUBMITTED", "CLUB_APPROVED", "CLUB_REJECTED", "STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"].map(status => ({ status, count: rows.filter(r => r.status === status).length }));
  return {
    metrics: {
      totalApplications: rows.length, uniqueAthletes: new Set(rows.map(r => r.userId)).size,
      pending: rows.filter(r => ["SUBMITTED", "CLUB_APPROVED"].includes(r.status)).length,
      rejected: rows.filter(r => ["CLUB_REJECTED", "STAFF_REJECTED"].includes(r.status)).length,
      approved: passed.length, acceptanceRate: rows.length ? passed.length / rows.length * 100 : 0,
      main: passed.filter(r => r.squadType === "main").length, reserve: passed.filter(r => r.squadType === "reserve").length,
      totalQuota, fillRate: totalQuota ? passed.length / totalQuota * 100 : 0,
    }, sports, faculties, statuses, unavailable: ["gender", "budget", "compliance"],
  };
}
export type AnalyticsSummary = ReturnType<typeof summarize>;

