"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
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

type RequestRow = {
  id: string;
  title: string;
  createdAt: string;
  reason?: string | null;
  documentUrl?: string | null;
  status?: string;
  rejectedReason?: string;
};

const STATUS_LABEL = {
  pending: { label: "รอการพิจารณา", className: "bg-slate-100 text-slate-700 border-slate-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function ClubRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let current = true;
    const loadRequests = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/clubs/requests");
        const data = (await response.json()) as { requests?: RequestRow[]; error?: string };
        if (!response.ok) throw new Error(data.error || "ไม่สามารถโหลดคำร้องได้");
        if (!Array.isArray(data.requests)) throw new Error("รูปแบบข้อมูลคำร้องไม่ถูกต้อง");
        if (!current) return;
        setRequests(data.requests.map((request) => ({
          id: request.id,
          title: request.title,
          date: new Date(request.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
          reason: request.reason || "",
          document: request.documentUrl || "",
          status: request.status === "APPROVED" ? "approved" : request.status === "REJECTED" ? "rejected" : "pending",
          rejectedReason: request.rejectedReason,
        })));
      } catch (error) {
        if (current) setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดคำร้องได้");
      } finally {
        if (current) setIsLoading(false);
      }
    };
    void loadRequests();
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" />
          <LogoutButton />
        </div>

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
          </div>
        </div>

        {/* Informational Guidance Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 shadow-xs leading-relaxed">
          <strong>แนวปฏิบัติการยื่นคำร้อง:</strong> สำหรับกรณีนักกีฬาที่มีคุณสมบัติไม่ครบถ้วนตามเกณฑ์ปกติ หรือมีความจำเป็นเร่งด่วนในการเปลี่ยนตัวนักกีฬา
          ชมรมจะต้องแนบหนังสือรับรองความเห็นชอบจากอาจารย์ที่ปรึกษาชมรมกีฬาเพื่อประกอบการพิจารณาของกองกิจการนิสิต
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {loadError && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {loadError}
            </div>
          )}
          {isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
              กำลังโหลดคำร้อง...
            </div>
          )}
          {!isLoading && !loadError && requests.length === 0 && (
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
                <span>เอกสารประกอบ: <strong className="text-blue-900">{r.document ? "เอกสารแนบ" : "ไม่มีเอกสาร"}</strong></span>
                {r.document && (
                  <a href={r.document} target="_blank" rel="noreferrer" className="text-blue-900 hover:underline font-medium">
                    เปิดดูเอกสารแนบ →
                  </a>
                )}
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