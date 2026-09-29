"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import LogoutButton from "@/components/shared/LogoutButton";
import AdminPasswordReset from "@/components/shared/AdminPasswordReset";
import BackButton from "@/components/shared/BackButton";

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
  isActive: boolean;
  createdAt: string;
};

const STATUS_LABEL = {
  active: { label: "เปิดใช้งาน", className: "bg-green-100 text-green-700" },
  pending: { label: "รอการอนุมัติ", className: "bg-yellow-100 text-yellow-800" },
  inactive: { label: "ยังไม่มีประธาน", className: "bg-gray-100 text-gray-500" },
};

export default function AdminClubsPage() {
  const action = useRequestAction();
  const [statusClub, setStatusClub] = useState<ClubAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [newPresidentForm, setNewPresidentForm] = useState({ presidentName: "", presidentPhone: "", email: "" });
  const [showAddNewClubModal, setShowAddNewClubModal] = useState(false);

  const [newClubForm, setNewClubForm] = useState({
    clubName: "",
    sport: "",
    presidentName: "",
    presidentPhone: "",
    username: "",
    password: ""
  });

  const load = useCallback(async () => {
    const data = await fetchJson<{ clubs: { id: string; name: string; sport: string; presidentName?: string; presidentPhone?: string; email: string; advisors?: unknown; status?: string; isActive: boolean; createdAt: string }[] }>("/api/clubs");
    return data.clubs.map((c): ClubAccount => ({ id: c.id, clubName: c.name, sport: c.sport, presidentName: c.presidentName || "-", presidentPhone: c.presidentPhone || "-", email: c.email,
      advisors: Array.isArray(c.advisors) ? c.advisors.filter((a): a is Advisor => !!a && typeof a.name === "string" && typeof a.phone === "string") : [],
      isActive: c.isActive,
      status: c.status === "PENDING" ? "pending" : c.isActive ? "active" : "inactive", createdAt: new Date(c.createdAt).toLocaleDateString("th-TH") }));
  }, []);
  const resource = useRemoteData(load);
  const clubs = resource.data ?? [];
  const pendingCount = clubs.filter(c => c.status === "pending").length;
  const handleStatusChange = () => action.run(async () => {
    if (!statusClub) return;
    await fetchJson(`/api/clubs/${statusClub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !statusClub.isActive }),
    });
    setStatusClub(null);
    resource.retry();
  });
  const handleApprove = (id: string) => action.run(async () => {
    await fetchJson(`/api/admin/clubs/${id}/approve`, { method: "PUT" });
    resource.retry();
  });
  const handleSetPresident = () => action.run(async () => {
    if (!selectedClubId) return;
    await fetchJson(`/api/admin/clubs/${selectedClubId}/president`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPresidentForm) });
    setShowAddModal(false); setSelectedClubId(null);
    setNewPresidentForm({ presidentName: "", presidentPhone: "", email: "" });
    resource.retry();
  });
  const handleAddNewClub = () => action.run(async () => {
    await fetchJson("/api/clubs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newClubForm.clubName, sport: newClubForm.sport, email: newClubForm.username, password: newClubForm.password, presidentName: newClubForm.presidentName, presidentPhone: newClubForm.presidentPhone }) });
    setShowAddNewClubModal(false);
    setNewClubForm({ clubName: "", sport: "", presidentName: "", presidentPhone: "", username: "", password: "" });
    resource.retry();
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 text-slate-800">
      <div className="max-w-full lg:max-w-7xl mx-auto space-y-6">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row">
          <div>
            <div className="mb-3"><BackButton href="/admin" label="กลับหน้า Admin" /></div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">Club Administration</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">จัดการบัญชีประธานชมรม</h1>
            <p className="text-slate-500 text-sm mt-1">สร้างชมรม แต่งตั้งประธาน และอนุมัติบัญชีจากข้อมูลจริงในระบบ</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddNewClubModal(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + เพิ่มชมรมใหม่
            </button>
            <LogoutButton />
          </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2 mb-6">
          <Link
            href="/admin/users"
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent transition-colors"
          >
            👥 การจัดการผู้ใช้งาน
          </Link>
          <Link
            href="/admin/clubs"
            className="px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition-colors"
          >
            🏟️ จัดการชมรมกีฬา
          </Link>
          <Link href="/admin/competitions" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">🏆 การแข่งขัน</Link>
        </div>

        <RequestState loading={resource.loading} error={resource.error || action.error} retry={resource.retry} />
        {action.success && <p role="status">{action.success}</p>}
        {!resource.loading && !resource.error && clubs.length === 0 && <p>ยังไม่มีชมรม</p>}
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
                  <p className="text-sm font-medium">การเข้าใช้งาน: {club.isActive ? "เปิดใช้งาน" : "ถูกระงับ"}</p>
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
                    <button disabled={action.busy} onClick={() => handleApprove(club.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">อนุมัติ</button>
                  )}
                  <button type="button" disabled={action.busy} onClick={() => setStatusClub(club)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50">
                    {club.isActive ? "ระงับบัญชี" : "เปิดใช้งานบัญชี"}
                  </button>
                  <AdminPasswordReset id={club.id} kind="clubs" label={club.email} />
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

      {statusClub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div role="dialog" aria-modal="true" aria-labelledby="club-status-title" className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 id="club-status-title" className="text-lg font-semibold">{statusClub.isActive ? "ยืนยันระงับบัญชีชมรม" : "ยืนยันเปิดใช้งานบัญชีชมรม"}</h2>
            <p className="mt-3">{statusClub.clubName} ({statusClub.email})</p>
            <p className="mt-2 text-sm">{statusClub.isActive ? "บัญชีชมรมและผู้ใช้ที่เชื่อมกับชมรมนี้จะเข้าใช้งานไม่ได้ แม้รีเซ็ตรหัสผ่าน" : "อนุญาตให้บัญชีชมรมกลับเข้าใช้งานได้"}</p>
            <RequestState error={action.error} />
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={action.busy} onClick={() => setStatusClub(null)} className="border rounded-lg px-4 py-2">ยกเลิก</button>
              <button type="button" disabled={action.busy} onClick={handleStatusChange} className="bg-blue-900 text-white rounded-lg px-4 py-2 disabled:opacity-50">{action.busy ? "กำลังบันทึก…" : "ยืนยัน"}</button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-xs text-gray-400">หลังจากบันทึก ระบบจะส่ง status เป็น &quot;รอการอนุมัติ&quot; ให้ Admin ยืนยันอีกครั้งก่อนที่ประธานชมรมจะ login ได้</p>
            </div>

            <RequestState error={action.error} retry={resource.retry} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setSelectedClubId(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
              <button onClick={handleSetPresident} disabled={action.busy || !newPresidentForm.presidentName || !newPresidentForm.email} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">บันทึก</button>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลสำหรับเข้าสู่ระบบ</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="email" placeholder="club@example.ac.th"
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

            <RequestState error={action.error} retry={resource.retry} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddNewClubModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
              <button 
                onClick={handleAddNewClub} 
                disabled={action.busy || !newClubForm.clubName || !newClubForm.sport || !newClubForm.presidentName || !newClubForm.username || !newClubForm.password} 
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
