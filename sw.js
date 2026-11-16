/* Offline support: pehli baar online kholne par app phone me save ho jati hai. */
const C = 'ledger-cache-v14';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    try {
      /* net ho to naya version lo (4 sec me na mile to saved wala) */
      const res = await Promise.race([fetch(r), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
      if (res && res.ok) c.put(r, res.clone());
      return res;
    } catch (err) {
      const m = (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? ((await c.match('./index.html')) || (await c.match('./'))) : null);
      return m || new Response('Offline — pehle ek baar internet se app kholein.', { status: 503 });
    }
  })());
});
