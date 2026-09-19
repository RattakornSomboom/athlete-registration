"use client";

import { useRouter } from "next/navigation";

export default function DevPage() {
  const router = useRouter();

  const setRole = async (role: string) => {
    try {
      await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      
      if (role === "athlete") router.push("/athlete/register");
      else if (role === "team_official") router.push("/team-official/register");
      else if (role === "club") router.push("/club/athletes");
      else if (role === "staff") router.push("/staff/applications");
      else if (role === "admin") router.push("/admin/clubs");
      else if (role === "superadmin") router.push("/superadmin");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Dev Tools</h1>
        <p className="text-gray-400 text-sm mb-6">เลือก role เพื่อทดสอบ (ลบออกก่อน production)</p>
        <div className="space-y-3">
          <button onClick={() => setRole("athlete")} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">เข้าในฐานะ นักกีฬา</button>
          <button onClick={() => setRole("team_official")} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">เข้าในฐานะ เจ้าหน้าที่ทีม</button>
          <button onClick={() => setRole("club")} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">เข้าในฐานะ ประธานชมรม</button>
          <button onClick={() => setRole("staff")} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">เข้าในฐานะ กิจการนิสิต</button>
          <button onClick={() => setRole("admin")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">เข้าในฐานะ Admin</button>
          <button onClick={() => setRole("superadmin")} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-sm transition-colors border-2 border-yellow-500 shadow-md">🌟 เข้าในฐานะ Super Admin (God Mode)</button>
        </div>
      </div>
    </div>
  );
}