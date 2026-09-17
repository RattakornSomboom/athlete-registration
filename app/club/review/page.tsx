"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

interface CandidateAthlete {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  sport: string;
  position: string;
  experience: string;
  achievement: string;
  gpa: number;
  squadType: "main" | "reserve" | "unassigned";
}

const INITIAL_CANDIDATES: CandidateAthlete[] = [
  { id: "1", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ", gpa: 3.42, squadType: "main" },
  { id: "2", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "คณะวิทยาศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", experience: "3 ปี", achievement: "ตัวแทนเขตภาคเหนือ", gpa: 3.50, squadType: "main" },
  { id: "3", firstName: "กิตติศักดิ์", lastName: "มั่นคง", studentId: "66028114", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองกลาง", experience: "4 ปี", achievement: "รองชนะเลิศฟุตบอลถ้วย ก", gpa: 3.12, squadType: "main" },
  { id: "4", firstName: "ณัฐพล", lastName: "ศรีกุล", studentId: "65039201", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sport: "ฟุตบอล", position: "กองหลัง", experience: "2 ปี", achievement: "แชมป์เยาวชนระดับจังหวัด", gpa: 2.85, squadType: "reserve" },
  { id: "5", firstName: "ธนกฤต", lastName: "วงศ์สว่าง", studentId: "67015520", faculty: "คณะวิศวกรรมศาสตร์", sport: "ฟุตบอล", position: "กองหน้า", experience: "2 ปี", achievement: "-", gpa: 2.95, squadType: "reserve" },
  { id: "6", firstName: "ชานนท์", lastName: "เรืองศิลป์", studentId: "68019931", faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ", sport: "ฟุตบอล", position: "กองกลาง", experience: "1 ปี", achievement: "-", gpa: 3.20, squadType: "unassigned" },
];

const SPORT_QUOTA = {
  sportName: "ฟุตบอล (ชาย)",
  clubName: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
  maxMainQuota: 22,
  maxReserveQuota: 6,
};

export default function ClubReviewPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateAthlete[]>(INITIAL_CANDIDATES);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certifyChecked, setCertifyChecked] = useState(false);

  const mainSquadCount = candidates.filter((c) => c.squadType === "main").length;
  const reserveSquadCount = candidates.filter((c) => c.squadType === "reserve").length;

  const handleSquadChange = (id: string, newType: "main" | "reserve" | "unassigned") => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, squadType: newType } : c))
    );
  };

  const handleSubmit = async () => {
    if (!certifyChecked) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            ส่งบัญชีรายชื่อนักกีฬาตัวแทนเรียบร้อยแล้ว
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบได้บันทึกและส่งข้อมูลบัญชีรายชื่อนักกีฬาตัวจริง {mainSquadCount} คน และตัวสำรอง {reserveSquadCount} คน
            ไปยังกองกิจการนิสิตเพื่อตรวจสอบคุณสมบัติตามระเบียบ กกมท. เรียบร้อยแล้ว
          </p>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => router.push("/club/athletes")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              กลับสู่หน้ารายชื่อนักกีฬาของชมรม
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การจัดทำบัญชีรายชื่อนักกีฬาเพื่อส่งกองกิจการนิสิต
            </h1>
            <p className="text-xs text-slate-500">
              {SPORT_QUOTA.clubName} — {SPORT_QUOTA.sportName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors"
            >
              ย้อนกลับ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Quota & Status Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวจริง (Main Squad)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">{mainSquadCount}</span>
              <span className="text-xs text-slate-400">/ โควตาสูงสุด {SPORT_QUOTA.maxMainQuota} คน</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-900 h-full rounded-full"
                style={{ width: `${Math.min((mainSquadCount / SPORT_QUOTA.maxMainQuota) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-800">{reserveSquadCount}</span>
              <span className="text-xs text-slate-400">/ โควตาสูงสุด {SPORT_QUOTA.maxReserveQuota} คน</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full"
                style={{ width: `${Math.min((reserveSquadCount / SPORT_QUOTA.maxReserveQuota) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ยอดรวมที่เสนอชื่อ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{mainSquadCount + reserveSquadCount}</span>
              <span className="text-xs text-slate-400">คน จากผู้สมัคร {candidates.length} คน</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              สถานะ: {mainSquadCount > 0 ? "พร้อมนำส่งตรวจสอบ" : "กรุณาจัดนักกีฬาตัวจริง"}
            </p>
          </div>
        </div>

        {/* Candidate Table & Squad Selection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              รายชื่อนักกีฬาที่ผ่านการคัดเลือกเบื้องต้นจากชมรม
            </h2>
            <span className="text-xs text-slate-500">
              เลือกสถานะ (ตัวจริง / สำรอง / ตัดตัว) ตามผลการคัดเลือก
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล / รหัสนิสิต</th>
                  <th className="py-3 px-4">คณะต้นสังกัด</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">เกรดเฉลี่ย</th>
                  <th className="py-3 px-4">ผลงาน / ประสบการณ์</th>
                  <th className="py-3 px-4 text-center">ประเภทที่ส่งรายชื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400">รหัสนิสิต {c.studentId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.faculty}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.position}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-semibold ${c.gpa < 2.0 ? "text-rose-600" : "text-slate-800"}`}>
                        {c.gpa.toFixed(2)}
                      </span>
                      {c.gpa < 2.0 && (
                        <span className="block text-[10px] text-rose-600">เสี่ยงไม่ผ่านเกณฑ์ กกมท.</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{c.achievement !== "-" ? c.achievement : "ไม่มีข้อมูลผลงาน"}</div>
                      <span className="text-[11px] text-slate-400">ประสบการณ์: {c.experience}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={c.squadType}
                        onChange={(e) =>
                          handleSquadChange(c.id, e.target.value as "main" | "reserve" | "unassigned")
                        }
                        className={`text-xs font-medium rounded-md px-2.5 py-1.5 border outline-none cursor-pointer ${
                          c.squadType === "main"
                            ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                            : c.squadType === "reserve"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                            : "bg-slate-100 border-slate-300 text-slate-600"
                        }`}
                      >
                        <option value="main">นักกีฬาตัวจริง</option>
                        <option value="reserve">นักกีฬาตัวสำรอง</option>
                        <option value="unassigned">ไม่ส่งรายชื่อ</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submission and Official Certification Box */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="certify"
                checked={certifyChecked}
                onChange={(e) => setCertifyChecked(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
              />
              <label htmlFor="certify" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                ข้าพเจ้าในฐานะประธานชมรม/ผู้รับผิดชอบ ขอรับรองว่านักกีฬาที่มีรายชื่อข้างต้น
                ผ่านการคัดเลือกและทดสอบสมรรถภาพตามเกณฑ์ของชมรมเรียบร้อยแล้ว
                และมีคุณสมบัติตามข้อบังคับของคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย (กกมท.)
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                นักกีฬาที่เสนอชื่อ: ตัวจริง {mainSquadCount} คน · ตัวสำรอง {reserveSquadCount} คน
              </span>
              <button
                onClick={handleSubmit}
                disabled={!certifyChecked || isSubmitting || (mainSquadCount === 0 && reserveSquadCount === 0)}
                className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? "กำลังนำส่งข้อมูล..." : "ลงนามส่งบัญชีรายชื่อให้กองกิจการนิสิต"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
