"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex flex-col">

      {/* ===== COVER HERO SECTION — ภาพปกพื้นหลัง + โลโก้ ===== */}
      <section
        className="relative w-full flex-1 flex flex-col items-center justify-center text-center overflow-hidden"
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
                <Image
                  src="/images/logo_up.png"
                  alt="ตราสัญลักษณ์ มหาวิทยาลัยพะเยา"
                  width={96}
                  height={112}
                  className="h-full w-full object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>

            {/* Center Title */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-blue-200 font-semibold">
                  มหาวิทยาลัยพะเยา · กองกิจการนิสิต
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
              </h1>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium">
                Information System for Sports Management and Excellence Development
              </p>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium">
                University of Phayao
              </p>
            </div>

            {/* Sports System Emblem (right) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-18 h-20 sm:w-22 sm:h-24 md:w-26 md:h-28 flex items-center justify-center">
                <Image
                  src="/images/system-logo.png"
                  alt="ตราสัญลักษณ์ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ"
                  width={104}
                  height={112}
                  className="h-full w-full object-contain drop-shadow-xl"
                  priority
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

      </section>

      {/* University Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 text-center">
        <p className="font-semibold text-slate-300">
          ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
          smed.up.ac.th · งานกีฬาและนันทนาการ กองกิจการนิสิต มหาวิทยาลัยพะเยา
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          19 หมู่ 2 ตำบลแม่กา อำเภอเมืองพะเยา จังหวัดพะเยา 56000
        </p>
      </footer>

    </div>
  );
}
