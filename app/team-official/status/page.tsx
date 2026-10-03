"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  getTeamOfficials,
  TeamOfficialApplication,
  POSITION_LABEL,
  OfficialStage,
} from "@/lib/team-official-store";

export default function TeamOfficialStatusPage() {
  const router = useRouter();
  const [officials, setOfficials] = useState<TeamOfficialApplication[]>([]);
  const [currentOfficialId, setCurrentOfficialId] = useState<string>("");

  useEffect(() => {
    const list = getTeamOfficials();
    setOfficials(list);

    // Read from URL query or localStorage or default to first item
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id");
      const savedId = localStorage.getItem("latest_official_id");
      if (qId && list.some((o) => o.id === qId || o.regCode === qId)) {
        setCurrentOfficialId(qId);
      } else if (savedId && list.some((o) => o.id === savedId)) {
        setCurrentOfficialId(savedId);
      } else if (list.length > 0) {
        setCurrentOfficialId(list[0].id);
      }
    }
  }, []);

  const currentOfficial = officials.find(
    (o) => o.id === currentOfficialId || o.regCode === currentOfficialId
  ) || officials[0];

  const getStepProgress = (stage: OfficialStage) => {
    // 4 Steps: 1: ยื่นแบบคำขอ, 2: ประธานชมรมรับรอง, 3: กองกิจการนิสิตตรวจ, 4: ขึ้นทะเบียนสำเร็จ
    switch (stage) {
      case "submitted_to_club":
        return { step: 1, label: "รอประธานชมรมกีฬาตรวจสอบเอกสารและแผนฝึกซ้อม" };
      case "club_approved":
        return { step: 2, label: "ประธานชมรมรับรองและเสนอชื่อแล้ว อยู่ระหว่างกองกิจการนิสิตตรวจสอบ" };
      case "club_returned":
        return { step: 1, label: "ประธานชมรมตีกลับเอกสาร กรุณาแก้ไขและนำส่งใหม่" };
      case "club_rejected":
        return { step: 1, label: "ชมรมกีฬาไม่อนุมัติคำขอ" };
      case "staff_returned":
        return { step: 2, label: "กองกิจการนิสิตตีกลับเอกสาร กรุณาประสานงานชมรมเพื่อส่งแก้ไข" };
      case "staff_approved":
        return { step: 4, label: "ขึ้นทะเบียนบุคลากรกีฬาสำเร็จ ออกรหัสบัตรประจำตัวเรียบร้อยแล้ว" };
      case "staff_rejected":
        return { step: 3, label: "กองกิจการนิสิตไม่อนุมัติการขึ้นทะเบียน" };
    }
  };

  const currentProgress = currentOfficial ? getStepProgress(currentOfficial.stage) : { step: 1, label: "" };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · ทะเบียนบุคลากรกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ติดตามสถานะการขึ้นทะเบียนเจ้าหน้าที่ทีมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/team-official/register")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + ยื่นคำขอใหม่
            </button>
          </div>
        </div>

        {/* Selector กรณีมีหลายรายการในระบบ */}
        {officials.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700">เลือกดูรายการคำขอของท่าน:</span>
            <select
              value={currentOfficial?.id || ""}
              onChange={(e) => setCurrentOfficialId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-800 font-medium outline-none cursor-pointer"
            >
              {officials.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.regCode} - {o.firstName} {o.lastName} ({POSITION_LABEL[o.appliedPosition]} ชมรม{o.sportName})
                </option>
              ))}
            </select>
          </div>
        )}

        {currentOfficial ? (
          <>
            {/* Step Progress Tracker (4 ขั้นตอน) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ขั้นตอนการตรวจสอบและขึ้นทะเบียนบุคลากร
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  เลขที่คำขอ: <strong>{currentOfficial.regCode}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative pt-2">
                {/* Step 1 */}
                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                    currentProgress.step >= 1 ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    1
                  </div>
                  <p className="text-xs font-semibold text-slate-900">ยื่นแบบคำขอ</p>
                  <p className="text-[10px] text-emerald-800 font-medium mt-0.5">เอกสารนำส่งเรียบร้อย</p>
                </div>

                {/* Step 2 */}
                <div className={`text-center p-3 rounded-lg border ${
                  currentProgress.step === 2
                    ? "bg-blue-50/60 border-blue-200"
                    : currentProgress.step > 2
                    ? "bg-slate-50 border-slate-100"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                    currentProgress.step > 2
                      ? "bg-emerald-800 text-white"
                      : currentProgress.step === 2
                      ? "bg-blue-900 text-white ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    2
                  </div>
                  <p className="text-xs font-semibold text-slate-900">ประธานชมรมรับรอง</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {currentOfficial.clubReviewedAt ? "รับรองและเสนอชื่อแล้ว" : "รอชมรมตรวจสอบ"}
                  </p>
                </div>

                {/* Step 3 */}
                <div className={`text-center p-3 rounded-lg border ${
                  currentProgress.step === 3
                    ? "bg-blue-50/60 border-blue-200"
                    : currentProgress.step > 3
                    ? "bg-slate-50 border-slate-100"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                    currentProgress.step > 3
                      ? "bg-emerald-800 text-white"
                      : currentProgress.step === 3
                      ? "bg-blue-900 text-white ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    3
                  </div>
                  <p className="text-xs font-semibold text-slate-900">กองกิจการนิสิตตรวจ</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {currentOfficial.staffReviewedAt ? "พิจารณาคุณสมบัติแล้ว" : "รอการรับรอง"}
                  </p>
                </div>

                {/* Step 4 */}
                <div className={`text-center p-3 rounded-lg border ${
                  currentProgress.step === 4
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                    currentProgress.step === 4 ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    4
                  </div>
                  <p className="text-xs font-semibold text-slate-900">ขึ้นทะเบียนสำเร็จ</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {currentOfficial.stage === "staff_approved" ? "ออกรหัสบัตร กกมท." : "รอผลการอนุมัติ"}
                  </p>
                </div>
              </div>
            </div>

            {/* สถานะหลัก (Main Status Banner) */}
            <div className={`rounded-xl border p-6 shadow-xs space-y-3 ${
              currentOfficial.stage === "staff_approved"
                ? "bg-emerald-50/60 border-emerald-200"
                : currentOfficial.stage === "staff_returned" || currentOfficial.stage === "club_returned"
                ? "bg-rose-50/70 border-rose-200"
                : "bg-white border-slate-200"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                  currentOfficial.stage === "staff_approved"
                    ? "bg-emerald-800 text-white"
                    : currentOfficial.stage === "staff_returned" || currentOfficial.stage === "club_returned"
                    ? "bg-rose-700 text-white"
                    : "bg-blue-900 text-white"
                }`}>
                  {currentOfficial.stage === "staff_approved" ? "✓" : currentOfficial.stage.includes("returned") ? "✕" : "..."}
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-900">
                    {currentOfficial.stage === "staff_approved"
                      ? "อนุมัติขึ้นทะเบียนเจ้าหน้าที่ทีมกีฬาเรียบร้อยแล้ว"
                      : currentOfficial.stage === "club_approved"
                      ? "ประธานชมรมลงนามเสนอชื่อแล้ว — อยู่ระหว่างกองกิจการนิสิตพิจารณา"
                      : currentOfficial.stage === "club_returned"
                      ? "ประธานชมรมแจ้งให้แก้ไขเอกสารหรือแผนการฝึกซ้อม"
                      : currentOfficial.stage === "staff_returned"
                      ? "กองกิจการนิสิตแจ้งตีกลับเพื่อให้แก้ไขข้อมูล"
                      : "อยู่ระหว่างการตรวจสอบโดยชมรมกีฬาต้นสังกัด"}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentProgress.label}
                  </p>

                  {/* Feedback จากผู้ตรวจ */}
                  {currentOfficial.staffFeedback && (
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">
                        ข้อความจากกองกิจการนิสิต ({currentOfficial.staffReviewedBy}):
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        &quot;{currentOfficial.staffFeedback}&quot;
                      </p>
                    </div>
                  )}

                  {currentOfficial.clubFeedback && !currentOfficial.staffFeedback && (
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">
                        ข้อความจากประธานชมรม ({currentOfficial.clubReviewedBy}):
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        &quot;{currentOfficial.clubFeedback}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* บัตรประจำตัวเจ้าหน้าที่ทีม กกมท. (Digital Official Accreditation Card) */}
            {currentOfficial.stage === "staff_approved" && currentOfficial.officialLicenseId && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-800 relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-200 block font-semibold">
                      บัตรประจำตัวเจ้าหน้าที่ทีมกีฬาอย่างเป็นทางการ · OFFICIAL ACCREDITATION CARD
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
                    </h3>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-blue-300 block">LICENSE ID</span>
                    <span className="text-xs font-bold text-amber-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-700">
                      {currentOfficial.officialLicenseId}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                  <div className="w-24 h-28 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center text-xs text-blue-200 shrink-0 text-center p-2">
                    รูปถ่ายเจ้าหน้าที่ทีม 1 นิ้ว
                  </div>

                  <div className="space-y-1.5 text-xs flex-1 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] text-blue-300 block">ชื่อ - นามสกุล / Name:</span>
                      <h4 className="text-base font-bold text-white">
                        {currentOfficial.firstName} {currentOfficial.lastName}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-blue-300 block">ตำแหน่งที่ขึ้นทะเบียน:</span>
                        <strong className="text-amber-300 font-semibold">{POSITION_LABEL[currentOfficial.appliedPosition]}</strong>
                      </div>
                      <div>
                        <span className="text-blue-300 block">ชนิดกีฬา / สังกัด:</span>
                        <strong className="text-white font-semibold">ชมรม{currentOfficial.sportName} ม.พะเยา</strong>
                      </div>
                      <div>
                        <span className="text-blue-300 block">หน่วยงานต้นสังกัด:</span>
                        <span className="text-blue-100">{currentOfficial.workplace}</span>
                      </div>
                      <div>
                        <span className="text-blue-300 block">สถานะการรับรอง:</span>
                        <span className="text-emerald-300 font-bold">รับรองสิทธิ์เข้าร่วมการแข่งขัน ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-300">
                  <span>ออกโดย: กองกิจการนิสิต มหาวิทยาลัยพะเยา</span>
                  <span className="font-mono">UP-KKMT52-CERTIFIED</span>
                </div>
              </div>
            )}

            {/* ตารางแสดงผลการตรวจเอกสารรายฉบับ (Document Verification Breakdown) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    ผลการตรวจสอบเอกสารและแผนการฝึกซ้อม (รายฉบับ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    แสดงสถานะการรับรองจากทั้งประธานชมรมกีฬาและกองกิจการนิสิต
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500 font-mono">
                  รวม {currentOfficial.documents.length} รายการ
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {currentOfficial.documents.map((doc) => {
                  return (
                    <div key={doc.id} className="p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-900 text-xs block">{doc.title}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ไฟล์: {doc.filename} · {doc.category}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-slate-400">ชมรม:</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            doc.clubStatus === "approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : doc.clubStatus === "returned"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}>
                            {doc.clubStatus === "approved" ? "ผ่าน ✓" : doc.clubStatus === "returned" ? "ให้แก้ไข ✕" : "รอตรวจ"}
                          </span>

                          <span className="text-[10px] text-slate-400 ml-1">กองกิจ:</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            doc.staffStatus === "approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : doc.staffStatus === "returned"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}>
                            {doc.staffStatus === "approved" ? "ผ่าน ✓" : doc.staffStatus === "returned" ? "ให้แก้ไข ✕" : "รอตรวจ"}
                          </span>
                        </div>
                      </div>

                      {/* แสดงข้อคิดเห็นถ้ามี */}
                      {(doc.clubComment || doc.staffComment) && (
                        <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1 text-rose-900">
                          {doc.clubComment && (
                            <div>
                              <strong className="text-[11px] text-rose-800">คำแนะนำจากชมรม:</strong> &quot;{doc.clubComment}&quot;
                            </div>
                          )}
                          {doc.staffComment && (
                            <div>
                              <strong className="text-[11px] text-rose-800">คำแนะนำจากกองกิจการนิสิต:</strong> &quot;{doc.staffComment}&quot;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ข้อมูลประวัติการสมัคร */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                ข้อมูลการขึ้นทะเบียนในระบบ
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                <div>ชื่อ - นามสกุล: <strong className="text-slate-900">{currentOfficial.firstName} {currentOfficial.lastName}</strong></div>
                <div>ตำแหน่งที่ขอ: <strong className="text-blue-900">{POSITION_LABEL[currentOfficial.appliedPosition]}</strong></div>
                <div>สังกัดชมรม: <strong className="text-slate-900">ชมรม{currentOfficial.sportName} ม.พะเยา</strong></div>
                <div>วันเวลาที่ยื่น: <span className="text-slate-600">{currentOfficial.submittedAt}</span></div>
                <div>เบอร์ติดต่อ: <span className="text-slate-600">{currentOfficial.phone}</span></div>
                <div>อีเมล: <span className="text-slate-600">{currentOfficial.email}</span></div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
            ยังไม่มีข้อมูลคำขอขึ้นทะเบียนในระบบ
          </div>
        )}

      </div>
    </div>
  );
}
