"use client";

import { useParams, useRouter } from "next/navigation";

const MOCK_ATHLETES = [
  {
    id: "1",
    firstName: "สมชาย",
    lastName: "ใจดี",
    studentId: "66027012",
    faculty: "วิทยาศาสตร์",
    major: "วิทยาการคอมพิวเตอร์",
    year: "4",
    phone: "081-234-5678",
    email: "66027012@up.ac.th",
    sport: "ฟุตบอล",
    position: "กองหน้า",
    experience: "3-5 ปี",
    achievement: "แชมป์กีฬาเขต ปี 2566",
    note: "สามารถเล่นได้หลายตำแหน่ง",
    club: "ชมรมฟุตบอล",
    statusHistory: [
      {
        status: "submitted",
        label: "ส่งใบสมัคร",
        date: "17 พ.ค. 2568 10:30",
        by: "สมชาย ใจดี",
      },
    ],
    currentStatus: "submitted",
    files: ["ผลงาน_สมชาย.pdf"],
  },

  {
    id: "2",
    firstName: "สมหญิง",
    lastName: "รักดี",
    studentId: "66027013",
    faculty: "วิศวกรรมศาสตร์",
    major: "วิศวกรรมคอมพิวเตอร์",
    year: "3",
    phone: "082-111-2222",
    email: "66027013@up.ac.th",
    sport: "ฟุตบอล",
    position: "กองกลาง",
    experience: "1-3 ปี",
    achievement: "รองแชมป์กีฬามหาวิทยาลัย",
    note: "",
    club: "ชมรมฟุตบอล",
    statusHistory: [
      {
        status: "submitted",
        label: "ส่งใบสมัคร",
        date: "18 พ.ค. 2568 09:00",
        by: "สมหญิง รักดี",
      },
    ],
    currentStatus: "submitted",
    files: [],
  },

  {
    id: "3",
    firstName: "มานะ",
    lastName: "สู้งาน",
    studentId: "65027001",
    faculty: "บริหาร",
    major: "การจัดการ",
    year: "4",
    phone: "083-555-6666",
    email: "65027001@up.ac.th",
    sport: "ฟุตบอล",
    position: "ผู้รักษาประตู",
    experience: "มากกว่า 5 ปี",
    achievement: "เหรียญทองกีฬาแห่งชาติ",
    note: "เคยเป็นตัวแทนจังหวัด",
    club: "ชมรมฟุตบอล",
    statusHistory: [
      {
        status: "submitted",
        label: "ส่งใบสมัคร",
        date: "15 พ.ค. 2568 11:00",
        by: "มานะ สู้งาน",
      },
      {
        status: "club_approved",
        label: "ชมรมอนุมัติ",
        date: "16 พ.ค. 2568 13:00",
        by: "ประธานชมรมฟุตบอล",
      },
    ],
    currentStatus: "club_approved",
    files: ["certificate.pdf"],
  },

  {
    id: "4",
    firstName: "ธนา",
    lastName: "มั่งมี",
    studentId: "65033010",
    faculty: "เศรษฐศาสตร์",
    major: "เศรษฐศาสตร์",
    year: "4",
    phone: "084-999-8888",
    email: "65033010@up.ac.th",
    sport: "ว่ายน้ำ",
    position: "100 เมตร ผีเสื้อ",
    experience: "มากกว่า 5 ปี",
    achievement: "สถิติมหาวิทยาลัย",
    note: "",
    club: "ชมรมว่ายน้ำ",
    statusHistory: [
      {
        status: "submitted",
        label: "ส่งใบสมัคร",
        date: "10 พ.ค. 2568",
        by: "ธนา มั่งมี",
      },
      {
        status: "club_approved",
        label: "ชมรมอนุมัติ",
        date: "11 พ.ค. 2568",
        by: "ประธานชมรมว่ายน้ำ",
      },
      {
        status: "selected",
        label: "กิจการนิสิตคัดเลือก",
        date: "12 พ.ค. 2568",
        by: "เจ้าหน้าที่กิจการนิสิต",
      },
    ],
    currentStatus: "selected",
    files: ["swimming_record.pdf"],
  },
];

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-700",
  club_approved: "bg-blue-100 text-blue-700",
  club_rejected: "bg-red-100 text-red-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const CURRENT_STATUS: Record<string, string> = {
  submitted: "รอชมรมพิจารณา",
  club_approved: "ชมรมอนุมัติแล้ว",
  club_rejected: "ชมรมไม่อนุมัติ",
  selected: "ผ่านการคัดเลือก",
  rejected: "ไม่ผ่านการคัดเลือก",
};

export default function AthleteDetailPage() {
  const router = useRouter();
  const params = useParams();

  const athlete = MOCK_ATHLETES.find(
    (a) => a.id === params.id
  );

  const handlePrint = () => window.print();

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            ไม่พบข้อมูลนักกีฬา
          </h1>

          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .print-container {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-6 no-print">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← ย้อนกลับ
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              🖨️ พิมพ์ / บันทึก PDF
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm print-container">

            <div className="border-b border-gray-100 px-8 py-6 text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ใบสมัครนักกีฬา
              </h1>

              <p className="text-gray-500 text-sm mt-1">
                กีฬามหาวิทยาลัยแห่งประเทศไทย — มหาวิทยาลัยพะเยา
              </p>
            </div>

            <div className="px-8 py-6 space-y-6">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  สถานะปัจจุบัน
                </span>

                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    STATUS_COLOR[athlete.currentStatus]
                  }`}
                >
                  {CURRENT_STATUS[athlete.currentStatus]}
                </span>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
                  ข้อมูลส่วนตัว
                </h2>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">ชื่อ-นามสกุล</span>
                    <p className="font-medium">
                      {athlete.firstName} {athlete.lastName}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">รหัสนิสิต</span>
                    <p className="font-medium">{athlete.studentId}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">คณะ</span>
                    <p className="font-medium">{athlete.faculty}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">สาขา</span>
                    <p className="font-medium">{athlete.major}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">ชั้นปี</span>
                    <p className="font-medium">ปี {athlete.year}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">เบอร์โทรศัพท์</span>
                    <p className="font-medium">{athlete.phone}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">อีเมล</span>
                    <p className="font-medium">{athlete.email}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">ชมรม</span>
                    <p className="font-medium">{athlete.club}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
                  ข้อมูลกีฬา
                </h2>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">ชนิดกีฬา</span>
                    <p className="font-medium">{athlete.sport}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">ตำแหน่ง</span>
                    <p className="font-medium">{athlete.position}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">ประสบการณ์</span>
                    <p className="font-medium">{athlete.experience}</p>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <span className="text-gray-500">
                    ผลงาน / รางวัล
                  </span>

                  <p className="font-medium mt-1">
                    {athlete.achievement || "-"}
                  </p>
                </div>

                {athlete.note && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">หมายเหตุ</span>

                    <p className="font-medium mt-1">
                      {athlete.note}
                    </p>
                  </div>
                )}
              </div>

              {athlete.files.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
                    ไฟล์แนบ
                  </h2>

                  <div className="space-y-2">
                    {athlete.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span>
                          {file.endsWith(".pdf") ? "📄" : "🖼️"}
                        </span>
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
                  ประวัติสถานะ
                </h2>

                <div className="space-y-3">
                  {athlete.statusHistory.map((h, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 mt-0.5" />

                        {i < athlete.statusHistory.length - 1 && (
                          <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                        )}
                      </div>

                      <div className="pb-3">
                        <p className="text-sm font-medium">
                          {h.label}
                        </p>

                        <p className="text-xs text-gray-500">
                          {h.date} — {h.by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}