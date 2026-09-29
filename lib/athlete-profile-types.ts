export type AthleteProfile = {
  studentId: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studentLevel: "bachelor" | "graduate";
  year: string;
  nationalId: string;
  nationality: string;
  birthDate: string; // yyyy-mm-dd
  gpaSemester: string;
  gpaCumulative: string;
  addressNo: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  photoName?: string;
  photoUrl?: string | null;
  // สำหรับคำนวณสิทธิ์
  birthYearCE: number;
  previousEntriesCount: number;
};
