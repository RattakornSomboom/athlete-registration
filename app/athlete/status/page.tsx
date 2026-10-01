"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { getAthleteProfile } from "@/lib/athlete-profile";

type ApplicationStatus = "pending" | "approved" | "rejected";
type ConfirmationStatus = "unconfirmed" | "confirmed" | "declined";

interface AthleteApplicationInfo {
  applicationNumber: string;
  fullName: string;
  studentId: string;
  faculty: string;
  major: string;
  sportName: string;
  clubName: string;
  position: string;
  squadType: "ตัวจริง" | "ตัวสำรอง" | "รอการจัดสรร";
  submissionDate: string;
  announcementDate: string;
  confirmationDeadline: string;
  status: ApplicationStatus;
  confirmation: ConfirmationStatus;
  declineReason?: string;
}

// ข้อมูลเริ่มต้นหลังส่งใบสมัคร: อยู่ในสถานะ pending (ขั้นตอนที่ 1 เสร็จสิ้น / รอพิจารณาคัดเลือก)
const INITIAL_ATHLETE_DATA: AthleteApplicationInfo = {
  applicationNumber: "SMED-APP-2569-0042",
  fullName: "นายสมชาย ใจดี",
  studentId: "66027012",
  faculty: "คณะวิทยาศาสตร์",
  major: "สาขาวิทยาการคอมพิวเตอร์",
  sportName: "ฟุตบอล (ชาย)",
  clubName: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
  position: "กองหน้า (Forward)",
  squadType: "รอการจัดสรร",
  submissionDate: "29 กันยายน 2569",
  announcementDate: "15 ตุลาคม 2569",
  confirmationDeadline: "25 ตุลาคม 2569",
  status: "pending",
  confirmation: "unconfirmed",
};

