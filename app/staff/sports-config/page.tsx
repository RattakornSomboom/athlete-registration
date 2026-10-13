"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Page, Notice, buttonClass, fieldClass } from "@/components/shared/Phase4UI";
import { errorMessage, requestJson } from "@/lib/phase4-client";
import { isTeamSport } from "@/lib/sport-type";

type SportConfigItem = {
  categories: string[];
  divisions: string[];
  sportType?: "TEAM" | "INDIVIDUAL";
};

type ConfigResponse = {
  config: Record<string, SportConfigItem>;
  customOnly: Record<string, SportConfigItem>;
  defaultCategories: string[];
};

export default function StaffSportsConfigPage() {
  const [configs, setConfigs] = useState<Record<string, SportConfigItem>>({});
  const [customSports, setCustomSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSportName, setNewSportName] = useState("");

  // Edit state for selected sport
  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [currentDivisions, setCurrentDivisions] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [newDivInput, setNewDivInput] = useState("");
  const [currentSportType, setCurrentSportType] = useState<"TEAM" | "INDIVIDUAL">("INDIVIDUAL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectSport = (sport: string, configData?: Record<string, SportConfigItem>) => {
    const dataToUse = configData ?? configs;
    setSelectedSport(sport);
    setIsAddingNew(false);
    setNewSportName("");
    setSuccessMessage("");
    setMessage("");
    const item = dataToUse[sport] || { categories: [], divisions: [] };
    setCurrentCategories([...item.categories]);
    setCurrentDivisions([...item.divisions]);
    setCurrentSportType(item.sportType || (isTeamSport(sport) ? "TEAM" : "INDIVIDUAL"));
  };

  useEffect(() => {
    let active = true;
    requestJson<ConfigResponse>("/api/staff/sport-categories")
      .then((data) => {
        if (!active) return;
        const configMap = data.config || {};
        setConfigs(configMap);
        setCustomSports(Object.keys(data.customOnly || {}));
        const sportsList = Object.keys(configMap);
        if (sportsList.length > 0) {
          const first = sportsList[0];
          setSelectedSport(first);
          const item = configMap[first];
          if (item) {
            setCurrentCategories([...item.categories]);
            setCurrentDivisions([...item.divisions]);
            setCurrentSportType(item.sportType || (isTeamSport(first) ? "TEAM" : "INDIVIDUAL"));
          }
        }
      })
      .catch((err: unknown) => {
        if (active) setMessage(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reloadAll = async (targetSportToSelect?: string) => {
    try {
      setLoading(true);
      const data = await requestJson<ConfigResponse>("/api/staff/sport-categories");
      const configMap = data.config || {};
      setConfigs(configMap);
      setCustomSports(Object.keys(data.customOnly || {}));
      const toSelect = targetSportToSelect || selectedSport || Object.keys(configMap)[0] || "";
      if (toSelect) {
        selectSport(toSelect, configMap);
      }
    } catch (err: unknown) {
      setMessage(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const startAddNewSport = () => {
    setIsAddingNew(true);
    setSelectedSport("");
    setNewSportName("");
    setCurrentCategories(["บุคคลชาย", "บุคคลหญิง", "ทีมชาย", "ทีมหญิง"]);
    setCurrentDivisions(["ทั่วไป"]);
    setCurrentSportType("INDIVIDUAL");
    setSuccessMessage("");
    setMessage("");
  };

  const addCategory = () => {
    const val = newCatInput.trim();
    if (!val) return;
    if (currentCategories.includes(val)) {
      setMessage("ประเภทนี้มีอยู่ในรายการแล้ว");
      return;
    }
    setCurrentCategories((prev) => [...prev, val]);
    setNewCatInput("");
    setMessage("");
  };

  const removeCategory = (cat: string) => {
    setCurrentCategories((prev) => prev.filter((c) => c !== cat));
  };

  const addDivision = () => {
    const val = newDivInput.trim();
    if (!val) return;
    if (currentDivisions.includes(val)) {
      setMessage("รุ่นนี้มีอยู่ในรายการแล้ว");
      return;
    }
    setCurrentDivisions((prev) => [...prev, val]);
    setNewDivInput("");
    setMessage("");
  };

  const removeDivision = (div: string) => {
    setCurrentDivisions((prev) => prev.filter((d) => d !== div));
  };

  const handleSave = async () => {
    const targetSport = isAddingNew ? newSportName.trim() : selectedSport;
    if (!targetSport) {
      setMessage("กรุณาระบุชื่อชนิดกีฬา");
      return;
    }
    if (currentCategories.length === 0) {
      setMessage("กรุณาระบุอย่างน้อย 1 ประเภทการแข่งขัน");
      return;
    }
    if (currentDivisions.length === 0) {
      setMessage("กรุณาระบุอย่างน้อย 1 รุ่นการแข่งขัน (เช่น 'ทั่วไป')");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      const res = await fetch("/api/staff/sport-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: targetSport,
          categories: currentCategories,
          divisions: currentDivisions,
          sportType: currentSportType,
        }),
      });

      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }

      setSuccessMessage(data.message || "บันทึกเรียบร้อยแล้ว");
      await reloadAll(targetSport);
    } catch (err: unknown) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const allSports = Object.keys(configs);

  return (
    <Page title="จัดการประเภทและรุ่นการแข่งขัน (Categories & Divisions)">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          กำหนดประเภท (เช่น ชายเดี่ยว, ทีมหญิง) รุ่น (เช่น ทั่วไป, รุ่นน้ำหนัก) และลักษณะชนิดกีฬา (ทีม / บุคคล) สำหรับแต่ละชนิดกีฬา เพื่อให้นิสิตเลือกในขั้นตอนการสมัคร
        </p>
        <Link
          href="/staff/settings"
          className="text-xs font-semibold text-blue-900 hover:underline"
        >
          ← กลับหน้าตั้งค่า
        </Link>
      </div>

      <Notice text={message} />
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          ✓ {successMessage}
        </div>
      )}

      {loading ? (
        <p role="status" className="text-slate-500 text-sm">กำลังโหลดข้อมูลการตั้งค่ากีฬา...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sports List Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">ชนิดกีฬาในระบบ ({allSports.length})</h2>
              <button
                type="button"
                onClick={startAddNewSport}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs transition"
              >
                + เพิ่มชนิดกีฬาใหม่
              </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
              {allSports.map((sport) => {
                const item = configs[sport];
                const isCustom = customSports.includes(sport);
                const isSelected = selectedSport === sport && !isAddingNew;
                const typeLabel = (item?.sportType || (isTeamSport(sport) ? "TEAM" : "INDIVIDUAL")) === "TEAM" ? "ทีม" : "บุคคล";
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => selectSport(sport)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-900 text-white shadow-xs font-bold"
                        : "hover:bg-slate-100 text-slate-700 bg-slate-50/60"
                    }`}
                  >
                    <span>{sport}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isSelected
                          ? "bg-blue-800 text-blue-100"
                          : typeLabel === "ทีม" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {typeLabel}
                      </span>
                      {isCustom && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isSelected ? "bg-blue-800 text-blue-100" : "bg-amber-100 text-amber-800"
                        }`}>
                          กำหนดเอง
                        </span>
                      )}
                      <span className={`text-[11px] ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                        {item?.categories?.length || 0} ประเภท
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config Editor Panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                {isAddingNew ? "เพิ่มการตั้งค่ากีฬาใหม่" : "แก้ไขการตั้งค่าชนิดกีฬา"}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {isAddingNew ? (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อชนิดกีฬา <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      className={fieldClass}
                      placeholder="เช่น ปาเป้า, ชักเย่อ, หมากกระดาน"
                      value={newSportName}
                      onChange={(e) => setNewSportName(e.target.value)}
                    />
                  </div>
                ) : (
                  <span>กีฬา: <strong className="text-blue-950">{selectedSport}</strong></span>
                )}
              </h2>
            </div>

            {/* Sport Type Selector */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                ประเภทลักษณะของชนิดกีฬา <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="sportType"
                    value="INDIVIDUAL"
                    checked={currentSportType === "INDIVIDUAL"}
                    onChange={() => setCurrentSportType("INDIVIDUAL")}
                    className="text-blue-900"
                  />
                  <span>กีฬาประเภทบุคคล (INDIVIDUAL) - อนุญาตหลายประเภทย่อย</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="sportType"
                    value="TEAM"
                    checked={currentSportType === "TEAM"}
                    onChange={() => setCurrentSportType("TEAM")}
                    className="text-blue-900"
                  />
                  <span>กีฬาประเภททีม (TEAM) - จำกัด 1 รายการต่อใบสมัคร</span>
                </label>
              </div>
            </div>

            {/* Categories Editor */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. ประเภทการแข่งขัน (Categories) <span className="text-slate-400 font-normal">({currentCategories.length} รายการ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบุประเภท เช่น บุคคลชาย, บุคคลหญิง, ชายเดี่ยว, หญิงคู่, ทีมชาย
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="พิมพ์ประเภทใหม่ เช่น ชายเดี่ยว แล้วกดเพิ่ม"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shrink-0 border border-slate-300 transition"
                >
                  + เพิ่ม
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {currentCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 text-xs font-medium rounded-lg border border-blue-200"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="text-blue-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                      title="ลบประเภทนี้"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {currentCategories.length === 0 && (
                  <p className="text-xs text-rose-600 italic">ยังไม่มีประเภทการแข่งขัน</p>
                )}
              </div>
            </div>

            {/* Divisions Editor */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  2. รุ่นการแข่งขัน (Divisions) <span className="text-slate-400 font-normal">({currentDivisions.length} รายการ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบุรุ่น เช่น ทั่วไป, รุ่นน้ำหนักไม่เกิน 60 กก., ฟรีสไตล์ 50ม.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="พิมพ์รุ่นใหม่ เช่น ทั่วไป แล้วกดเพิ่ม"
                  value={newDivInput}
                  onChange={(e) => setNewDivInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDivision(); } }}
                />
                <button
                  type="button"
                  onClick={addDivision}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shrink-0 border border-slate-300 transition"
                >
                  + เพิ่ม
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {currentDivisions.map((div) => (
                  <span
                    key={div}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-900 text-xs font-medium rounded-lg border border-violet-200"
                  >
                    <span>{div}</span>
                    <button
                      type="button"
                      onClick={() => removeDivision(div)}
                      className="text-violet-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                      title="ลบรุ่นนี้"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {currentDivisions.length === 0 && (
                  <p className="text-xs text-rose-600 italic">ยังไม่มีรุ่นการแข่งขัน</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              {isAddingNew && (
                <button
                  type="button"
                  onClick={() => selectSport(allSports[0] || "")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={buttonClass}
              >
                {saving ? "กำลังบันทึก..." : "💾 บันทึกการตั้งค่า"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
