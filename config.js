// ============================================================
// 🔑 NIM STUDIO PRO — CONFIGURATION v4.1
// ⚠️ SÉCURITÉ : ce fichier expose les clés API côté client.
// Pour la production, MIGRE vers un proxy serveur (Supabase Edge
// Functions ou Cloudflare Workers) qui détient les clés.
// Voir RUFLO_PLAN.md pour la roadmap.
// ============================================================
const CONFIG = {

  // ── SUPABASE ─────────────────────────────────────────────
  SUPABASE_URL:      "https://exopobvryynqnbfywmta.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_48Ph9_QfJil7HeNC0MGaxg_PXHwIhla",

  // ── ANTHROPIC CLAUDE ──────────────────────────────────────
  // ➕ https://console.anthropic.com → API Keys
  ANTHROPIC_API_KEY:  "REMPLACE_PAR_TA_NOUVELLE_CLE_ANTHROPIC",
  ANTHROPIC_BASE_URL: "https://api.anthropic.com/v1",

  // ── FAL.AI ────────────────────────────────────────────────
  // ➕ https://fal.ai/dashboard → API Keys
  FAL_API_KEY:  "REMPLACE_PAR_TA_NOUVELLE_CLE_FAL",
  FAL_BASE_URL: "https://fal.run",

  // ── GEMINI ───────────────────────────────────────────────
  GEMINI_API_KEYS: [
    "REMPLACE_PAR_TA_NOUVELLE_CLE_GEMINI",
  ],
  GEMINI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/openai/",

  // ── STRIPE ───────────────────────────────────────────────
  STRIPE_MONTHLY_LINK: "https://buy.stripe.com/8x24gA4wY8oe7J2b8J6sw00",
  STRIPE_ANNUAL_LINK: "https://buy.stripe.com/aFa7sM7JafQG9RaccN6sw02",

  // ── LIMITES ──────────────────────────────────────────────
  FREE_TOKEN_LIMIT_PER_HOUR: 10000,
  FREE_RESET_MINUTES:        60,

  // ── DEFAULTS ─────────────────────────────────────────────
  // ⚠️ IDs Claude vérifiés mai 2026 — adapter selon ton accès API
  CLAUDE_MODEL_DEFAULT_FREE: "claude-haiku-4-5-20251001",
  CLAUDE_MODEL_DEFAULT_PRO:  "claude-sonnet-4-5-20250929",
  GEMINI_MODEL_DEFAULT:      "gemini-2.0-flash",
  FAL_IMAGE_DEFAULT:         "fal-ai/flux-pro/v1.1",
  FAL_VIDEO_DEFAULT:         "fal-ai/kling-video/v2.6/pro/text-to-video",

  // ── INFOS APP ────────────────────────────────────────────
  APP_NAME:      "NIM Studio Pro",
  APP_URL:       "https://drayk973.github.io/NIM-STUDIO-AI/",
  SUPPORT_EMAIL: "shopova@gmail.com",

  // ── COMPTES PRO ──────────────────────────────────────────
  // ⚠️ NE JAMAIS stocker des mots de passe en clair côté client.
  // Migrer vers Supabase Auth (déjà installé) le plus vite possible.
  PRO_ACCOUNTS: [
    // { email:"...", passwords:["..."], label:"..." },
  ],

  // ── FAL.AI IMAGE MODELS ───────────────────────────────────
  FAL_IMAGE_MODELS: [
    { id:"fal-ai/flux/schnell",        label:"FLUX Schnell ⚡",   tier:"free", price:"$0.003/img", note:"Rapide · 1024px" },
    { id:"fal-ai/ideogram/v3",         label:"Ideogram V3 ✏️",   tier:"free", price:"$0.03/img",  note:"Texte · Logos" },
    { id:"fal-ai/flux-pro/v1.1",       label:"FLUX.2 Pro ✦",     tier:"pro",  price:"$0.04/img",  note:"Photoréalisme · 2048px" },
    { id:"fal-ai/flux-pro/v1.1-ultra", label:"FLUX.2 Ultra 💎",   tier:"pro",  price:"$0.06/img",  note:"4K · Ultra HD" },
    { id:"fal-ai/gpt-image-1",         label:"GPT Image 1.5 🤖",  tier:"pro",  price:"$0.04/img",  note:"Instructions précises" },
    { id:"fal-ai/recraft-v3",          label:"Recraft V3 🎨",     tier:"pro",  price:"$0.04/img",  note:"Design · Vecteur" },
  ],

  // ── FAL.AI VIDEO MODELS ───────────────────────────────────
  // maxDuration = durée max (sec) supportée
  FAL_VIDEO_MODELS: [
    { id:"fal-ai/ltx-video-2/text-to-video",           label:"LTX Video ⚡",         tier:"free", price:"$0.002/s", maxDuration:30,  qualities:["480p"],        note:"Test rapide" },
    { id:"fal-ai/kling-video/v2.6/pro/text-to-video",  label:"Kling 2.6 Pro 🎬",     tier:"pro",  price:"$0.07/s",  maxDuration:10,  qualities:["720p","1080p"],note:"Qualité · économique" },
    { id:"fal-ai/kling-video/v2.6/pro/image-to-video", label:"Kling 2.6 Img→Vid 🖼️", tier:"pro",  price:"$0.07/s",  maxDuration:10,  qualities:["720p","1080p"],note:"Animer une image" },
    { id:"fal-ai/kling-video/v3/pro/text-to-video",    label:"Kling 3.0 Pro ✦",      tier:"pro",  price:"$0.20/s",  maxDuration:30,  qualities:["1080p","4K"],  note:"Premium · 4K" },
    { id:"fal-ai/veo-3/fast",                          label:"Veo 3.1 Fast 💎",       tier:"pro",  price:"$0.10/s",  maxDuration:8,   qualities:["1080p"],       note:"Google DeepMind" },
    { id:"fal-ai/sora/v2",                             label:"Sora 2 ⚡",             tier:"pro",  price:"$0.10/s",  maxDuration:12,  qualities:["720p"],        note:"OpenAI + audio" },
    { id:"fal-ai/sora/v2-pro",                         label:"Sora 2 Pro 🔥",         tier:"pro",  price:"$0.50/s",  maxDuration:25,  qualities:["1080p"],       note:"Multi-shots" },
    { id:"fal-ai/runway-gen4/turbo",                   label:"Runway Gen-4 🎭",       tier:"pro",  price:"$0.05/s",  maxDuration:8,   qualities:["1080p"],       note:"Perso cohérent" },
    { id:"fal-ai/wan/v2.6/1.3b/text-to-video",        label:"Wan 2.6 🌊",            tier:"pro",  price:"$0.03/s",  maxDuration:60,  qualities:["720p","1080p"],note:"Long · économique" },
  ],
};

