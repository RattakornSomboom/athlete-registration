import Link from "next/link";
export default function AdminPage() {
  return <main className="mx-auto max-w-3xl space-y-6 p-8"><h1 className="text-2xl font-bold">ผู้ดูแลระบบ</h1><nav className="grid gap-4">{[["users", "จัดการผู้ใช้งาน"], ["clubs", "จัดการชมรม"], ["competitions", "ตั้งค่าการแข่งขัน กีฬา โควตา และวันรับสมัคร"]].map(([path, label]) => <Link key={path} href={"/admin/" + path} className="rounded border p-4 text-purple-800">{label}</Link>)}<Link href="/staff/applications">พิจารณาใบสมัครและประกาศผล</Link><Link href="/staff/analytics">สถิติและส่งออก</Link></nav></main>;
}
