import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// null when not configured -> the app falls back to the bundled local gallery
export const supabase = url && key ? createClient(url, key) : null;
