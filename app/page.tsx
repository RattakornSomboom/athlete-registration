"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">

      {/* Top University Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-900 flex items-center justify-center font-bold text-white text-sm border border-blue-700">
              UP
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400 block font-semibold">
                มหาวิทยาลัยพะเยา · กองกิจการนิสิต
              </span>
              <span className="text-sm font-bold text-white">
                ระบบพัฒนาเพื่อความเป็นเลิศด้านกีฬา มหาวิทยาลัยพะเยา
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Portal Options */}
      <main className="max-w-6xl mx-auto px-6 py-16 w-full space-y-12">

        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            ระบบพัฒนาเพื่อความเป็นเลิศด้านกีฬา มหาวิทยาลัยพะเยา
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mx-auto">
            ศูนย์กลางการรับสมัครนักศึกษาเข้ารับการคัดเลือก การจัดทำบัญชีรายชื่อของชมรมกีฬา
            และการกำกับดูแลตรวจสอบคุณสมบัตินักกีฬาตามระเบียบของคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย (กกมท.)
          </p>
        </div>

        {/* Portal Entrances: 3 Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Role 1: นักศึกษา / นักกีฬา */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-blue-900 tracking-wider uppercase block">
                สำหรับนักศึกษาและนักกีฬา
              </span>
              <h2 className="text-base font-bold text-slate-900">
                สมัครและติดตามผลการคัดเลือก
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                กรอกข้อมูลประวัติการแข่งขัน แนบเอกสารผลการเรียน และติดตามผลการพิจารณาเพื่อยืนยันสิทธิ์เป็นตัวแทนสถาบัน
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 space-y-2">
              <Link
                href="/athlete/register"
                className="block text-center w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                ยื่นใบสมัครเข้ารับการคัดเลือก
              </Link>
              <Link
                href="/athlete/status"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                ตรวจสอบสถานะและยืนยันสิทธิ์
              </Link>
            </div>
          </div>

          {/* Role 2: ชมรมกีฬา / ผู้ฝึกสอน */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-800 tracking-wider uppercase block">
                สำหรับชมรมกีฬาและผู้ฝึกสอน
              </span>
              <h2 className="text-base font-bold text-slate-900">
                พิจารณาและจัดทำบัญชีรายชื่อ
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                ตรวจสอบรายชื่อผู้สมัคร จัดประเภทนักกีฬาตัวจริงและตัวสำรองตามโควตาสูงสุด และลงนามส่งรายชื่อให้กองกิจการนิสิต
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 space-y-2">
              <Link
                href="/club/athletes"
                className="block text-center w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                รายชื่อนักกีฬาในชมรม
              </Link>
              <Link
                href="/club/review"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                จัดทำบัญชีรายชื่อส่งกองกิจ
              </Link>
            </div>
          </div>

          {/* Role 3: เจ้าหน้าที่กองกิจการนิสิต */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-purple-900 tracking-wider uppercase block">
                สำหรับเจ้าหน้าที่กองกิจการนิสิต
              </span>
              <h2 className="text-base font-bold text-slate-900">
                ตรวจสอบและวิเคราะห์ผลภาพรวม
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                ตรวจสอบเอกสารคุณสมบัติตามระเบียบ กกมท. ประกาศผลทางการ และติดตามการวิเคราะห์สถิติตัวเลขผ่านแดชบอร์ด
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 space-y-2">
              <Link
                href="/staff/analytics"
                className="block text-center w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                แดชบอร์ดวิเคราะห์ผล & ปฏิทิน กกมท.
              </Link>
              <Link
                href="/staff/applications"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                จัดการใบสมัครรายชมรม
              </Link>
            </div>
          </div>

        </div>

        {/* Official Information Footer Banner */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">
            ข้อบังคับและแนวปฏิบัติการขึ้นทะเบียนนักกีฬา
          </h3>
          <p className="leading-relaxed text-slate-500">
            นักศึกษาที่จะสมัครเข้ารับการคัดเลือกจะต้องเป็นผู้มีสถานภาพเป็นนักศึกษามหาวิทยาลัยพะเยาในระดับปริญญาตรีหรือบัณฑิตศึกษา
            และมีผลการเรียนเฉลี่ยสะสมไม่ต่ำกว่าเกณฑ์ที่สถาบันและคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทยกำหนด
            โดยต้องผ่านการทดสอบสมรรถภาพและการรับรองจากชมรมต้นสังกัด
          </p>
        </div>

      </main>

      {/* University Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 text-center">
        <p>กองกิจการนิสิต มหาวิทยาลัยพะเยา · งานกีฬาและนันทนาการ</p>
        <p className="text-[11px] text-slate-500 mt-1">
          19 หมู่ 2 ตำบลแม่กา อำเภอเมืองพะเยา จังหวัดพะเยา 56000
        </p>
      </footer>

    </div>
  );
}
