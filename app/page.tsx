"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">

      {/* ===== COVER HERO SECTION — ภาพปกพื้นหลัง + โลโก้ ===== */}
      <section
        className="relative w-full flex-1 flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "560px" }}
      >
        {/* Background Image with optimized dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/cover-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px]" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-8">

          {/* Logos Row: UP Logo (left) — Title (center) — System Emblem (right) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {/* UP University Logo (left) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-20 h-24 md:w-24 md:h-28 flex items-center justify-center">
                <Image
                  src="/images/logo_up.png"
                  alt="ตราสัญลักษณ์ มหาวิทยาลัยพะเยา"
                  width={96}
                  height={112}
                  className="h-full w-full object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* Center Title */}
            <div className="flex-1 min-w-0 space-y-2.5 text-center">
              <div>
                <span className="inline-block text-xs text-blue-200 font-medium tracking-normal rounded-full bg-blue-950/70 border border-blue-800/60 px-3 py-1">
                  มหาวิทยาลัยพะเยา · กองกิจการนิสิต
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Information System for Sports Management and Excellence Development
              </p>
              <p className="text-xs text-slate-400 font-normal">
                University of Phayao
              </p>
            </div>

            {/* Sports System Emblem (right) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-20 h-24 md:w-26 md:h-28 flex items-center justify-center">
                <Image
                  src="/images/system-logo.png"
                  alt="ตราสัญลักษณ์ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ"
                  width={104}
                  height={112}
                  className="h-full w-full object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Login CTA */}
          <div className="pt-2 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>เข้าสู่ระบบสารสนเทศ</span>
            </Link>
          </div>
        </div>

      </section>

      {/* University Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 py-6 text-center space-y-1">
        <p className="font-medium text-slate-300">
          ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
        </p>
        <p className="text-xs text-slate-400">
          smed.up.ac.th · งานกีฬาและนันทนาการ กองกิจการนิสิต มหาวิทยาลัยพะเยา
        </p>
        <p className="text-xs text-slate-500">
          19 หมู่ 2 ตำบลแม่กา อำเภอเมืองพะเยา จังหวัดพะเยา 56000
        </p>
      </footer>

    </div>
  );
}
