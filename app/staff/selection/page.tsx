import StaffReview from "@/components/shared/StaffReview";
import { Page } from "@/components/shared/Phase4UI";

export default function SelectionPage() {
  return (
    <Page title="ประกาศผลการคัดเลือก">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        เลือกรายการแข่งขันและตรวจสอบตัวอย่างรายชื่อก่อนประกาศ ระบบจะเผยแพร่เฉพาะผู้สมัครของการแข่งขันที่เลือกเท่านั้น
      </div>
      <StaffReview />
    </Page>
  );
}
