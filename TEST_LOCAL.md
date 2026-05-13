# 🧪 Test local — NIM Studio AI

## Méthode rapide (Python — préinstallé partout)

```bash
unzip NIM-STUDIO-FIXED.zip
cd NIM-STUDIO-FIXED
python3 -m http.server 8080
```

Puis ouvre dans le navigateur :
- **Landing** : http://localhost:8080/index.html
- **App** : http://localhost:8080/app.html

## Méthode Node (avec hot-reload)

```bash
npx serve -p 8080 NIM-STUDIO-FIXED
```

## ⚠️ Avant de tester

Le `config.js` contient des **placeholders** (`REMPLACE_PAR_TA_NOUVELLE_CLE_...`).
Pour tester les fonctions IA, soit :
- **A)** Colle tes nouvelles clés API dans `config.js` (mode démo uniquement, ne déploie PAS comme ça)
- **B)** Attends d'avoir déployé les Edge Functions (proxy sécurisé — voir `EDGE_FUNCTIONS_SETUP.md`)

## ✅ Checklist de test

| Élément | Test | Attendu |
|---------|------|---------|
| Splash | Ouvrir `/app.html` | Disparaît en < 2.5s, jamais bloqué |
| Popup install desktop | Ouvrir `/index.html` sur Chrome desktop | Pas d'auto-open intrusif |
| Popup install mobile | Ouvrir `/index.html` sur téléphone | Popup s'ouvre après 800ms |
| iOS Safari | Ouvrir `/index.html` sur iPhone Safari | Guide "Partager → Sur écran d'accueil" visible |
| Service Worker | DevTools → Application → SW | Status "activated" |
| Console | DevTools → Console | Aucune erreur rouge |
| Offline | DevTools → Network → Offline | App charge depuis cache |

## 🐛 Si bug : récupérer les logs

```js
// Dans la console DevTools
console.log('SW:', await navigator.serviceWorker.getRegistration());
console.log('LocalStorage:', Object.fromEntries(Object.entries(localStorage)));
console.log('Standalone:', window.matchMedia('(display-mode:standalone)').matches);
```

Colle-moi le résultat si quelque chose cloche.
