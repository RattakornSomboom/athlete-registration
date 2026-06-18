"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("token");
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