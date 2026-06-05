"use client";

import { useState } from "react";

type Sport = {
  id: string;
  name: string;
  maxAthletes: number;
  isOpen: boolean;
  positions: string[];
  requirements: string;
};

const INITIAL_SPORTS: Sport[] = [
  { id: "1", name: "ฟุตบอล", maxAthletes: 22, isOpen: true, positions: ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"], requirements: "ต้องผ่านการคัดเลือกจากชมรม" },
  { id: "2", name: "บาสเกตบอล", maxAthletes: 12, isOpen: true, positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"], requirements: "ประสบการณ์อย่างน้อย 1 ปี" },
  { id: "3", name: "วอลเลย์บอล", maxAthletes: 12, isOpen: false, positions: ["ตัวรับ", "ตัวต้าน", "ตัวเซต", "ตัวรุก"], requirements: "" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function StaffSettingsPage() {
  const [sports, setSports] = useState<Sport[]>(INITIAL_SPORTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newSport, setNewSport] = useState<Omit<Sport, "id">>({
    name: "",
    maxAthletes: 10,
    isOpen: true,
    positions: [],
    requirements: "",
  });

  const [positionInput, setPositionInput] = useState("");
  const [editPositionInput, setEditPositionInput] = useState("");

  // Toggle เปิด/ปิดรับสมัคร
  const toggleOpen = (id: string) =>
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, isOpen: !s.isOpen } : s));

  // ลบกีฬา
  const deleteSport = (id: string) =>
    setSports((prev) => prev.filter((s) => s.id !== id));

  // เพิ่มกีฬาใหม่
  const handleAddSport = () => {
    if (!newSport.name) return;
    setSports((prev) => [...prev, { ...newSport, id: generateId() }]);
    setNewSport({ name: "", maxAthletes: 10, isOpen: true, positions: [], requirements: "" });
    setPositionInput("");
    setShowAddForm(false);
  };

  // แก้ไขกีฬา
  const handleEdit = (id: string, field: keyof Sport, value: unknown) =>
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  // เพิ่มตำแหน่งใน new sport
  const addPosition = () => {
    if (!positionInput.trim()) return;
    setNewSport((prev) => ({ ...prev, positions: [...prev.positions, positionInput.trim()] }));
    setPositionInput("");
  };

  // เพิ่มตำแหน่งใน edit sport
  const addEditPosition = (id: string) => {
    if (!editPositionInput.trim()) return;
    handleEdit(id, "positions", [...(sports.find((s) => s.id === id)?.positions || []), editPositionInput.trim()]);
    setEditPositionInput("");
  };

  const handleSave = async () => {
    // TODO: ส่งข้อมูลไป API จริง
    console.log("save sports", sports);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ตั้งค่าการรับสมัคร</h1>
            <p className="text-gray-500 text-sm mt-1">จัดการชนิดกีฬาและเงื่อนไขการสมัคร</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + เพิ่มกีฬา
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saved ? "บันทึกแล้ว ✓" : "บันทึก"}
            </button>
          </div>
        </div>

        {/* Add Sport Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-4">เพิ่มชนิดกีฬาใหม่</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อกีฬา</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น กรีฑา"
                    value={newSport.name}
                    onChange={(e) => setNewSport((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">จำนวนรับสูงสุด</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSport.maxAthletes}
                    onChange={(e) => setNewSport((p) => ({ ...p, maxAthletes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ตำแหน่ง / ประเภท</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น กองหน้า"
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPosition()}
                  />
                  <button onClick={addPosition} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">เพิ่ม</button>
                </div>
                {newSport.positions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSport.positions.map((p, i) => (
                      <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {p}
                        <button onClick={() => setNewSport((prev) => ({ ...prev, positions: prev.positions.filter((_, idx) => idx !== i) }))} className="text-blue-400 hover:text-blue-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เงื่อนไขการสมัคร</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="เงื่อนไขหรือข้อกำหนดพิเศษ"
                  value={newSport.requirements}
                  onChange={(e) => setNewSport((p) => ({ ...p, requirements: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">ยกเลิก</button>
                <button onClick={handleAddSport} disabled={!newSport.name} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 rounded-lg transition-colors">เพิ่มกีฬา</button>
              </div>
            </div>
          </div>
        )}

        {/* Sport Cards */}
        <div className="space-y-3">
          {sports.map((sport) => (
            <div key={sport.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-medium text-gray-900">{sport.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sport.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {sport.isOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleOpen(sport.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sport.isOpen ? "border border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-green-600 hover:bg-green-700 text-white"}`}
                  >
                    {sport.isOpen ? "ปิดรับ" : "เปิดรับ"}
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === sport.id ? null : sport.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors"
                  >
                    {editingId === sport.id ? "ปิด" : "แก้ไข"}
                  </button>
                  <button
                    onClick={() => deleteSport(sport.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>

              {/* Info */}
              {editingId !== sport.id && (
                <div className="text-sm text-gray-500 space-y-1">
                  <p>จำนวนรับสูงสุด: <span className="text-gray-900 font-medium">{sport.maxAthletes} คน</span></p>
                  {sport.positions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sport.positions.map((p, i) => (
                        <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p}</span>
                      ))}
                    </div>
                  )}
                  {sport.requirements && <p className="text-xs text-gray-400 mt-1">เงื่อนไข: {sport.requirements}</p>}
                </div>
              )}

              {/* Edit Form */}
              {editingId === sport.id && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อกีฬา</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={sport.name}
                        onChange={(e) => handleEdit(sport.id, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">จำนวนรับสูงสุด</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={sport.maxAthletes}
                        onChange={(e) => handleEdit(sport.id, "maxAthletes", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ตำแหน่ง / ประเภท</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เพิ่มตำแหน่ง"
                        value={editPositionInput}
                        onChange={(e) => setEditPositionInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addEditPosition(sport.id)}
                      />
                      <button onClick={() => addEditPosition(sport.id)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">เพิ่ม</button>
                    </div>
                    {sport.positions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sport.positions.map((p, i) => (
                          <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {p}
                            <button onClick={() => handleEdit(sport.id, "positions", sport.positions.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-blue-700">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เงื่อนไขการสมัคร</label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      value={sport.requirements}
                      onChange={(e) => handleEdit(sport.id, "requirements", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}