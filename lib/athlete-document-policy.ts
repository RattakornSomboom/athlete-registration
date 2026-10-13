export const ATHLETE_DOCUMENT_FIELDS = ["photoFileUrl", "idCardFileUrl", "studentCardFileUrl", "studentCertFileUrl", "upAcademyFileUrl", "fitnessTestFileUrl", "noClubFileUrl"] as const;
export const ATHLETE_VISIBLE_DOCUMENT_FIELDS = ATHLETE_DOCUMENT_FIELDS.filter(
  field => !["upAcademyFileUrl", "fitnessTestFileUrl", "noClubFileUrl"].includes(field),
);
export const REQUIRED_ATHLETE_DOCUMENTS = ATHLETE_DOCUMENT_FIELDS.slice(0, 4);

export const ATHLETE_DOCUMENT_LABELS: Record<string, string> = {
  photoFileUrl: "รูปถ่ายชุดนิสิต",
  idCardFileUrl: "สำเนาบัตรประจำตัวประชาชน",
  studentCardFileUrl: "สำเนาบัตรนิสิต",
  studentCertFileUrl: "ใบรับรองการเป็นนิสิต",
  upAcademyFileUrl: "ใบผ่านการอบรม UP Academy",
  fitnessTestFileUrl: "ผลการทดสอบสมรรถภาพทางกาย",
  noClubFileUrl: "หนังสือรับรองกรณีไม่มีชมรม",
};

export function documentReference(id: string) { return `/api/documents/${id}/download`; }
export function documentId(value: unknown): string | null {
  return typeof value === "string" ? /^\/api\/documents\/([a-zA-Z0-9_-]+)\/download$/.exec(value)?.[1] ?? null : null;
}

export function protectedApplication<T extends { id: string }>(application: T): T {
  const result = { ...application };
  for (const field of ATHLETE_DOCUMENT_FIELDS) {
    const val = result[field as keyof T];
    if (field in result && val && typeof val === "string" && val.trim() !== "" && val.trim() !== "-") {
      Object.assign(result, { [field]: `/api/applications/${application.id}/documents/${field}` });
    } else if (field in result) {
      Object.assign(result, { [field]: null });
    }
  }
  return result;
}

export type DocumentCheckItem = {
  field: string;
  label: string;
  required: boolean;
  submitted: boolean;
};

export type DocumentCheckResult = {
  hasAllRequired: boolean;
  missingDocuments: { field: string; label: string }[];
  items: DocumentCheckItem[];
};

export function checkAthleteRequiredDocuments(
  data: Record<string, unknown>,
  hasClub: boolean | null = null
): DocumentCheckResult {
  const items: DocumentCheckItem[] = [];
  const missingDocuments: { field: string; label: string }[] = [];

  let requiresNoClubFile = false;
  if (hasClub === false) {
    requiresNoClubFile = true;
  } else if (hasClub === null && (data.supervisorName || data.supervisorPosition)) {
    requiresNoClubFile = true;
  }

  for (const field of ATHLETE_DOCUMENT_FIELDS) {
    const required = (REQUIRED_ATHLETE_DOCUMENTS as readonly string[]).includes(field) || (field === "noClubFileUrl" && requiresNoClubFile);
    const val = data[field];
    const submitted = (typeof File !== "undefined" && val instanceof File) || (typeof val === "string" && val.trim() !== "" && val.trim() !== "-" && val !== "null");
    
    items.push({
      field,
      label: ATHLETE_DOCUMENT_LABELS[field] || field,
      required,
      submitted,
    });

    if (required && !submitted) {
      missingDocuments.push({ field, label: ATHLETE_DOCUMENT_LABELS[field] || field });
    }
  }

  return {
    hasAllRequired: missingDocuments.length === 0,
    missingDocuments,
    items,
  };
}
