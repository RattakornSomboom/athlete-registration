export class HttpError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
export async function readResponse<T>(response: Response): Promise<T> {
  let data: unknown;
  try { data = await response.json(); } catch { data = null; }
  const object = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
  if (!response.ok) {
    const fallback = response.status === 401 ? "session หมดอายุ กรุณาเข้าสู่ระบบใหม่" : response.status === 403 ? "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" : response.status === 404 ? "ไม่พบข้อมูลที่ต้องการ" : "ทำรายการไม่สำเร็จ กรุณาลองใหม่";
    let message = typeof object?.error === "string" && response.status < 500 ? object.error : fallback;
    if (response.status === 409) message += " — กรุณาโหลดข้อมูลล่าสุดก่อนทำรายการอีกครั้ง";
    const fields = object?.fieldErrors && typeof object.fieldErrors === "object" ? Object.fromEntries(Object.entries(object.fieldErrors).filter(([,v]) => typeof v === "string")) as Record<string,string> : {};
    throw new HttpError(response.status, message, fields);
  }
  if (!object) throw new HttpError(502, "เซิร์ฟเวอร์ตอบข้อมูลไม่ถูกต้อง กรุณาลองใหม่");
  return object as T;
}
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", ...options }); }
  catch { throw new HttpError(0, "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่"); }
  return readResponse<T>(response);
}
export function requestMessage(error: unknown) {
  if (!(error instanceof Error)) return "ทำรายการไม่สำเร็จ กรุณาลองใหม่";
  const fields = error instanceof HttpError ? Object.values(error.fieldErrors).join(" · ") : "";
  return error.message + (fields ? ": " + fields : "");
}
