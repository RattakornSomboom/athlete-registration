"use client";

import { useState } from "react";
import type { AthleteExcellenceItem } from "@/lib/performance-service";

export default function PerformanceQuadrantChart({
  athletes,
  onSelectAthlete,
}: {
  athletes: AthleteExcellenceItem[];
  onSelectAthlete?: (athlete: AthleteExcellenceItem) => void;
}) {
  const [activeAthlete, setActiveAthlete] = useState<AthleteExcellenceItem | null>(null);

  if (!athletes.length) return null;

  // ขอบเขตพิกัด SVG (0 - 100)
  // แกน X = Fitness Average (สมรรถภาพก่อนแข่ง 0 - 100)
  // แกน Y = Competition Score หรือ Performance Index (0 - 100) โดยแกน Y ของ SVG ทิศลง จึงใช้ 100 - Y
  const width = 640;
  const height = 360;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // จุดตัดกึ่งกลางของ 4 จตุภาค: X = 75 (เกณฑ์สมรรถภาพดี), Y = 70 (เกณฑ์ผลงานผ่าน)
  const splitX = 75;
  const splitY = 70;

  const toSvgX = (val: number) => padding.left + (val / 100) * plotWidth;
  const toSvgY = (val: number) => padding.top + ((100 - val) / 100) * plotHeight;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-800">
            กราฟวิเคราะห์ 4 จตุภาค (เปรียบเทียบความพร้อมก่อนแข่ง vs ผลงานจริง)
          </h4>
          <p className="text-[11px] text-slate-500">
            จำแนกสถานะนักกีฬา: แกน X = สมรรถภาพก่อนแข่ง (%) · แกน Y = ดัชนีผลงานจริง (คะแนน 0–100)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" /> กลุ่มยอดเยี่ยม (ฟิตสมบูรณ์)
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" /> กลุ่มเสี่ยงบาดเจ็บ (ยืดหยุ่นต่ำ)
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-rose-800">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs" /> กลุ่มต้องพัฒนาเร่งด่วน
          </span>
        </div>
      </div>

      <div className="relative mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          style={{ maxHeight: "360px" }}
        >
          {/* พื้นหลัง 4 จตุภาค */}
          {/* จตุภาคซ้ายล่าง: กลุ่มต้องพัฒนาเร่งด่วน (สีแดงจาง) */}
          <rect
            x={padding.left}
            y={toSvgY(splitY)}
            width={(splitX / 100) * plotWidth}
            height={((100 - splitY) / 100) * plotHeight}
            fill="#fff1f2"
            opacity="0.6"
          />
          {/* จตุภาคขวาล่าง: กลุ่มหลุดเป้าหมาย (สีเทาฟ้าจาง) */}
          <rect
            x={toSvgX(splitX)}
            y={toSvgY(splitY)}
            width={((100 - splitX) / 100) * plotWidth}
            height={((100 - splitY) / 100) * plotHeight}
            fill="#f8fafc"
            opacity="0.8"
          />
          {/* จตุภาคซ้ายบน: กลุ่มเสี่ยงบาดเจ็บ (สีเหลืองอำพันจาง) */}
          <rect
            x={padding.left}
            y={padding.top}
            width={(splitX / 100) * plotWidth}
            height={(splitY / 100) * plotHeight}
            fill="#fffbeb"
            opacity="0.7"
          />
          {/* จตุภาคขวาบน: กลุ่มยอดเยี่ยม (สีเขียวจาง) */}
          <rect
            x={toSvgX(splitX)}
            y={padding.top}
            width={((100 - splitX) / 100) * plotWidth}
            height={(splitY / 100) * plotHeight}
            fill="#f0fdf4"
            opacity="0.7"
          />

          {/* ป้ายกำกับ 4 โซน (ภาษาไทยชัดเจน) */}
          <text x={toSvgX(splitX) + 10} y={padding.top + 20} className="fill-emerald-800 text-[11px] font-bold">
            ★ กลุ่มยอดเยี่ยม (ฟิตสมบูรณ์ & ผลงานเลิศ)
          </text>
          <text x={padding.left + 10} y={padding.top + 20} className="fill-amber-800 text-[11px] font-bold">
            ⚠ กลุ่มเสี่ยงบาดเจ็บ (ผลงานดีแต่ความยืดหยุ่นต่ำ)
          </text>
          <text x={padding.left + 10} y={toSvgY(splitY) + 20} className="fill-rose-700 text-[11px] font-bold">
            ▼ กลุ่มต้องเร่งยกระดับ (สมรรถภาพตก & หลุดเป้าเวลา)
          </text>
          <text x={toSvgX(splitX) + 10} y={toSvgY(splitY) + 20} className="fill-slate-500 text-[11px] font-semibold">
            ◷ กลุ่มหลุดเป้าหมาย (ความฟิตสูงแต่ผลงานหลุดเป้า)
          </text>

          {/* เส้นแบ่งจตุภาค (Crosshair lines) */}
          <line
            x1={toSvgX(splitX)}
            y1={padding.top}
            x2={toSvgX(splitX)}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={toSvgY(splitY)}
            x2={width - padding.right}
            y2={toSvgY(splitY)}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* เส้นแกนหลัก X และ Y */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* สเกลและข้อความแกน X */}
          {[0, 25, 50, 75, 100].map(val => (
            <g key={`x-${val}`}>
              <line
                x1={toSvgX(val)}
                y1={height - padding.bottom}
                x2={toSvgX(val)}
                y2={height - padding.bottom + 5}
                stroke="#64748b"
              />
              <text
                x={toSvgX(val)}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-slate-600 text-[10px]"
              >
                {val}%
              </text>
            </g>
          ))}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="fill-slate-700 text-[11px] font-bold"
          >
            สมรรถภาพทางกายเฉลี่ยก่อนแข่งขัน (ร้อยละความพร้อม 0–100%)
          </text>

          {/* สเกลและข้อความแกน Y */}
          {[0, 25, 50, 75, 100].map(val => (
            <g key={`y-${val}`}>
              <line
                x1={padding.left - 5}
                y1={toSvgY(val)}
                x2={padding.left}
                y2={toSvgY(val)}
                stroke="#64748b"
              />
              <text
                x={padding.left - 8}
                y={toSvgY(val) + 3}
                textAnchor="end"
                className="fill-slate-600 text-[10px]"
              >
                {val}
              </text>
            </g>
          ))}
          <text
            x={-(padding.top + plotHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            className="fill-slate-700 text-[11px] font-bold"
          >
            ดัชนีผลงานการแข่งขันจริง (คะแนน 0–100)
          </text>

          {/* จุดแสดงตำแหน่งของนักกีฬาแต่ละคน */}
          {athletes.map(athlete => {
            const xVal = athlete.analysis.fitnessAverage ?? 50;
            const yVal = athlete.analysis.performanceIndex;
            const cx = toSvgX(xVal);
            const cy = toSvgY(yVal);
            const isHovered = activeAthlete?.applicationId === athlete.applicationId;

            // กำหนดสีของจุดตามความพร้อมและคอขวด
            const color =
              yVal >= 80 && xVal >= 75
                ? "#10b981" // เขียว: ยอดเยี่ยม
                : athlete.analysis.weaknesses.some(w => w.includes("ยืดหยุ่น"))
                  ? "#f59e0b" // ส้ม: เสี่ยงบาดเจ็บ
                  : xVal < 65 || yVal < 60
                    ? "#f43f5e" // แดง: คอขวดต้องพัฒนา
                    : "#3b82f6"; // น้ำเงิน: ทั่วไป

            return (
              <g
                key={athlete.applicationId}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => {
                  setActiveAthlete(athlete);
                  if (onSelectAthlete) onSelectAthlete(athlete);
                }}
                onMouseEnter={() => setActiveAthlete(athlete)}
              >
                {/* วงแหวนสะท้อนเมื่อ hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="14"
                    fill={color}
                    opacity="0.25"
                    className="animate-pulse"
                  />
                )}
                {/* จุดหลัก */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "8" : "6"}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />
                {/* ป้ายชื่อย่อข้างจุด */}
                <text
                  x={cx + 10}
                  y={cy + 4}
                  className="fill-slate-900 text-[10px] font-bold pointer-events-none drop-shadow-xs"
                >
                  {athlete.athleteName.split(" ")[0]} ({athlete.analysis.performanceIndex})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip / Info Card เมื่อกดเลือกนักกีฬาจากจุดบนกราฟ */}
      {activeAthlete && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3 shadow-xs flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">{activeAthlete.athleteName}</span>
              <span className="text-[11px] text-slate-500">
                {activeAthlete.sport} · {activeAthlete.faculty}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              ก่อนแข่งฟิต <strong>{activeAthlete.analysis.fitnessAverage}%</strong> ➔ หลังแข่งอันดับ{" "}
              <strong>{activeAthlete.matchResult?.rank ?? "-"}</strong> (ผล: {activeAthlete.matchResult?.outcome ?? "-"}) ·{" "}
              ดัชนีรวม <strong>คะแนน {activeAthlete.analysis.performanceIndex}</strong>
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-blue-900">
              🎯 แผนการพัฒนา: {activeAthlete.analysis.actionPlan}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveAthlete(null)}
            className="self-end sm:self-center text-xs font-semibold text-slate-400 hover:text-slate-700"
          >
            ✕ ปิดกล่อง
          </button>
        </div>
      )}
    </div>
  );
}
