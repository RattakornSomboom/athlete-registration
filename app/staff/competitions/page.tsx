"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import Link from "next/link";

const SPORTS = [
  "กรีฑา", "กีฬาทางน้ำ", "วอลเลย์บอล", "เทควันโด", "มวยไทยสมัครเล่น", "ฟุตบอล", "บาสเกตบอล",
  "เปตอง", "เซปักตะกร้อ", "อีสปอร์ต", "แบดมินตัน", "เทนนิส", "ฟุตซอล", "เปตอง"
];

type Quota = {
  sport: string;
  maxStarters: string;
  maxSubstitutes: string;
  ageLimit: string;
};

export default function StaffCompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    round: "qualifier",
    year: "2569",
    deadline: "",
  });
  const [quotas, setQuotas] = useState<Quota[]>([]);

  useEffect(() => {
    fetch("/api/competitions")
      .then((r) => r.json())
      .then((data) => {
        setCompetitions(data.competitions || []);
        setLoading(false);
      });
  }, []);

  const addQuota = () => {
    setQuotas([...quotas, { sport: "", maxStarters: "", maxSubstitutes: "", ageLimit: "" }]);
  };

  const removeQuota = (index: number) => {
    setQuotas(quotas.filter((_, i) => i !== index));
  };

  const updateQuota = (index: number, field: string, value: string) => {
    const newQuotas = [...quotas];
    newQuotas[index] = { ...newQuotas[index], [field]: value };
    setQuotas(newQuotas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.year) {
      alert("กรุณากรอกชื่อและปี");
      return;
    }

    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quotas: quotas.filter((q) => q.sport)
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      alert("สร้างโปรแกรมการแข่งขันสำเร็จ");
      setShowForm(false);
      setForm({ name: "", round: "qualifier", year: "2569", deadline: "" });
      setQuotas([]);
      
      const refresh = await fetch("/api/competitions");
      const refData = await refresh.json();
      setCompetitions(refData.competitions || []);
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">
            University Sports
          </span>
          <h2 className="text-lg font-bold text-white leading-tight">
            กองกิจการนิสิต
          </h2>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/staff/analytics" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">แดชบอร์ด</Link>
          <Link href="/staff/competitions" className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white transition-colors">โปรแกรมการแข่งขัน</Link>
          <Link href="/staff/applications" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">จัดการใบสมัคร</Link>
          <Link href="/staff/settings" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">ตั้งค่าระบบ</Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">โปรแกรมการแข่งขันประจำปี</h1>
              <p className="text-sm text-slate-500 mt-1">ตั้งค่าการแข่งขัน โควตา และกำหนดการ</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + สร้างโปรแกรมใหม่
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">สร้างโปรแกรมการแข่งขันใหม่</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการแข่งขัน</label>
                    <input required className="w-full px-3 py-2 border rounded-lg text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="เช่น กีฬามหาวิทยาลัย ครั้งที่ 52" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ปี พ.ศ.</label>
                    <input required type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รอบการแข่งขัน</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm" value={form.round} onChange={e => setForm({...form, round: e.target.value})}>
                      <option value="qualifier">รอบคัดเลือก</option>
                      <option value="final">รอบมหกรรม</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุดรับสมัคร</label>
                    <input type="datetime-local" className="w-full px-3 py-2 border rounded-lg text-sm" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-900">โควตาชนิดกีฬา (Sport Quotas)</h3>
                    <button type="button" onClick={addQuota} className="text-blue-600 text-xs font-medium hover:underline">+ เพิ่มชนิดกีฬา</button>
                  </div>
                  {quotas.map((q, i) => (
                    <div key={i} className="flex gap-2 items-center mb-2">
                      <select className="flex-1 px-3 py-1.5 border rounded-lg text-sm" value={q.sport} onChange={e => updateQuota(i, "sport", e.target.value)}>
                        <option value="">เลือกกีฬา</option>
                        {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" placeholder="ตัวจริง" className="w-20 px-3 py-1.5 border rounded-lg text-sm" value={q.maxStarters} onChange={e => updateQuota(i, "maxStarters", e.target.value)} />
                      <input type="number" placeholder="ตัวสำรอง" className="w-20 px-3 py-1.5 border rounded-lg text-sm" value={q.maxSubstitutes} onChange={e => updateQuota(i, "maxSubstitutes", e.target.value)} />
                      <input type="number" placeholder="เกณฑ์อายุสูงสุด" className="w-28 px-3 py-1.5 border rounded-lg text-sm" value={q.ageLimit} onChange={e => updateQuota(i, "ageLimit", e.target.value)} />
                      <button type="button" onClick={() => removeQuota(i)} className="text-red-500 text-lg ml-2">×</button>
                    </div>
                  ))}
                  {quotas.length === 0 && <p className="text-xs text-gray-400">ยังไม่ได้กำหนดโควตา (นักกีฬาสมัครได้ไม่จำกัดตามระเบียบหลัก)</p>}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">บันทึกโปรแกรม</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          ) : competitions.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <p className="text-slate-500 text-sm">ยังไม่มีโปรแกรมการแข่งขัน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitions.map((c) => (
                <div key={c.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {c.status === "OPEN" ? "กำลังรับสมัคร" : "ปิดรับสมัคร"}
                    </span>
                    <span className="text-xs text-slate-400">ปี {c.year}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">รอบ: {c.round === "qualifier" ? "คัดเลือก" : "มหกรรม"}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">โควตากีฬา: {c.quotas?.length || 0} ชนิด</span>
                    <span className="text-xs text-slate-500">ผู้สมัคร: {c._count?.applications || 0} คน</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
