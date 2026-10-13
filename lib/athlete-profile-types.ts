export type AthleteProfile = {
  studentId: string;
  firstName: string;
  lastName: string;
  gender?: "male" | "female" | "";
  faculty: string;
  major: string;
  studentLevel: "bachelor" | "graduate";
  year: string;
  semester?: string | null;
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
  participateCountBachelor?: number | null;
  participateCountMaster?: number | null;
  participateCountPhd?: number | null;
};
