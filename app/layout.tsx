import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Phase4Nav } from "@/components/shared/Phase4UI";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
      className={`${prompt.variable} h-full antialiased`}
    >
      <body className={`${prompt.className} min-h-full flex flex-col font-sans`}>
        <Phase4Nav />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
