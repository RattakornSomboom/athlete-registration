import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client — ใช้ service_role key สำหรับ server-side operations
 * เช่น upload ไฟล์ไปยัง Storage โดยไม่ต้องผ่าน RLS
 *
 * ⚠️ ห้ามใช้ใน client-side เด็ดขาด
 */
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
