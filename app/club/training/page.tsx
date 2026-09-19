"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import Link from "next/link";

type Coach = {
  id: string;
  name: string;
  phone: string | null;
};

type TrainingReport = {
  id: string;
  date: string;
  progress: string;
  issues: string | null;
  photoUrl: string | null;
};

type TrainingProgram = {
  id: string;
  goal: string;
  schedule: string | null;
  reports: TrainingReport[];
};

export default function ClubTrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);

  // Forms
  const [coachForm, setCoachForm] = useState({ name: "", phone: "" });
  const [programForm, setProgramForm] = useState({ goal: "", schedule: "" });
  const [reportForm, setReportForm] = useState({ programId: "", date: "", progress: "", issues: "", photoUrl: "" });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/club/training");
      const data = await res.json();
      setCoaches(data.coaches ?? []);
      setPrograms(data.programs ?? []);
    } catch {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachForm.name) return;
    const res = await fetch("/api/club/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_COACH", ...coachForm })
    });
    if (res.ok) {
      setCoachForm({ name: "", phone: "" });
      fetchData();
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.goal) return;
    const res = await fetch("/api/club/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CREATE_PROGRAM", ...programForm })
    });
    if (res.ok) {
      setProgramForm({ goal: "", schedule: "" });
      fetchData();
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.programId || !reportForm.progress || !reportForm.date) return;
    const res = await fetch("/api/club/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_REPORT", ...reportForm })
    });
    if (res.ok) {
      setReportForm({ programId: "", date: "", progress: "", issues: "", photoUrl: "" });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">
            Club Management
          </span>
          <h2 className="text-lg font-bold text-white leading-tight">ประธานชมรม</h2>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/club/athletes" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">รายชื่อผู้สมัคร (Phase A)</Link>
          <Link href="/club/training" className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white transition-colors">จัดการการฝึกซ้อม (Phase B)</Link>
          <Link href="/club/review" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">คัดเลือกนักกีฬา (Phase C)</Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Phase B: จัดการการฝึกซ้อม</h1>
            <p className="text-sm text-slate-500 mt-1">ผู้ฝึกสอน, โปรแกรมการฝึกซ้อม, และรายงานความก้าวหน้า</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coaches Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">ผู้ฝึกสอน (Coaches)</h2>
              <form onSubmit={handleAddCoach} className="flex gap-2 mb-4">
                <input required placeholder="ชื่อ-สกุล" className="flex-1 border rounded-lg px-3 py-1.5 text-sm" value={coachForm.name} onChange={e => setCoachForm({...coachForm, name: e.target.value})} />
                <input placeholder="เบอร์โทรศัพท์" className="flex-1 border rounded-lg px-3 py-1.5 text-sm" value={coachForm.phone} onChange={e => setCoachForm({...coachForm, phone: e.target.value})} />
                <button type="submit" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800">เพิ่ม</button>
              </form>
              <div className="space-y-2">
                {coaches.map(c => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-lg border text-sm flex justify-between">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-slate-500">{c.phone || "-"}</span>
                  </div>
                ))}
                {coaches.length === 0 && <p className="text-xs text-slate-400">ยังไม่มีผู้ฝึกสอน</p>}
              </div>
            </div>

            {/* Program Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">โปรแกรมการฝึกซ้อมประจำวัน/สัปดาห์</h2>
              <form onSubmit={handleCreateProgram} className="flex flex-col gap-2 mb-4">
                <input required placeholder="เป้าหมาย (เช่น เน้นพละกำลังและแท็คติก)" className="w-full border rounded-lg px-3 py-1.5 text-sm" value={programForm.goal} onChange={e => setProgramForm({...programForm, goal: e.target.value})} />
                <textarea placeholder="ตารางการฝึก (เช่น จ-ศ 17:00-19:00 วิ่ง 5km)" className="w-full border rounded-lg px-3 py-1.5 text-sm" value={programForm.schedule} onChange={e => setProgramForm({...programForm, schedule: e.target.value})} />
                <button type="submit" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 w-full">สร้างโปรแกรมการฝึก</button>
              </form>
            </div>
          </div>

          {/* Reports Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4">รายงานความก้าวหน้าการฝึกซ้อม</h2>
            {programs.length === 0 ? (
              <p className="text-sm text-slate-500">กรุณาสร้างโปรแกรมการฝึกก่อนรายงานผล</p>
            ) : (
              <form onSubmit={handleAddReport} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-lg border">
                <select required className="col-span-1 md:col-span-4 border rounded-lg px-3 py-1.5 text-sm" value={reportForm.programId} onChange={e => setReportForm({...reportForm, programId: e.target.value})}>
                  <option value="">เลือกโปรแกรมที่ต้องการรายงาน...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.goal}</option>)}
                </select>
                <input required type="date" className="border rounded-lg px-3 py-1.5 text-sm" value={reportForm.date} onChange={e => setReportForm({...reportForm, date: e.target.value})} />
                <input required placeholder="ผลความก้าวหน้า" className="border rounded-lg px-3 py-1.5 text-sm col-span-2" value={reportForm.progress} onChange={e => setReportForm({...reportForm, progress: e.target.value})} />
                <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">บันทึกรายงาน</button>
              </form>
            )}

            <div className="space-y-4">
              {programs.map(p => (
                <div key={p.id} className="border-t pt-4">
                  <h3 className="font-semibold text-slate-800 text-sm mb-2">โปรแกรม: {p.goal}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {p.reports.map(r => (
                      <div key={r.id} className="border rounded-lg p-3 text-sm bg-white shadow-xs">
                        <div className="flex justify-between font-semibold mb-1">
                          <span>{new Date(r.date).toLocaleDateString("th-TH")}</span>
                        </div>
                        <p className="text-slate-600 mt-1">ความก้าวหน้า: {r.progress}</p>
                      </div>
                    ))}
                    {p.reports.length === 0 && <p className="text-xs text-slate-400">ยังไม่มีรายงานสำหรับโปรแกรมนี้</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
