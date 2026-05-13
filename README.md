# 🚀 NIM Studio Pro — v4.1 (sécurisé)

Studio IA complet : Claude · FLUX · Kling · Sora · Veo · Gemini, en une seule PWA.

## 📁 Structure

```
NIM-STUDIO-FIXED/
├── index.html          # Landing page + popup install PWA
├── app.html            # Application principale (chat IA, génération média)
├── admin.html          # 🆕 Dashboard admin (KPI, top users, coûts API)
├── config.js           # Config client + routers API (mode proxy/direct)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (cache offline)
│
├── icon-192.png, icon-512.png              # Icons standard
├── icon-192-maskable.png, icon-512-maskable.png  # Icons Android adaptifs
├── apple-touch-icon.png                    # iOS home screen
├── favicon-32.png                          # Onglet navigateur
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql          # Tables, RLS, RPC quota
│   └── functions/
│       ├── claude-proxy/index.ts           # Proxy Anthropic sécurisé
│       ├── fal-proxy/index.ts              # Proxy fal.ai sécurisé
│       ├── gemini-proxy/index.ts           # Proxy Gemini sécurisé
│       └── stripe-webhook/index.ts         # Webhook paiement Stripe
│
└── docs/
    ├── FIXES.md                # Changelog des fixes (bugs corrigés)
    ├── TEST_LOCAL.md           # Comment tester en local
    ├── EDGE_FUNCTIONS_SETUP.md # Setup Supabase étape par étape
    ├── RUFLO_PLAN.md           # 5 missions Ruflo pré-écrites
    └── VIDEO_SPLIT_ARCH.md     # Architecture découpe vidéo auto
```

## 🚀 Quick start

### Test local immédiat (sans clés API)

```bash
unzip NIM-STUDIO-FIXED.zip && cd NIM-STUDIO-FIXED
python3 -m http.server 8080
# → http://localhost:8080
```

### Déploiement production

1. **Tables Supabase** : exécuter `supabase/migrations/001_initial_schema.sql` dans SQL Editor
2. **Edge Functions** : suivre `EDGE_FUNCTIONS_SETUP.md`
3. **Activer proxy** : dans `config.js`, mettre `CONFIG.USE_PROXY = true`
4. **Stripe webhook** : configurer dans Stripe Dashboard
5. **Déployer le frontend** : GitHub Pages / Vercel / Netlify (drag & drop)

## ⚙️ Modes d'opération

| Mode | `USE_PROXY` | Clés API dans config.js | Pour qui |
|------|-------------|-------------------------|----------|
| **Dev local** | `false` | Oui (mais ne JAMAIS commit) | Test rapide |
| **Production** | `true` | **Vides** (clés côté Supabase) | Déploiement réel |

## 👥 Comptes & rôles

| Plan | Modèles dispos | Quota | Comment ?  |
|------|----------------|-------|------------|
| `free` | Haiku 4.5, FLUX Schnell, LTX Video, Gemini 2.0 Flash | 10K tokens/h | Sign-up gratuit |
| `pro` | Tout (Sonnet, Opus, FLUX Pro, Kling 3.0, Sora 2 Pro, etc.) | Illimité | Stripe checkout |
| `admin` | + Dashboard `/admin.html` | — | `UPDATE profiles SET plan='admin' WHERE email='...'` |

## 🔒 Sécurité (v4.1)

- ✅ Clés API jamais exposées côté client (Edge Functions)
- ✅ RLS Supabase sur toutes les tables
- ✅ Quotas serveur-side (fonction `check_user_quota`)
- ✅ Webhook Stripe vérifié par signature
- ✅ Pas de mots de passe en clair (Supabase Auth bcrypt)
- ✅ HTTPS forcé en production (par Vercel/Netlify)

## 📊 Monitoring inclus

- Dashboard admin `/admin.html` :
  - Utilisateurs total / Pro actifs / MRR estimé
  - Appels API (jour / 30 jours)
  - Coût API en USD (par jour, par provider, par user)
  - Top 20 utilisateurs par consommation
  - 50 derniers appels en temps réel

## 🐝 Suite via Ruflo

Voir `RUFLO_PLAN.md` pour les 5 missions pré-écrites :
1. Audit complet (5 min)
2. ~~Sécurisation API~~ ✅ **fait dans cette v4.1**
3. PWA bulletproof
4. Découpe vidéo auto (architecture dans `VIDEO_SPLIT_ARCH.md`)
5. Monitoring & analytics

## 📜 Versions

- **v4.0** : version initiale (bugs splash/popup, clés API en clair)
- **v4.1** ✨ : fix splash, popup multi-plateforme, icons PWA complets, Edge Functions sécurisées, dashboard admin, schéma Supabase complet, webhook Stripe, plan Ruflo
