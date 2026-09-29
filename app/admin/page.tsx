import Link from "next/link";

const adminModules = [
  ["/admin/users", "Identity & Access", "จัดการผู้ใช้งาน", "สร้างบัญชี กำหนดบทบาท เปิดหรือระงับบัญชี และส่งลิงก์ตั้งรหัสผ่านใหม่"],
  ["/admin/clubs", "Club Administration", "จัดการชมรมกีฬา", "สร้างชมรม แต่งตั้งประธาน และอนุมัติบัญชีชมรมก่อนเปิดใช้งาน"],
  ["/admin/competitions", "Competition Control", "ตั้งค่าการแข่งขัน", "กำหนดกีฬา โควตา วันสิ้นสุด และสถานะเปิดหรือปิดรับสมัคร"],
  ["/staff/applications", "Operations", "พิจารณาใบสมัคร", "ค้นหา ตรวจสอบ อนุมัติ และประกาศผลรายการแข่งขัน"],
  ["/staff/analytics", "Reporting", "สถิติและส่งออก", "ดูภาพรวมตามการแข่งขัน กีฬา และสถานะ พร้อมส่งออกข้อมูล"],
] as const;

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Administration Console</p>
            <h1 className="mt-2 text-3xl font-bold">ศูนย์ควบคุมผู้ดูแลระบบ</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">จัดการบัญชี ชมรม การแข่งขัน และการดำเนินงานหลักของระบบกีฬามหาวิทยาลัยพะเยา</p>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminModules.map(([href, eyebrow, title, description]) => (
            <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-950 group-hover:text-blue-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-blue-800">เปิดเมนู →</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
