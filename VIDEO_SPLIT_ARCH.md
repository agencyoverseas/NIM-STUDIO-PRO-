# ✂️ Découpe vidéo auto — Architecture

Feature annoncée dans NIM Studio mais non implémentée. Voici l'archi recommandée.

## 🎯 User stories

1. User génère une vidéo longue (Sora 2 Pro, Kling 3.0, Wan 2.6 → jusqu'à 60s).
2. User clique **« Découper en clips »** → choisit :
   - Nombre de clips (2 à 10)
   - Format de sortie (16:9, 9:16, 1:1)
   - Durée par clip (auto / 5s / 10s / 15s)
3. App découpe et propose un téléchargement ZIP.

## 🏗️ 3 options techniques

### Option A — ffmpeg.wasm côté client (recommandé)

**Pros** : zéro coût serveur, privacy (la vidéo ne quitte pas le téléphone), instantané.
**Cons** : ~25MB de WASM à charger une fois, perf limitée sur vieux téléphones.

```html
<!-- index.html ou app.html -->
<script src="https://cdn.jsdelivr.net/npm/@ffmpeg/[email protected]/dist/umd/ffmpeg.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ffmpeg/[email protected]/dist/umd/util.min.js"></script>
```

```js
async function splitVideo(videoUrl, clipCount, format) {
  const { FFmpeg } = FFmpegWASM;
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  // Charger la vidéo source
  const resp = await fetch(videoUrl);
  const buf = new Uint8Array(await resp.arrayBuffer());
  await ffmpeg.writeFile('input.mp4', buf);

  // Récupérer durée totale via ffprobe (output stderr)
  let duration = 0;
  ffmpeg.on('log', ({ message }) => {
    const m = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (m) duration = (+m[1])*3600 + (+m[2])*60 + parseFloat(m[3]);
  });
  await ffmpeg.exec(['-i', 'input.mp4']);

  const clipDur = duration / clipCount;
  const clips = [];

  // Mapping format → filtre crop
  const cropFilter = {
    '16:9': 'crop=ih*16/9:ih',
    '9:16': 'crop=iw:iw*16/9',
    '1:1':  'crop=ih:ih',
  }[format] || '';

  for (let i = 0; i < clipCount; i++) {
    const start = i * clipDur;
    const out = `clip_${i+1}.mp4`;
    const args = [
      '-i', 'input.mp4',
      '-ss', String(start), '-t', String(clipDur),
      '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast',
    ];
    if (cropFilter) args.push('-vf', cropFilter);
    args.push(out);
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(out);
    clips.push({ name: out, blob: new Blob([data], { type: 'video/mp4' }) });
  }

  return clips;
}

// Téléchargement ZIP via JSZip
async function downloadClipsZip(clips) {
  const JSZip = await import('https://cdn.jsdelivr.net/npm/[email protected]/+esm');
  const zip = new JSZip.default();
  clips.forEach(c => zip.file(c.name, c.blob));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nim-clips.zip'; a.click();
  URL.revokeObjectURL(url);
}
```

### Option B — Edge Function + ffmpeg sur Supabase Storage

**Pros** : pas de charge côté client, marche partout.
**Cons** : coût compute Supabase, vidéo doit transiter par leur infra.

Pas idéal car Edge Functions Deno n'ont **pas** ffmpeg natif. Il faudrait passer par Replicate / fal.ai / un service tiers (coût supplémentaire).

### Option C — fal.ai endpoint dédié

Si fal.ai propose un endpoint de découpe (à vérifier dans leur doc).
**Pros** : intégration cohérente avec le reste.
**Cons** : coût par appel, pas certain que ça existe.

## 🎨 Détection moments forts (option premium)

Pour la version "intelligente" :

1. **Scene detection** : ffmpeg `select='gt(scene,0.4)'` détecte les transitions.
2. **Audio peaks** : analyser le volume avec `astats`, garder les pics.
3. **Combine** : choisir des clips qui commencent à un scene cut + ont un pic audio.

```bash
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]select='gt(scene,0.3)',metadata=print:file=-" \
  -f null - 2>&1 | grep pts_time
```

## 📋 Roadmap d'implémentation

**Sprint 1 (1-2h via Ruflo Mission 4)** :
- [x] Architecture documentée (ce fichier)
- [ ] UI bouton « Découper » dans `app.html` → modal de choix
- [ ] Implémentation Option A (ffmpeg.wasm)
- [ ] Download ZIP fonctionnel
- [ ] Persistance dans table `video_clips`

**Sprint 2 (2-3h)** :
- [ ] Détection scenes automatique
- [ ] Preview avant téléchargement
- [ ] Renommage personnalisé des clips
- [ ] Partage direct vers TikTok/Insta (Web Share API)

## 🚀 Lancement via Ruflo

```bash
npx ruflo@latest hive-mind spawn "Implémente la feature découpe vidéo auto de NIM Studio Pro selon l'architecture définie dans VIDEO_SPLIT_ARCH.md. \
1) Agent UI : ajouter modal de découpe dans app.html (déclenché après chaque génération vidéo). \
2) Agent intégration : charger ffmpeg.wasm de manière lazy (uniquement quand l'user clique sur découper). \
3) Agent QA : tester sur iPhone Safari, Chrome Android, Chrome desktop. \
4) Agent persistance : sauvegarder chaque clip dans table video_clips Supabase. \
Livrable : feature fonctionnelle end-to-end." --queen-type tactical
```
