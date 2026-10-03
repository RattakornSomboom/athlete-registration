"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { getTeamOfficials, TeamOfficialApplication, POSITION_LABEL } from "@/lib/team-official-store";

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
  const [activeTab, setActiveTab] = useState<"athletes" | "officials">("athletes");
  const [officials, setOfficials] = useState<TeamOfficialApplication[]>([]);

  useEffect(() => {
    const list = getTeamOfficials();
    setOfficials(list);
  }, []);

  const certifiedOfficials = officials.filter((o) => o.stage === "staff_approved");
  const pendingOfficials = officials.filter((o) => o.stage === "club_approved");

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
          <h2 className="text-base font-bold text-slate-900">ประกาศผลการคัดเลือกและขึ้นทะเบียนสำเร็จ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบได้บันทึกและเผยแพร่ประกาศรายชื่อนักกีฬาตัวแทนสถาบัน และทะเบียนเจ้าหน้าที่ทีมกีฬาอย่างเป็นทางการ พร้อมเปิดให้นักกีฬาเข้ารายงานตัวยืนยันสิทธิ์เรียบร้อยแล้ว
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
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · คณะกรรมการอำนวยการกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การบันทึกผลเข้าระบบและออกประกาศผลทางการ (นักกีฬา & ผู้ฝึกสอน)
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/officials")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ระบบตรวจเอกสารเจ้าหน้าที่ทีม
            </button>
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวแทนสถาบันที่ผ่านคัดเลือก</span>
            <span className="text-2xl font-bold text-blue-900">{SELECTED_ATHLETES.length} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              ตัวจริง {SELECTED_ATHLETES.filter(a => a.squadType === "ตัวจริง").length} · สำรอง {SELECTED_ATHLETES.filter(a => a.squadType === "ตัวสำรอง").length}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">เจ้าหน้าที่ทีม/ผู้ฝึกสอนที่ขึ้นทะเบียนแล้ว</span>
            <span className="text-2xl font-bold text-emerald-800">{certifiedOfficials.length} ท่าน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              ออกรหัสใบอนุญาต กกมท.52 แล้ว
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">เจ้าหน้าที่ทีมที่รอกองกิจอนุมัติ</span>
            <span className="text-2xl font-bold text-amber-600">{pendingOfficials.length} ท่าน</span>
            <p className="text-[11px] text-slate-400 mt-1">
              รอตรวจสอบขั้นสุดท้ายก่อนออกประกาศ
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("athletes")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "athletes"
                  ? "bg-blue-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              1. บัญชีรายชื่อนักกีฬาตัวแทนสถาบัน ({SELECTED_ATHLETES.length} คน)
            </button>
            <button
              onClick={() => setActiveTab("officials")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "officials"
                  ? "bg-blue-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>2. บัญชีรายชื่อเจ้าหน้าที่ทีม/ผู้ฝึกสอน ({certifiedOfficials.length} ท่าน)</span>
              {certifiedOfficials.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700 text-white font-bold">
                  ✓ พร้อมประกาศ
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            พิมพ์ประกาศทางการ
          </button>
        </div>

        {/* TAB 1: Athletes List Table */}
        {activeTab === "athletes" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  บัญชีรายชื่อนักกีฬาตัวแทนที่พร้อมออกประกาศ
                </h2>
                <p className="text-xs text-slate-500">
                  ตรวจสอบความถูกต้องก่อนกดบันทึกผลขึ้นระบบและออกประกาศทางการ
                </p>
              </div>
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
          </div>
        )}

        {/* TAB 2: Officials List Table */}
        {activeTab === "officials" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  บัญชีรายชื่อเจ้าหน้าที่ทีมและผู้ฝึกสอนที่ผ่านการขึ้นทะเบียน (กกมท. ครั้งที่ 52)
                </h2>
                <p className="text-xs text-slate-500">
                  ผ่านการตรวจสอบเอกสารและออกรหัส License ID โดยกองกิจการนิสิตเรียบร้อยแล้ว
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">ตำแหน่ง</th>
                    <th className="py-3 px-4">ชมรมกีฬา</th>
                    <th className="py-3 px-4">หน่วยงานต้นสังกัด</th>
                    <th className="py-3 px-4 font-mono">รหัสบัตร กกมท.</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certifiedOfficials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        ยังไม่มีเจ้าหน้าที่ทีมที่ขึ้นทะเบียนสำเร็จ (ไปที่ระบบตรวจสอบเพื่ออนุมัติ)
                      </td>
                    </tr>
                  ) : (
                    certifiedOfficials.map((o, index) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{o.firstName} {o.lastName}</td>
                        <td className="py-3 px-4 font-medium text-blue-900">{POSITION_LABEL[o.appliedPosition]}</td>
                        <td className="py-3 px-4 text-slate-600">ชมรม{o.sportName}</td>
                        <td className="py-3 px-4 text-slate-600">{o.workplace}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-amber-700 bg-amber-50/60 px-2 py-0.5 rounded">
                          {o.officialLicenseId}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ขึ้นทะเบียนสำเร็จ ✓
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Panel for Official Publishing */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                ขั้นตอนสุดท้าย · Final Official Ratification
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              ลงนามอนุมัติ บันทึกผลขึ้นระบบ และออกประกาศทางการ
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed max-w-xl">
              ระบบจะบันทึกสถานะนักกีฬาและเจ้าหน้าที่ทีมเข้าสู่ฐานข้อมูลกลางของมหาวิทยาลัยพะเยา ออกประกาศผลอย่างเป็นทางการ และเปิดให้นักกีฬาเข้ารายงานตัวยืนยันสิทธิ์ทันที
            </p>
          </div>

          <button
            onClick={handleAnnounce}
            disabled={loading}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 disabled:bg-slate-500 text-slate-950 text-xs font-extrabold px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-md whitespace-nowrap ring-4 ring-amber-400/30 hover:scale-105 active:scale-95"
          >
            {loading ? "กำลังบันทึกและประกาศผล..." : "ลงนามอนุมัติ บันทึกผลเข้าระบบ และออกประกาศผลทางการ"}
          </button>
        </div>

      </div>
    </div>
  );
}
