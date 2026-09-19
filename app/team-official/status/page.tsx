"use client";

import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

export default function TeamOfficialStatusPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · ทะเบียนบุคลากรกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              สถานะการขึ้นทะเบียนเจ้าหน้าที่ทีมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            ขั้นตอนการตรวจสอบและขึ้นทะเบียน
          </h2>
          <div className="grid grid-cols-3 gap-2 relative">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <p className="text-xs font-semibold text-slate-900">ยื่นแบบคำขอ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">เอกสารครบถ้วน</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <p className="text-xs font-semibold text-slate-900">พิจารณาคุณสมบัติ</p>
              <p className="text-[11px] text-blue-900 font-medium mt-0.5">อยู่ระหว่างการตรวจสอบ</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <p className="text-xs font-semibold text-slate-900">ออกบัตรประจำตัว</p>
              <p className="text-[11px] text-slate-400 mt-0.5">รอการรับรอง</p>
            </div>
          </div>
        </div>

        {/* Official Status Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center mx-auto text-sm font-bold">
            ...
          </div>
          <h2 className="text-base font-bold text-slate-900">
            อยู่ระหว่างการตรวจสอบคุณสมบัติและแผนการฝึกซ้อม
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            คณะกรรมการฝ่ายกีฬา กองกิจการนิสิต กำลังตรวจสอบเอกสารหลักฐาน ประวัติการอบรม
            และแผนงานการฝึกซ้อมของท่านตามข้อบังคับ กกมท. โปรดติดตามผลในระบบอีกครั้ง
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              กำหนดการแจ้งผลการรับรอง: ภายใน 5 วันทำการหลังปิดรับสมัคร
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
