const C='fluxo-v1',F=['./','index.html','style.css','app.js','manifest.webmanifest','icon.svg'];

self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));

// Serve do cache e atualiza em segundo plano
self.addEventListener('fetch',e=>{
  if(e.request.method!='GET'||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(caches.match(e.request).then(r=>{
    const n=fetch(e.request).then(x=>{const cp=x.clone();caches.open(C).then(c=>c.put(e.request,cp));return x}).catch(()=>r);
    return r||n;
  }));
});
