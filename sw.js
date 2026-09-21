/* 酒帖 Service Worker — 電波の届かない店内でも開けるようにするためのキャッシュ。
   アプリを更新したら CACHE の版番号を上げること（古いキャッシュは activate で消える）。 */
const CACHE = 'sakecho-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* キャッシュ優先で即座に表示し、裏でネットから取り直して次回に反映する
   （店内で開いたときに待たされないことを、更新の即時性より優先している）。 */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || caches.match('./index.html'));

      return hit || net;
    })
  );
});
