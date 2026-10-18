import type { Metadata } from "next";

// ชื่อหน้าตั้งที่ระดับ route (server) เพื่อให้ถูกต้องตั้งแต่โหลดแรกและไม่ถูกเขียนทับตอน hydrate (WCAG 2.4.2)
export const metadata: Metadata = { title: "แผนที่จุดอ่อนทีม · สู่ความเป็นเลิศ · SMED" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
