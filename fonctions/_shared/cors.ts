// ============================================================
// CORS helper — Supabase Edge Functions
// Path: supabase/functions/_shared/cors.ts
// ============================================================
// 🔒 SECURITY v4.2 — Whitelist d'origines au lieu de "*"
// Adapter ALLOWED_ORIGINS à tes domaines réels avant déploiement.
// ============================================================

export const ALLOWED_ORIGINS = [
  "https://drayk973.github.io",        // GitHub Pages actuel
  "https://nimstudiopro.com",           // domaine custom prod (si tu en as un)
  "https://www.nimstudiopro.com",
  "http://localhost:8080",              // dev local — RETIRER en prod
  "http://localhost:3000",
  "http://127.0.0.1:8080",
];

const BASE_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  // Si origin dans la whitelist → autoriser. Sinon → premier de la liste (= refus implicite côté browser).
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    ...BASE_HEADERS,
  };
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}
