"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

const SELECTED_ATHLETES = [
  { id: "1", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "คณะวิทยาศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", club: "ชมรมฟุตบอล", squadType: "ตัวจริง" },
  { id: "2", firstName: "กิตติศักดิ์", lastName: "มั่นคง", studentId: "66028114", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองกลาง", club: "ชมรมฟุตบอล", squadType: "ตัวจริง" },
  { id: "3", firstName: "นภา", lastName: "ฟ้าใส", studentId: "66045002", faculty: "คณะมนุษยศาสตร์", sport: "วอลเลย์บอล", position: "ตัวรับ", club: "ชมรมวอลเลย์บอล", squadType: "ตัวจริง" },
  { id: "4", firstName: "ธนกฤต", lastName: "วงศ์สว่าง", studentId: "67015520", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", club: "ชมรมฟุตบอล", squadType: "ตัวสำรอง" },
];

export default function StaffSelectionPage() {
  const router = useRouter();
  const [announced, setAnnounced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnnounce = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setAnnounced(true);
    setLoading(false);
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
            ระบบได้เผยแพร่ประกาศรายชื่อนักกีฬาตัวแทนสถาบันอย่างเป็นทางการ และเปิดให้นักกีฬาเข้ารายงานตัวยืนยันสิทธิ์เรียบร้อยแล้ว
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ไปที่แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => router.push("/staff/applications")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              กลับหน้ารายการใบสมัคร
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" />
          <LogoutButton />
        </div>

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
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">จำนวนนักกีฬาที่ผ่านการอนุมัติขั้นสุดท้าย</span>
            <span className="text-2xl font-bold text-slate-900">{SELECTED_ATHLETES.length} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              แบ่งเป็นตัวจริง {SELECTED_ATHLETES.filter(a => a.squadType === "ตัวจริง").length} คน และตัวสำรอง {SELECTED_ATHLETES.filter(a => a.squadType === "ตัวสำรอง").length} คน
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            พิมพ์ประกาศทางการ
          </button>
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
                {SELECTED_ATHLETES.map((a, index) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{a.firstName} {a.lastName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{a.studentId}</td>
                    <td className="py-3 px-4 text-slate-600">{a.faculty}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{a.sport} ({a.position})</td>
                    <td className="py-3 px-4 text-slate-600">{a.club}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        a.squadType === "ตัวจริง"
                          ? "bg-blue-100 text-blue-900 font-semibold"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {a.squadType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              เมื่อกดออกประกาศทางการ ระบบจะเปิดให้นิสิตเข้ารายงานตัวและยืนยันสิทธิ์ตามกำหนดเวลา
            </div>
            <button
              onClick={handleAnnounce}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? "กำลังดำเนินการ..." : "ลงนามอนุมัติและออกประกาศผลทางการ"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
