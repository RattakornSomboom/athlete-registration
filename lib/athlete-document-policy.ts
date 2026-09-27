export const ATHLETE_DOCUMENT_FIELDS = ["photoFileUrl", "idCardFileUrl", "studentCardFileUrl", "studentCertFileUrl", "upAcademyFileUrl", "fitnessTestFileUrl", "noClubFileUrl"] as const;
export const REQUIRED_ATHLETE_DOCUMENTS = ATHLETE_DOCUMENT_FIELDS.slice(0, 6);
export function documentReference(id: string) { return `/api/documents/${id}/download`; }
export function documentId(value: unknown): string | null {
  return typeof value === "string" ? /^\/api\/documents\/([a-zA-Z0-9_-]+)\/download$/.exec(value)?.[1] ?? null : null;
}
export function protectedApplication<T extends { id: string }>(application: T): T {
  const result = { ...application };
  for (const field of ATHLETE_DOCUMENT_FIELDS) {
    if (field in result && result[field as keyof T]) Object.assign(result, { [field]: `/api/applications/${application.id}/documents/${field}` });
  }
  return result;
}
