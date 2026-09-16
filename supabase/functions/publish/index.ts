/**
 * Turns an admin's "Publish to site" click into a host rebuild.
 *
 * The deploy hook URL is a bearer secret: anyone who has it can spend a build
 * from the monthly quota. It lives here as a function secret so it never
 * reaches the browser bundle - /admin is a public page, so a NEXT_PUBLIC_ var
 * would be readable by anyone who opens devtools.
 *
 * Deploy:  supabase functions deploy publish
 * Secret:  supabase secrets set DEPLOY_HOOK_URL=https://...
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );

  // is_admin() reads auth.uid() from the caller's own JWT, so the anon key
  // alone proves nothing - the caller must be signed in AND in admins.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return new Response("Forbidden", { status: 403, headers: cors });
  }

  const hook = Deno.env.get("DEPLOY_HOOK_URL");
  if (!hook) {
    return new Response("DEPLOY_HOOK_URL is not set", { status: 500, headers: cors });
  }

  const res = await fetch(hook, { method: "POST" });
  return new Response(res.ok ? "queued" : "the host refused the build", {
    status: res.ok ? 202 : 502,
    headers: cors,
  });
});
