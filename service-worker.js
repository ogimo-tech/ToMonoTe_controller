const CACHE = 'tomonote-v4';
const PRECACHE = ['./', './index.html', './manifest.json'];

// インストール: HTML/manifest を先読みキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

// 有効化: 旧キャッシュ削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch:
//  HTML(ナビゲーション/ドキュメント) … ネット優先（オンライン時は常に最新を配信、失敗時のみキャッシュ）
//  その他(画像など)               … キャッシュ優先（オフライン高速・通信節約）
self.addEventListener('fetch', e => {
  const req = e.request;
  const isDoc = req.mode === 'navigate'
             || req.destination === 'document'
             || req.url.endsWith('/')
             || req.url.endsWith('index.html');

  if (isDoc) {
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() =>
        caches.match(req).then(c => c || caches.match('./index.html'))
      )
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});
