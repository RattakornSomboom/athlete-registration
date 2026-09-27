import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Phase4Nav } from "@/components/shared/Phase4UI";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบลงทะเบียนนักกีฬา | มหาวิทยาลัยพะเยา",
  description: "ระบบลงทะเบียนและคัดเลือกนักกีฬามหาวิทยาลัยพะเยา สำหรับนักศึกษา ชมรมกีฬา และเจ้าหน้าที่",
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
      <body className="min-h-full flex flex-col"><Phase4Nav /><main className="flex-1 flex flex-col">{children}</main></body>
    </html>
  );
}
