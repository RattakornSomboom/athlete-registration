"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Athlete = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  sport: string;
  position: string;
  experience: string;
  achievement: string;
  status: "pending" | "approved" | "rejected";
};

const MOCK_ATHLETES: Athlete[] = [
  { id: "1", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "วิทยาศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", experience: "3-5 ปี", achievement: "แชมป์กีฬาเขต 2566", status: "pending" },
  { id: "2", firstName: "สมหญิง", lastName: "รักดี", studentId: "66027013", faculty: "วิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองกลาง", experience: "1-3 ปี", achievement: "", status: "pending" },
  { id: "3", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "บริหาร", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ", status: "approved" },
];

const STATUS_LABEL = {
  pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "ผ่านการคัดเลือก", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

export default function ClubAthletesPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>(MOCK_ATHLETES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = athletes.filter((a) => {
    const matchSearch = `${a.firstName} ${a.lastName} ${a.studentId}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) =>
    setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));

  const handleReject = (id: string) =>
    setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));

  const pendingCount = athletes.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายชื่อนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">ชมรมฟุตบอล — รอพิจารณา {pendingCount} คน</p>
          </div>
          <button
            onClick={() => router.push("/club/review")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ส่งต่อกิจการนิสิต
          </button>
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอพิจารณา</option>
            <option value="approved">ผ่านการคัดเลือก</option>
            <option value="rejected">ไม่ผ่าน</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ไม่พบรายชื่อนักกีฬา
            </div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{a.firstName} {a.lastName}</span>
                    <span className="text-gray-400 text-sm">#{a.studentId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[a.status].className}`}>
                      {STATUS_LABEL[a.status].label}
                    </span>
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
                    <button onClick={() => handleApprove(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
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