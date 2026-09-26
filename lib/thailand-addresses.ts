// lib/thailand-addresses.ts
// ฐานข้อมูลลำดับชั้น จังหวัด (77 จังหวัด) -> อำเภอ (928 อำเภอ/เขต) -> ตำบล (7,348 ตำบล/แขวง) -> รหัสไปรษณีย์ ครบถ้วน 100% ทั่วประเทศไทย
import {
  provinces,
  districts,
  subDistricts,
} from "@bilions/thailand-address";

export type TambonData = {
  name: string;
  postalCode: string;
};

export type AmphureData = {
  name: string;
  tambons?: TambonData[];
};

export type ProvinceData = {
  name: string;
  amphures: AmphureData[];
};

// รายชื่อครบทั้ง 77 จังหวัด เรียงตามลำดับพยัญชนะไทย
export const ALL_THAI_PROVINCES: string[] = provinces
  .map((p) => p.name_in_thai)
  .sort((a, b) => a.localeCompare(b, "th"));

function cleanDistrictName(name: string): string {
  // ทำความสะอาดชื่อเขต เช่น "เขต พระนคร" -> "เขตพระนคร"
  return name.replace(/^เขต\s+/, "เขต");
}

/**
 * ดึงรายชื่ออำเภอ/เขตทั้งหมดของจังหวัดที่เลือก (มีอำเภอจริงครบทุกอำเภอใน 77 จังหวัด)
 */
export function getAmphuresByProvince(provinceName: string): AmphureData[] {
  if (!provinceName) return [];
  const p = provinces.find((x) => x.name_in_thai === provinceName);
  if (!p) return [];

  const matchedDistricts = districts.filter((d) => d.province_id === p.id);
  return matchedDistricts.map((d) => ({
    name: cleanDistrictName(d.name_in_thai),
  }));
}

/**
 * ดึงรายชื่อตำบล/แขวง และรหัสไปรษณีย์ทั้งหมดของอำเภอ/เขตที่เลือก
 */
export function getTambonsByAmphure(
  provinceName: string,
  amphureName: string
): TambonData[] {
  if (!provinceName || !amphureName) return [];
  const p = provinces.find((x) => x.name_in_thai === provinceName);
  if (!p) return [];

  const dist = districts.find(
    (d) =>
      d.province_id === p.id &&
      (cleanDistrictName(d.name_in_thai) === amphureName ||
        d.name_in_thai === amphureName)
  );
  if (!dist) return [];

  const matchedSubDistricts = subDistricts.filter(
    (s) => s.district_id === dist.id
  );
  return matchedSubDistricts.map((s) => ({
    name: s.name_in_thai,
    postalCode: String(s.zip_code || ""),
  }));
}
