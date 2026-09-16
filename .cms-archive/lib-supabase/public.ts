import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anon, cookie-free client for public pages. No cookies means Next can
 * statically render the menu and revalidate it, instead of hitting the
 * database on every request.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
