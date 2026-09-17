"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type SpecialRequest = {
  id: string;
  title: string;
  reason: string;
  date: string;
  document: string;
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;
};

const MOCK_REQUESTS: SpecialRequest[] = [
  {
    id: "1",
    title: "ขอผ่อนผันเกณฑ์ผลงานการแข่งขันระดับชาติ",
    reason: "นักกีฬามีผลงานเกิน 2 ปีย้อนหลังเล็กน้อย แต่ผ่านการทดสอบสมรรถภาพทางกายภาพในเกณฑ์ดีเยี่ยมและเพิ่งฟื้นตัวจากอาการบาดเจ็บ",
    date: "15 พ.ค. 2568",
    document: "หนังสือขออนุมัติกรณีพิเศษ_001.pdf",
    status: "pending",
  },
];

const STATUS_LABEL = {
  pending: { label: "รอการพิจารณา", className: "bg-slate-100 text-slate-700 border-slate-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function ClubRequestsPage() {
  const router = useRouter();
  const [requests] = useState<SpecialRequest[]>(MOCK_REQUESTS);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การยื่นและติดตามคำร้องขออนุมัติกรณีพิเศษ
            </h1>
            <p className="text-xs text-slate-500">
              ยื่นคำร้องผ่านอาจารย์ที่ปรึกษาชมรมเพื่อเสนอต่อคณะกรรมการกองกิจการนิสิต
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/requests/new")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + ยื่นคำร้องขออนุมัติใหม่
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

        {/* Informational Guidance Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 shadow-xs leading-relaxed">
          <strong>แนวปฏิบัติการยื่นคำร้อง:</strong> สำหรับกรณีนักกีฬาที่มีคุณสมบัติไม่ครบถ้วนตามเกณฑ์ปกติ หรือมีความจำเป็นเร่งด่วนในการเปลี่ยนตัวนักกีฬา
          ชมรมจะต้องแนบหนังสือรับรองความเห็นชอบจากอาจารย์ที่ปรึกษาชมรมกีฬาเพื่อประกอบการพิจารณาของกองกิจการนิสิต
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              ยังไม่มีประวัติการยื่นคำร้องกรณีพิเศษ
            </div>
          )}

          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{r.title}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_LABEL[r.status].className}`}>
                      {STATUS_LABEL[r.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{r.reason}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">ยื่นเมื่อ: {r.date}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>เอกสารประกอบ: <strong className="text-blue-900">{r.document}</strong></span>
                <button
                  onClick={() => alert(`เปิดดูเอกสาร ${r.document}`)}
                  className="text-blue-900 hover:underline font-medium cursor-pointer"
                >
                  เปิดดูเอกสารแนบ →
                </button>
              </div>

              {r.status === "rejected" && r.rejectedReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <strong>เหตุผลที่ไม่อนุมัติ:</strong> {r.rejectedReason}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
