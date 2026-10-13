"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Page, Notice, buttonClass, fieldClass } from "@/components/shared/Phase4UI";
import { errorMessage, requestJson } from "@/lib/phase4-client";

type LegacySport = {
  id: string;
  name: string;
  category: string;
  maxAthletes: number;
  isOpen: boolean;
  positions: string[];
  requirements: string | null;
};

export type CompetitionEditionCriteria = {
  year: string;
  name: string;
  hostUniversity?: string;
  region?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  minGpax: number;
  firstYearExempt: boolean;
  maxAge: number;
  maxBachelorParticipations: number;
  maxGraduateParticipations: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  enabledSportsQualifier: string[];
  enabledSportsMain: string[];
  enabledSports?: string[];
};

type EditionsConfig = {
  activeYear: string;
  editions: Record<string, CompetitionEditionCriteria>;
};

type SettingsResponse = {
  allSports?: string[];
  sports: LegacySport[];
  schedule: { region?: string; hostUniversity?: string; startDate?: string; endDate?: string; location?: string; note?: string };
  editionsConfig?: EditionsConfig;
};

const defaultCriteria: CompetitionEditionCriteria = {
  year: "2568",
  name: "กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 50",
  hostUniversity: "มหาวิทยาลัยพะเยา",
  region: "ภาคเหนือ",
  location: "สนามกีฬา มหาวิทยาลัยพะเยา",
  startDate: "",
  endDate: "",
  note: "",
  status: "ACTIVE",
  minGpax: 2.0,
  firstYearExempt: true,
  maxAge: 28,
  maxBachelorParticipations: 5,
  maxGraduateParticipations: 3,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  enabledSportsQualifier: [],
  enabledSportsMain: [],
};

const categoryLabels: Record<string, string> = {
  mandatory: "กีฬาบังคับ",
  international: "กีฬาเลือกสากล",
  general: "กีฬาเลือกทั่วไป",
  thai: "กีฬาไทย",
  demonstration: "กีฬาสาธิต",
};

