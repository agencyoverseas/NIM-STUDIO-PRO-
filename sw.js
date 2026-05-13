// NIM STUDIO PRO — SERVICE WORKER v6.4 (v4.2 security fixes)
const CACHE='nim-v64',CACHE_FONTS='nim-v64-fonts',VERSION='6.4',VERSION_DATE='2026-05';
const CORE=['./','./index.html','./app.html','./admin.html','./manifest.json','./config.js','./icon-192.png','./icon-512.png','./icon-192-maskable.png','./icon-512-maskable.png','./apple-touch-icon.png','./favicon-32.png'];
const API_BYPASS=['api.anthropic.com','fal.run','fal.ai','generativelanguage.googleapis.com','supabase.co','buy.stripe.com','stripe.com','cdn.jsdelivr.net'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(f=>c.add(f)))).then(()=>{
    self.clients.matchAll({includeUncontrolled:true,type:'window'}).then(cls=>cls.forEach(cl=>cl.postMessage({type:'SW_UPDATE_READY',version:VERSION,date:VERSION_DATE,cache:CACHE})));
  }));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==CACHE_FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=e.request.url;
  if(e.request.method!=='GET')return;
  if(API_BYPASS.some(d=>url.includes(d)))return;
  if(url.startsWith('chrome-extension://'))return;
  if(url.includes('fonts.gstatic.com')||url.includes('fonts.googleapis.com')){
    e.respondWith(caches.open(CACHE_FONTS).then(c=>c.match(e.request).then(h=>h||fetch(e.request).then(r=>{c.put(e.request,r.clone());return r;}))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(cached=>{
    const net=fetch(e.request).then(r=>{if(r&&r.status===200&&r.type!=='opaque')c.put(e.request,r.clone());return r;}).catch(()=>null);
    return cached||net.then(r=>r||(e.request.headers.get('accept')?.includes('text/html')?c.match('./app.html'):undefined));
  })));
});
// FIXED: all if blocks properly closed
self.addEventListener('message',e=>{
  if(e.data?.type==='SW_SKIP_WAITING'){self.skipWaiting();}
  if(e.data?.type==='PING'){e.ports[0]?.postMessage({type:'PONG',cache:CACHE,version:VERSION});}
  if(e.data?.type==='GET_VERSION'){e.ports[0]?.postMessage({type:'VERSION_INFO',cache:CACHE,version:VERSION,date:VERSION_DATE});}
});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?.json()||{};}catch{}
  e.waitUntil(self.registration.showNotification(d.title||'NIM Studio Pro',{body:d.body||'Nouvelle mise à jour !',icon:'./icon-192.png',badge:'./icon-192.png',vibrate:[200,100,200],tag:'nim-notif',data:{url:d.url||'./app.html'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cls=>{
    for(const c of cls){if(c.url.includes('app.html')&&'focus'in c)return c.focus();}
    return clients.openWindow('./app.html');
  }));
});
