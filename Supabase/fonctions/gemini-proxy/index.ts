// ============================================================
// GEMINI PROXY — Supabase Edge Function (Deno) v4.2
// Path: supabase/functions/gemini-proxy/index.ts
// ============================================================
// 🔒 v4.2 : CORS whitelist + check modèle autorisé par plan
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, preflight } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FREE_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
]);
const PRO_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
]);

serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const CORS = corsHeaders(req);

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401, CORS);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return json({ error: "Invalid token" }, 401, CORS);

    // Plan
    const { data: profile } = await sb.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";

    // Body
    const body = await req.json();
    const { model, messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return json({ error: "messages array required" }, 400, CORS);
    }

    // Vérifier modèle autorisé
    const allowed = plan === "free" ? FREE_MODELS : PRO_MODELS;
    const chosenModel = model || "gemini-2.0-flash";
    if (!allowed.has(chosenModel)) {
      return json({ error: `Modèle ${chosenModel} réservé aux comptes Pro` }, 403, CORS);
    }

    // Quota
    const { data: quotaRows } = await sb.rpc("check_user_quota", {
      p_user_id: user.id, p_window_minutes: 60, p_max_tokens: 10000,
    });
    if (quotaRows?.[0] && !quotaRows[0].allowed) {
      return json({ error: "Quota dépassé", remaining: quotaRows[0].remaining }, 429, CORS);
    }

    // Appel Gemini via endpoint OpenAI-compatible
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify({ model: chosenModel, messages }),
      }
    );
    const data = await resp.json();

    const tokensIn = data?.usage?.prompt_tokens ?? 0;
    const tokensOut = data?.usage?.completion_tokens ?? 0;

    await sb.from("api_usage").insert({
      user_id: user.id, provider: "gemini", model: chosenModel,
      tokens_in: tokensIn, tokens_out: tokensOut,
      cost_usd: (tokensIn * 0.075 + tokensOut * 0.30) / 1_000_000,
      status: resp.ok ? "ok" : "error",
    });

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500, CORS);
  }
});

function json(o: unknown, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(o), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}