export default function StaffSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [legacySports, setLegacySports] = useState<LegacySport[]>([]);
  const [legacySchedule, setLegacySchedule] = useState<SettingsResponse["schedule"]>({});
  const [showLegacy, setShowLegacy] = useState(false);

  const [systemSports, setSystemSports] = useState<string[]>([]);
  const [sportSearch, setSportSearch] = useState("");
  const [sportTab, setSportTab] = useState<"qualifier" | "main">("qualifier");

  const [editionsConfig, setEditionsConfig] = useState<EditionsConfig>({
    activeYear: "2568",
    editions: {
      "2568": { ...defaultCriteria },
    },
  });
  const [selectedYear, setSelectedYear] = useState<string>("2568");
  const [currentCriteria, setCurrentCriteria] = useState<CompetitionEditionCriteria>({ ...defaultCriteria });
  const [newYearInput, setNewYearInput] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    let active = true;

    requestJson<SettingsResponse>("/api/staff/settings")
      .then((data) => {
        if (!active) return;
        setLegacySports(data.sports || []);
        setSystemSports(data.allSports || []);
        setLegacySchedule(data.schedule || {});

        if (data.editionsConfig && data.editionsConfig.editions && Object.keys(data.editionsConfig.editions).length > 0) {
          setEditionsConfig(data.editionsConfig);
          const currentActive = data.editionsConfig.activeYear || Object.keys(data.editionsConfig.editions)[0];
          setSelectedYear(currentActive);
          const crit = data.editionsConfig.editions[currentActive] || { ...defaultCriteria, year: currentActive };
          if (crit.enabledSports && (!crit.enabledSportsQualifier || !crit.enabledSportsMain)) {
            crit.enabledSportsQualifier = [...crit.enabledSports];
            crit.enabledSportsMain = [...crit.enabledSports];
          }
          if (!crit.enabledSportsQualifier) crit.enabledSportsQualifier = [...(data.allSports || [])];
          if (!crit.enabledSportsMain) crit.enabledSportsMain = [...(data.allSports || [])];
          if (false) {
            crit.enabledSports = [...(data.allSports || [])];
          }
          setCurrentCriteria(crit);
        } else {
          const initialYear = "2568";
          const initialConfig: EditionsConfig = {
            activeYear: initialYear,
            editions: {
              [initialYear]: {
                ...defaultCriteria,
                hostUniversity: data.schedule?.hostUniversity || defaultCriteria.hostUniversity,
                region: data.schedule?.region || defaultCriteria.region,
                location: data.schedule?.location || defaultCriteria.location,
                startDate: data.schedule?.startDate || "",
                endDate: data.schedule?.endDate || "",
                note: data.schedule?.note || "",
              enabledSportsQualifier: [...(data.allSports || [])],
                enabledSportsMain: [...(data.allSports || [])],
              },
            },
          };
          setEditionsConfig(initialConfig);
          setSelectedYear(initialYear);
          setCurrentCriteria(initialConfig.editions[initialYear]);
        }
      })
      .catch((err) => {
        if (active) setMessage(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    setIsCreatingNew(false);
    setMessage("");
    setSuccessMessage("");
    if (editionsConfig.editions[year]) {
      const crit = { ...editionsConfig.editions[year] };
      if (crit.enabledSports && (!crit.enabledSportsQualifier || !crit.enabledSportsMain)) {
        crit.enabledSportsQualifier = [...crit.enabledSports];
        crit.enabledSportsMain = [...crit.enabledSports];
      }
      if (!crit.enabledSportsQualifier) crit.enabledSportsQualifier = [...systemSports];
      if (!crit.enabledSportsMain) crit.enabledSportsMain = [...systemSports];
      if (false) {
        crit.enabledSports = [...systemSports];
      }
      setCurrentCriteria(crit);
    }
  };

  const handleFieldChange = <K extends keyof CompetitionEditionCriteria>(field: K, value: CompetitionEditionCriteria[K]) => {
    setCurrentCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNewYear = () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) {
      setMessage("กรุณาระบุปีการแข่งขัน (พ.ศ.)");
      return;
    }
    if (editionsConfig.editions[trimmed]) {
      setMessage(`ปีการแข่งขัน ${trimmed} มีอยู่ในระบบแล้ว`);
      return;
    }

    const newEdition: CompetitionEditionCriteria = {
      ...defaultCriteria,
      year: trimmed,
      name: `กีฬามหาวิทยาลัยแห่งประเทศไทย (ปี ${trimmed})`,
      status: "DRAFT",
      enabledSportsQualifier: [...systemSports],
      enabledSportsMain: [...systemSports],
    };

    const updatedEditions = {
      ...editionsConfig.editions,
      [trimmed]: newEdition,
    };

    setEditionsConfig((prev) => ({
      ...prev,
      editions: updatedEditions,
    }));
    setSelectedYear(trimmed);
    setCurrentCriteria(newEdition);
    setNewYearInput("");
    setIsCreatingNew(false);
    setMessage("");
    setSuccessMessage(`เพิ่มปีการแข่งขัน ${trimmed} เรียบร้อย (อย่าลืมกดบันทึกการตั้งค่า)`);
  };

  const handleCloneYear = () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) {
      setMessage("กรุณาระบุปี พ.ศ. ใหม่ที่จะคัดลอกไป");
      return;
    }
    if (editionsConfig.editions[trimmed]) {
      setMessage(`ปีการแข่งขัน ${trimmed} มีอยู่ในระบบแล้ว`);
      return;
    }

    const cloned: CompetitionEditionCriteria = {
      ...currentCriteria,
      year: trimmed,
      name: `${currentCriteria.name} (คัดลอกจากปี ${currentCriteria.year})`,
      status: "DRAFT",
    };

    const updatedEditions = {
      ...editionsConfig.editions,
      [trimmed]: cloned,
    };

    setEditionsConfig((prev) => ({
      ...prev,
      editions: updatedEditions,
    }));
    setSelectedYear(trimmed);
    setCurrentCriteria(cloned);
    setNewYearInput("");
    setIsCreatingNew(false);
    setMessage("");
    setSuccessMessage(`คัดลอกเกณฑ์จากปี ${currentCriteria.year} ไปยังปี ${trimmed} แล้ว (อย่าลืมกดบันทึก)`);
  };

  const handleSetActiveYear = () => {
    setEditionsConfig((prev) => ({
      ...prev,
      activeYear: selectedYear,
    }));
    setSuccessMessage(`ตั้งให้ปี ${selectedYear} เป็นปีการแข่งขันหลักที่เปิดใช้งาน`);
  };



  const handleToggleSport = (sportName: string) => {
    setCurrentCriteria((prev) => {
      const key = sportTab === "qualifier" ? "enabledSportsQualifier" : "enabledSportsMain";
      const currentList = prev[key] || systemSports;
      const set = new Set(currentList);
      if (set.has(sportName)) set.delete(sportName);
      else set.add(sportName);
      return { ...prev, [key]: Array.from(set) };
    });
  };

  const handleEnableAllSports = (enable: boolean) => {
    setCurrentCriteria((prev) => {
      const key = sportTab === "qualifier" ? "enabledSportsQualifier" : "enabledSportsMain";
      return { ...prev, [key]: enable ? [...systemSports] : [] };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      const updatedEditions = {
        ...editionsConfig.editions,
        [selectedYear]: { ...currentCriteria },
      };

      const newConfig: EditionsConfig = {
        activeYear: editionsConfig.activeYear || selectedYear,
        editions: updatedEditions,
      };

      const response = await fetch("/api/staff/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateEditions",
          editionsConfig: newConfig,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setEditionsConfig(newConfig);
      setSuccessMessage("บันทึกการตั้งค่าเกณฑ์การแข่งขันเรียบร้อยแล้ว");
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  const filteredSports = useMemo(() => {
    if (!sportSearch.trim()) return systemSports;
    const term = sportSearch.trim().toLowerCase();
    return systemSports.filter((s) => s.toLowerCase().includes(term));
  }, [systemSports, sportSearch]);

  const activeSportsSet = useMemo(() => {
    const list = sportTab === "qualifier" ? currentCriteria.enabledSportsQualifier : currentCriteria.enabledSportsMain;
    return new Set(list || systemSports);
  }, [currentCriteria.enabledSportsQualifier, currentCriteria.enabledSportsMain, systemSports, sportTab]);

  const yearsList = Object.keys(editionsConfig.editions).sort((a, b) => b.localeCompare(a));

  return (
    <Page title="เกณฑ์และการตั้งค่าการแข่งขันประจำปี">
      <Notice text={message} />
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-900">
          {successMessage}
        </div>
      )}

      {/* Quick Navigation / Help Header */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ระบบตั้งค่าเกณฑ์การแข่งขันยืดหยุ่นตามปีการแข่งขัน</h2>
            <p className="mt-1 text-sm text-slate-600">
              กำหนดคุณสมบัตินักกีฬา (GPAX, อายุ, จำนวนครั้ง), กำหนดการ, และกติกาการคิดคะแนนแยกตามแต่ละปีการแข่งขันโดยไม่กระทบข้อมูลย้อนหลัง
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/staff/competitions"
              className="rounded-lg border border-blue-900/20 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100"
            >
              จัดการการแข่งขัน (กองกิจฯ)
            </Link>
            <Link
              href="/staff/sports-config"
              className="rounded-lg border border-violet-900/20 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100"
            >
              กำหนดประเภท/รุ่นแข่งขัน
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500" role="status">
          กำลังโหลดข้อมูลเกณฑ์การแข่งขัน…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Year / Edition Switcher Bar */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">เลือกปีการแข่งขัน:</span>
                {yearsList.map((yr) => {
                  const isSelected = yr === selectedYear;
                  const isActiveYear = yr === editionsConfig.activeYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectYear(yr)}
                      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        isSelected
                          ? "bg-blue-900 text-white shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>พ.ศ. {yr}</span>
                      {isActiveYear && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isSelected ? "bg-blue-700 text-blue-100" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          ใช้งานหลัก
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isCreatingNew ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + เพิ่มปีการแข่งขัน / คัดลอกเกณฑ์
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-2">
                    <input
                      type="text"
                      placeholder="ระบุปี เช่น 2569"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                      className="w-32 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewYear}
                      className="rounded bg-blue-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-800"
                    >
                      สร้างใหม่
                    </button>
                    <button
                      type="button"
                      onClick={handleCloneYear}
                      className="rounded bg-violet-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
                      title="คัดลอกค่าและเกณฑ์จากปีที่เปิดอยู่"
                    >
                      คัดลอกจากปี {selectedYear}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewYearInput("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Year indicator */}
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>ปีที่กำลังตั้งค่า: <strong className="text-slate-900">พ.ศ. {selectedYear}</strong></span>
                <span className="text-slate-300">|</span>
                <span>
                  สถานะการใช้งาน:{" "}
                  {editionsConfig.activeYear === selectedYear ? (
                    <strong className="text-emerald-700">ปีการแข่งขันหลักของระบบ</strong>
                  ) : (
                    <span className="text-slate-500">ไม่ใช่ปีหลัก</span>
                  )}
                </span>
              </div>
              {editionsConfig.activeYear !== selectedYear && (
                <button
                  type="button"
                  onClick={handleSetActiveYear}
                  className="font-medium text-blue-900 underline hover:text-blue-700"
                >
                  ตั้งเป็นปีการแข่งขันหลัก (Set as Active)
                </button>
              )}
            </div>
          </section>

          {/* Form Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Details & Rules */}
            <div className="space-y-6 lg:col-span-2">
              {/* Card 1: General Info */}
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">1. ข้อมูลการแข่งขันและเจ้าภาพ (ปี {selectedYear})</h3>
                  <p className="text-xs text-slate-500">ข้อมูลทั่วไปและสถานที่จัดการแข่งขันประจำรอบนี้</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">ชื่อการแข่งขัน</label>
                    <input
                      type="text"
                      value={currentCriteria.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">มหาวิทยาลัยเจ้าภาพ</label>
                    <input
                      type="text"
                      value={currentCriteria.hostUniversity || ""}
                      onChange={(e) => handleFieldChange("hostUniversity", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">เขต / ภาคการแข่งขัน</label>
                    <input
                      type="text"
                      value={currentCriteria.region || ""}
                      onChange={(e) => handleFieldChange("region", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">วันที่เริ่มต้นการแข่งขัน</label>
                    <input
                      type="date"
                      value={currentCriteria.startDate || ""}
                      onChange={(e) => handleFieldChange("startDate", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">วันที่สิ้นสุดการแข่งขัน</label>
                    <input
                      type="date"
                      value={currentCriteria.endDate || ""}
                      onChange={(e) => handleFieldChange("endDate", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">สถานที่จัดการแข่งขัน</label>
                    <input
                      type="text"
                      value={currentCriteria.location || ""}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">หมายเหตุ / คำชี้แจงประจำปี</label>
                    <textarea
                      rows={2}
                      value={currentCriteria.note || ""}
                      onChange={(e) => handleFieldChange("note", e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>


              {/* Card: Sports Inclusion */}
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">2. ชนิดกีฬาที่เปิดแข่งขันประจำปี (Sports Inclusion)</h3>
                    <p className="text-xs text-slate-500">
                      แยกตั้งค่าชนิดกีฬาอิสระระหว่างรอบคัดเลือกและรอบมหกรรมของปี {selectedYear} (เปิดอยู่ {activeSportsSet.size} จาก {systemSports.length} ชนิดกีฬา)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEnableAllSports(true)}
                      className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100"
                    >
                      เปิดทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnableAllSports(false)}
                      className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      ปิดทั้งหมด
                    </button>
                  </div>
                </div>


                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setSportTab("qualifier")}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                      sportTab === "qualifier"
                        ? "bg-blue-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    1. รอบคัดเลือก (Qualifier)
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {(currentCriteria.enabledSportsQualifier || systemSports).length} ชนิด
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSportTab("main")}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                      sportTab === "main"
                        ? "bg-violet-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    2. รอบมหกรรม (Main Tournament)
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {(currentCriteria.enabledSportsMain || systemSports).length} ชนิด
                    </span>
                  </button>
                </div>

                <div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder={sportTab === "qualifier" ? "ค้นหาชนิดกีฬาในรอบคัดเลือก..." : "ค้นหาชนิดกีฬาในรอบมหกรรม..."}
                      value={sportSearch}
                      onChange={(e) => setSportSearch(e.target.value)}
                      className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-800"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filteredSports.map((sport) => {
                      const isEnabled = activeSportsSet.has(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => handleToggleSport(sport)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            isEnabled
                              ? sportTab === "qualifier" ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm" : "border-violet-300 bg-violet-50 text-violet-900 shadow-sm"
                              : "border-slate-200 bg-slate-50/60 text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              isEnabled ? (sportTab === "qualifier" ? "bg-blue-600" : "bg-violet-600") : "bg-slate-300"
                            }`}
                          />
                          <span>{sport}</span>
                          <span className={`text-[10px] ${isEnabled ? (sportTab === "qualifier" ? "text-blue-700 font-semibold" : "text-violet-700 font-semibold") : "text-slate-400"}`}>
                            {isEnabled ? "(เปิด)" : "(ปิด)"}
                          </span>
                        </button>
                      );
                    })}
                    {filteredSports.length === 0 && (
                      <p className="text-xs text-slate-500">ไม่พบชนิดกีฬาที่ค้นหา</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Card 3: Qualification Criteria */}
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">3. เกณฑ์คุณสมบัตินักกีฬา (Eligibility Rules)</h3>
                  <p className="text-xs text-slate-500">เกณฑ์คัดกรองอัตโนมัติตามระเบียบการแข่งขันของปีนี้</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      เกรดเฉลี่ยสะสมขั้นต่ำ (GPAX)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={currentCriteria.minGpax}
                      onChange={(e) => handleFieldChange("minGpax", parseFloat(e.target.value) || 0)}
                      className={fieldClass}
                    />
                    <span className="text-[11px] text-slate-500">มาตรฐานคือ 2.00</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      เกณฑ์อายุสูงสุด (ปีบริบูรณ์)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="40"
                      value={currentCriteria.maxAge}
                      onChange={(e) => handleFieldChange("maxAge", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                    <span className="text-[11px] text-slate-500">มาตรฐานกีฬามหาวิทยาลัยคือ 28 ปี</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      โควตาเข้าร่วมสูงสุด - ระดับปริญญาตรี (ครั้ง)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentCriteria.maxBachelorParticipations}
                      onChange={(e) => handleFieldChange("maxBachelorParticipations", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                    <span className="text-[11px] text-slate-500">เกณฑ์ระเบียบคือไม่เกิน 5 ครั้ง</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      โควตาเข้าร่วมสูงสุด - ระดับบัณฑิตศึกษา (ครั้ง)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentCriteria.maxGraduateParticipations}
                      onChange={(e) => handleFieldChange("maxGraduateParticipations", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                    <span className="text-[11px] text-slate-500">รวม ป.โท และ ป.เอก ไม่เกิน 3 ครั้ง</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentCriteria.firstYearExempt}
                        onChange={(e) => handleFieldChange("firstYearExempt", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        ยกเว้นเกณฑ์ GPAX สำหรับนิสิตปี 1 ภาคเรียนที่ 1
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-slate-500 ml-6">
                      หากเปิดใช้งาน นิสิตชั้นปีที่ 1 ภาคการศึกษาแรกที่ยังไม่มีเกรดเฉลี่ยสะสมจะผ่านเกณฑ์คุณสมบัตินี้ได้
                    </p>
                  </div>
                </div>
              </section>

              {/* Card 3: Scoring Rules */}
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">4. ระบบคิดคะแนนและจัดอันดับ (Scoring Rules)</h3>
                  <p className="text-xs text-slate-500">คะแนนสำหรับรอบแบ่งกลุ่มและการจัดอันดับผลการแข่งขัน</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">ชนะ (คะแนน)</label>
                    <input
                      type="number"
                      value={currentCriteria.pointsWin}
                      onChange={(e) => handleFieldChange("pointsWin", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">เสมอ (คะแนน)</label>
                    <input
                      type="number"
                      value={currentCriteria.pointsDraw}
                      onChange={(e) => handleFieldChange("pointsDraw", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">แพ้ (คะแนน)</label>
                    <input
                      type="number"
                      value={currentCriteria.pointsLoss}
                      onChange={(e) => handleFieldChange("pointsLoss", parseInt(e.target.value, 10) || 0)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right 1 Col: Actions & Summary */}
            <div className="space-y-6">
              {/* Action Box */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
                <h3 className="font-bold text-blue-950">สถานะและบันทึกข้อมูล</h3>
                <p className="mt-1 text-xs text-blue-800">
                  การแก้ไขจะมีผลต่อรอบการแข่งขัน พ.ศ. {selectedYear}
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">สถานะปีการแข่งขัน</label>
                    <select
                      value={currentCriteria.status}
                      onChange={(e) => handleFieldChange("status", e.target.value as CompetitionEditionCriteria["status"])}
                      className={fieldClass}
                    >
                      <option value="DRAFT">ฉบับร่าง (DRAFT)</option>
                      <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                      <option value="ARCHIVED">ปิด/เก็บประวัติ (ARCHIVED)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full ${buttonClass} py-2.5 text-center`}
                  >
                    {saving ? "กำลังบันทึก…" : `บันทึกการตั้งค่าปี ${selectedYear}`}
                  </button>
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900">สรุปเกณฑ์ปี {selectedYear}</h4>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>ปีการแข่งขัน:</span>
                    <strong className="text-slate-900">พ.ศ. {currentCriteria.year}</strong>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>สถานะ:</span>
                    <span className="font-semibold text-blue-900">{currentCriteria.status}</span>
                  </li>

                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>กีฬาคัดเลือก (Qualifier):</span>
                    <strong className="text-blue-700">{(currentCriteria.enabledSportsQualifier || systemSports).length} / {systemSports.length} ชนิด</strong>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>กีฬามหกรรม (Main):</span>
                    <strong className="text-violet-700">{(currentCriteria.enabledSportsMain || systemSports).length} / {systemSports.length} ชนิด</strong>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>GPAX ขั้นต่ำ:</span>
                    <span className="font-medium text-slate-900">{currentCriteria.minGpax.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>อายุสูงสุด:</span>
                    <span className="font-medium text-slate-900">{currentCriteria.maxAge} ปี</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>แข่ง ป.ตรี ได้สูงสุด:</span>
                    <span className="font-medium text-slate-900">{currentCriteria.maxBachelorParticipations} ครั้ง</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>แข่ง บัณฑิตศึกษา ได้สูงสุด:</span>
                    <span className="font-medium text-slate-900">{currentCriteria.maxGraduateParticipations} ครั้ง</span>
                  </li>
                  <li className="flex justify-between">
                    <span>ระบบคะแนน (ช/ส/พ):</span>
                    <span className="font-medium text-slate-900">
                      {currentCriteria.pointsWin} / {currentCriteria.pointsDraw} / {currentCriteria.pointsLoss}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Toggle Legacy Schedule & Sports */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowLegacy(!showLegacy)}
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  <span>ข้อมูลกีฬาและกำหนดการเดิม (Legacy)</span>
                  <span>{showLegacy ? "ซ่อน ▲" : "แสดง ▼"}</span>
                </button>

                {showLegacy && (
                  <div className="mt-4 space-y-3 text-xs text-slate-600">
                    <p className="rounded bg-amber-50 p-2 text-amber-800">
                      ข้อมูลกีฬาเดิมในระบบ ({legacySports.length} ชนิดกีฬา) เก็บไว้เป็นข้อมูลอ้างอิงย้อนหลัง
                    </p>
                    {legacySchedule && (
                      <dl className="grid gap-1.5">
                        <div>
                          <dt className="text-slate-400">เจ้าภาพเดิม:</dt>
                          <dd className="font-medium">{legacySchedule.hostUniversity || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">สถานที่เดิม:</dt>
                          <dd className="font-medium">{legacySchedule.location || "-"}</dd>
                        </div>
                      </dl>
                    )}
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto border-t border-slate-100 pt-2">
                      {legacySports.map((s) => (
                        <li key={s.id} className="border-b border-slate-50 pb-1">
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <span className="ml-1 text-slate-400">({categoryLabels[s.category] || s.category})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