export default function AthleteStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<AthleteApplicationInfo>(INITIAL_ATHLETE_DATA);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ดึงข้อมูลจริงจาก Profile และ LocalStorage หากมี
  useEffect(() => {
    if (typeof window === "undefined") return;

    const profile = getAthleteProfile();
    const storedStatus = localStorage.getItem("athlete_application_status") as ApplicationStatus | null;
    const storedDate = localStorage.getItem("athlete_application_submitted_at");
    const storedSport = localStorage.getItem("athlete_registered_sport");

    setData((prev) => ({
      ...prev,
      fullName: profile ? `${profile.firstName} ${profile.lastName}` : prev.fullName,
      studentId: profile ? profile.studentId : prev.studentId,
      faculty: profile ? profile.faculty : prev.faculty,
      major: profile ? profile.major : prev.major,
      sportName: storedSport || prev.sportName,
      submissionDate: storedDate || prev.submissionDate,
      status: storedStatus || "pending",
      squadType: (storedStatus === "approved") ? "ตัวจริง" : "รอการจัดสรร",
    }));
  }, []);

  const handleConfirm = () => {
    setData((prev) => ({ ...prev, confirmation: "confirmed" }));
    setActionSuccess("ท่านได้ยืนยันสิทธิ์เป็นตัวแทนนักกีฬามหาวิทยาลัยพะเยาเรียบร้อยแล้ว");
  };

  const handleDecline = () => {
    if (!declineReason.trim()) return;
    setData((prev) => ({
      ...prev,
      confirmation: "declined",
      declineReason: declineReason.trim(),
    }));
    setShowDeclineModal(false);
    setActionSuccess("บันทึกการขอสละสิทธิ์ของท่านเรียบร้อยแล้ว ระบบจะส่งต่อข้อมูลให้ชมรมกีฬาเพื่อเลื่อนลำดับตัวสำรอง");
  };

  // จำลองสลับสถานะสำหรับการนำเสนอและบันทึกภาพหน้าจอ
  const simulateState = (st: ApplicationStatus, conf: ConfirmationStatus = "unconfirmed", squad: "ตัวจริง" | "ตัวสำรอง" | "รอการจัดสรร" = "รอการจัดสรร") => {
    setData((prev) => ({
      ...prev,
      status: st,
      confirmation: conf,
      squadType: squad,
    }));
    setActionSuccess(null);
  };

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
              SMED · ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              สถานะการสมัครและรายงานตัวนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย (กกมท.)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/athlete/register")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แก้ไข / ยื่นใบสมัครใหม่
            </button>
          </div>
        </div>

        {/* Demo Simulator Bar (สำหรับพรีเซนต์และแคปภาพหน้าจอในเล่ม) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-900" />
            <span className="text-xs font-semibold text-slate-700">จำลองสถานะการทดสอบระบบ:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => simulateState("pending", "unconfirmed", "รอการจัดสรร")}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer font-medium ${
                data.status === "pending"
                  ? "bg-blue-900 text-white border-blue-900 font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              1. รอพิจารณา (ค่าเริ่มต้น)
            </button>
            <button
              type="button"
              onClick={() => simulateState("approved", "unconfirmed", "ตัวจริง")}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer font-medium ${
                data.status === "approved" && data.confirmation === "unconfirmed"
                  ? "bg-blue-900 text-white border-blue-900 font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              2. ผ่านคัดเลือก (รอตอบรับ)
            </button>
            <button
              type="button"
              onClick={() => simulateState("approved", "confirmed", "ตัวจริง")}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer font-medium ${
                data.status === "approved" && data.confirmation === "confirmed"
                  ? "bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              3. ยืนยันสิทธิ์แล้ว
            </button>
            <button
              type="button"
              onClick={() => simulateState("approved", "declined", "ตัวจริง")}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer font-medium ${
                data.confirmation === "declined"
                  ? "bg-rose-700 text-white border-rose-700 font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              4. สละสิทธิ์
            </button>
          </div>
        </div>

        {/* Action Alert Message */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="font-bold text-emerald-900 hover:underline">
              ปิด
            </button>
          </div>
        )}

        {/* Step Progress Tracker — 4 ขั้นตอน */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ขั้นตอนการคัดเลือกและยืนยันสิทธิ์
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
              {data.status === "pending"
                ? "ขั้นตอนปัจจุบัน: ขั้นตอนที่ 1 เสร็จสิ้น (กำลังพิจารณาคัดเลือก)"
                : data.status === "approved"
                ? "ขั้นตอนปัจจุบัน: ขั้นตอนที่ 4 (รายงานตัวยืนยันสิทธิ์)"
                : "เสร็จสิ้นกระบวนการ"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 relative">
            {/* Step 1: ยื่นใบสมัคร */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2 shadow-xs">
                ✓
              </div>
              <p className="text-xs font-bold text-slate-900">1. ยื่นใบสมัคร</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">สำเร็จแล้ว</p>
              <p className="text-[10px] text-slate-400">({data.submissionDate})</p>
            </div>

            {/* Step 2: พิจารณาคัดเลือก */}
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 transition-all ${
                data.status === "pending"
                  ? "bg-blue-900 text-white ring-4 ring-blue-100"
                  : data.status === "approved"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-rose-700 text-white"
              }`}>
                {data.status === "approved" ? "✓" : "2"}
              </div>
              <p className="text-xs font-bold text-slate-900">2. พิจารณาคัดเลือก</p>
              <p className={`text-[11px] mt-0.5 ${
                data.status === "pending"
                  ? "text-blue-900 font-bold"
                  : data.status === "approved"
                  ? "text-emerald-700 font-medium"
                  : "text-rose-700 font-medium"
              }`}>
                {data.status === "pending" ? "กำลังดำเนินการ" : data.status === "approved" ? "ผ่านเกณฑ์ชมรม" : "ไม่ผ่านเกณฑ์"}
              </p>
            </div>

            {/* Step 3: ประกาศผล */}
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 transition-all ${
                data.status === "approved"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-200 text-slate-500"
              }`}>
                {data.status === "approved" ? "✓" : "3"}
              </div>
              <p className="text-xs font-bold text-slate-900">3. ประกาศผล</p>
              <p className={`text-[11px] mt-0.5 ${
                data.status === "approved" ? "text-emerald-700 font-medium" : "text-slate-400"
              }`}>
                {data.status === "approved" ? "ผ่านการคัดเลือก" : "รอประกาศผล"}
              </p>
            </div>

            {/* Step 4: ยืนยันสิทธิ์ */}
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 transition-all ${
                data.status !== "approved"
                  ? "bg-slate-200 text-slate-500"
                  : data.confirmation === "confirmed"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : data.confirmation === "declined"
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-amber-500 text-white ring-4 ring-amber-100"
              }`}>
                {data.confirmation === "confirmed" ? "✓" : data.confirmation === "declined" ? "✕" : "4"}
              </div>
              <p className="text-xs font-bold text-slate-900">4. ยืนยันสิทธิ์</p>
              <p className={`text-[11px] mt-0.5 ${
                data.status !== "approved"
                  ? "text-slate-400"
                  : data.confirmation === "confirmed"
                  ? "text-emerald-700 font-medium"
                  : data.confirmation === "declined"
                  ? "text-rose-700 font-medium"
                  : "text-amber-700 font-bold"
              }`}>
                {data.status !== "approved"
                  ? "ยังไม่ถึงกำหนด"
                  : data.confirmation === "confirmed"
                  ? "ยืนยันสิทธิ์แล้ว"
                  : data.confirmation === "declined"
                  ? "สละสิทธิ์"
                  : "รอการยืนยันสิทธิ์"}
              </p>
            </div>
          </div>
        </div>

        {/* Application Details Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest text-slate-300">
                  {data.applicationNumber}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  data.status === "approved"
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-700 text-slate-200"
                }`}>
                  {data.squadType}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{data.fullName}</h2>
              <p className="text-xs text-slate-300">
                รหัสนิสิต {data.studentId} · {data.faculty}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">สถานะผลการพิจารณา</span>
              <span className={`text-sm font-semibold ${
                data.status === "approved"
                  ? "text-emerald-400"
                  : data.status === "pending"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}>
                {data.status === "approved"
                  ? "ผ่านการคัดเลือกเป็นตัวแทนสถาบัน"
                  : data.status === "pending"
                  ? "อยู่ระหว่างการพิจารณาคัดเลือก"
                  : "ไม่ผ่านการคัดเลือก"}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-500 block">ชนิดกีฬา / รายการ</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{data.sportName}</span>
                <span className="text-slate-500 mt-1 block">ตำแหน่ง: {data.position}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-500 block">ชมรมสังกัด</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{data.clubName}</span>
                <span className="text-slate-500 mt-1 block">สังกัดกองกิจการนิสิต มพ.</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-500 block">กำหนดการประกาศผล</span>
                <span className="font-semibold text-blue-900 text-sm mt-0.5 block">
                  {data.announcementDate}
                </span>
                <span className="text-slate-500 mt-1 block">
                  {data.status === "approved" ? `ยืนยันสิทธิ์ภายใน ${data.confirmationDeadline}` : "ติดตามประกาศผลทางการในระบบ"}
                </span>
              </div>
            </div>

            {/* Decision / Status Box */}
            <div className="border-t border-slate-200 pt-6">

              {/* กรณีสถานะ: pending (ขั้นตอนที่ 1 เสร็จสิ้น / รอการพิจารณาคัดเลือก) */}
              {data.status === "pending" && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-amber-900">
                      สถานะปัจจุบัน: ใบสมัครอยู่ระหว่างการพิจารณาคัดเลือก (ขั้นตอนที่ 1 เสร็จสิ้น)
                    </h3>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ระบบได้รับข้อมูลใบสมัคร เอกสารรับรองคุณสมบัติ และผลการทดสอบสมรรถภาพทางกายของท่านเรียบร้อยแล้ว
                    ขณะนี้อยู่ระหว่างการตรวจสอบคุณสมบัติตามระเบียบ กกมท. และการพิจารณาทดสอบทักษะกีฬาโดยชมรมกีฬาต้นสังกัด
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>กำหนดการประกาศรายชื่อผู้ผ่านการคัดเลือกอย่างเป็นทางการ: {data.announcementDate}</span>
                    <span className="font-semibold text-blue-900">เมื่อประกาศผลแล้ว ระบบจะเปิดขั้นตอนที่ 4 ให้ยืนยันสิทธิ์ต่อไป</span>
                  </div>
                </div>
              )}

              {/* กรณีสถานะ: approved (ขั้นตอนที่ 4 รายงานตัวยืนยันสิทธิ์) */}
              {data.status === "approved" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    การรายงานตัวและยืนยันสิทธิ์เข้าร่วมการแข่งขัน
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ตามระเบียบคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย (กกมท.) ให้นักศึกษาที่มีรายชื่อผ่านการคัดเลือก
                    รายงานตัวและยืนยันสิทธิ์เพื่อดำเนินการขึ้นทะเบียนนักกีฬาเข้าร่วมการแข่งขันต่อไป
                  </p>

                  {data.confirmation === "unconfirmed" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">โปรดเลือกการตอบรับสิทธิ์ของท่าน</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          กรุณาดำเนินการยืนยันก่อนวันที่ {data.confirmationDeadline} เวลา 16:30 น.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setShowDeclineModal(true)}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          ขอสละสิทธิ์
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="w-full sm:w-auto px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          ยืนยันสิทธิ์เป็นตัวแทน
                        </button>
                      </div>
                    </div>
                  )}

                  {data.confirmation === "confirmed" && (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-900 block">
                            สถานะ: ยืนยันสิทธิ์เข้าร่วมการแข่งขันแล้ว
                          </span>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            เอกสารของท่านได้รับการบันทึกเข้าสู่ระบบฐานข้อมูลนักกีฬาตัวแทนสถาบันเรียบร้อยแล้ว
                          </p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="text-xs font-medium text-emerald-800 bg-white border border-emerald-300 px-3 py-1.5 rounded-md hover:bg-emerald-50 cursor-pointer"
                        >
                          พิมพ์เอกสารยืนยันสิทธิ์
                        </button>
                      </div>
                      <div className="text-[11px] text-emerald-700 pt-2 border-t border-emerald-200">
                        ขั้นตอนต่อไป: กรุณาติดต่อประธานชมรมหรือผู้ฝึกสอนเพื่อเข้าร่วมการฝึกซ้อมและตรวจร่างกายตามกำหนดการ
                      </div>
                    </div>
                  )}

                  {data.confirmation === "declined" && (
                    <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-rose-900 block">
                        สถานะ: สละสิทธิ์การเป็นตัวแทน
                      </span>
                      <p className="text-rose-800">
                        เหตุผลการสละสิทธิ์: {data.declineReason || "ไม่ได้ระบุเหตุผล"}
                      </p>
                      <p className="text-rose-700 text-[11px] pt-2 border-t border-rose-200">
                        ระบบได้ส่งข้อมูลให้ทางชมรมเพื่อเลื่อนลำดับนักกีฬาตัวสำรองขึ้นมาทำหน้าที่แทนแล้ว
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal: กรอกเหตุผลการสละสิทธิ์ */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  แบบฟอร์มขอสละสิทธิ์การเป็นตัวแทนนักกีฬา
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  การสละสิทธิ์จะมีผลทันทีและไม่สามารถเรียกคืนสิทธิ์ได้
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระบุเหตุผลความจำเป็นในการขอสละสิทธิ์ <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น มีอาการบาดเจ็บ, ติดภารกิจการเรียนหรือการสอบ ฯลฯ"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  ยืนยันการสละสิทธิ์
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
