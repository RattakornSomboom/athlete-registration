import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requiredServerEnv } from "@/lib/server-env";

const supabaseUrl = requiredServerEnv("SUPABASE_URL");
const supabaseServiceKey = requiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
