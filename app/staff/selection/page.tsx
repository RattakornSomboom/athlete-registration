"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import { requestJson, errorMessage, statusLabel, type CompetitionOption, type OfficialRecord } from "@/lib/phase4-client";
import { positionLabels } from "@/lib/official-labels";

type AnnounceAthlete = {
  id: string;
  sport: string;
  user: {
    studentId: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
};

export default function StaffSelectionPage() {
  const router = useRouter();

  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"athletes" | "officials">("athletes");

  const [athletes, setAthletes] = useState<AnnounceAthlete[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [officials, setOfficials] = useState<OfficialRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [announcing, setAnnouncing] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const [errorMessageState, setErrorMessageState] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson<{ competitions: CompetitionOption[] }>("/api/competitions"),
      requestJson<{ applications: OfficialRecord[] }>("/api/staff/officials"),
    ])
      .then(([compData, offData]) => {
        if (!active) return;
        setCompetitions(compData.competitions);
        setOfficials(offData.applications);
        if (compData.competitions.length > 0) {
          setSelectedCompId(compData.competitions[0].id);
        }
      })
      .catch((e) => {
        if (active) setErrorMessageState(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompId) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setErrorMessageState("");
      }
    });
    requestJson<{ competitionId: string; applications: AnnounceAthlete[] }>(
      "/api/staff/applications/announce?competitionId=" + encodeURIComponent(selectedCompId),
      undefined,
      "GET"
    )
      .then((data) => {
        if (!active) return;
        setAthletes(data.applications);
        setSelectedAthleteIds(new Set(data.applications.map((a) => a.id)));
      })
      .catch((e) => {
        if (active) setErrorMessageState(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCompId]);

  const certifiedOfficials = officials.filter((o) => o.status === "STAFF_APPROVED" || o.status === "FINAL_SELECTED");
  const pendingOfficials = officials.filter((o) => o.status === "CLUB_APPROVED");

  const toggleSelectAthlete = (id: string) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAthleteIds.size === athletes.length) {
      setSelectedAthleteIds(new Set());
    } else {
      setSelectedAthleteIds(new Set(athletes.map((a) => a.id)));
    }
  };

  const handleAnnounce = async () => {
    if (!selectedCompId || selectedAthleteIds.size === 0) return;
    setAnnouncing(true);
    setErrorMessageState("");
    try {
      await requestJson("/api/staff/applications/announce", {
        competitionId: selectedCompId,
        applicationIds: Array.from(selectedAthleteIds),
      });
      setAnnounced(true);
      setShowConfirmModal(false);
    } catch (e) {
      setErrorMessageState(errorMessage(e));
      setShowConfirmModal(false);
    } finally {
      setAnnouncing(false);
    }
  };

  if (announced) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-base font-bold text-slate-900">ประกาศผลการคัดเลือกและขึ้นทะเบียนสำเร็จ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบได้บันทึกและเผยแพร่ประกาศรายชื่อนักกีฬาตัวแทนสถาบัน ({selectedAthleteIds.size} คน) อย่างเป็นทางการในฐานข้อมูล พร้อมเปิดให้นิสิตรายงานตัวยืนยันสิทธิ์เรียบร้อยแล้ว
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              ไปที่แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              type="button"
              onClick={() => {
                setAnnounced(false);
                setSelectedAthleteIds(new Set());
              }}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              กลับหน้ารายการคัดเลือก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" label="กลับหน้ารายการใบสมัคร" />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · คณะกรรมการอำนวยการกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การบันทึกผลเข้าระบบและออกประกาศผลทางการ (นักกีฬา & ผู้ฝึกสอน)
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">นักกีฬาที่พร้อมประกาศผล</span>
            <span className="text-2xl font-bold text-blue-900">{athletes.length} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              เลือกแล้ว {selectedAthleteIds.size} / {athletes.length} คน
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">เจ้าหน้าที่ทีมที่ขึ้นทะเบียนแล้ว</span>
            <span className="text-2xl font-bold text-emerald-800">{certifiedOfficials.length} ท่าน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยฯ
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">เจ้าหน้าที่รอตรวจสอบ</span>
            <span className="text-2xl font-bold text-amber-700">{pendingOfficials.length} ท่าน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              ชมรมกีฬาเสนอชื่อเข้ามา
            </p>
          </div>
        </div>

        {/* Competition Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">เลือกรายการแข่งขัน:</span>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-800 font-semibold outline-none cursor-pointer"
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({statusLabel[c.status] || c.status})
                </option>
              ))}
            </select>
          </div>

          {activeTab === "athletes" && athletes.length > 0 && (
            <button
              type="button"
              disabled={selectedAthleteIds.size === 0 || announcing}
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              ประกาศผลและขึ้นทะเบียน ({selectedAthleteIds.size} คน)
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessageState && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {errorMessageState}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("athletes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "athletes"
                ? "bg-blue-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            รายชื่อนักกีฬาตัวแทนที่ผ่านการคัดเลือก ({athletes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("officials")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "officials"
                ? "bg-blue-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            รายชื่อเจ้าหน้าที่ทีม/ผู้ฝึกสอนที่ขึ้นทะเบียน ({certifiedOfficials.length})
          </button>
        </div>

        {/* Tab 1: Athletes Table */}
        {activeTab === "athletes" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  รายชื่อนักกีฬาตัวแทนสถาบัน (สถานะ: กองกิจฯ อนุมัติแล้ว)
                </h2>
                <p className="text-[11px] text-slate-500">
                  ผู้ที่ได้รับการคัดเลือกในรายการแข่งขันนี้ที่พร้อมประกาศผลอย่างเป็นทางการ
                </p>
              </div>
              {athletes.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-blue-900 font-semibold hover:underline cursor-pointer"
                >
                  {selectedAthleteIds.size === athletes.length ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th scope="col" className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={athletes.length > 0 && selectedAthleteIds.size === athletes.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-900 cursor-pointer"
                      />
                    </th>
                    <th scope="col" className="p-3">รหัสนิสิต</th>
                    <th scope="col" className="p-3">ชื่อ - สกุล</th>
                    <th scope="col" className="p-3">ชนิดกีฬา</th>
                    <th scope="col" className="p-3 text-center">สถานะปัจจุบัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">กำลังโหลดรายชื่อนักกีฬา...</td>
                    </tr>
                  )}
                  {!loading && athletes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        ยังไม่มีนักกีฬาที่ผ่านการอนุมัติระดับกองกิจฯ ในการแข่งขันนี้
                      </td>
                    </tr>
                  )}
                  {!loading && athletes.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAthleteIds.has(a.id)}
                          onChange={() => toggleSelectAthlete(a.id)}
                          className="rounded border-slate-300 text-blue-900 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-700">{a.user?.studentId || "-"}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {a.user?.profile?.firstName} {a.user?.profile?.lastName}
                      </td>
                      <td className="p-3 text-slate-600">{a.sport}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ผ่านการอนุมัติกองกิจฯ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Officials Table */}
        {activeTab === "officials" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                รายชื่อเจ้าหน้าที่ทีมและผู้ฝึกสอนกีฬาที่ขึ้นทะเบียนแล้ว
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th scope="col" className="p-3 w-12 text-center">ที่</th>
                    <th scope="col" className="p-3">ชื่อ - สกุล</th>
                    <th scope="col" className="p-3">ตำแหน่ง</th>
                    <th scope="col" className="p-3">ชมรม / กีฬา</th>
                    <th scope="col" className="p-3">หน่วยงาน</th>
                    <th scope="col" className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certifiedOfficials.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        ยังไม่มีเจ้าหน้าที่ทีมที่ผ่านการขึ้นทะเบียน
                      </td>
                    </tr>
                  )}
                  {certifiedOfficials.map((off, idx) => (
                    <tr key={off.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {off.profile?.firstName} {off.profile?.lastName}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {positionLabels[off.profile?.appliedPosition] || off.profile?.appliedPosition}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{off.club?.name || "-"}</td>
                      <td className="p-3 text-slate-600">{off.profile?.workplace || "-"}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ขึ้นทะเบียนสำเร็จ ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการออกประกาศผลการคัดเลือก
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจะเปลี่ยนสถานะของผู้สมัครที่เลือก ({selectedAthleteIds.size} คน) ให้เป็น <strong>&quot;ผ่านการคัดเลือกขั้นสุดท้าย (FINAL_SELECTED)&quot;</strong> และบันทึกประวัติการประกาศผลในฐานข้อมูล
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={announcing}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={announcing}
                  onClick={handleAnnounce}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {announcing ? "กำลังประกาศผล..." : "ยืนยันประกาศผล"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
