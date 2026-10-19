"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import { SettingsIcon, CloseIcon } from "@/components/shared/Icons";

type NavLink = readonly [href: string, label: string];

const CLUB_LINKS: NavLink[] = [
  ["/club/competitions", "รายการแข่งขัน"],
  ["/club/tracking", "ติดตามสถานะ"],
  ["/club/review", "บัญชีตัวจริง/สำรอง"],
  ["/club/activities", "กิจกรรมชมรม"],
  ["/club/requests", "คำร้องพิเศษ"],
  ["/club/officials", "เจ้าหน้าที่ทีม"],
];

const STAFF_LINKS: NavLink[] = [
  ["/staff/applications", "ใบสมัครและบัญชีชมรม"],
  ["/staff/officials", "เจ้าหน้าที่ทีม"],
  ["/staff/competitions", "โปรแกรมการแข่งขัน"],
  ["/staff/selection", "ประกาศผล"],
  ["/staff/requests", "คำร้องพิเศษ"],
  ["/staff/activities", "กิจกรรมชมรม"],
  ["/staff/analytics", "สถิติ"],
  ["/staff/excellence", "สู่ความเป็นเลิศ"],
];

const STAFF_SETTINGS: NavLink = ["/staff/settings", "ตั้งค่าระบบ"];

const TEAM_OFFICIAL_LINKS: NavLink[] = [
  ["/team-official/register", "สมัครการแข่งขัน"],
  ["/team-official/status", "ผลการสมัคร"],
];

function linksFor(path: string): NavLink[] {
  if (path.startsWith("/club")) return CLUB_LINKS;
  if (path.startsWith("/admin")) return [];
  if (path.startsWith("/staff")) return STAFF_LINKS;
  if (path.startsWith("/team-official")) return TEAM_OFFICIAL_LINKS;
  return [];
}

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

const logoutClass =
  "rounded-lg border border-rose-400/60 px-3.5 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-400";

export default function AppNav() {
  const path = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const links = linksFor(path);
  if (!links.length || path.endsWith("/signup")) return null;

  const isStaff = path.startsWith("/staff");
  const open = openPath === path;

  const linkClass = (href: string) =>
    `block whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
      isActive(path, href)
        ? "bg-blue-600 font-semibold text-white shadow-sm"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav
      aria-label="เมนูหลัก"
      className="sticky top-0 z-40 print:hidden border-b border-white/10 bg-slate-950 text-white shadow-md backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-base font-bold tracking-wide transition-opacity hover:opacity-90"
        >
          UP <span className="text-blue-400">SMED</span>
        </Link>

        <ul className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {links.map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(path, href) ? "page" : undefined}
                className={linkClass(href)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-3 xl:flex">
          {isStaff && (
            <Link
              href={STAFF_SETTINGS[0]}
              title={STAFF_SETTINGS[1]}
              aria-label={STAFF_SETTINGS[1]}
              aria-current={isActive(path, STAFF_SETTINGS[0]) ? "page" : undefined}
              className={`rounded-lg p-2 text-slate-300 transition-colors ${
                isActive(path, STAFF_SETTINGS[0])
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/10 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          )}
          {isStaff && <LogoutButton className={logoutClass} />}
        </div>

        <button
          type="button"
          onClick={() => setOpenPath(open ? null : path)}
          aria-expanded={open}
          aria-label="เปิด/ปิดเมนู"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white xl:hidden"
        >
          {open ? (
            <CloseIcon className="w-5 h-5" />
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <ul className="space-y-1 border-t border-white/10 px-4 py-3 xl:hidden">
          {[...links, ...(isStaff ? [STAFF_SETTINGS] : [])].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(path, href) ? "page" : undefined}
                className={linkClass(href)}
              >
                {label}
              </Link>
            </li>
          ))}
          {isStaff && (
            <li className="pt-2">
              <LogoutButton className={`${logoutClass} w-full`} />
            </li>
          )}
        </ul>
      )}
    </nav>
  );
}
