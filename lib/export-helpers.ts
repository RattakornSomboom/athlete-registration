export interface AthleteExportRow {
  index: number;
  fullName: string;
  studentId: string;
  nationalId: string;
  gender: string;
  faculty: string;
  major: string;
  studentLevel: string;
  year: string;
  sportName: string;
  position: string;
  squadType: string;
  status: string;
  gpaCumulative: string;
  phone: string;
}

export function exportAthletesToCSV(filename: string, rows: AthleteExportRow[]) {
  const headers = [
    "ลำดับ",
    "ชื่อ - นามสกุล",
    "รหัสนิสิต",
    "เลขประจำตัวประชาชน",
    "เพศ",
    "คณะ",
    "สาขาวิชา",
    "ระดับการศึกษา",
    "ชั้นปี",
    "ชนิดกีฬา",
    "ตำแหน่ง/ประเภท",
    "ประเภทการส่งชื่อ",
    "สถานะการพิจารณา",
    "เกรดเฉลี่ยสะสม",
    "เบอร์โทรศัพท์",
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.index,
        `"${r.fullName.replace(/"/g, '""')}"`,
        `"${r.studentId}"`,
        `"${r.nationalId}"`,
        `"${r.gender}"`,
        `"${r.faculty.replace(/"/g, '""')}"`,
        `"${r.major.replace(/"/g, '""')}"`,
        `"${r.studentLevel}"`,
        `"${r.year}"`,
        `"${r.sportName.replace(/"/g, '""')}"`,
        `"${r.position.replace(/"/g, '""')}"`,
        `"${r.squadType}"`,
        `"${r.status}"`,
        `"${r.gpaCumulative}"`,
        `"${r.phone}"`,
      ].join(",")
    ),
  ].join("\r\n");

  // ใส่ UTF-8 BOM (﻿) เพื่อให้เปิดใน Microsoft Excel ภาษาไทยไม่เพี้ยน
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface FitnessExportRow {
  index: number;
  studentId: string;
  fullName: string;
  gender: string;
  faculty: string;
  sportName: string;
  round: string;
  testDate: string;
  bmi: string;
  gripStrength: string;
  legStrength: string;
  sitAndReach: string;
  sitUps30s: number;
  pushUps30s: number;
  sprint40m: string;
  beepTest: string;
  vo2max: string;
  overallScore: number;
  overallGrade: string;
  eligibilityStatus: string;
}

export function exportFitnessRecordsToCSV(filename: string, rows: FitnessExportRow[]) {
  const headers = [
    "ลำดับ",
    "รหัสนิสิต",
    "ชื่อ - นามสกุล",
    "เพศ",
    "คณะ",
    "ชนิดกีฬา",
    "รอบการทดสอบ",
    "วันที่ทดสอบ",
    "ดัชนีมวลกาย (BMI)",
    "แรงบีบมือ (กก./นน.ตัว)",
    "แรงเหยียดขา (กก./นน.ตัว)",
    "ความอ่อนตัว (ซม.)",
    "ลุกนั่ง 30 วินาที (ครั้ง)",
    "ดันพื้น 30 วินาที (ครั้ง)",
    "วิ่งเร็ว 40 เมตร (วินาที)",
    "Beep Test (Level)",
    "VO2max ประมาณการ (ml/kg/min)",
    "คะแนนรวม (100)",
    "ระดับผลการประเมิน",
    "สถานะตามเกณฑ์ กกมท.",
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.index,
        `"${r.studentId}"`,
        `"${r.fullName.replace(/"/g, '""')}"`,
        `"${r.gender}"`,
        `"${r.faculty.replace(/"/g, '""')}"`,
        `"${r.sportName.replace(/"/g, '""')}"`,
        `"${r.round}"`,
        `"${r.testDate}"`,
        `"${r.bmi}"`,
        `"${r.gripStrength}"`,
        `"${r.legStrength}"`,
        `"${r.sitAndReach}"`,
        r.sitUps30s,
        r.pushUps30s,
        `"${r.sprint40m}"`,
        `"${r.beepTest}"`,
        `"${r.vo2max}"`,
        r.overallScore,
        `"${r.overallGrade}"`,
        `"${r.eligibilityStatus}"`,
      ].join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

