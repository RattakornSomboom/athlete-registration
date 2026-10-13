"use client";

import { useEffect, useState, useMemo } from "react";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { requestJson, errorMessage, statusLabel, type OfficialRecord } from "@/lib/phase4-client";
import { officialLabels, documentLabels, positionLabels } from "@/lib/official-labels";
import { PrivateFile } from "@/components/shared/Phase4UI";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";
import { detectGenderFromName } from "@/lib/fitness-excel-parser";

export default function OfficialReview({ scope }: { scope: "club" | "staff" }) {
  const endpoint = "/api/" + scope + "/officials";

  const [rows, setRows] = useState<OfficialRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedClub, setSelectedClub] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ id: string; type: "approve" | "reject" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [certifyFeedback, setCertifyFeedback] = useState("อนุมัติขึ้นทะเบียนบุคลากรกีฬา กกมท. ครั้งที่ 52 อย่างเป็นทางการ");

  useEffect(() => {
    let active = true;
    requestJson<{ applications: OfficialRecord[] }>(endpoint)
      .then((d) => { if (active) setRows(d.applications); })
      .catch((e) => { if (active) setMessage(errorMessage(e)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [endpoint]);

  async function load() {
    setBusy(true);
    try {
      const data = await requestJson<{ applications: OfficialRecord[] }>(endpoint);
      setRows(data.applications);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function review(id: string, version: number, action: string) {
    setBusy(true);
    setMessage("");
    const reasonToSend = action === "approve" && scope === "staff" ? certifyFeedback : actionReason;
    try {
      await requestJson(endpoint, { id, version, action, reason: reasonToSend });
      await load();
      setActionModal(null);
      setActionReason("");
      setDetailId(null);
      setMessage("บันทึกผลพิจารณาแล้ว");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const detailOfficial = rows.find((r) => r.id === detailId);

  const filteredRows = useMemo(() => {
    return rows.filter((o) => {
      const matchClub = selectedClub === "all" || o.club?.name === selectedClub;
      const matchStatus = selectedStatus === "all" || o.status === selectedStatus;
      const searchStr = `${o.profile?.firstName || ""} ${o.profile?.lastName || ""} ${o.profile?.nationalId || ""} ${o.profile?.workplace || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      return matchClub && matchStatus && matchSearch;
    });
  }, [rows, selectedClub, selectedStatus, search]);

  const pendingCount = rows.filter((o) => o.status === (scope === "club" ? "SUBMITTED" : "CLUB_APPROVED")).length;
  const approvedCount = rows.filter((o) => o.status === "STAFF_APPROVED" || (scope === "club" && o.status === "CLUB_APPROVED")).length;

  const stageBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">รอชมรมตรวจสอบ</span>;
      case "CLUB_APPROVED":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">ชมรมเสนอชื่อแล้ว (รอกองกิจฯ)</span>;
      case "RETURNED":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">ตีกลับให้แก้ไข</span>;
      case "CLUB_REJECTED":
      case "STAFF_REJECTED":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">ไม่อนุมัติ</span>;
      case "STAFF_APPROVED":
      case "FINAL_SELECTED":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">กองกิจฯ อนุมัติสำเร็จ ✓</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">{statusLabel[status] || status}</span>;
    }
  };

  const handleExportCSV = () => {
    const csvRows: AthleteExportRow[] = filteredRows.map((a, idx) => ({
      index: idx + 1,
      fullName: `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`,
      studentId: "-",
      nationalId: a.profile?.nationalId || "-",
      gender: detectGenderFromName(a.profile?.firstName || ""),
      faculty: a.profile?.workplace || "-",
      major: "-",
      studentLevel: "-",
      year: "-",
      sportName: a.competition?.name || "-",
      position: positionLabels[a.profile?.appliedPosition] || a.profile?.appliedPosition || "-",
      squadType: "เจ้าหน้าที่ทีม",
      status: statusLabel[a.status] || a.status,
      gpaCumulative: "-",
      phone: a.profile?.phone || "-",
    }));
    exportAthletesToCSV("ทะเบียนบุคลากรทีมกีฬา_" + scope, csvRows);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton href={scope === "club" ? "/club/competitions" : "/staff/applications"} label={scope === "club" ? "กลับหน้ารายการแข่งขัน" : "กลับหน้าหลัก"} />
          {scope === "club" && <LogoutButton />}
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {scope === "club" ? "การพิจารณาและรับรองเจ้าหน้าที่ทีมกีฬา" : "ทะเบียนเจ้าหน้าที่และผู้ฝึกสอนกีฬา กกมท.52"}
            </h1>
            <p className="text-xs text-slate-500">
              {scope === "club" ? "ตรวจสอบคุณสมบัติ แผนการฝึกซ้อม และลงนามเสนอชื่อให้กองกิจการนิสิต" : "ระบบพิจารณารับรองแผนการฝึกซ้อมและขึ้นทะเบียนบุคลากรกีฬา"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scope === "staff" && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                ดาวน์โหลด CSV
              </button>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              โหลดข้อมูลล่าสุด
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            {message}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">รอพิจารณาตรวจสอบ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">เสนอชื่อ / อนุมัติแล้ว</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">{approvedCount}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ไม่อนุมัติ / ตีกลับ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700">
                {rows.filter((o) => o.status === "RETURNED" || o.status.includes("REJECTED")).length}
              </span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ยอดรวมบุคลากรที่ยื่นขอ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{rows.length}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เลขบัตร, ที่ทำงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
          />
          {scope === "staff" && (
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ทุกชมรมกีฬา</option>
              {[...new Set(rows.map((o) => o.club?.name).filter(Boolean))].map((cName) => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          )}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">ทุกสถานะ</option>
            {[...new Set(rows.map((o) => o.status))].map((st) => (
              <option key={st} value={st}>{statusLabel[st] || st}</option>
            ))}
          </select>
        </div>

        {/* Application List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              รายชื่อเจ้าหน้าที่ทีมกีฬาที่เสนอตัวปฏิบัติหน้าที่
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {busy && !rows.length && (
              <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
            )}
            {!busy && filteredRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ไม่พบใบสมัครในเงื่อนไขที่เลือก</div>
            ) : (
              filteredRows.map((off) => {
                return (
                  <div key={off.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div onClick={() => setDetailId(off.id)} className="flex-1 cursor-pointer space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {off.profile?.firstName} {off.profile?.lastName}
                        </span>
                        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {positionLabels[off.profile?.appliedPosition] || off.profile?.appliedPosition} {off.profile?.appliedPosition === "other" && `(${off.profile?.appliedPositionOther})`}
                        </span>
                        {stageBadge(off.status)}
                      </div>
                      <div className="text-xs text-slate-600">
                        {off.profile?.workplace} · ตำแหน่ง: {off.profile?.workPosition} · โทร: {off.profile?.phone}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>ชมรม: {off.club?.name || "-"}</span>
                        <span>·</span>
                        <span>การแข่งขัน: {off.competition?.name || "-"}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons inline */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailId(off.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300"
                      >
                        ดูเอกสาร/พิจารณา
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {detailOfficial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-3xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {positionLabels[detailOfficial.profile?.appliedPosition] || detailOfficial.profile?.appliedPosition}
                    </span>
                    {stageBadge(detailOfficial.status)}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {detailOfficial.profile?.firstName} {detailOfficial.profile?.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {detailOfficial.club?.name} · {detailOfficial.competition?.name}
                  </p>
                </div>
                <button type="button" onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
              </div>

              {/* General Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(detailOfficial.profile || {}).filter(([k]) => k !== "appliedPosition" && k !== "appliedPositionOther").map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">{officialLabels[k] || k}</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{v || "-"}</span>
                  </div>
                ))}
              </div>

              {/* Documents List */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">เอกสารประกอบการพิจารณา</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(detailOfficial.documents || {}).map(([k, docId]) => (
                    <div key={k} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-xs bg-white">
                      <span className="font-medium text-slate-700">{documentLabels[k] || k}</span>
                      <PrivateFile id={docId as string} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Actions */}
              {detailOfficial.status === (scope === "club" ? "SUBMITTED" : "CLUB_APPROVED") && (
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setActionModal({ id: detailOfficial.id, type: "reject" }); setActionReason(""); }}
                    className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {scope === "club" ? "ไม่อนุมัติ / ตีกลับให้แก้ไข" : "ไม่อนุมัติ / ตีกลับ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionModal({ id: detailOfficial.id, type: "approve" }); setActionReason(""); }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    {scope === "club" ? "รับรองและเสนอชื่อให้กองกิจฯ" : "อนุมัติและขึ้นทะเบียน"}
                  </button>
                </div>
              )}

              {/* History */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">ประวัติการดำเนินการ</h3>
                <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
                  {detailOfficial.events?.map((e) => (
                    <div key={e.id} className="mb-2 last:mb-0 border-l-2 border-slate-200 pl-3">
                      <div className="font-semibold">{statusLabel[e.action] || e.action}</div>
                      <div className="text-slate-400">{new Date(e.createdAt).toLocaleString("th-TH")}</div>
                      {e.reason && <div className="text-rose-700 mt-0.5">เหตุผล: {e.reason}</div>}
                    </div>
                  ))}
                  {(!detailOfficial.events || detailOfficial.events.length === 0) && "ยังไม่มีประวัติ"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {actionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-slate-900">
                {actionModal.type === "approve" ? (scope === "club" ? "ยืนยันการรับรองและเสนอชื่อ" : "ยืนยันการอนุมัติและขึ้นทะเบียน") : "ยืนยันการไม่อนุมัติ / ตีกลับ"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {actionModal.type === "approve" 
                  ? "ระบบจะบันทึกสถานะการอนุมัติและส่งต่อไปยังขั้นตอนถัดไป คุณสามารถระบุข้อความเพิ่มเติมได้"
                  : "กรุณาระบุเหตุผลหรือข้อบกพร่องที่พบ เพื่อให้ผู้สมัครรับทราบหรือนำไปแก้ไข"}
              </p>
              
              <textarea
                value={actionModal.type === "approve" ? (scope === "staff" ? certifyFeedback : actionReason) : actionReason}
                onChange={(e) => actionModal.type === "approve" && scope === "staff" ? setCertifyFeedback(e.target.value) : setActionReason(e.target.value)}
                placeholder={actionModal.type === "approve" ? "ความคิดเห็นเพิ่มเติม (ไม่บังคับ)" : "เหตุผลที่ไม่อนุมัติ หรือสิ่งที่ต้องแก้ไข (บังคับ)"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 min-h-24"
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  disabled={busy}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => review(actionModal.id, detailOfficial?.version ?? 0, actionModal.type)}
                  disabled={busy || (actionModal.type === "reject" && !actionReason.trim())}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50 ${actionModal.type === "approve" ? "bg-blue-900 hover:bg-blue-800" : "bg-rose-700 hover:bg-rose-800"}`}
                >
                  {busy ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
