export class PasswordResetDeliveryError extends Error {
  constructor() {
    super("บริการส่งอีเมลยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
  }
}

function deliveryConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) throw new PasswordResetDeliveryError();
  try {
    const origin = new URL(appUrl);
    const local = ["localhost", "127.0.0.1"].includes(origin.hostname);
    if (origin.username || origin.password || (origin.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && local && origin.protocol === "http:"))) {
      throw new PasswordResetDeliveryError();
    }
    return { apiKey, from, origin: origin.origin };
  } catch {
    throw new PasswordResetDeliveryError();
  }
}

export function assertPasswordResetDeliveryConfigured(): void {
  deliveryConfiguration();
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const { apiKey, from, origin } = deliveryConfiguration();
  const link = new URL("/reset-password", origin);
  link.searchParams.set("token", token);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "ตั้งรหัสผ่านใหม่ — ระบบบริหารจัดการการแข่งขันกีฬา",
        text: `ตั้งรหัสผ่านใหม่โดยเปิดลิงก์นี้ภายใน 15 นาที:\n${link.toString()}\n\nหากคุณไม่ได้ส่งคำขอ สามารถละเว้นอีเมลนี้ได้`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new PasswordResetDeliveryError();
  } catch {
    // Never attach provider responses, request bodies or reset tokens to errors.
    throw new PasswordResetDeliveryError();
  }
}