// Gemini key rotation (legacy, à supprimer une fois 100% migré sur Edge Functions)
CONFIG.GEMINI_API_KEY = CONFIG.GEMINI_API_KEYS[0];
CONFIG._geminiIdx = 0;
CONFIG.getGeminiKey   = () => CONFIG.GEMINI_API_KEYS[CONFIG._geminiIdx % CONFIG.GEMINI_API_KEYS.length];
CONFIG.rotateGeminiKey = () => { CONFIG._geminiIdx = (CONFIG._geminiIdx+1) % CONFIG.GEMINI_API_KEYS.length; return CONFIG.getGeminiKey(); };

// ============================================================
// 🛡️ MODE PROXY SÉCURISÉ
// ============================================================
// Si USE_PROXY = true, tous les appels API passent par les
// Supabase Edge Functions (claude-proxy, fal-proxy, gemini-proxy).
// Les clés API ne sont JAMAIS exposées au client.
//
// Pour activer :
//   1. Déployer les Edge Functions (voir EDGE_FUNCTIONS_SETUP.md)
//   2. Mettre USE_PROXY à true
//   3. Vider ANTHROPIC_API_KEY, FAL_API_KEY, GEMINI_API_KEYS
// ============================================================
CONFIG.USE_PROXY = false; // Passer à true une fois Edge Functions déployées

