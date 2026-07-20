"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Position = "manager" | "coach" | "assistant_coach" | "other";

const POSITION_LABEL: Record<Position, string> = {
  manager: "ผู้จัดการทีม",
  coach: "ผู้ฝึกสอน",
  assistant_coach: "ผู้ช่วยผู้ฝึกสอน",
  other: "อื่นๆ",
};

export default function TeamOfficialRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [nameChangeFile, setNameChangeFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    nationality: "ไทย",
    birthDate: "",
    addressNo: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    workplace: "",
    workPosition: "",
    previousCount: "",
    appliedPosition: "" as Position | "",
    appliedPositionOther: "",
    acceptedRules: "false",
  });

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const fileHandler = (setter: (f: File | null) => void, maxMB = 10) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= maxMB * 1024 * 1024) setter(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("submit team official", {
        ...form,
        photo: photo?.name,
        planFile: planFile?.name,
        idCardFile: idCardFile?.name,
        nameChangeFile: nameChangeFile?.name,
      });
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/team-official/status");
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!(
    form.firstName && form.lastName && form.nationalId && form.birthDate &&
    form.addressNo && form.subDistrict && form.district && form.province && form.postalCode &&
    form.phone && form.email && form.workplace && form.workPosition &&
    form.appliedPosition && planFile && idCardFile && form.acceptedRules === "true"
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ใบสมัครเจ้าหน้าที่ทีม</h1>
            <p className="text-gray-500 text-sm mt-1">ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยผู้ฝึกสอน — กีฬามหาวิทยาลัยฯ ครั้งที่ 52</p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

          <p className="text-sm font-medium text-gray-700">รูปถ่ายชุดสุภาพ (ขนาด 1 นิ้ว)</p>
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <span className="text-2xl mb-1">📷</span>
            <span className="text-xs text-gray-500 text-center px-2">{photo ? photo.name : "แนบรูปถ่าย"}</span>
            <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setPhoto, 5)} />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประจำตัวประชาชน</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สัญชาติ</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันเดือนปีเกิด</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
          </div>

          <p className="text-sm font-medium text-gray-700 pt-2">ที่อยู่ปัจจุบัน</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">เลขที่</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.addressNo} onChange={(e) => set("addressNo", e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.subDistrict} onChange={(e) => set("subDistrict", e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.province} onChange={(e) => set("province", e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">โทรศัพท์</label><input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ทำงาน</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.workplace} onChange={(e) => set("workplace", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง (ที่ทำงาน)</label>
            <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.workPosition} onChange={(e) => set("workPosition", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เคยปฏิบัติหน้าที่นี้มาก่อนกี่ครั้ง (ไม่รวมครั้งนี้)</label>
            <input type="number" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.previousCount} onChange={(e) => set("previousCount", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ขอสมัครเป็น</label>
            <div className="grid grid-cols-2 gap-3">
              {(["manager", "coach", "assistant_coach", "other"] as Position[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("appliedPosition", p)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.appliedPosition === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  {POSITION_LABEL[p]}
                </button>
              ))}
            </div>
            {form.appliedPosition === "other" && (
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2" placeholder="ระบุตำแหน่ง" value={form.appliedPositionOther} onChange={(e) => set("appliedPositionOther", e.target.value)} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สำเนาบัตรประจำตัวประชาชน</label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-500">{idCardFile ? idCardFile.name : "คลิกเพื่อแนบไฟล์ (PDF/JPG)"}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setIdCardFile)} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สำเนาหลักฐานเปลี่ยนชื่อ-นามสกุล (ถ้ามี)</label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-500">{nameChangeFile ? nameChangeFile.name : "คลิกเพื่อแนบไฟล์ (PDF/JPG)"}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setNameChangeFile)} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แผนการฝึกซ้อมกีฬา (อย่างน้อย 1 เดือน)</label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-500">{planFile ? planFile.name : "คลิกเพื่อแนบไฟล์ (PDF)"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={fileHandler(setPlanFile)} />
            </label>
          </div>

          <label className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              checked={form.acceptedRules === "true"} 
              onChange={(e) => set("acceptedRules", e.target.checked ? "true" : "false")} 
            />
            <span>ข้าพเจ้ารับทราบระเบียบและข้อบังคับการจัดการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทยโดยละเอียด และยินดีปฏิบัติตามคำตัดสินของคณะกรรมการฯ ทุกประการ</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "กำลังส่งข้อมูล..." : "ส่งใบสมัคร"}
          </button>
        </div>
      </div>
    </div>
  );
}