import {
  districts,
  provinces,
  subDistricts,
} from "@bilions/thailand-address";

export interface TambonData {
  name: string;
  postalCode: string;
}

export interface AmphureData {
  name: string;
}

export const ALL_THAI_PROVINCES = provinces
  .map((province) => province.name_in_thai)
  .sort((left, right) => left.localeCompare(right, "th"));

function cleanDistrictName(name: string): string {
  return name.replace(/^เขต\s+/, "เขต");
}

export function getAmphuresByProvince(provinceName: string): AmphureData[] {
  const province = provinces.find((item) => item.name_in_thai === provinceName);
  if (!province) return [];

  return districts
    .filter((district) => district.province_id === province.id)
    .map((district) => ({ name: cleanDistrictName(district.name_in_thai) }));
}

export function getTambonsByAmphure(
  provinceName: string,
  amphureName: string,
): TambonData[] {
  const province = provinces.find((item) => item.name_in_thai === provinceName);
  if (!province) return [];

  const district = districts.find(
    (item) =>
      item.province_id === province.id &&
      (item.name_in_thai === amphureName || cleanDistrictName(item.name_in_thai) === amphureName),
  );
  if (!district) return [];

  return subDistricts
    .filter((subDistrict) => subDistrict.district_id === district.id)
    .map((subDistrict) => ({
      name: subDistrict.name_in_thai,
      postalCode: String(subDistrict.zip_code ?? ""),
    }));
}
