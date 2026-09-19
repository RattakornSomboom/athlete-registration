export type AthleteExportRow = {
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
};

export function exportAthletesToCSV(filename: string, data: AthleteExportRow[]) {
  const headers = [
    "ลำดับ", "ชื่อ-สกุล", "รหัสนิสิต", "เลขประจำตัวประชาชน", "เพศ",
    "คณะ", "สาขา", "ระดับการศึกษา", "ชั้นปี", "ชนิดกีฬา",
    "ตำแหน่ง", "บัญชี", "สถานะ", "เกรดเฉลี่ยสะสม", "โทรศัพท์",
  ];

  const rows = data.map((row) => [
    row.index,
    row.fullName,
    row.studentId,
    row.nationalId,
    row.gender,
    row.faculty,
    row.major,
    row.studentLevel,
    row.year,
    row.sportName,
    row.position,
    row.squadType,
    row.status,
    row.gpaCumulative,
    row.phone,
  ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));

  const bom = "\uFEFF"; // BOM for Excel UTF-8
  const csvContent = bom + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
