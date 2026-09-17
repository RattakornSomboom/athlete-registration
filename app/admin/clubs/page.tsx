"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Advisor = {
  name: string;
  phone: string;
};

type ClubAccount = {
  id: string;
  clubName: string;
  sport: string;
  presidentName: string;
  presidentPhone: string;
  email: string;
  advisors: Advisor[];
  status: "active" | "pending" | "inactive";
  createdAt: string;
};

const STATUS_LABEL = {
  active: { label: "เปิดใช้งาน", className: "bg-green-100 text-green-700" },
  pending: { label: "รอการอนุมัติ", className: "bg-yellow-100 text-yellow-800" },
  inactive: { label: "ยังไม่มีประธาน", className: "bg-gray-100 text-gray-500" },
};

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [newPresidentForm, setNewPresidentForm] = useState({ presidentName: "", presidentPhone: "", email: "" });
  const [showAddNewClubModal, setShowAddNewClubModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newClubForm, setNewClubForm] = useState({
    clubName: "",
    sport: "",
    presidentName: "",
    presidentPhone: "",
    username: "",
    password: ""
  });

  const fetchClubs = () => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        if (data.clubs?.length > 0) {
          setClubs(data.clubs.map((c: any) => ({
            id: c.id,
            clubName: c.name,
            sport: c.sport,
            presidentName: c.presidentName || "-",
            presidentPhone: c.presidentPhone || "-",
            email: c.email,
            advisors: c.advisors ? (typeof c.advisors === 'string' ? JSON.parse(c.advisors) : c.advisors) : [],
            status: c.status?.toLowerCase() || (c.isActive ? "active" : "inactive"),
            createdAt: new Date(c.createdAt).toLocaleDateString("th-TH")
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const pendingCount = clubs.filter((c) => c.status === "pending").length;

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/clubs/${id}/approve`, { method: "PUT" });
      if (res.ok) {
        setClubs((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" as const } : c));
      } else {
        alert("อนุมัติไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPresident = async () => {
    if (!selectedClubId || !newPresidentForm.presidentName || !newPresidentForm.email) return;
    try {
      const res = await fetch(`/api/admin/clubs/${selectedClubId}/president`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPresidentForm)
      });
      if (res.ok) {
        setClubs((prev) => prev.map((c) =>
          c.id === selectedClubId
            ? { ...c, presidentName: newPresidentForm.presidentName, presidentPhone: newPresidentForm.presidentPhone, email: newPresidentForm.email, status: "pending" as const, createdAt: "วันนี้" }
            : c
        ));
        setShowAddModal(false);
        setSelectedClubId(null);
        setNewPresidentForm({ presidentName: "", presidentPhone: "", email: "" });
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewClub = async () => {
    if (!newClubForm.clubName || !newClubForm.sport || !newClubForm.username || !newClubForm.password) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClubForm.clubName,
          sport: newClubForm.sport,
          email: newClubForm.username,
          password: newClubForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "สร้างชมรมไม่สำเร็จ"); return; }

      const newClub: ClubAccount = {
        id: data.club.id,
        clubName: data.club.name,
        sport: data.club.sport,
        presidentName: newClubForm.presidentName || "-",
        presidentPhone: newClubForm.presidentPhone || "-",
        email: data.club.email,
        advisors: [],
        status: "active",
        createdAt: "วันนี้",
      };
      setClubs((prev) => [...prev, newClub]);
      setShowAddNewClubModal(false);
      setNewClubForm({ clubName: "", sport: "", presidentName: "", presidentPhone: "", username: "", password: "" });
      alert(`สร้างชมรม "${newClub.clubName}" สำเร็จ! ประธานชมรม login ด้วย email: ${newClub.email}`);
    } catch {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setCreateLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการ Account ประธานชมรม</h1>
            <p className="text-gray-500 text-sm mt-1">Admin — กำหนดสิทธิ์ประธานชมรมแต่ละกีฬา</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddNewClubModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + เพิ่มชมรมใหม่
            </button>
            <LogoutButton />
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">แจ้งเตือน: คำขอรอการอนุมัติ</h3>
                <p className="text-sm text-amber-800 mt-0.5">มีคำขอเปลี่ยน/แต่งตั้งประธานชมรมใหม่จำนวน <span className="font-bold">{pendingCount}</span> รายการ ที่รอการอนุมัติจากคุณ</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800 shadow-sm">
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
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div>
                          <p className="font-medium text-gray-700">ประธานชมรม</p>
                          <p>{club.presidentName} {club.presidentPhone && `(โทร: ${club.presidentPhone})`}</p>
                          <p className="text-xs text-gray-400">{club.email}</p>
                        </div>
                        {club.advisors && club.advisors.length > 0 && (
                          <div className="pt-1 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-1">อาจารย์ที่ปรึกษา</p>
                            <ul className="space-y-1">
                              {club.advisors.map((adv, idx) => (
                                <li key={idx}>• {adv.name} {adv.phone && `(โทร: ${adv.phone})`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {club.createdAt !== "-" && <p className="text-xs text-gray-400 mt-2">กำหนดเมื่อ: {club.createdAt}</p>}
                      </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPresidentForm.presidentPhone}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, presidentPhone: e.target.value }))}
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

      {/* Modal เพิ่มชมรมใหม่ */}
      {showAddNewClubModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">เพิ่มชมรมกีฬาใหม่</h2>
            <p className="text-gray-500 text-sm mb-4">
              กำหนดสิทธิ์ Username และ Password ให้กับประธานชมรมใหม่
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อชมรม</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น ชมรมฟุตซอล"
                    value={newClubForm.clubName}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, clubName: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดกีฬา</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น ฟุตซอล"
                    value={newClubForm.sport}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, sport: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล ประธาน</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newClubForm.presidentName}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, presidentName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newClubForm.presidentPhone}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, presidentPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <p className="text-sm font-medium text-blue-700 mb-3">ตั้งค่าบัญชีผู้ใช้ (สำหรับ Login)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เช่น futsal_up"
                      value={newClubForm.username}
                      onChange={(e) => setNewClubForm((p) => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                      value={newClubForm.password}
                      onChange={(e) => setNewClubForm((p) => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddNewClubModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
              <button 
                onClick={handleAddNewClub} 
                disabled={!newClubForm.clubName || !newClubForm.sport || !newClubForm.presidentName || !newClubForm.username || !newClubForm.password} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                บันทึกและสร้างชมรม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}