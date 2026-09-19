"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

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
  { id: "1", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "คณะวิทยาศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", experience: "3-5 ปี", achievement: "แชมป์กีฬาเขต 2566", status: "pending" },
  { id: "2", firstName: "สมหญิง", lastName: "รักดี", studentId: "66027013", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองกลาง", experience: "1-3 ปี", achievement: "-", status: "pending" },
  { id: "3", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ", status: "approved" },
  { id: "4", firstName: "กิตติศักดิ์", lastName: "มั่นคง", studentId: "66028114", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองกลาง", experience: "4 ปี", achievement: "รองชนะเลิศฟุตบอลถ้วย ก", status: "approved" },
  { id: "5", firstName: "ณัฐพล", lastName: "ศรีกุล", studentId: "65039201", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sport: "ฟุตบอล", position: "กองหลัง", experience: "2 ปี", achievement: "แชมป์เยาวชนระดับจังหวัด", status: "approved" },
  { id: "6", firstName: "ภานุวัฒน์", lastName: "สุขสวัสดิ์", studentId: "67041022", faculty: "คณะวิทยาการจัดการ", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "3 ปี", achievement: "-", status: "pending" },
];

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
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ทะเบียนรายชื่อผู้สมัครเข้ารับการคัดเลือก
            </h1>
            <p className="text-xs text-slate-500">
              ชมรมฟุตบอล — ผู้สมัครรอการตรวจสอบ {pendingCount} รายการ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              จัดทำบัญชีรายชื่อส่งกองกิจ
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">ผู้สมัครในสังกัดชมรม</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{athletes.length} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">ผ่านการคัดเลือกเบื้องต้น</span>
            <span className="text-xl font-bold text-emerald-800 mt-0.5 block">
              {athletes.filter((a) => a.status === "approved").length} คน
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">รอการพิจารณาคัดเลือก</span>
            <span className="text-xl font-bold text-blue-900 mt-0.5 block">{pendingCount} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">ไม่ผ่านเกณฑ์</span>
            <span className="text-xl font-bold text-slate-600 mt-0.5 block">
              {athletes.filter((a) => a.status === "rejected").length} คน
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล หรือ รหัสนิสิต..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-800 outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-800 outline-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอพิจารณา</option>
              <option value="approved">ผ่านการคัดเลือก</option>
              <option value="rejected">ไม่ผ่านเกณฑ์</option>
            </select>
          </div>
          <span className="text-xs text-slate-500">
            แสดงผล {filtered.length} จาก {athletes.length} รายการ
          </span>
        </div>

        {/* Athletes Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">รหัสนิสิต</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">คณะต้นสังกัด</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">ประสบการณ์ / ผลงาน</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{a.studentId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{a.firstName} {a.lastName}</td>
                    <td className="py-3 px-4 text-slate-600">{a.faculty}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{a.position}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{a.achievement !== "-" ? a.achievement : "ไม่มีผลงานอ้างอิง"}</div>
                      <span className="text-[11px] text-slate-400">ประสบการณ์: {a.experience}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-medium ${
                        a.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 font-semibold"
                          : a.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {a.status === "approved" ? "ผ่านการคัดเลือก" : a.status === "rejected" ? "ไม่ผ่าน" : "รอพิจารณา"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[11px] transition-colors"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] transition-colors"
                        >
                          ไม่ผ่าน
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
