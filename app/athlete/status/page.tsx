"use client";

export default function AthleteStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">สถานะการสมัคร</h1>
          <p className="text-gray-500 text-sm mt-1">ติดตามผลการพิจารณาของชมรม</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">อยู่ระหว่างการพิจารณา</h2>
          <p className="text-gray-500 text-sm">ชมรมกำลังตรวจสอบข้อมูลของคุณ กรุณารอการแจ้งผล</p>
        </div>
      </div>
    </div>
  );
}