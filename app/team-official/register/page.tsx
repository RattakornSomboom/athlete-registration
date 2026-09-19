"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · การขึ้นทะเบียนบุคลากรกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              แบบคำขอขึ้นทะเบียนเจ้าหน้าที่ทีมกีฬาตัวแทนสถาบัน
            </h1>
            <p className="text-xs text-slate-500">
              ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยผู้ฝึกสอน — การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/team-official/status")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตรวจสอบสถานะ
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">รูปถ่ายหน้าตรงชุดสุภาพ (ขนาด 1 นิ้ว สำหรับทำบัตรประจำตัว)</p>
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
              <span className="text-xs text-slate-500 text-center px-2">{photo ? photo.name : "คลิกแนบรูปถ่าย"}</span>
              <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setPhoto, 5)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 outline-none" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 outline-none" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เลขประจำตัวประชาชน</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 outline-none" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">สัญชาติ</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 outline-none" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">วันเดือนปีเกิด</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
          </div>

          <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 uppercase tracking-wider">ที่อยู่ตามทะเบียนบ้าน / ที่อยู่ปัจจุบัน</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-slate-700 mb-1">บ้านเลขที่ / หมู่</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={form.addressNo} onChange={(e) => set("addressNo", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1">ตำบล / แขวง</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={form.subDistrict} onChange={(e) => set("subDistrict", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ / เขต</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1">จังหวัด</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={form.province} onChange={(e) => set("province", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1">รหัสไปรษณีย์</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label><input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="0XX-XXX-XXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">อีเมลติดต่อ (Email)</label>
              <input type="email" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="example@up.ac.th" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">หน่วยงาน / สถานที่ทำงานปัจจุบัน</label>
              <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น มหาวิทยาลัยพะเยา" value={form.workplace} onChange={(e) => set("workplace", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่งในที่ทำงาน</label>
              <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น อาจารย์, เจ้าหน้าที่, บุคลากรภายนอก" value={form.workPosition} onChange={(e) => set("workPosition", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เคยปฏิบัติหน้าที่นี้ในกีฬามหาวิทยาลัยฯ กี่ครั้ง</label>
              <input type="number" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="0" value={form.previousCount} onChange={(e) => set("previousCount", e.target.value)} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800 mb-2">ตำแหน่งเจ้าหน้าที่ทีมที่ขอขึ้นทะเบียน <span className="text-rose-600">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["manager", "coach", "assistant_coach", "other"] as Position[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("appliedPosition", p)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${form.appliedPosition === p ? "bg-blue-900 text-white border-blue-900 font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  {POSITION_LABEL[p]}
                </button>
              ))}
            </div>
            {form.appliedPosition === "other" && (
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none mt-2" placeholder="โปรดระบุตำแหน่ง เช่น นักกายภาพบำบัด, เจ้าหน้าที่ประสานงาน" value={form.appliedPositionOther} onChange={(e) => set("appliedPositionOther", e.target.value)} />
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สำเนาบัตรประจำตัวประชาชน <span className="text-rose-600">*</span></label>
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
                <span className="text-xs text-slate-500">{idCardFile ? idCardFile.name : "คลิกแนบไฟล์สำเนาบัตรประชาชน (PDF/JPG/PNG)"}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setIdCardFile)} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล (ถ้ามี)</label>
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
                <span className="text-xs text-slate-500">{nameChangeFile ? nameChangeFile.name : "คลิกแนบไฟล์หลักฐาน (ถ้ามี)"}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setNameChangeFile)} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">แผนการฝึกซ้อมกีฬาและเก็บตัว (อย่างน้อย 1 เดือน) <span className="text-rose-600">*</span></label>
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
                <span className="text-xs text-slate-500">{planFile ? planFile.name : "คลิกแนบไฟล์แผนการฝึกซ้อม (PDF)"}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={fileHandler(setPlanFile)} />
              </label>
            </div>
          </div>

          <label className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
              checked={form.acceptedRules === "true"}
              onChange={(e) => set("acceptedRules", e.target.checked ? "true" : "false")}
            />
            <span className="leading-relaxed">ข้าพเจ้ารับทราบระเบียบและข้อบังคับการจัดการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทยโดยละเอียด และยินดีปฏิบัติตามคำตัดสินของคณะกรรมการฯ ทุกประการ</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            {loading ? "กำลังนำส่งข้อมูล..." : "ลงนามส่งแบบคำขอขึ้นทะเบียนเจ้าหน้าที่ทีม"}
          </button>
        </div>
      </div>
    </div>
  );
}