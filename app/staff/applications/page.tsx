"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type FitnessTest = {
  tested: boolean;
  result: "excellent" | "good" | "fair" | "poor" | "";
  testDate: string;
  note: string;
};

type StatisticalTrial = {
  needed: boolean;
  conducted: boolean;
  passed: boolean | null;
  trialDate: string;
  measuredValue: string;
  criteriaValue: string;
  note: string;
};

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  sport: string;
  position: string;
  experience: string;
  achievement: string;
  club: string;
  status: "pending" | "selected" | "rejected";
  fitnessTest: FitnessTest;
  statisticalTrial: StatisticalTrial;
};

const MOCK_APPLICATIONS: Application[] = [
  { id: "1", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "บริหาร", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ", club: "ชมรมฟุตบอล", status: "pending", fitnessTest: { tested: false, result: "", testDate: "", note: "" }, statisticalTrial: { needed: false, conducted: false, passed: null, trialDate: "", measuredValue: "", criteriaValue: "", note: "" } },
  { id: "2", firstName: "วิชัย", lastName: "เก่งกาจ", studentId: "66031005", faculty: "ครุศาสตร์", sport: "บาสเกตบอล", position: "Point Guard", experience: "3-5 ปี", achievement: "แชมป์ระดับจังหวัด", club: "ชมรมบาสเกตบอล", status: "pending", fitnessTest: { tested: true, result: "good", testDate: "20 พ.ค. 2568", note: "" }, statisticalTrial: { needed: false, conducted: false, passed: null, trialDate: "", measuredValue: "", criteriaValue: "", note: "" } },
  { id: "3", firstName: "นภา", lastName: "ฟ้าใส", studentId: "66045002", faculty: "มนุษยศาสตร์", sport: "วอลเลย์บอล", position: "ตัวรับ", experience: "1-3 ปี", achievement: "", club: "ชมรมวอลเลย์บอล", status: "selected", fitnessTest: { tested: true, result: "excellent", testDate: "18 พ.ค. 2568", note: "" }, statisticalTrial: { needed: true, conducted: true, passed: true, trialDate: "19 พ.ค. 2568", measuredValue: "12.5 วินาที", criteriaValue: "13.0 วินาที", note: "ผ่านเกณฑ์มาตรฐาน" } },
  { id: "4", firstName: "ธนา", lastName: "มั่งมี", studentId: "65033010", faculty: "เศรษฐศาสตร์", sport: "ว่ายน้ำ", position: "100 เมตร ผีเสื้อ", experience: "มากกว่า 5 ปี", achievement: "สถิติมหาวิทยาลัย", club: "ชมรมว่ายน้ำ", status: "pending", fitnessTest: { tested: false, result: "", testDate: "", note: "" }, statisticalTrial: { needed: true, conducted: false, passed: null, trialDate: "", measuredValue: "", criteriaValue: "", note: "" } },
];

const STATUS_LABEL = {
  pending: { label: "รอคัดเลือก", className: "bg-yellow-100 text-yellow-800" },
  selected: { label: "คัดเลือกแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

const FITNESS_LABEL: Record<string, { label: string; className: string }> = {
  excellent: { label: "ดีมาก", className: "bg-green-100 text-green-700" },
  good: { label: "ดี (ผ่านเกณฑ์)", className: "bg-blue-100 text-blue-700" },
  fair: { label: "ปานกลาง (ผ่านเกณฑ์)", className: "bg-yellow-100 text-yellow-700" },
  poor: { label: "ต่ำกว่าเกณฑ์", className: "bg-red-100 text-red-700" },
};

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [fitnessModalId, setFitnessModalId] = useState<string | null>(null);
  const [fitnessForm, setFitnessForm] = useState<FitnessTest>({ tested: false, result: "", testDate: "", note: "" });

  const openFitnessModal = (app: Application) => {
    setFitnessModalId(app.id);
    setFitnessForm(app.fitnessTest);
  };

  const saveFitnessTest = () => {
    if (!fitnessModalId) return;
    setApplications((prev) =>
      prev.map((a) => a.id === fitnessModalId ? { ...a, fitnessTest: { ...fitnessForm, tested: true } } : a)
    );
    setFitnessModalId(null);
  };

  const [trialModalId, setTrialModalId] = useState<string | null>(null);
  const [trialForm, setTrialForm] = useState<StatisticalTrial>({ needed: true, conducted: false, passed: null, trialDate: "", measuredValue: "", criteriaValue: "", note: "" });

  const openTrialModal = (app: Application) => {
    setTrialModalId(app.id);
    setTrialForm(app.statisticalTrial);
  };

  const saveTrial = () => {
    if (!trialModalId) return;
    setApplications((prev) =>
      prev.map((a) => a.id === trialModalId ? { ...a, statisticalTrial: { ...trialForm, conducted: true } } : a)
    );
    setTrialModalId(null);
  };

  const sports = ["all", ...Array.from(new Set(applications.map((a) => a.sport)))];

  const filtered = applications.filter((a) => {
    const matchSearch = `${a.firstName} ${a.lastName} ${a.studentId}`.toLowerCase().includes(search.toLowerCase());
    const matchSport = filterSport === "all" || a.sport === filterSport;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchSport && matchStatus;
  });

  const handleSelect = (id: string) =>
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "selected" } : a));

  const handleReject = (id: string) =>
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));

  const selectedCount = applications.filter((a) => a.status === "selected").length;
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ใบสมัครนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">รอคัดเลือก {pendingCount} คน · คัดเลือกแล้ว {selectedCount} คน</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/staff/activities")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              📋 กิจกรรมชมรม
            </button>
            <button
              onClick={() => router.push("/staff/requests")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              📝 คำร้องพิเศษ
            </button>
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⚙️ ตั้งค่า
            </button>
            <button
              onClick={() => router.push("/staff/selection")}
              disabled={selectedCount === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ประกาศผล ({selectedCount})
            </button>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "ใบสมัครทั้งหมด", value: applications.length, color: "text-gray-900" },
            { label: "รอคัดเลือก", value: pendingCount, color: "text-yellow-600" },
            { label: "คัดเลือกแล้ว", value: selectedCount, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนิสิต..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
          >
            {sports.map((s) => (
              <option key={s} value={s}>{s === "all" ? "ทุกชนิดกีฬา" : s}</option>
            ))}
          </select>
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอคัดเลือก</option>
            <option value="selected">คัดเลือกแล้ว</option>
            <option value="rejected">ไม่ผ่าน</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">ไม่พบใบสมัคร</div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900">{a.firstName} {a.lastName}</span>
                    <span className="text-gray-400 text-sm">#{a.studentId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[a.status].className}`}>{STATUS_LABEL[a.status].label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a.club}</span>
                    {a.fitnessTest.tested ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FITNESS_LABEL[a.fitnessTest.result].className}`}>
                        สมรรถภาพ: {FITNESS_LABEL[a.fitnessTest.result].label}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        ยังไม่ทดสอบสมรรถภาพ
                      </span>
                    )}
                    {a.statisticalTrial.needed && (
                      a.statisticalTrial.conducted ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.statisticalTrial.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          ประลองสถิติ: {a.statisticalTrial.passed ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          ⚠️ ต้องประลองทดสอบสถิติ
                        </span>
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{a.faculty} — {a.sport} ({a.position})</p>
                    <p>ประสบการณ์: {a.experience}</p>
                    {a.achievement && <p>ผลงาน: {a.achievement}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button onClick={() => router.push(`/athlete/${a.id}`)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    ดูข้อมูล
                  </button>
                  <button onClick={() => openFitnessModal(a)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    🏃 บันทึกผลทดสอบ
                  </button>
                  <button onClick={() => openTrialModal(a)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    📊 ประลองสถิติ
                  </button>
                  {a.status === "pending" && (
                    <>
                      <button onClick={() => handleReject(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                      <button onClick={() => handleSelect(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">คัดเลือก</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal บันทึกผลทดสอบสมรรถภาพ */}
      {fitnessModalId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">บันทึกผลทดสอบสมรรถภาพ</h2>
            <p className="text-gray-500 text-sm mb-4">
              {applications.find((a) => a.id === fitnessModalId)?.firstName} {applications.find((a) => a.id === fitnessModalId)?.lastName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสมรรถภาพทางกาย</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={fitnessForm.result}
                  onChange={(e) => setFitnessForm((p) => ({ ...p, result: e.target.value as FitnessTest["result"] }))}
                >
                  <option value="">เลือกระดับ</option>
                  <option value="excellent">ดีมาก</option>
                  <option value="good">ดี (ผ่านเกณฑ์)</option>
                  <option value="fair">ปานกลาง (ผ่านเกณฑ์)</option>
                  <option value="poor">ต่ำกว่าเกณฑ์ (ไม่ผ่าน)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  ตามประกาศมหาวิทยาลัย ต้องมีสมรรถภาพทางกายอยู่ในระดับปานกลางขึ้นไป
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ทดสอบ</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fitnessForm.testDate}
                  onChange={(e) => setFitnessForm((p) => ({ ...p, testDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  value={fitnessForm.note}
                  onChange={(e) => setFitnessForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setFitnessModalId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveFitnessTest}
                disabled={!fitnessForm.result || !fitnessForm.testDate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                บันทึกผล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ประลองทดสอบสถิติ */}
      {trialModalId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">ประลองทดสอบสถิติ</h2>
            <p className="text-gray-500 text-sm mb-1">
              {applications.find((a) => a.id === trialModalId)?.firstName} {applications.find((a) => a.id === trialModalId)?.lastName}
            </p>
            <p className="text-xs text-amber-600 mb-4">
              ใช้กรณีนักกีฬายังไม่มีผลแข่งขันตามเกณฑ์ข้อ 6 — ต้องเข้าประลองเพื่อทดสอบสถิติเทียบเกณฑ์มาตรฐาน
            </p>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={trialForm.needed}
                    onChange={(e) => setTrialForm((p) => ({ ...p, needed: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  จำเป็นต้องประลองทดสอบสถิติ
                </label>
              </div>

              {trialForm.needed && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ประลอง</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={trialForm.trialDate}
                      onChange={(e) => setTrialForm((p) => ({ ...p, trialDate: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ผลที่วัดได้</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น 12.5 วินาที"
                        value={trialForm.measuredValue}
                        onChange={(e) => setTrialForm((p) => ({ ...p, measuredValue: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เกณฑ์มาตรฐาน</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น 13.0 วินาที"
                        value={trialForm.criteriaValue}
                        onChange={(e) => setTrialForm((p) => ({ ...p, criteriaValue: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ผลการประลอง</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTrialForm((p) => ({ ...p, passed: true }))}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          trialForm.passed === true ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        ผ่านเกณฑ์
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrialForm((p) => ({ ...p, passed: false }))}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          trialForm.passed === false ? "bg-red-600 text-white border-red-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        ไม่ผ่านเกณฑ์
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      value={trialForm.note}
                      onChange={(e) => setTrialForm((p) => ({ ...p, note: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTrialModalId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveTrial}
                disabled={trialForm.needed && (trialForm.passed === null || !trialForm.trialDate)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                บันทึกผล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}