"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // เรียก API logout เพื่อลบ httpOnly cookie ฝั่ง server
    await fetch("/api/auth/logout", { method: "POST" });
    // ลบ localStorage ที่ใช้เก็บ studentId
    localStorage.removeItem("current_student_id");
    router.push("/login");
  };

  return (
    <div className="flex justify-end">
      <button
        onClick={handleLogout}
        className="text-sm text-red-500 hover:text-red-600 font-medium border border-red-300 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}