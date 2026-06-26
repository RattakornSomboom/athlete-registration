"use client";

import { useRouter } from "next/navigation";

export default function DevPage() {
  const router = useRouter();

  const setRole = (role: string) => {
    document.cookie = `role=${role}; path=/`;
    if (role === "athlete") router.push("/athlete/register");
    else if (role === "team_official") router.push("/team-official/register");
    else if (role === "club") router.push("/club/athletes");
    else if (role === "staff") router.push("/staff/applications");
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
        </div>
      </div>
    </div>
  );
}