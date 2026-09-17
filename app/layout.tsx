import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบพัฒนาเพื่อความเป็นเลิศด้านกีฬา มหาวิทยาลัยพะเยา",
  description: "ระบบบริหารจัดการการรับสมัคร การคัดเลือก และรายงานตัวนักกีฬาตัวแทนมหาวิทยาลัยพะเยา ในการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
