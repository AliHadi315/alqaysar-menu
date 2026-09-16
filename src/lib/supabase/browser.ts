import { createClient } from "@supabase/supabase-js";

/**
 * Browser client. Uses the anon key, which is public by design — every write
 * is authorised by Supabase row level security against the signed-in user,
 * not by this key. The service role key must never appear in the browser.
 */
// No generated database types in this project, so rows are untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | null = null;

export function db() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase is not configured for this build.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = createClient<any>(url, key);
  }
  return client;
}

export const isConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
