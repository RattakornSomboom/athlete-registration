export async function requestJson<T>(url: string, data?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(url, data === undefined ? { cache: "no-store" } : {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ทำรายการไม่สำเร็จ");
  return result as T;
}
export const errorMessage = (e: unknown) => e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ";
export type CompetitionOption = { id: string; name: string; status: string; quotas: { sport: string; maxStarters: number; maxSubstitutes: number }[] };
export type HistoryEvent = { id: string; action: string; reason?: string | null; createdAt: string };
export type OfficialRecord = {
  id: string; competitionId: string; clubId: string; version: number; status: string;
  profile: Record<string, string>; documents: Record<string, string>;
  club?: { name: string }; competition: { name: string }; events: HistoryEvent[];
};
export const statusLabel: Record<string, string> = {
  DRAFT: "ร่าง", SUBMITTED: "รอชมรมพิจารณา", CLUB_APPROVED: "ชมรมอนุมัติ / รอกองกิจฯ",
  STAFF_APPROVED: "กองกิจฯ อนุมัติ", CLUB_REJECTED: "ชมรมปฏิเสธ", STAFF_REJECTED: "กองกิจฯ ปฏิเสธ",
  FINAL_SELECTED: "ประกาศผลแล้ว", RETURNED: "ส่งคืนให้แก้ไข", SAVED: "บันทึกร่าง",
};

