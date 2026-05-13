// ============================================================
// CLAUDE PROXY — Supabase Edge Function (Deno)
// Path: supabase/functions/claude-proxy/index.ts
// ============================================================
// Sécurise les appels Anthropic en gardant la clé côté serveur.
// Vérifie auth user + plan + quota avant de transférer.
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, preflight } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FREE_MODELS = new Set(["claude-haiku-4-5-20251001"]);
const PRO_MODELS  = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-5-20251015",
]);

serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const CORS = corsHeaders(req);

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    // ── 1. Vérifier auth user ─────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401, CORS);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return json({ error: "Invalid token" }, 401, CORS);

    // ── 2. Récupérer profil + plan ────────────────────────
    const { data: profile } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = profile?.plan ?? "free";

    // ── 3. Parser body ────────────────────────────────────
    const body = await req.json();
    const { messages, model, max_tokens, system, temperature } = body;

    if (!messages || !Array.isArray(messages)) {
      return json({ error: "messages array required" }, 400, CORS);
    }

    // ── 4. Vérifier modèle autorisé par le plan ───────────
    const allowedSet = plan === "free" ? FREE_MODELS : PRO_MODELS;
    const chosenModel = model || (plan === "free"
      ? "claude-haiku-4-5-20251001"
      : "claude-sonnet-4-5-20250929");

    if (!allowedSet.has(chosenModel)) {
      return json({ error: `Model ${chosenModel} not allowed for plan ${plan}` }, 403, CORS);
    }

    // ── 5. Vérifier quota ─────────────────────────────────
    const { data: quotaRows } = await sb.rpc("check_user_quota", {
      p_user_id: user.id,
      p_window_minutes: 60,
      p_max_tokens: 10000,
    });
    const quota = quotaRows?.[0];
    if (quota && !quota.allowed) {
      return json({
        error: "Quota dépassé",
        used_tokens: quota.used_tokens,
        remaining: quota.remaining,
      }, 429, CORS);
    }

    // ── 6. Appel Anthropic ────────────────────────────────
    const anthropicBody: Record<string, unknown> = {
      model: chosenModel,
      max_tokens: Math.min(max_tokens ?? 1024, 4096),
      messages,
    };
    if (system) anthropicBody.system = system;
    if (typeof temperature === "number") anthropicBody.temperature = temperature;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await resp.json();

    // ── 7. Logger usage ───────────────────────────────────
    const tokensIn  = data?.usage?.input_tokens  ?? 0;
    const tokensOut = data?.usage?.output_tokens ?? 0;

    await sb.from("api_usage").insert({
      user_id: user.id,
      provider: "claude",
      model: chosenModel,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: estimateClaudeCost(chosenModel, tokensIn, tokensOut),
      status: resp.ok ? "ok" : "error",
    });

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[claude-proxy]", e);
    return json({ error: String(e?.message ?? e) }, 500, CORS);
  }
});

function json(o: unknown, status = 200, cors: Record<string,string> = {}) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Tarifs Anthropic au 2026-05 (USD / 1M tokens) — à mettre à jour si Anthropic change
function estimateClaudeCost(model: string, tIn: number, tOut: number): number {
  const rates: Record<string, [number, number]> = {
    "claude-haiku-4-5-20251001":   [0.80,  4.00],
    "claude-sonnet-4-5-20250929":  [3.00, 15.00],
    "claude-opus-4-5-20251015":   [15.00, 75.00],
  };
  const [inR, outR] = rates[model] ?? [3, 15];
  return (tIn * inR + tOut * outR) / 1_000_000;
}
