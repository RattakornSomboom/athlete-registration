"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import LogoutButton from "@/components/shared/LogoutButton";

type Application = {
  id: string;
  sport: string;
  category: string;
  squadType: string | null;
  user: {
    studentId: string;
    profile?: { firstName: string; lastName: string; faculty: string; phone: string } | null;
  };
  competition: { name: string; sport: string; club: { name: string } };
};

export default function StaffSelectionPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcing, setAnnouncing] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/staff/applications?status=STAFF_APPROVED")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAnnounce = async () => {
    if (!confirm(`ยืนยันประกาศผลการคัดเลือกนักกีฬาตัวแทนสถาบันทั้งหมด ${applications.length} คน?`)) return;
    setAnnouncing(true);
    try {
      const res = await fetch("/api/staff/applications/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: applications.map((a) => a.id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count);
        setAnnounced(true);
      } else {
        alert(data.error || "ประกาศผลไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setAnnouncing(false);
    }
  };

  const handleExportExcel = () => {
    const data = applications.map((a, i) => ({
      "ลำดับ": i + 1,
      "รหัสนิสิต": a.user.studentId,
      "ชื่อ-นามสกุล": a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : "-",
      "คณะ": a.user.profile?.faculty || "-",
      "ชนิดกีฬา": a.sport || a.competition.sport,
      "ตำแหน่ง": a.category,
      "สถานะ": a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ผ่านการคัดเลือก",
      "หมายเลขโทรศัพท์": a.user.profile?.phone || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อนักกีฬา");
    XLSX.writeFile(workbook, "athlete-selection.xlsx");
  };

  if (announced) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-base font-bold text-slate-900">ประกาศผลการคัดเลือกสำเร็จ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบได้เผยแพร่ประกาศรายชื่อนักกีฬาตัวแทนสถาบันอย่างเป็นทางการ และเปิดให้นักกีฬาเข้ารายงานตัวยืนยันสิทธิ์เรียบร้อยแล้ว (รวม {count} คน)
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ไปที่แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => router.push("/staff/applications")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              กลับหน้ารายการใบสมัคร
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mainCount = applications.filter(a => a.squadType === "main").length;
  const reserveCount = applications.filter(a => a.squadType === "reserve").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ประกาศผลการคัดเลือกนักกีฬาตัวแทนสถาบัน
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => router.back()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">จำนวนนักกีฬาที่ผ่านการอนุมัติขั้นสุดท้าย</span>
            <span className="text-2xl font-bold text-slate-900">{loading ? "..." : applications.length} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              แบ่งเป็นตัวจริง {loading ? "..." : mainCount} คน และตัวสำรอง {loading ? "..." : reserveCount} คน
            </p>
          </div>
          <div className="flex gap-2">
            {!loading && applications.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                📥 Export Excel
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              พิมพ์ประกาศทางการ
            </button>
          </div>
        </div>

        {/* Official Candidates List Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              บัญชีรายชื่อนักกีฬาตัวแทนที่พร้อมออกประกาศ
            </h2>
            <span className="text-xs text-slate-500">
              ตรวจสอบความถูกต้องก่อนกดออกประกาศทางการ
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 text-slate-400 text-sm">กำลังโหลด...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">ไม่มีนักกีฬาที่รอประกาศผล</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">รหัสนิสิต</th>
                    <th className="py-3 px-4">คณะต้นสังกัด</th>
                    <th className="py-3 px-4">ชนิดกีฬา / ตำแหน่ง</th>
                    <th className="py-3 px-4">ชมรมที่สังกัด</th>
                    <th className="py-3 px-4 text-center">ประเภท</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((a, index) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{a.user.studentId}</td>
                      <td className="py-3 px-4 text-slate-600">{a.user.profile?.faculty || "-"}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{a.competition.name} ({a.category})</td>
                      <td className="py-3 px-4 text-slate-600">{a.competition.club.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          a.squadType === "main"
                            ? "bg-blue-100 text-blue-900 font-semibold"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ผ่านการคัดเลือก"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {applications.length > 0 && !loading && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                เมื่อกดออกประกาศทางการ ระบบจะเปิดให้นิสิตเข้ารายงานตัวและยืนยันสิทธิ์ตามกำหนดเวลา
              </div>
              <button
                onClick={handleAnnounce}
                disabled={announcing}
                className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {announcing ? "กำลังดำเนินการ..." : "ลงนามอนุมัติและออกประกาศผลทางการ"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}