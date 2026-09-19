"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type Advisor = {
  name: string;
  phone: string;
};

type ClubAccount = {
  id: string;
  clubName: string;
  sport: string;
  presidentName: string;
  presidentPhone: string;
  email: string;
  advisors: Advisor[];
  status: "active" | "pending" | "inactive";
  createdAt: string;
};

const MOCK_CLUBS: ClubAccount[] = [
  { 
    id: "1", clubName: "ชมรมวิ่ง ว่าย พาย ปั่น (กรีฑา ว่ายน้ำ)", sport: "กรีฑา ว่ายน้ำ", 
    presidentName: "นางสาวภณิตา สุขโข", presidentPhone: "09 8753 9936", email: "phanita@up.ac.th", 
    advisors: [
      { name: "นายสัณห์ชัย หยีวิยม", phone: "0816809005" },
      { name: "ดร.พัชรินทร์ ตั้งชัยสุริยา", phone: "0979636465" },
      { name: "นางสาวจุมพิศตรา ผูกจิต", phone: "0895521917" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "2", clubName: "ชมรมบาสเกตบอล", sport: "บาสเกตบอล", 
    presidentName: "นายจตุรเทพ อินทนนท์", presidentPhone: "09 5672 0118", email: "jaturothep@up.ac.th", 
    advisors: [
      { name: "ผศ.ภญ.จันทิมา ชูรัศมี", phone: "0865912228" },
      { name: "รศ.ดร.พยุงศักดิ์ ตันติไพบูลย์วงศ์", phone: "0847120880" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "3", clubName: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา", sport: "ฟุตบอล", 
    presidentName: "นายปราบปกป้อง ถาเเหล่ง", presidentPhone: "09 6145 5647", email: "prabpokpong@up.ac.th", 
    advisors: [
      { name: "ดร.พิเชษฐ์ ชัยเลิศ", phone: "0868252946" },
      { name: "นายคะนอง ปิงเมือง", phone: "0869099087" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "4", clubName: "ชมรมวอลเลย์บอล", sport: "วอลเลย์บอล", 
    presidentName: "นายอิทธิพัทธ์ กลิ่นทอง", presidentPhone: "09 4621 0026", email: "itthipat@up.ac.th", 
    advisors: [
      { name: "นายปัณณธร วุฒิปริยาธร", phone: "0621952839" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "5", clubName: "ชมรมเทควันโด มหาวิทยาลัยพะเยา TKB UP", sport: "เทควันโด", 
    presidentName: "นางสาววรัญญา นาระกันทา", presidentPhone: "08 9430 8140", email: "waranya@up.ac.th", 
    advisors: [
      { name: "นายตฤณ ธุระพ่อค้า", phone: "0988195665" },
      { name: "นายเพ็ชร พงษ์เฉย", phone: "0846130680" },
      { name: "นางสาวพรทิพา นุโปจา", phone: "0904407416" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "6", clubName: "ชมรมมวยมหาวิทยาลัยพะเยา (มวยไทยสมัครเล่น)", sport: "มวยไทยสมัครเล่น", 
    presidentName: "นายณัฐชนน ตาหล้า", presidentPhone: "08 2896 2373", email: "natchanon@up.ac.th", 
    advisors: [
      { name: "นายเกรียงไกร แถบคำ", phone: "0956865743" },
      { name: "ดร.อทิติ วลัญฐ์เพียร", phone: "0849417721" },
      { name: "ผศ.ดร. ธีรภัทร ศรีรัตนโชติ", phone: "0865902493" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "7", clubName: "ชมรมเปตอง มหาวิทยาลัยพะเยา", sport: "เปตอง", 
    presidentName: "นางสาวภัทรวนันท์ เรือนคำ", presidentPhone: "0828962373", email: "phatrawanan@up.ac.th", 
    advisors: [
      { name: "ผศ.ดร.ธเนศ ทองเดชศรี", phone: "0865670396" },
      { name: "นายพงศกร ศิริคำน้อย", phone: "0875445792" },
      { name: "นางสาวลานนา หมื่นจันทร์", phone: "0831546007" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "8", clubName: "ชมรมปิงปองมหาวิทยาลัยพะเยา", sport: "เทเบิลเทนนิส", 
    presidentName: "นายนพวิชญ์ เชิงสุขศิริกุล", presidentPhone: "08 6557 6810", email: "nopawit@up.ac.th", 
    advisors: [
      { name: "นายณัฐกร คำปวน", phone: "0847139284" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "9", clubName: "ชมรมแบดมินตัน มหาวิทยาลัยพะเยา", sport: "แบดมินตัน", 
    presidentName: "นายธนทัศน์ ชาววังฆ้อง", presidentPhone: "09 7964 4093", email: "thanathat@up.ac.th", 
    advisors: [
      { name: "ผศ.ดร.อักษรากร คำมาสุข", phone: "0956982162" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "10", clubName: "ชมรมฟุตซอล มหาวิทยาลัยพะเยา", sport: "ฟุตซอล", 
    presidentName: "นายณัฐภูมินทร์ เถาเปียง", presidentPhone: "09 3574 6467", email: "natthapoomin@up.ac.th", 
    advisors: [
      { name: "ผศ.ดร.กฤษดา ตามประดิษฐ์", phone: "0876295552" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  },
  { 
    id: "11", clubName: "ชมรมวู้ดบอล มหาวิทยาลัยพะเยา", sport: "วู้ดบอล", 
    presidentName: "นายพีรเดช สินประเสริฐ", presidentPhone: "08 0003 7723", email: "peeradet@up.ac.th", 
    advisors: [
      { name: "นายสิทธิวิทย์ อิ่มปัญญา", phone: "0988108101" }
    ],
    status: "active", createdAt: "1 ม.ค. 2568" 
  }
];

const STATUS_LABEL = {
  active: { label: "เปิดใช้งาน", className: "bg-green-100 text-green-700" },
  pending: { label: "รอการอนุมัติ", className: "bg-yellow-100 text-yellow-800" },
  inactive: { label: "ยังไม่มีประธาน", className: "bg-gray-100 text-gray-500" },
};

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubAccount[]>(MOCK_CLUBS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [newPresidentForm, setNewPresidentForm] = useState({ presidentName: "", presidentPhone: "", email: "" });
  const [showAddNewClubModal, setShowAddNewClubModal] = useState(false);
  const [newClubForm, setNewClubForm] = useState({
    clubName: "",
    sport: "",
    presidentName: "",
    presidentPhone: "",
    username: "",
    password: ""
  });

  const pendingCount = clubs.filter((c) => c.status === "pending").length;

  const handleApprove = (id: string) => {
    setClubs((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" } : c));
  };

  const handleSetPresident = () => {
    if (!selectedClubId || !newPresidentForm.presidentName || !newPresidentForm.email) return;
    setClubs((prev) => prev.map((c) =>
      c.id === selectedClubId
        ? { ...c, presidentName: newPresidentForm.presidentName, presidentPhone: newPresidentForm.presidentPhone, email: newPresidentForm.email, status: "pending", createdAt: "วันนี้" }
        : c
    ));
    setShowAddModal(false);
    setSelectedClubId(null);
    setNewPresidentForm({ presidentName: "", presidentPhone: "", email: "" });
  };

  const handleAddNewClub = () => {
    if (!newClubForm.clubName || !newClubForm.sport || !newClubForm.presidentName || !newClubForm.username || !newClubForm.password) return;
    
    const newClub: ClubAccount = {
      id: Math.random().toString(36).substr(2, 9),
      clubName: newClubForm.clubName,
      sport: newClubForm.sport,
      presidentName: newClubForm.presidentName,
      presidentPhone: newClubForm.presidentPhone,
      email: newClubForm.username,
      advisors: [],
      status: "active",
      createdAt: "วันนี้"
    };
    
    setClubs([...clubs, newClub]);
    setShowAddNewClubModal(false);
    setNewClubForm({ clubName: "", sport: "", presidentName: "", presidentPhone: "", username: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton />
          <LogoutButton />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบผู้ดูแลระบบกลาง · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การบริหารจัดการบัญชีผู้ใช้งานประธานชมรมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              กำหนดสิทธิ์และแต่งตั้งผู้รับผิดชอบชมรมกีฬาแต่ละชนิด สำหรับการแข่งขัน กกมท. ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddNewClubModal(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
            >
              + เพิ่มชมรมกีฬาใหม่
            </button>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-amber-900">คำขอแต่งตั้งหรือเปลี่ยนตัวประธานชมรมรอการอนุมัติ</h3>
              <p className="text-xs text-amber-800 mt-0.5">มีคำขอจำนวน <span className="font-bold">{pendingCount}</span> รายการ ที่รอการอนุมัติจากผู้ดูแลระบบ</p>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 shadow-xs">
          <strong>แนวปฏิบัติ:</strong> เมื่อมีการจัดตั้งชมรมใหม่หรือเปลี่ยนวาระประธานชมรม ผู้ดูแลระบบต้องกำหนดบัญชีผู้ใช้งานและอนุมัติสิทธิ์ในระบบนี้ เพื่อให้ประธานชมรมสามารถเข้าสู่ระบบและจัดทำบัญชีรายชื่อนักกีฬาได้
        </div>

        <div className="space-y-3">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{club.clubName}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                      club.status === "active"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : club.status === "pending"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {STATUS_LABEL[club.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">ชนิดกีฬา: {club.sport}</p>
                  {club.presidentName !== "-" && (
                    <div className="mt-3 text-xs text-slate-600">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                        <div>
                          <p className="font-semibold text-slate-800">ประธานชมรม</p>
                          <p>{club.presidentName} {club.presidentPhone && `(โทร: ${club.presidentPhone})`}</p>
                          <p className="text-xs text-gray-400">{club.email}</p>
                        </div>
                        {club.advisors && club.advisors.length > 0 && (
                          <div className="pt-1 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-1">อาจารย์ที่ปรึกษา</p>
                            <ul className="space-y-1">
                              {club.advisors.map((adv, idx) => (
                                <li key={idx}>• {adv.name} {adv.phone && `(โทร: ${adv.phone})`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {club.createdAt !== "-" && <p className="text-xs text-gray-400 mt-2">กำหนดเมื่อ: {club.createdAt}</p>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {club.status === "pending" && (
                    <button
                      onClick={() => handleApprove(club.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      อนุมัติ
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedClubId(club.id); setShowAddModal(true); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {club.status === "inactive" ? "แต่งตั้งประธาน" : "เปลี่ยนตัวประธาน"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal กำหนด/เปลี่ยนประธาน */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-300 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">แต่งตั้งประธานชมรมกีฬา</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {clubs.find((c) => c.id === selectedClubId)?.clubName}
                </p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setSelectedClubId(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล ประธานชมรม <span className="text-rose-600">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={newPresidentForm.presidentName}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, presidentName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="0XX-XXX-XXXX"
                  value={newPresidentForm.presidentPhone}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, presidentPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมลมหาวิทยาลัย (@up.ac.th) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="xxxxxxxx@up.ac.th"
                  value={newPresidentForm.email}
                  onChange={(e) => setNewPresidentForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                เมื่อบันทึกแล้ว ระบบจะส่งสถานะเป็น "รอการอนุมัติ" ให้ผู้ดูแลระบบตรวจสอบอีกครั้งก่อนเปิดสิทธิ์การใช้งาน
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => { setShowAddModal(false); setSelectedClubId(null); }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSetPresident}
                disabled={!newPresidentForm.presidentName || !newPresidentForm.email}
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่มชมรมใหม่ */}
      {showAddNewClubModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-300 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">เพิ่มชมรมกีฬาใหม่และกำหนดบัญชีผู้ใช้</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ขึ้นทะเบียนชมรมสังกัดมหาวิทยาลัยพะเยาและสร้างสิทธิ์เข้าใช้งานระบบ
                </p>
              </div>
              <button
                onClick={() => setShowAddNewClubModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อชมรมกีฬา <span className="text-rose-600">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="เช่น ชมรมฟุตซอล มหาวิทยาลัยพะเยา"
                  value={newClubForm.clubName}
                  onChange={(e) => setNewClubForm((p) => ({ ...p, clubName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชนิดกีฬาที่รับผิดชอบ <span className="text-rose-600">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="เช่น ฟุตซอล"
                  value={newClubForm.sport}
                  onChange={(e) => setNewClubForm((p) => ({ ...p, sport: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล ประธานชมรม <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="ชื่อ - นามสกุล"
                    value={newClubForm.presidentName}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, presidentName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="0XX-XXX-XXXX"
                    value={newClubForm.presidentPhone}
                    onChange={(e) => setNewClubForm((p) => ({ ...p, presidentPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                  กำหนดบัญชีผู้ใช้งานสำหรับ Login (ประธานชมรม)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none"
                      placeholder="เช่น futsal_up"
                      value={newClubForm.username}
                      onChange={(e) => setNewClubForm((p) => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                      placeholder="••••••••"
                      value={newClubForm.password}
                      onChange={(e) => setNewClubForm((p) => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddNewClubModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddNewClub}
                disabled={!newClubForm.clubName || !newClubForm.sport || !newClubForm.presidentName || !newClubForm.username || !newClubForm.password}
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                บันทึกและขึ้นทะเบียนชมรม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}