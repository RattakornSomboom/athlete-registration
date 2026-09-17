"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Stats = {
  total: number;
  submitted: number;
  clubApproved: number;
  clubRejected: number;
  staffApproved: number;
  staffRejected: number;
  finalSelected: number;
};

type Club = {
  id: string;
  name: string;
  sport: string;
  email: string;
  isActive: boolean;
  _count: { competitions: number; activities: number };
};

const SPORTS = [
  "กรีฑา", "กีฬาทางน้ำ", "วอลเลย์บอล", "เทควันโด", "มวยไทยสมัครเล่น", "ฟุตบอล", "บาสเกตบอล",
  "เปตอง", "จักรยาน", "เซปักตะกร้อ", "ยูยิตสู", "เทเบิลเทนนิส", "แบดมินตัน", "เทนนิส",
  "ฟุตซอล", "ฮับกิโด", "อีสปอร์ต", "จานร่อน", "ปีนหน้าผา", "วู้ดบอล", "สควอช",
  "คิกบ็อกซิ่ง", "ซอฟท์บอล", "เรือพาย", "คาราเต้", "ฟันดาบสากล", "เชียร์",
  "แฮนด์บอล", "ฮอกกี้", "รักบี้ฟุตบอล", "วูซู", "หมากรุกสากล", "บริดจ์", "ดาบไทย",
];

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", sport: "", round: "qualifier", year: "2569", clubId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [clubsRes, statsRes] = await Promise.all([
        fetch("/api/clubs"),
        fetch("/api/staff/applications"),
      ]);
      const clubsData = await clubsRes.json();
      const statsData = await statsRes.json();
      setClubs(clubsData.clubs ?? []);
      setStats(statsData.stats ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(); 
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.sport || !form.round || !form.year || !form.clubId) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, year: parseInt(form.year) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "สร้างรายการไม่สำเร็จ"); return; }
      setShowModal(false);
      setForm({ name: "", sport: "", round: "qualifier", year: "2569", clubId: "" });
      setSuccess(`สร้างรายการแข่งขัน "${data.competition?.name}" สำเร็จ`);
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการใบสมัครนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">
              กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
              {stats && ` · รอพิจารณารวม ${stats.submitted + stats.clubApproved} คน`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + สร้างรายการแข่งขัน
            </button>
            <button onClick={() => router.push("/staff/activities")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">📋 กิจกรรมชมรม</button>
            <button onClick={() => router.push("/staff/selection")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">🏆 ประกาศผล</button>
            <LogoutButton />
          </div>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">✅ {success}</div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">ใบสมัครทั้งหมด</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.submitted}</p>
              <p className="text-sm text-gray-500 mt-1">รอชมรมพิจารณา</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.clubApproved}</p>
              <p className="text-sm text-gray-500 mt-1">รอเจ้าหน้าที่</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.finalSelected}</p>
              <p className="text-sm text-gray-500 mt-1">ผ่านการคัดเลือก</p>
            </div>
          </div>
        )}

        {/* Club List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {clubs.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">ยังไม่มีชมรม</div>
            )}
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => router.push(`/staff/applications/${club.id}`)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-medium text-gray-900">{club.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{club.sport}</span>
                      {!club.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ปิดใช้งาน</span>}
                    </div>
                    <p className="text-sm text-gray-500">
                      {club._count.competitions} รายการแข่งขัน · {club.email}
                    </p>
                  </div>
                  <span className="text-gray-400 shrink-0">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Competition Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">สร้างรายการแข่งขัน</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการแข่งขัน</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ฟุตบอล 11 คน ชาย"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชมรมที่รับผิดชอบ</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.clubId}
                  onChange={(e) => setForm((p) => ({ ...p, clubId: e.target.value }))}
                >
                  <option value="">-- เลือกชมรม --</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sport})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดกีฬา</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.sport}
                  onChange={(e) => setForm((p) => ({ ...p, sport: e.target.value }))}
                >
                  <option value="">-- เลือกชนิดกีฬา --</option>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รอบการแข่งขัน</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["qualifier", "รอบคัดเลือก"], ["final", "รอบมหกรรม"]].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setForm((p) => ({ ...p, round: val }))}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${form.round === val ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ปี (พ.ศ.)</label>
                <input type="number" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "กำลังสร้าง..." : "สร้างรายการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}