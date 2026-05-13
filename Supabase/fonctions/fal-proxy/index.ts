// ============================================================
// FAL.AI PROXY — Supabase Edge Function (Deno)
// Path: supabase/functions/fal-proxy/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, preflight } from "../_shared/cors.ts";

const FAL_API_KEY = Deno.env.get("FAL_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Modèles autorisés par plan
const FREE_MODELS = new Set([
  "fal-ai/flux/schnell",
  "fal-ai/ideogram/v3",
  "fal-ai/ltx-video-2/text-to-video",
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

    const { data: profile } = await sb.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";

    const body = await req.json();
    const { endpoint, payload, type } = body;
    // type: 'image' | 'video'

    if (!endpoint || !payload) return json({ error: "endpoint + payload required" }, 400, CORS);

    // Vérifier modèle autorisé
    if (plan === "free" && !FREE_MODELS.has(endpoint)) {
      return json({ error: `Modèle ${endpoint} réservé aux comptes Pro` }, 403, CORS);
    }

    // Enregistrer génération (status pending)
    const { data: gen } = await sb.from("media_generations").insert({
      user_id: user.id,
      type: type || "image",
      prompt: payload.prompt || "",
      model: endpoint,
      status: "processing",
      metadata: { payload },
    }).select().single();

    // Appel fal.ai
    const resp = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${FAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();

    // Extraire URL résultat
    const resultUrl = type === "video"
      ? (data?.video?.url || data?.videos?.[0]?.url)
      : (data?.images?.[0]?.url || data?.image?.url);

    // Update génération + log usage
    if (gen) {
      await sb.from("media_generations").update({
        result_url: resultUrl,
        status: resp.ok ? "done" : "failed",
        error_message: resp.ok ? null : JSON.stringify(data).slice(0, 500),
      }).eq("id", gen.id);
    }

    await sb.from("api_usage").insert({
      user_id: user.id,
      provider: "fal",
      model: endpoint,
      cost_usd: estimateFalCost(endpoint, type, payload),
      status: resp.ok ? "ok" : "error",
    });

    return new Response(JSON.stringify({ ...data, generation_id: gen?.id }), {
      status: resp.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[fal-proxy]", e);
    return json({ error: String(e?.message ?? e) }, 500, CORS);
  }
});

function json(o: unknown, status = 200, cors: Record<string,string> = {}) {
  return new Response(JSON.stringify(o), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

function estimateFalCost(endpoint: string, type: string, payload: any): number {
  // Estimations basées sur la doc fal.ai (à vérifier)
  if (type === "video") {
    const dur = payload?.duration ?? 5;
    if (endpoint.includes("kling-video/v3")) return 0.20 * dur;
    if (endpoint.includes("sora/v2-pro"))    return 0.50 * dur;
    if (endpoint.includes("kling-video"))    return 0.07 * dur;
    if (endpoint.includes("veo-3"))          return 0.10 * dur;
    if (endpoint.includes("sora"))           return 0.10 * dur;
    if (endpoint.includes("ltx-video"))      return 0.002 * dur;
    return 0.05 * dur;
  }
  // Images
  if (endpoint.includes("flux-pro/v1.1-ultra")) return 0.06;
  if (endpoint.includes("flux-pro"))            return 0.04;
  if (endpoint.includes("schnell"))             return 0.003;
  return 0.04;
}
