"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Inject a fake current_club_id into local storage if they want to test Club routes
    if (!localStorage.getItem("current_club_id")) {
      // Just put a dummy or prompt them to select one later
      // The API routes are unlocked, but the frontend might crash if it expects an ID format
      localStorage.setItem("current_club_id", "clm2xt6j50000aabc12345678"); 
      localStorage.setItem("club", JSON.stringify({ id: "clm2xt6j50000aabc12345678", name: "Super Admin Club Mode", sport: "ฟุตบอล" }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-yellow-500">🌟</span> God Mode Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">ยินดีต้อนรับ Super Admin เลือกโซนที่ต้องการเข้าทดสอบระบบได้เลยครับ</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          
          {/* Athlete Zone */}
          <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">🏃 นักกีฬา (Athlete)</h2>
            <div className="space-y-3">
              <Link href="/athlete/register" className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <span className="font-semibold text-indigo-800 block">กรอกใบสมัครลงแข่ง</span>
                <span className="text-xs text-slate-500">ทดสอบการส่งใบสมัครและเช็คอายุ/โควตา</span>
              </Link>
              <Link href="/athlete/status" className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <span className="font-semibold text-indigo-800 block">เช็คสถานะใบสมัคร</span>
                <span className="text-xs text-slate-500">ทดสอบการดูสถานะที่ได้รับการอนุมัติ</span>
              </Link>
            </div>
          </div>

          {/* Club Zone */}
          <div className="bg-white p-6 rounded-2xl border-2 border-rose-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">🏟️ ชมรม (Club)</h2>
            <div className="space-y-3">
              <Link href="/club/athletes" className="block p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-colors">
                <span className="font-semibold text-rose-800 block">Phase A: สรุปข้อมูลผู้สมัคร</span>
                <span className="text-xs text-slate-500">ทดสอบการจัดกลุ่มนักกีฬาแยกตามกีฬา</span>
              </Link>
              <Link href="/club/training" className="block p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-colors">
                <span className="font-semibold text-rose-800 block">Phase B: จัดการการฝึกซ้อม</span>
                <span className="text-xs text-slate-500">ทดสอบเพิ่มโค้ชและรายการฝึก</span>
              </Link>
              <Link href="/club/review" className="block p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-colors">
                <span className="font-semibold text-rose-800 block">Phase C: คัดเลือกนักกีฬา</span>
                <span className="text-xs text-slate-500">ทดสอบเลือกตัวจริง/ตัวสำรอง และพิมพ์เอกสาร</span>
              </Link>
            </div>
          </div>

          {/* Staff Zone */}
          <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">🏢 กองกิจการนิสิต (Staff)</h2>
            <div className="space-y-3">
              <Link href="/staff/competitions" className="block p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                <span className="font-semibold text-emerald-800 block">สร้างโปรแกรมการแข่งขัน</span>
                <span className="text-xs text-slate-500">กำหนดโควตาและอายุนักกีฬา</span>
              </Link>
              <Link href="/staff/applications" className="block p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                <span className="font-semibold text-emerald-800 block">แดชบอร์ดสรุปผล</span>
                <span className="text-xs text-slate-500">ดูยอดผู้สมัครและดาวน์โหลดเอกสารต่างๆ</span>
              </Link>
            </div>
          </div>

          {/* Admin Zone */}
          <div className="bg-white p-6 rounded-2xl border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">⚙️ ระบบ (Admin)</h2>
            <div className="space-y-3">
              <Link href="/admin/clubs" className="block p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 transition-colors">
                <span className="font-semibold text-purple-800 block">จัดการชมรม</span>
                <span className="text-xs text-slate-500">สร้างและระงับบัญชีชมรม</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
