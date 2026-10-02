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

// Pre-index สำหรับการค้นหาความเร็วสูง (O(1) lookup ไม่ต้องวนลูป 7,348 รายการซ้ำ)
const provinceMap = new Map<string, (typeof provinces)[0]>();
for (const p of provinces) {
  provinceMap.set(p.name_in_thai, p);
}

const districtsByProvinceId = new Map<number, (typeof districts)>();
for (const d of districts) {
  const list = districtsByProvinceId.get(d.province_id) || [];
  list.push(d);
  districtsByProvinceId.set(d.province_id, list);
}

const subDistrictsByDistrictId = new Map<number, (typeof subDistricts)>();
for (const s of subDistricts) {
  const list = subDistrictsByDistrictId.get(s.district_id) || [];
  list.push(s);
  subDistrictsByDistrictId.set(s.district_id, list);
}

/**
 * ดึงรายชื่ออำเภอ/เขตทั้งหมดของจังหวัดที่เลือก (ความเร็วสูง O(1))
 */
export function getAmphuresByProvince(provinceName: string): AmphureData[] {
  if (!provinceName) return [];
  const p = provinceMap.get(provinceName);
  if (!p) return [];

  const matched = districtsByProvinceId.get(p.id) || [];
  return matched.map((d) => ({
    name: cleanDistrictName(d.name_in_thai),
  }));
}

/**
 * ดึงรายชื่อตำบล/แขวง และรหัสไปรษณีย์ทั้งหมดของอำเภอ/เขตที่เลือก (ความเร็วสูง O(1))
 */
export function getTambonsByAmphure(
  provinceName: string,
  amphureName: string
): TambonData[] {
  if (!provinceName || !amphureName) return [];
  const p = provinceMap.get(provinceName);
  if (!p) return [];

  const distList = districtsByProvinceId.get(p.id) || [];
  const dist = distList.find(
    (d) =>
      cleanDistrictName(d.name_in_thai) === amphureName ||
      d.name_in_thai === amphureName
  );
  if (!dist) return [];

  const matched = subDistrictsByDistrictId.get(dist.id) || [];
  return matched.map((s) => ({
    name: s.name_in_thai,
    postalCode: String(s.zip_code || ""),
  }));
}
