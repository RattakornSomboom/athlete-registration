"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex flex-col">

      {/* ===== COVER HERO SECTION — ภาพปกพื้นหลัง + โลโก้ ===== */}
      <section
        className="relative w-full flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/cover-bg.jpg')" }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-6">

          {/* Logos Row: UP Logo (left) — Title (center) — System Emblem (right) */}
          <div className="flex items-center justify-center gap-6 md:gap-10">
            {/* UP University Logo (left) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 flex items-center justify-center">
                <img
                  src="/images/logo_up.png"
                  alt="ตราสัญลักษณ์ มหาวิทยาลัยพะเยา"
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
            </div>

            {/* Center Title */}
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-200 font-semibold">
                มหาวิทยาลัยพะเยา · กองกิจการนิสิต
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
              </h1>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium">
                Information System for Sports Management and Excellence Development, University of Phayao
              </p>
            </div>

            {/* Sports System Emblem (right) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img
                  src="/images/system-logo.jpg"
                  alt="ตราสัญลักษณ์ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Login CTA */}
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* ===== Portal Entrance Cards ===== */}
      <main className="bg-slate-50 flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

          {/* Section Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">เลือกประเภทผู้ใช้งานระบบ</h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              ศูนย์กลางการรับสมัครนักศึกษาเข้ารับการคัดเลือก การจัดทำบัญชีรายชื่อของชมรมกีฬา
              และการกำกับดูแลตรวจสอบคุณสมบัตินักกีฬาตามระเบียบ กกมท.
            </p>
          </div>

          {/* Portal Entrances: 3 Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Role 1: นักศึกษา / นักกีฬา */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
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
                  แดชบอร์ดวิเคราะห์ผล &amp; ปฏิทิน กกมท.
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
