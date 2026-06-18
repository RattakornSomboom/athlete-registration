"use client";

import { useRouter } from "next/navigation";

export default function DevPage() {
  const router = useRouter();

  const setRole = (role: string, path: string) => {
    document.cookie = `role=${role}; path=/`;
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          Dev Tools
        </h1>

        <p className="text-gray-400 text-sm mb-6">
          เลือก role เพื่อทดสอบ
        </p>

        <div className="space-y-3">

          <button
            onClick={() =>
              setRole("athlete", "/athlete/register")
            }
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg"
          >
            เข้าในฐานะ นักกีฬา
          </button>

          <button
            onClick={() =>
              setRole("club", "/club/athletes")
            }
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg"
          >
            เข้าในฐานะ ประธานชมรม
          </button>

          <button
            onClick={() =>
              setRole("staff", "/staff/applications")
            }
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg"
          >
            เข้าในฐานะ กิจการนิสิต
          </button>

          <button
            onClick={() =>
              setRole("staff", "/staff/settings")
            }
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg"
          >
            เข้าในฐานะ กิจการนิสิต (ตั้งค่า)
          </button>

        </div>
      </div>
    </div>
  );
}