"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
};

const MOCK_APPLICATIONS: Application[] = [
  { id: "1", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "บริหาร", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ", club: "ชมรมฟุตบอล", status: "pending" },
  { id: "2", firstName: "วิชัย", lastName: "เก่งกาจ", studentId: "66031005", faculty: "ครุศาสตร์", sport: "บาสเกตบอล", position: "Point Guard", experience: "3-5 ปี", achievement: "แชมป์ระดับจังหวัด", club: "ชมรมบาสเกตบอล", status: "pending" },
  { id: "3", firstName: "นภา", lastName: "ฟ้าใส", studentId: "66045002", faculty: "มนุษยศาสตร์", sport: "วอลเลย์บอล", position: "ตัวรับ", experience: "1-3 ปี", achievement: "", club: "ชมรมวอลเลย์บอล", status: "selected" },
  { id: "4", firstName: "ธนา", lastName: "มั่งมี", studentId: "65033010", faculty: "เศรษฐศาสตร์", sport: "ว่ายน้ำ", position: "100 เมตร ผีเสื้อ", experience: "มากกว่า 5 ปี", achievement: "สถิติมหาวิทยาลัย", club: "ชมรมว่ายน้ำ", status: "pending" },
];

const STATUS_LABEL = {
  pending: { label: "รอคัดเลือก", className: "bg-yellow-100 text-yellow-800" },
  selected: { label: "คัดเลือกแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
          <button
            onClick={() => router.push("/staff/selection")}
            disabled={selectedCount === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ประกาศผล ({selectedCount})
          </button>
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
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{a.faculty} — {a.sport} ({a.position})</p>
                    <p>ประสบการณ์: {a.experience}</p>
                    {a.achievement && <p>ผลงาน: {a.achievement}</p>}
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleReject(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                    <button onClick={() => handleSelect(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">คัดเลือก</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}