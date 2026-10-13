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
        <AppNav />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
