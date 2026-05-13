# 🛡️ Setup Edge Functions — Sécurisation API

Guide pas-à-pas pour déployer le proxy sécurisé Supabase qui cache les clés API côté serveur.

## ⚙️ Pré-requis

```bash
# 1. Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link au projet existant (récupère l'ID depuis dashboard.supabase.com)
cd NIM-STUDIO-FIXED
supabase link --project-ref exopobvryynqnbfywmta
```

## 📋 Étape 1 — Créer les tables

Ouvre **Supabase Dashboard → SQL Editor** et exécute le contenu de :
```
supabase/migrations/001_initial_schema.sql
```

Crée 5 tables (profiles, api_usage, conversations, media_generations, video_clips), 1 vue admin, 1 fonction RPC quota, des RLS policies.

## 🔐 Étape 2 — Configurer les secrets

Dans **Supabase Dashboard → Edge Functions → Secrets** OU via CLI :

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-XXX
supabase secrets set FAL_API_KEY=XXX:YYY
supabase secrets set GEMINI_API_KEY=AIzaXXX
supabase secrets set STRIPE_SECRET_KEY=sk_live_XXX
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXX
```

⚠️ **Ces clés ne sont JAMAIS visibles côté client.** Elles vivent uniquement dans Supabase.

## 🚀 Étape 3 — Déployer les 4 Edge Functions

```bash
supabase functions deploy claude-proxy
supabase functions deploy fal-proxy
supabase functions deploy gemini-proxy
supabase functions deploy stripe-webhook --no-verify-jwt
```

⚠️ Le webhook Stripe nécessite `--no-verify-jwt` car Stripe ne passe pas de JWT, mais une signature dédiée vérifiée dans le code.

## 🔗 Étape 4 — Configurer Stripe Webhook

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. URL : `https://exopobvryynqnbfywmta.supabase.co/functions/v1/stripe-webhook`
3. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copie le **Signing secret** (`whsec_...`) → mets-le dans `STRIPE_WEBHOOK_SECRET` (étape 2)

## ✅ Étape 5 — Activer le proxy côté client

Dans `config.js` :
```js
CONFIG.USE_PROXY = true; // ← activer
```

Et **vider** les clés (elles ne servent plus côté client) :
```js
ANTHROPIC_API_KEY: "",
FAL_API_KEY: "",
GEMINI_API_KEYS: [""],
```

## 🧪 Étape 6 — Tester

```bash
# Test claude-proxy avec un token Supabase valide
TOKEN="<récupère via sb.auth.signInWithPassword puis copie data.session.access_token>"

curl -X POST \
  https://exopobvryynqnbfywmta.supabase.co/functions/v1/claude-proxy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 100,
    "messages": [{"role":"user","content":"Dis bonjour en 5 mots"}]
  }'
```

Réponse attendue : `{"content":[{"text":"..."}],...}`

## 📊 Étape 7 — Vérifier les logs

**Supabase Dashboard → Edge Functions → claude-proxy → Logs** : tu vois chaque appel.

**Table `api_usage`** : chaque génération logée avec coût USD estimé. Requête utile :
```sql
select
  date_trunc('day', created_at) as jour,
  provider,
  count(*) as appels,
  sum(tokens_in + tokens_out) as tokens,
  round(sum(cost_usd)::numeric, 2) as cost_usd
from api_usage
where created_at > now() - interval '30 days'
group by 1, 2
order by 1 desc;
```

## 🚨 Avant de passer en prod

- [ ] Tables créées et RLS activé
- [ ] 5 secrets configurés dans Supabase
- [ ] 4 Edge Functions déployées
- [ ] Webhook Stripe créé et signing secret copié
- [ ] `USE_PROXY = true` dans config.js
- [ ] Clés API vidées de config.js
- [ ] Test curl OK
- [ ] Test checkout Stripe en mode test : flux complet email → checkout → webhook → profile.plan='pro'

## 💰 Coût estimé Edge Functions

Tier gratuit Supabase : **500K invocations / mois**.
À 100 utilisateurs actifs × 50 messages/jour = 150K calls/mois → toujours dans le gratuit.

Au-delà : $2 / 1M invocations supplémentaires.
