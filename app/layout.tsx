import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/shared/AppNav";

export const metadata: Metadata = {
  title: "SMED | ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา",
  description: "SMED (smed.up.ac.th) - ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา (Information System for Sports Management and Excellence Development, University of Phayao)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-900 focus:shadow-lg print:hidden"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <AppNav />
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">{children}</main>
      </body>
    </html>
  );
}
