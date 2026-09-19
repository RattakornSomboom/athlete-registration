"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

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
  squadType: "ตัวจริง" | "ตัวสำรอง";
  submissionDate: string;
  announcementDate: string;
  confirmationDeadline: string;
  status: ApplicationStatus;
  confirmation: ConfirmationStatus;
  declineReason?: string;
}

const MOCK_ATHLETE_DATA: AthleteApplicationInfo = {
  applicationNumber: "UP-ATH-2568-0042",
  fullName: "นายสมชาย ใจดี",
  studentId: "66027012",
  faculty: "คณะวิทยาศาสตร์",
  major: "สาขาวิทยาการคอมพิวเตอร์",
  sportName: "ฟุตบอล (ชาย)",
  clubName: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
  position: "กองหน้า (Forward)",
  squadType: "ตัวจริง",
  submissionDate: "15 กุมภาพันธ์ 2568",
  announcementDate: "28 กุมภาพันธ์ 2568",
  confirmationDeadline: "10 มีนาคม 2568",
  status: "approved",
  confirmation: "unconfirmed",
};

export default function AthleteStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<AthleteApplicationInfo>(MOCK_ATHLETE_DATA);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
    setActionSuccess("บันทึกการขอสละสิทธิ์ของท่านเรียบร้อยแล้ว ระบบจะส่งต่อข้อมูลให้ประธานชมรม");
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
              ระบบรับสมัครและรายงานตัวนักกีฬาตัวแทนสถาบัน
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              สถานะการสมัครและรายงานตัวนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
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

        {/* Step Progress Tracker */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            ขั้นตอนการคัดเลือกและยืนยันสิทธิ์
          </h2>
          <div className="grid grid-cols-4 gap-2 relative">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <p className="text-xs font-semibold text-slate-900">ยื่นใบสมัคร</p>
              <p className="text-[11px] text-slate-400 mt-0.5">สำเร็จแล้ว</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <p className="text-xs font-semibold text-slate-900">พิจารณาคัดเลือก</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ผ่านเกณฑ์ชมรม</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <p className="text-xs font-semibold text-slate-900">ประกาศผล</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">ผ่านการคัดเลือก</p>
            </div>

            <div className="text-center">
              <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                data.confirmation === "confirmed"
                  ? "bg-emerald-700 text-white"
                  : data.confirmation === "declined"
                  ? "bg-rose-700 text-white"
                  : "bg-blue-900 text-white"
              }`}>
                4
              </div>
              <p className="text-xs font-semibold text-slate-900">ยืนยันสิทธิ์</p>
              <p className={`text-[11px] mt-0.5 ${
                data.confirmation === "confirmed"
                  ? "text-emerald-700 font-medium"
                  : data.confirmation === "declined"
                  ? "text-rose-700 font-medium"
                  : "text-blue-900 font-medium"
              }`}>
                {data.confirmation === "confirmed"
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
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-800 text-white font-medium">
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
              <span className="text-sm font-semibold text-emerald-400">
                ผ่านการคัดเลือกเป็นตัวแทนสถาบัน
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
                <span className="text-slate-500 block">กำหนดการยืนยันสิทธิ์</span>
                <span className="font-semibold text-rose-700 text-sm mt-0.5 block">ภายใน {data.confirmationDeadline}</span>
                <span className="text-slate-500 mt-1 block">หากพ้นกำหนดจะถือว่าสละสิทธิ์</span>
              </div>
            </div>

            {/* Confirmation Decision Box */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                การรายงานตัวและยืนยันสิทธิ์เข้าร่วมการแข่งขัน
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
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
                      className="text-xs font-medium text-emerald-800 bg-white border border-emerald-300 px-3 py-1.5 rounded-md hover:bg-emerald-50"
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
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 rounded-md transition-colors"
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
