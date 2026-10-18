"use client";

import { eventLabel, formatTrackTime, type ProgressionSeries } from "@/lib/excellence-athletics";
import { formatThaiDate } from "@/components/shared/ExcellenceUI";

const WIDTH = 640;
const HEIGHT = 230;
const PAD = { left: 64, right: 20, top: 18, bottom: 38 };

function dayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / 86_400_000;
}

// เส้นพัฒนาการเวลาของ 1 รายการ: แกนตั้งกลับด้าน (เวลาน้อย = เร็วกว่า อยู่ด้านบน) เส้นประคือเป้า วงกลมหนาคือ PB
export function ProgressionChart({ series }: { series: ProgressionSeries }) {
  const { points, targetSeconds } = series;
  const values = [...points.map(point => point.seconds), ...(targetSeconds === null ? [] : [targetSeconds])];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const margin = Math.max((rawMax - rawMin) * 0.12, 0.1);
  const min = rawMin - margin;
  const max = rawMax + margin;
  const firstDay = dayNumber(points[0].date);
  const lastDay = dayNumber(points[points.length - 1].date);
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (date: string) => PAD.left + (lastDay === firstDay ? plotW / 2 : ((dayNumber(date) - firstDay) / (lastDay - firstDay)) * plotW);
  const y = (seconds: number) => PAD.top + ((seconds - min) / (max - min)) * plotH;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(point.date).toFixed(1)},${y(point.seconds).toFixed(1)}`).join(" ");
  const first = points[0].seconds;
  const last = points[points.length - 1].seconds;
  const best = Math.min(...points.map(point => point.seconds));
  const summary = `กราฟพัฒนาการเวลา ${eventLabel(series.event)} ${points.length} ครั้ง จาก ${formatTrackTime(first)} เป็น ${formatTrackTime(last)} เวลาดีที่สุด ${formatTrackTime(best)}`
    + (targetSeconds === null ? " ยังไม่ตั้งเป้า" : ` เป้า ${formatTrackTime(targetSeconds)}`);

  return (
    <figure className="w-full max-w-3xl">
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-900">{eventLabel(series.event)}</span>
        <span className="text-slate-600">
          {formatTrackTime(first)} → {formatTrackTime(last)} · ดีที่สุด {formatTrackTime(best)}
          {targetSeconds === null ? " · ยังไม่ตั้งเป้า" : ` · เป้า ${formatTrackTime(targetSeconds)}`}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="w-full">
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-slate-300" />
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} className="stroke-slate-300" />
        <text x={PAD.left - 8} y={PAD.top + 5} textAnchor="end" className="fill-slate-500 text-[13px]">{formatTrackTime(min)}</text>
        <text x={PAD.left - 8} y={HEIGHT - PAD.bottom} textAnchor="end" className="fill-slate-500 text-[13px]">{formatTrackTime(max)}</text>
        <text x={PAD.left} y={HEIGHT - 12} textAnchor="start" className="fill-slate-500 text-[13px]">{formatThaiDate(points[0].date)}</text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 12} textAnchor="end" className="fill-slate-500 text-[13px]">{formatThaiDate(points[points.length - 1].date)}</text>
        {targetSeconds !== null && (
          <g>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(targetSeconds)} y2={y(targetSeconds)} strokeDasharray="5 4" strokeWidth={1.5} className="stroke-emerald-600" />
            <text x={PAD.left + 6} y={y(targetSeconds) - 6} textAnchor="start" className="fill-emerald-700 text-[13px]">เป้า {formatTrackTime(targetSeconds)}</text>
          </g>
        )}
        <path d={path} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-blue-800" />
        {points.map(point => (
          <g key={point.id}>
            <circle cx={x(point.date)} cy={y(point.seconds)} r={point.isPB ? 6 : 4} className={point.isPB ? "fill-violet-600 stroke-white" : "fill-blue-800 stroke-white"} strokeWidth={1.5}>
              <title>{`${formatThaiDate(point.date)} · ${formatTrackTime(point.seconds)}${point.isPB ? " (PB)" : ""}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-600 align-middle" />PB</span>
        <span><span className="mr-1 inline-block h-0.5 w-4 bg-emerald-600 align-middle" />เป้าเวลา</span>
        <span>เส้นขึ้น = เวลาเร็วขึ้น</span>
      </p>
    </figure>
  );
}
