# 🔧 NIM Studio AI — Fixes v4.1

## ✅ Corrigé

### 1. Splash bloqué (`app.html`)
- **Avant** : `restoreSavedKeys()` sans try/catch → si throw, splash figé 5s.
- **Après** : try/catch isolé, guard réduit à 2.5s, `clearTimeout` à chaque sortie de branche.
- **Avant** : timeout Supabase 2s + délai splash 1.2s = 3.2s minimum d'attente avant fallback.
- **Après** : timeout Supabase 1.5s, transition garantie en max 2.7s.

### 2. Popup install qui ne fonctionnait pas (`index.html` + `app.html`)
- **Avant** : sur desktop sans `beforeinstallprompt`, popup affiché mais bouton inutile.
- **Avant** : sur iOS hors Safari, aucun message.
- **Avant** : auto-open à chaque visite (pénible).
- **Après** :
  - Détection 4 cas : Android prompt natif / iOS Safari / iOS autre / Desktop.
  - Pas d'auto-open intrusif sur desktop.
  - Message dédié par plateforme (icône + texte adaptés).
  - Fallback Firefox Android avec instructions menu navigateur.

### 3. Sécurité (`config.js`)
- **Avant** : 4 clés API + 3 mots de passe utilisateurs en clair → visibles dans DevTools de n'importe quel visiteur.
- **Après** : placeholders + warning explicite + référence au plan de migration Supabase Edge Functions.
- **⚠️ Action requise** : tu as confirmé avoir révoqué les anciennes clés. Génère-en de nouvelles et colle-les dans le nouveau `config.js`, OU mieux : suis la Mission 2 du `RUFLO_PLAN.md`.

### 4. Model ID Claude invalide
- **Avant** : `CLAUDE_MODEL_DEFAULT_PRO: "claude-sonnet-4-6"` (format invalide).
- **Après** : `claude-sonnet-4-5-20250929` (format date complet requis par l'API).
- ⚠️ À vérifier selon ton accès console.anthropic.com — les IDs exacts peuvent évoluer.

### 5. 🆕 Bug critique JS détecté & corrigé (`enterApp` ligne 901)
- **Avant** : déclaration `var _adm` dupliquée + bloc `if` imbriqué jamais fermé proprement → accolade orpheline dans tout le script. Code probablement copié-collé deux fois par erreur.
- **Conséquence** : le parser JS pouvait silently fail sur certains navigateurs après login Pro, et le bouton admin ne s'affichait jamais correctement.
- **Après** : code nettoyé, `if (_adm && _adm.isAdmin)` correctement fermé, variable `email` non définie remplacée par `emailOrNull` (paramètre réel de la fonction).
- **Bonus** : ce bug explique sans doute pourquoi le compte admin (`obra@gmail.com`) n'accédait pas au dashboard.

## 🔴 NON corrigé (nécessite Ruflo ou backend)

| Problème | Pourquoi pas ici | Mission Ruflo |
|----------|------------------|---------------|
| Clés API exposées côté client | Nécessite proxy serveur | Mission 2 |
| Mots de passe en clair | Nécessite migration Supabase Auth | Mission 2 |
| Stripe sans webhook | Nécessite Edge Function | Mission 2 |
| Icons PWA manquants (icon-192.png, icon-512.png) | Pas dans le zip | Mission 3 |
| Découpe vidéo (annoncée mais absente) | Feature à construire | Mission 4 |

## 🧪 Test local

```bash
# Lancer un serveur local (PWA requiert HTTPS ou localhost)
cd NIM-STUDIO-FIXED
python3 -m http.server 8080

# Puis ouvrir :
# http://localhost:8080/index.html  (landing)
# http://localhost:8080/app.html    (app directe)
```

## 📦 Déploiement

- **GitHub Pages** : push sur main, c'est déployé.
- **Vercel/Netlify** : drag&drop du dossier, c'est en ligne.
- ⚠️ Avant de déployer : remplir les vraies clés API dans `config.js` (ou mieux, faire la Mission 2 Ruflo d'abord).
