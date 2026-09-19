"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export default function BackButton({
  href,
  label = "ย้อนกลับ",
  className = "",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-medium transition-all cursor-pointer shadow-2xs ${className}`}
      title={label}
    >
      <svg
        className="w-3.5 h-3.5 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
