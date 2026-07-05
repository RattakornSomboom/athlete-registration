"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type ClubAccount = {
  id: string;
  clubName: string;
  sport: string;
  presidentName: string;
  email: string;
  status: "active" | "pending" | "inactive";
  createdAt: string;
};

const MOCK_CLUBS: ClubAccount[] = [
  { id: "1", clubName: "ชมรมฟุตบอล", sport: "ฟุตบอล", presidentName: "นายสมชาย ใจดี", email: "somchai@up.ac.th", status: "active", createdAt: "1 ม.ค. 2568" },
  { id: "2", clubName: "ชมรมบาสเกตบอล", sport: "บาสเกตบอล", presidentName: "นางสาวสมหญิง รักดี", email: "somying@up.ac.th", status: "pending", createdAt: "15 ม.ค. 2568" },
  { id: "3", clubName: "ชมรมวอลเลย์บอล", sport: "วอลเลย์บอล", presidentName: "-", email: "-", status: "inactive", createdAt: "-" },
];

const STATUS_LABEL = {
  active: { label: "เปิดใช้งาน", className: "bg-green-100 text-green-700" },
  pending: { label: "รอการอนุมัติ", className: "bg-yellow-100 text-yellow-800" },
  inactive: { label: "ยังไม่มีประธาน", className: "bg-gray-100 text-gray-500" },
};

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubAccount[]>(MOCK_CLUBS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [newPresidentForm, setNewPresidentForm] = useState({ presidentName: "", email: "" });

  const handleApprove = (id: string) => {
    setClubs((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" } : c));
  };

  const handleSetPresident = () => {
    if (!selectedClubId || !newPresidentForm.presidentName || !newPresidentForm.email) return;
    setClubs((prev) => prev.map((c) =>
      c.id === selectedClubId
        ? { ...c, presidentName: newPresidentForm.presidentName, email: newPresidentForm.email, status: "pending", createdAt: "วันนี้" }
        : c
    ));
    setShowAddModal(false);
    setSelectedClubId(null);
    setNewPresidentForm({ presidentName: "", email: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการ Account ประธานชมรม</h1>
            <p className="text-gray-500 text-sm mt-1">Admin — กำหนดสิทธิ์ประธานชมรมแต่ละกีฬา</p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
          📋 เมื่อชมรมจัดตั้งใหม่ ให้ Admin กำหนด Account และสิทธิ์ประธานชมรมในหน้านี้ ประธานชมรมจะสามารถ Login เข้าระบบได้หลังจาก Admin อนุมัติแล้วเท่านั้น
        </div>

        <div className="space-y-3">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-gray-900">{club.clubName}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[club.status].className}`}>
                      {STATUS_LABEL[club.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">กีฬา: {club.sport}</p>
                  {club.presidentName !== "-" && (
                    <div className="mt-1 text-sm text-gray-500">
                      <p>ประธาน: {club.presidentName}</p>
                      <p>Email: {club.email}</p>
                      {club.createdAt !== "-" && <p>กำหนดเมื่อ: {club.createdAt}</p>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {club.status === "pending" && (
                    <button onClick={() => handleApprove(club.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">อนุมัติ</button>
                  )}
                  <button
                    onClick={() => { setSelectedClubId(club.id); setShowAddModal(true); }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {club.status === "inactive" ? "กำหนดประธาน" : "เปลี่ยนประธาน"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal กำหนด/เปลี่ยนประธาน */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">กำหนดประธานชมรม</h2>
            <p className="text-gray-500 text-sm mb-4">
              {clubs.find((c) => c.id === selectedClubId)?.clubName}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล ประธานชมรม</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPresidentForm.presidentName}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, presidentName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email มหาวิทยาลัย</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="xxxxxxxx@up.ac.th"
                  value={newPresidentForm.email}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <p className="text-xs text-gray-400">หลังจากบันทึก ระบบจะส่ง status เป็น "รอการอนุมัติ" ให้ Admin ยืนยันอีกครั้งก่อนที่ประธานชมรมจะ login ได้</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setSelectedClubId(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
              <button onClick={handleSetPresident} disabled={!newPresidentForm.presidentName || !newPresidentForm.email} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}