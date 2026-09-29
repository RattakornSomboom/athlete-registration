"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import LogoutButton from "@/components/shared/LogoutButton";
import AdminPasswordReset from "@/components/shared/AdminPasswordReset";
import BackButton from "@/components/shared/BackButton";

type UserItem = {
  id: string;
  studentId: string | null;
  email: string;
  role: "ATHLETE" | "STAFF" | "ADMIN" | "TEAM_OFFICIAL" | "CLUB";
  clubId?: string | null;
  isActive: boolean;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

const ROLE_CONFIG: Record<
  UserItem["role"],
  { label: string; badgeClass: string; desc: string }
> = {
  CLUB: { label: "ชมรม (Club)", badgeClass: "bg-blue-100 text-blue-700", desc: "จัดการข้อมูลในขอบเขตชมรมที่ผูกไว้" },
  ADMIN: {
    label: "ผู้ดูแลระบบ (Admin)",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    desc: "จัดการผู้ใช้และตั้งค่าระบบ",
  },
  STAFF: {
    label: "เจ้าหน้าที่กองกิจฯ (Staff)",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    desc: "ตรวจสอบคุณสมบัติและสถิติ",
  },
  TEAM_OFFICIAL: {
    label: "เจ้าหน้าที่ทีม (Team Staff)",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    desc: "ผู้ฝึกสอนและผู้จัดการทีม",
  },
  ATHLETE: {
    label: "นิสิตนักกีฬา (Athlete)",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    desc: "นิสิตผู้สมัครเข้าร่วมแข่งขัน",
  },
};

export default function AdminUsersPage() {
  const action = useRequestAction();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<UserItem | null>(null);
  const [statusChangeUser, setStatusChangeUser] = useState<UserItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    phone: "",
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [newRole, setNewRole] = useState<string>("STAFF");

  const [newClubId, setNewClubId] = useState("");
  const clubLoad = useCallback(() => fetchJson<{ clubs: { id: string; name: string; isActive: boolean }[] }>("/api/clubs"), []);
  const clubResource = useRemoteData(clubLoad);

  // Filter and paginate on the server so every account is reachable.
  const load = useCallback(async () => {
    const query = new URLSearchParams({
      search: searchTerm.trim(), role: selectedRole, status: selectedStatus,
      page: String(page), limit: "25",
    });
    return fetchJson<{ users: UserItem[]; total: number; totalPages: number }>("/api/admin/users?" + query);
  }, [searchTerm, selectedRole, selectedStatus, page]);
  const resource = useRemoteData(load);
  const users = useMemo(() => resource.data?.users ?? [], [resource.data]);
  const filteredUsers = users;

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const staffAndAdmin = users.filter((u) => ["STAFF", "ADMIN"].includes(u.role)).length;
    return { total, active, inactive, staffAndAdmin };
  }, [users]);

  // Handlers
  const handleCreateUser = () =>
    action.run(async () => {
      if (new TextEncoder().encode(createForm.password).length > 72) {
        throw new Error("รหัสผ่านยาวเกิน 72 ไบต์");
      }
      await fetchJson("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
        phone: "",
        isActive: true,
      });
      resource.retry();
    });

  const handleEditUser = () =>
    action.run(async () => {
      if (!editingUser) return;
      await fetchJson(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingUser(null);
      resource.retry();
    });

  const handleChangeRole = () =>
    action.run(async () => {
      if (!roleChangeUser) return;
      await fetchJson(`/api/admin/users/${roleChangeUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, clubId: newRole === "CLUB" ? newClubId : null }),
      });
      setRoleChangeUser(null);
      resource.retry();
    });

  const handleToggleStatus = () =>
    action.run(async () => {
      if (!statusChangeUser) return;
      await fetchJson(`/api/admin/users/${statusChangeUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !statusChangeUser.isActive }),
      });
      setStatusChangeUser(null);
      resource.retry();
    });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-full lg:max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3"><BackButton href="/admin" label="กลับหน้า Admin" /></div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">Identity & Access</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">การจัดการผู้ใช้งาน</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Admin — จัดการสิทธิ์ กำหนดบทบาท และระงับ/เปิดใช้งานบัญชีผู้ใช้ในระบบ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> เพิ่มผู้ใช้
            </button>
            <LogoutButton />
          </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2">
          <Link
            href="/admin/users"
            className="px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition-colors"
          >
            👥 การจัดการผู้ใช้งาน
          </Link>
          <Link
            href="/admin/clubs"
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent transition-colors"
          >
            🏟️ จัดการชมรมกีฬา
          </Link>
          <Link href="/admin/competitions" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">🏆 การแข่งขัน</Link>
        </div>

        {/* Action Notifications & Request State */}
        <RequestState
          loading={resource.loading}
          error={resource.error || action.error}
          retry={resource.retry}
        />
        {action.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-sm text-green-800 flex items-center gap-2">
            <span>✅</span>
            <span>{action.success}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">ผู้ใช้ในหน้านี้</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-gray-500 mt-1">เปิดใช้งานในหน้านี้</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <p className="text-2xl font-bold text-rose-600">{stats.inactive}</p>
            <p className="text-xs text-gray-500 mt-1">ระงับในหน้านี้</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <p className="text-2xl font-bold text-purple-600">{stats.staffAndAdmin}</p>
            <p className="text-xs text-gray-500 mt-1">เจ้าหน้าที่และแอดมินในหน้านี้</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ค้นหาผู้ใช้</label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล, อีเมล หรือรหัสนิสิต..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">กรองตามสิทธิ์ (Role)</label>
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">สิทธิ์ทั้งหมด</option>
                <option value="ADMIN">ADMIN — ผู้ดูแลระบบ</option>
                <option value="STAFF">STAFF — เจ้าหน้าที่กองกิจฯ</option>
                <option value="TEAM_OFFICIAL">TEAM_OFFICIAL — เจ้าหน้าที่ทีม</option>
                <option value="CLUB">CLUB — ชมรม</option>
                <option value="ATHLETE">ATHLETE — นิสิตนักกีฬา</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">กรองตามสถานะ (Status)</label>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                <option value="INACTIVE">ระงับการใช้งาน (SUSPENDED)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
            <span>แสดง {filteredUsers.length} จาก {resource.data?.total ?? 0} รายการ</span>
            {(searchTerm || selectedRole !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("ALL");
                  setSelectedStatus("ALL");
                  setPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ผู้ใช้งาน</th>
                  <th scope="col" className="px-5 py-3.5">อีเมล / ติดต่อ</th>
                  <th scope="col" className="px-5 py-3.5">สิทธิ์ (Role)</th>
                  <th scope="col" className="px-5 py-3.5">สถานะ</th>
                  <th scope="col" className="px-5 py-3.5">วันที่สร้าง</th>
                  <th scope="col" className="px-5 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!resource.loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || {
                    label: u.role,
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                    desc: "",
                  };

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        {u.studentId && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            รหัสนิสิต: {u.studentId}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-900">{u.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">โทร: {u.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleConfig.badgeClass}`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            ระงับการใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditForm({
                                name: u.name,
                                email: u.email,
                                phone: u.phone !== "-" ? u.phone : "",
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => {
                              setRoleChangeUser(u);
                              setNewRole(u.role);
                              setNewClubId(u.clubId ?? "");
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                          >
                            เปลี่ยนสิทธิ์
                          </button>
                          <AdminPasswordReset id={u.id} label={u.email} />
                          <button
                            onClick={() => setStatusChangeUser(u)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              u.isActive
                                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {u.isActive ? "ระงับ" : "เปิดใช้"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <nav aria-label="หน้ารายการผู้ใช้" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button type="button" disabled={page <= 1 || resource.loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">หน้าก่อนหน้า</button>
          <span>หน้า {page} / {Math.max(1, resource.data?.totalPages ?? page)}</span>
          <button type="button" disabled={resource.loading || page >= (resource.data?.totalPages ?? page)} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">หน้าถัดไป</button>
        </nav>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Modal 1: Create Internal User
      ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={(event) => { event.preventDefault(); void handleCreateUser(); }} className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">เพิ่มผู้ใช้งานภายในระบบ</h2>
              <p className="text-gray-500 text-xs mt-1">
                สร้างบัญชีสำหรับเจ้าหน้าที่กองกิจการนิสิต, ผู้ดูแลระบบ หรือเจ้าหน้าที่ทีม
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  อีเมล (สำหรับเข้าสู่ระบบ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  placeholder="user@up.ac.th"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  สิทธิ์การใช้งาน (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="STAFF">STAFF — เจ้าหน้าที่กองกิจการนิสิต</option>
                  <option value="ADMIN">ADMIN — ผู้ดูแลระบบ</option>
                  <option value="TEAM_OFFICIAL">TEAM_OFFICIAL — เจ้าหน้าที่ทีม</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 8 ตัวอักษร ไม่เกิน 72 ไบต์"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className={`mt-1 text-xs ${new TextEncoder().encode(createForm.password).length > 72 ? "text-rose-700" : "text-gray-500"}`}>
                  อย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์ ({new TextEncoder().encode(createForm.password).length}/72 ไบต์)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  maxLength={50}
                  placeholder="08xxxxxxxx"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create-isActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="create-isActive" className="text-xs text-gray-700 select-none">
                  เปิดใช้งานบัญชีทันทีหลังสร้าง
                </label>
              </div>
            </div>

            <RequestState error={action.error} retry={resource.retry} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={action.busy}
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={action.busy || !createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 8 || new TextEncoder().encode(createForm.password).length > 72}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {action.busy ? "กำลังสร้าง..." : "บันทึกและสร้าง"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 2: Edit User Basic Information
      ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={(event) => { event.preventDefault(); void handleEditUser(); }} className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลผู้ใช้งาน</h2>
              <p className="text-gray-500 text-xs mt-1">
                แก้ไขชื่อ อีเมล หรือเบอร์โทรศัพท์สำหรับ {editingUser.email}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  อีเมล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  maxLength={50}
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <RequestState error={action.error} retry={resource.retry} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={action.busy}
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={action.busy || !editForm.name.trim() || !editForm.email.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {action.busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 3: Change Role Confirmation
      ───────────────────────────────────────────────────────────── */}
      {roleChangeUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">เปลี่ยนสิทธิ์ผู้ใช้งาน</h2>
              <p className="text-gray-500 text-xs mt-1">
                การเปลี่ยนสิทธิ์จะส่งผลต่อเมนูและการเข้าถึงข้อมูลในระบบทันที
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">ผู้ใช้:</span>
                <span className="font-semibold text-gray-800">{roleChangeUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">อีเมล:</span>
                <span className="text-gray-700 font-mono">{roleChangeUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">สิทธิ์ปัจจุบัน:</span>
                <span className="font-medium text-purple-700">
                  {ROLE_CONFIG[roleChangeUser.role]?.label || roleChangeUser.role}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                เลือกสิทธิ์ใหม่ <span className="text-rose-500">*</span>
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="STAFF">STAFF — เจ้าหน้าที่กองกิจการนิสิต</option>
                <option value="ADMIN">ADMIN — ผู้ดูแลระบบ</option>
                <option value="TEAM_OFFICIAL">TEAM_OFFICIAL — เจ้าหน้าที่ทีม</option>
                <option value="CLUB">CLUB — ชมรม</option>
                {roleChangeUser.studentId && (
                  <option value="ATHLETE">ATHLETE — นิสิตนักกีฬา</option>
                )}
              </select>
            </div>

            {newRole === "CLUB" && <label className="block">ชมรมที่รับผิดชอบ<select aria-label="ชมรมที่รับผิดชอบ" value={newClubId} onChange={e => setNewClubId(e.target.value)} className="w-full border p-2"><option value="">เลือกชมรม</option>{clubResource.data?.clubs.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><RequestState loading={clubResource.loading} error={clubResource.error} retry={clubResource.retry}/></label>}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              ⚠️ <strong>ข้อควรระวัง:</strong> การเปลี่ยนสิทธิ์จะได้รับการบันทึกลงใน Audit Log
              และระบบจะป้องกันไม่ให้ลดสิทธิ์ของตนเอง หรือลดสิทธิ์ Admin บัญชีสุดท้าย
            </div>

            <RequestState error={action.error} retry={resource.retry} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleChangeRole}
                disabled={action.busy || newRole === roleChangeUser.role}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {action.busy ? "กำลังเปลี่ยน..." : "ยืนยันเปลี่ยนสิทธิ์"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 4: Toggle Status Confirmation Dialog
      ───────────────────────────────────────────────────────────── */}
      {statusChangeUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {statusChangeUser.isActive ? "ยืนยันการระงับบัญชี" : "ยืนยันการเปิดใช้งานบัญชี"}
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                {statusChangeUser.isActive
                  ? `คุณต้องการระงับการใช้งานบัญชี "${statusChangeUser.name}" (${statusChangeUser.email}) ใช่หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้`
                  : `คุณต้องการเปิดใช้งานบัญชี "${statusChangeUser.name}" (${statusChangeUser.email}) ใช่หรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบได้ตามปกติ`}
              </p>
            </div>

            {statusChangeUser.isActive && statusChangeUser.role === "ADMIN" && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                ⚠️ การระงับบัญชี Admin จะไม่สามารถทำได้หากเป็น Admin บัญชีสุดท้ายที่ใช้งานอยู่
              </div>
            )}

            <RequestState error={action.error} retry={resource.retry} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusChangeUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={action.busy}
                className={`flex-1 font-medium py-2 rounded-lg text-sm text-white transition-colors cursor-pointer ${
                  statusChangeUser.isActive
                    ? "bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300"
                    : "bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                }`}
              >
                {action.busy
                  ? "กำลังบันทึก..."
                  : statusChangeUser.isActive
                  ? "ยืนยันระงับบัญชี"
                  : "ยืนยันเปิดใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