CONFIG._getAuthToken = async function() {
  if (!window.supabase || !CONFIG.SUPABASE_URL) return null;
  if (!CONFIG._sbClient) {
    CONFIG._sbClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
  const { data } = await CONFIG._sbClient.auth.getSession();
  return data?.session?.access_token || null;
};

// Claude router
CONFIG.claudeChat = async function(messages, modelId, opts={}) {
  // ── Mode proxy sécurisé ───────────────────────────────────
  if (CONFIG.USE_PROXY) {
    const token = await CONFIG._getAuthToken();
    if (!token) throw new Error('Connexion requise (Supabase Auth)');

    const sys = messages.find(m => m.role === 'system');
    const msgs = messages.filter(m => m.role !== 'system');

    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: modelId || CONFIG.CLAUDE_MODEL_DEFAULT_PRO,
        max_tokens: opts.max_tokens || 1024,
        temperature: opts.temperature,
        messages: msgs,
        system: sys?.content,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('Claude proxy ' + res.status + ': ' + t.slice(0, 200));
    }
    const d = await res.json();
    return d?.content?.[0]?.text || '';
  }

  // ── Mode direct (legacy, dev uniquement) ──────────────────
  if (!CONFIG.ANTHROPIC_API_KEY || CONFIG.ANTHROPIC_API_KEY.includes('REMPLACE'))
    throw new Error('Clé Anthropic manquante — config.js → ANTHROPIC_API_KEY (ou active USE_PROXY)');
  const sys  = messages.find(m => m.role==='system');
  const msgs = messages.filter(m => m.role!=='system');
  const body = { model: modelId||CONFIG.CLAUDE_MODEL_DEFAULT_PRO, max_tokens: opts.max_tokens||1024, messages: msgs };
  if (sys) body.system = sys.content;
  const res = await fetch(CONFIG.ANTHROPIC_BASE_URL+'/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':CONFIG.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body: JSON.stringify(body),
  });
  if (!res.ok) { const t=await res.text(); throw new Error('Claude '+res.status+': '+t.slice(0,200)); }
  const d = await res.json();
  return d?.content?.[0]?.text || '';
};

// fal.ai router
CONFIG.falGenerate = async function(type, prompt, endpoint, opts={}) {
  const ep = endpoint || (type==='video' ? CONFIG.FAL_VIDEO_DEFAULT : CONFIG.FAL_IMAGE_DEFAULT);
  const payload = type==='video'
    ? { prompt, duration: opts.duration||5, aspect_ratio: opts.aspect_ratio||'16:9', ...(opts.extra||{}) }
    : { prompt, image_size: opts.image_size||'landscape_16_9', num_images:1, output_format:'jpeg', ...(opts.extra||{}) };

  // ── Mode proxy sécurisé ───────────────────────────────────
  if (CONFIG.USE_PROXY) {
    const token = await CONFIG._getAuthToken();
    if (!token) throw new Error('Connexion requise (Supabase Auth)');

    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/fal-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: ep, type, payload }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('fal proxy ' + res.status + ': ' + t.slice(0, 200));
    }
    const d = await res.json();
    return type==='video' ? (d?.video?.url||d?.videos?.[0]?.url||null) : (d?.images?.[0]?.url||d?.image?.url||null);
  }

  // ── Mode direct (legacy) ──────────────────────────────────
  if (!CONFIG.FAL_API_KEY || CONFIG.FAL_API_KEY.includes('REMPLACE'))
    throw new Error('Clé fal.ai manquante — config.js → FAL_API_KEY (ou active USE_PROXY)');
  const res = await fetch(`${CONFIG.FAL_BASE_URL}/${ep}`, {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Key '+CONFIG.FAL_API_KEY},
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const t=await res.text(); throw new Error('fal.ai '+res.status+': '+t.slice(0,200)); }
  const d = await res.json();
  return type==='video' ? (d?.video?.url||d?.videos?.[0]?.url||null) : (d?.images?.[0]?.url||d?.image?.url||null);
};

// Pro account check (LEGACY — supprimer après migration Supabase Auth)
CONFIG.checkProAccount = function(email, password) {
  const e=(email||'').trim().toLowerCase(), p=(password||'').trim();
  return CONFIG.PRO_ACCOUNTS.some(a => a.email.toLowerCase()===e && (Array.isArray(a.passwords)?a.passwords:[a.password]).some(pw=>pw===p));
};
