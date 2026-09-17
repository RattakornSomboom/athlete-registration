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
