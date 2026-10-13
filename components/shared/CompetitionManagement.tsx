"use client";

import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/shared/BackButton";
import { formatThaiDate } from "@/lib/thai-date";
import { isTeamSport } from "@/lib/sport-type";


type SportComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
};

function SportCombobox({ value, onChange, options, required = false }: SportComboboxProps) {
  const [customMode, setCustomMode] = useState(false);
  const hasCustomValue = value.length > 0 && !options.includes(value);
  const showCustomInput = customMode || hasCustomValue;

  return (
    <div className="space-y-2">
      <select
        required={!showCustomInput && required}
        value={showCustomInput ? "__custom__" : value}
        onChange={(event) => {
          if (event.target.value === "__custom__") {
            setCustomMode(true);
            onChange("");
            return;
          }
          setCustomMode(false);
          onChange(event.target.value);
        }}
        aria-label="ชนิดกีฬา"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-1 focus:ring-blue-100"
      >
        <option value="" disabled>เลือกชนิดกีฬา...</option>
        {options.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
        <option value="__custom__">+ เพิ่มชนิดกีฬาใหม่</option>
      </select>
      {showCustomInput && (
        <input
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="พิมพ์ชื่อชนิดกีฬาใหม่"
          aria-label="ชื่อชนิดกีฬาใหม่"
          className="w-full rounded-lg border border-blue-300 bg-blue-50/40 px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-1 focus:ring-blue-100"
        />
      )}
    </div>
  );
}

type Quota = {
  sport: string;
  maxStarters: string;
  maxSubstitutes: string;
  maxEntriesPerAthlete: string;
  maxEntriesPerEvent: string;
  ageLimit: string;
};

type CompetitionModel = {
  id: string;
  name: string;
  round: string;
  year: number;
  status: "OPEN" | "CLOSED" | "COMPLETED" | string;
  deadline: string | null;
  createdAt?: string;
  quotas?: {
    sport: string;
    maxStarters: number;
    maxSubstitutes: number;
    maxEntriesPerAthlete?: number | null;
    maxEntriesPerEvent?: number | null;
    ageLimit: number | null;
  }[];
  _count?: {
    applications: number;
  };
};

function getRoundLabel(round: string | null | undefined): string {
  if (!round) return "ไม่ระบุ";
  const r = round.toLowerCase();
  if (r === "final" || r === "รอบมหกรรม") return "รอบมหกรรม";
  if (r === "qualifier" || r === "รอบคัดเลือก" || r.includes("คัดเลือก")) return "รอบคัดเลือกเขตภาคเหนือ";
  return round.startsWith("รอบ") ? round : `รอบ${round}`;
}

function formatThaiDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "ไม่ระบุ";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "ไม่ระบุ";
    const dateFormatted = formatThaiDate(d, { format: "medium" });
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateFormatted} เวลา ${hours}:${minutes} น.`;
  } catch {
    return "ไม่ระบุ";
  }
}

function toLocalDatetimeInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}


type ToastState = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
} | null;

export default function CompetitionManagement({ allowEdit = false }: { allowEdit?: boolean }) {
    const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);


  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [competitions, setCompetitions] = useState<CompetitionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    round: "qualifier",
    year: "2569",
    startDate: "",
    deadline: "",
    status: "CLOSED",
  });
  const [quotas, setQuotas] = useState<Quota[]>([]);

  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [sportTypeMap, setSportTypeMap] = useState<Record<string, "TEAM" | "INDIVIDUAL">>({});


  useEffect(() => {
    let ignore = false;
    fetch("/api/sports", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (!ignore && Array.isArray(data.sports)) setAvailableSports(data.sports); })
      .catch(() => undefined);
    fetch("/api/sport-categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!ignore && data?.config) {
          const map: Record<string, "TEAM" | "INDIVIDUAL"> = {};
          for (const [s, c] of Object.entries(data.config as Record<string, { sportType?: "TEAM" | "INDIVIDUAL" }>)) {
            if (c.sportType) map[s] = c.sportType;
          }
          setSportTypeMap(map);
        }
      })
      .catch(() => undefined);
    fetch("/api/competitions", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!ignore) {
          setCompetitions(data.competitions || []);
          setError("");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("โหลดรายการการแข่งขันไม่สำเร็จ");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const resetForm = () => {
    const nowLocal = toLocalDatetimeInput(new Date().toISOString());
    setForm({
      name: "",
      round: "qualifier",
      year: "2569",
      startDate: nowLocal,
      deadline: "",
      status: "CLOSED",
    });
    setQuotas([]);
    setEditingId(null);
    setFormError("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormError("");
    setShowForm(true);
  };

  const handleEdit = (c: CompetitionModel) => {
    setEditingId(c.id);
    setFormError("");
    let normalizedRound = c.round;
    if (c.round === "รอบคัดเลือก" || c.round?.includes("คัดเลือก")) normalizedRound = "qualifier";
    else if (c.round === "รอบมหกรรม" || c.round?.includes("มหกรรม")) normalizedRound = "final";

    setForm({
      name: c.name,
      round: normalizedRound,
      year: String(c.year),
      startDate: toLocalDatetimeInput(c.createdAt),
      deadline: toLocalDatetimeInput(c.deadline),
      status: c.status,
    });
    setQuotas(
      (c.quotas ?? []).map((q) => ({
        sport: q.sport,
        maxStarters: String(q.maxStarters),
        maxSubstitutes: String(q.maxSubstitutes),
        maxEntriesPerAthlete: q.maxEntriesPerAthlete !== null && q.maxEntriesPerAthlete !== undefined ? String(q.maxEntriesPerAthlete) : "",
        maxEntriesPerEvent: q.maxEntriesPerEvent !== null && q.maxEntriesPerEvent !== undefined ? String(q.maxEntriesPerEvent) : "",
        ageLimit: q.ageLimit === null ? "" : String(q.ageLimit),
      }))
    );
    setShowForm(true);
  };

  const addQuota = () => {
    setQuotas([...quotas, { sport: "", maxStarters: "1", maxSubstitutes: "0", maxEntriesPerAthlete: "", maxEntriesPerEvent: "", ageLimit: "" }]);
  };

  const removeQuota = (index: number) => {
    setQuotas(quotas.filter((_, i) => i !== index));
  };

  const updateQuota = (index: number, field: keyof Quota, value: string) => {
    const newQuotas = [...quotas];
    newQuotas[index] = { ...newQuotas[index], [field]: value };
    setQuotas(newQuotas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.year) {
      setFormError("กรุณาระบุชื่อการแข่งขันและปีการแข่งขัน");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (form.startDate && form.deadline && new Date(form.deadline) <= new Date(form.startDate)) {
      setFormError("วันและเวลาสิ้นสุดรับสมัครต้องอยู่หลังจากวันเริ่มรับสมัคร");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const validQuotas = quotas.filter((q) => q.sport.trim().length > 0);
    if (form.status === "OPEN" && validQuotas.length === 0) {
      setFormError("กรุณากำหนดโควตากีฬาอย่างน้อย 1 ชนิดก่อนเปิดรับสมัคร");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        round: form.round,
        year: parseInt(form.year, 10),
        status: form.status,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        quotas: validQuotas.map((q) => ({
          sport: q.sport.trim(),
          maxStarters: Math.max(0, parseInt(q.maxStarters, 10) || 0),
          maxSubstitutes: Math.max(0, parseInt(q.maxSubstitutes, 10) || 0),
          ageLimit: q.ageLimit ? Math.max(1, parseInt(q.ageLimit, 10) || 28) : null,
        })),
      };

      const res = await fetch(editingId ? `/api/competitions/${editingId}` : "/api/competitions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMessage = data.fieldErrors
          ? Object.values(data.fieldErrors).join("\n")
          : (data.error || "บันทึกไม่สำเร็จ");
        setFormError(errMessage);
        formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setToast({
        type: "success",
        title: "ดำเนินการสำเร็จ",
        message: editingId ? "บันทึกการแก้ไขโปรแกรมการแข่งขันสำเร็จ" : "บันทึกข้อมูลการแข่งขันสำเร็จ",
      });
      setShowForm(false);
      resetForm();
      setReloadKey((k) => k + 1);
    } catch {
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const totalStartersInForm = quotas.reduce((sum, q) => sum + (parseInt(q.maxStarters, 10) || 0), 0);
  const totalSubstitutesInForm = quotas.reduce((sum, q) => sum + (parseInt(q.maxSubstitutes, 10) || 0), 0);
  const grandTotalQuotaInForm = totalStartersInForm + totalSubstitutesInForm;

  return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md z-[100] transition-all duration-300">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-white/95 border-emerald-300 text-slate-800 shadow-emerald-950/10"
                : toast.type === "error"
                ? "bg-white/95 border-rose-300 text-slate-800 shadow-rose-950/10"
                : "bg-white/95 border-blue-300 text-slate-800 shadow-blue-950/10"
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                toast.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : toast.type === "error"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {toast.type === "success" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === "error" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h4
                className={`text-sm font-bold ${
                  toast.type === "success"
                    ? "text-emerald-800"
                    : toast.type === "error"
                    ? "text-rose-800"
                    : "text-blue-800"
                }`}
              >
                {toast.title || (toast.type === "success" ? "ดำเนินการสำเร็จ" : "เกิดข้อผิดพลาด")}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              aria-label="ปิดการแจ้งเตือน"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}


      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3">
                <BackButton href="/staff/applications" label="กลับหน้ารายการสมัคร" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
                กองกิจการนิสิต · มหาวิทยาลัยพะเยา
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950">
                โปรแกรมการแข่งขันประจำปี (Competition Control)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                บริหารจัดการข้อมูลการแข่งขัน กำหนดการรับสมัคร และโควตานักกีฬาแต่ละชนิดกีฬา
              </p>
            </div>

            {allowEdit && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                สร้างโปรแกรมการแข่งขัน
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }} className="font-semibold underline ml-2">ลองใหม่</button>
          </div>
        )}

        {/* Modal / Form Drawer */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden">
              {/* Modal Top Bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? "แก้ไขโปรแกรมการแข่งขัน" : "เพิ่มโปรแกรมการแข่งขันใหม่"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดช่วงเวลารับสมัคร และโควตาจำนวนนักกีฬาตัวจริงและตัวสำรอง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  aria-label="ปิดหน้าต่าง"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Form Content */}
              <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Form Error Banner */}
                {formError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
                    <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 whitespace-pre-line font-medium leading-relaxed">
                      {formError}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormError("")}
                      className="text-rose-400 hover:text-rose-700 p-0.5 rounded-md transition cursor-pointer"
                      aria-label="ปิดข้อความแจ้งเตือน"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {/* กลุ่มข้อมูลพื้นฐาน */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.12em] text-blue-900 border-b border-blue-50 pb-1.5">
                    ข้อมูลการแข่งขัน
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ชื่อการแข่งขัน <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="เช่น การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        รอบการแข่งขัน
                      </label>
                      <select
                        aria-label="รอบการแข่งขัน"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        value={form.round}
                        onChange={(e) => setForm({ ...form, round: e.target.value })}
                      >
                        <option value="qualifier">รอบคัดเลือกเขตภาคเหนือ</option>
                        <option value="final">รอบมหกรรม</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ประจำปี (พ.ศ.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        placeholder="2569"
                      />
                    </div>
                  </div>
                </div>

                {/* กลุ่มช่วงเวลารับสมัคร: แบ่ง 2 ช่อง วันเริ่ม และ วันสิ้นสุด */}
                <div className="space-y-4 text-xs">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.12em] text-blue-900 border-b border-blue-50 pb-1.5">
                    กำหนดการและสถานะการรับสมัคร
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs ">
                    {/* ช่องที่ 1: วันเริ่มการรับสมัคร */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        วันเริ่มการรับสมัคร
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          aria-label="วันเริ่มการรับสมัคร"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        วัน-เวลาที่เปิดระบบรับสมัครนิสิต
                      </p>
                    </div>

                    {/* ช่องที่ 2: วันสิ้นสุดรับสมัคร */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        วันสิ้นสุดรับสมัคร
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          aria-label="วันสิ้นสุดรับสมัคร"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          value={form.deadline}
                          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        วัน-เวลาที่ปิดรับสมัครและปิดแก้ไขข้อมูล
                      </p>
                    </div>

                    {/* สถานะการแข่งขัน */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        สถานะการแข่งขัน
                      </label>
                      <select
                        aria-label="สถานะการแข่งขัน"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-1xs text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="CLOSED">ปิดรับสมัคร (CLOSED)</option>
                        <option value="OPEN">เปิดรับสมัคร (OPEN)</option>
                        <option value="COMPLETED">เสร็จสิ้นการแข่งขัน (COMPLETED)</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ควบคุมการเปิด/ปิดรับสมัครในระบบ
                      </p>
                    </div>
                  </div>
                </div>

                {/* โควตาชนิดกีฬา (Sport Quotas) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                    <div>
                      <h3 className="text-xl font-semibold uppercase tracking-[0.12em] text-blue-900">
                        โควตาชนิดกีฬา 
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        พิมพ์ค้นหาหรือเลือกชนิดกีฬา กำหนดจำนวนตัวจริง ตัวสำรอง และคำนวณยอดรวมอัตโนมัติ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addQuota}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      เพิ่มชนิดกีฬา
                    </button>
                  </div>

                  {quotas.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <p className="text-sm text-slate-500">ยังไม่มีการกำหนดชนิดกีฬา</p>
                      <button
                        type="button"
                        onClick={addQuota}
                        className="mt-2 text-xs font-semibold text-blue-700 underline"
                      >
                        + คลิกเพื่อเพิ่มชนิดกีฬาแรก
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl bg-white shadow-xs">
                      {/* Table Header Labels */}
                      <div className="grid grid-cols-12 gap-2 bg-slate-100/80 rounded-t-xl px-3.5 py-2.5 text-1xs font-bold text-slate-700 border-b border-slate-200">
                        <div className="col-span-5 flex items-center gap-1">
                          <span>ชนิดกีฬา</span>
                          <span className="text-[10px] text-slate-400 font-normal">(พิมพ์ค้นหา/เพิ่มใหม่ได้)</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span>ตัวจริง / สูงสุดต่อคน</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span>สำรอง / ต่อรุ่นย่อย</span>
                        </div>
                        <div className="col-span-2 text-center text-blue-950">
                          <span>รวมโควตา / ลักษณะ</span>
                        </div>
                        <div className="col-span-1 text-center text-slate-400">
                          <span>ลบ</span>
                        </div>
                      </div>

                      {/* Quota Row Items */}
                      <div className="divide-y divide-slate-100">
                        {quotas.map((q, i) => {
                          const isTeam = isTeamSport(q.sport, sportTypeMap[q.sport]);
                          const startersNum = parseInt(q.maxStarters, 10) || 0;
                          const subsNum = parseInt(q.maxSubstitutes, 10) || 0;
                          const totalAthletes = startersNum + subsNum;

                          return (
                            <div
                              key={i}
                              className="grid grid-cols-12 gap-2 items-center px-3.5 py-2.5 hover:bg-slate-50/70 transition relative focus-within:z-30"
                            >
                              {/* ช่อง 1: ชนิดกีฬา (พิมพ์ได้ + datalist) */}
                              <div className="col-span-5">
                                <SportCombobox
                                  value={q.sport}
                                  onChange={(val) => updateQuota(i, "sport", val)}
                                  options={availableSports}
                                  required
                                />
                              </div>

                              {/* ช่อง 2: โควตาตัวจริง / สูงสุดต่อคน */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  aria-label={isTeam ? "ตัวจริง (คน)" : "โควตาสูงสุดต่อนักกีฬา (รายการ)"}
                                  placeholder={isTeam ? "เช่น 11" : "เช่น 2-4"}
                                  className="w-full text-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-700 focus:ring-1 focus:ring-blue-100"
                                  value={isTeam ? q.maxStarters : (q.maxEntriesPerAthlete || q.maxStarters)}
                                  onChange={(e) => {
                                    updateQuota(i, "maxStarters", e.target.value);
                                    if (!isTeam) updateQuota(i, "maxEntriesPerAthlete", e.target.value);
                                  }}
                                />
                                <p className="text-[10px] text-center text-slate-400 mt-0.5">
                                  {isTeam ? "ตัวจริง (คน)" : "สูงสุด/คน (รายการ)"}
                                </p>
                              </div>

                              {/* ช่อง 3: โควตาตัวสำรอง / ต่อรุ่นย่อย */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  aria-label={isTeam ? "ตัวสำรอง (คน)" : "โควตารวมต่อประเภทย่อย (คน)"}
                                  placeholder={isTeam ? "เช่น 7" : "เช่น 3-5"}
                                  className="w-full text-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-700 focus:ring-1 focus:ring-blue-100"
                                  value={isTeam ? q.maxSubstitutes : (q.maxEntriesPerEvent || q.maxSubstitutes)}
                                  onChange={(e) => {
                                    updateQuota(i, "maxSubstitutes", e.target.value);
                                    if (!isTeam) updateQuota(i, "maxEntriesPerEvent", e.target.value);
                                  }}
                                />
                                <p className="text-[10px] text-center text-slate-400 mt-0.5">
                                  {isTeam ? "ตัวสำรอง (คน)" : "โควตา/รุ่น (คน)"}
                                </p>
                              </div>

                              {/* ช่อง 4: รวมจำนวน หรือลักษณะกีฬา */}
                              <div className="col-span-2">
                                {isTeam ? (
                                  <div className="w-full text-center py-1.5 px-2 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 font-bold text-sm shadow-2xs">
                                    {totalAthletes} <span className="text-[11px] font-normal text-blue-700">คน (ทีม)</span>
                                  </div>
                                ) : (
                                  <div className="w-full text-center py-1.5 px-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs">
                                    กีฬาเดี่ยว
                                  </div>
                                )}
                              </div>

                              {/* ช่อง 5: ปุ่มลบรายการ */}
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeQuota(i)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="ลบชนิดกีฬานี้"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer สรุปภาพรวมโควตากีฬา */}
                      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 rounded-b-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-4">
                          <span>
                            จำนวนชนิดกีฬา: <strong className="text-slate-900 font-bold">{quotas.length}</strong> ชนิด
                          </span>
                          <span>
                            ตัวจริงรวม: <strong className="text-slate-900 font-bold">{totalStartersInForm}</strong> คน
                          </span>
                          <span>
                            ตัวสำรองรวม: <strong className="text-slate-900 font-bold">{totalSubstitutesInForm}</strong> คน
                          </span>
                        </div>
                        <div className="bg-blue-900 text-white font-semibold px-3 py-1 rounded-lg">
                          รวมโควตาทั้งหมด: {grandTotalQuotaInForm} คน
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ปุ่มควบคุม */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm transition"
                  >
                    {saving ? "กำลังบันทึกข้อมูล..." : editingId ? "บันทึกการแก้ไข" : "บันทึกโปรแกรมการแข่งขัน"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* รายการการแข่งขันที่บันทึกไว้ */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลการแข่งขัน...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">ยังไม่มีโปรแกรมการแข่งขันในระบบ</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              คลิกปุ่ม &quot;สร้างโปรแกรมการแข่งขัน&quot; ด้านบนเพื่อเริ่มต้นกำหนดโปรแกรมและโควตานักกีฬา
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {competitions.map((c) => {
              const totalStarters = (c.quotas ?? []).reduce((acc, q) => acc + q.maxStarters, 0);
              const totalSubs = (c.quotas ?? []).reduce((acc, q) => acc + q.maxSubstitutes, 0);
              const totalAllQuotas = totalStarters + totalSubs;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card: Status & Year */}
                    <div className="flex justify-between items-center mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          c.status === "OPEN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : c.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "OPEN"
                              ? "bg-emerald-500 animate-pulse"
                              : c.status === "COMPLETED"
                              ? "bg-blue-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {c.status === "OPEN"
                          ? "กำลังรับสมัคร (OPEN)"
                          : c.status === "COMPLETED"
                          ? "เสร็จสิ้น (COMPLETED)"
                          : "ปิดรับสมัคร (CLOSED)"}
                      </span>

                      <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                        ประจำปี พ.ศ. {c.year}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {c.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      รอบ: {getRoundLabel(c.round)}
                    </p>

                    {/* Schedule Box: 2 ช่องวันรับสมัคร (วันเริ่ม และ วันสิ้นสุด) */}
                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          วันเริ่มการรับสมัคร:
                        </span>
                        <strong className="text-slate-800 font-semibold">
                          {formatThaiDateTime(c.createdAt)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          วันสิ้นสุดรับสมัคร:
                        </span>
                        <strong className="text-slate-800 font-semibold">
                          {formatThaiDateTime(c.deadline)}
                        </strong>
                      </div>
                    </div>

                    {/* Sport Quotas Preview List */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          โควตารายชนิดกีฬา ({c.quotas?.length || 0} ชนิด)
                        </span>
                        <span className="text-xs font-semibold text-blue-900">
                          รวม {totalAllQuotas} คน
                        </span>
                      </div>

                      {c.quotas && c.quotas.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/50 rounded-lg border border-slate-100">
                          {c.quotas.map((q, idx) => {
                            const isTeam = isTeamSport(q.sport, sportTypeMap[q.sport]);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs"
                              >
                                <span className="font-semibold text-slate-900">{q.sport}</span>
                                <span className="text-slate-400">·</span>
                                {isTeam ? (
                                  <>
                                    <span className="text-blue-800 font-bold">
                                      {q.maxStarters + q.maxSubstitutes}
                                    </span>
                                    <span className="text-[10px] text-slate-500">คน (ทีม)</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-emerald-800 font-bold">
                                      {q.maxEntriesPerAthlete ?? q.maxStarters}/{q.maxEntriesPerEvent ?? q.maxSubstitutes}
                                    </span>
                                    <span className="text-[10px] text-slate-500">เดี่ยว</span>
                                  </>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">ยังไม่มีการระบุโควตากีฬา</p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Summary & Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        ผู้สมัครแล้ว: <strong className="text-slate-900 font-bold">{c._count?.applications || 0}</strong> คน
                      </span>
                    </div>

                    {allowEdit && (
                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        แก้ไข / จัดการโควตา
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
