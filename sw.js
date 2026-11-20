/* 매경 시황·세계경제 Service Worker
 * 전략: Network-First
 *  - 매일 app-data.js 만 갱신되므로, 네트워크가 되면 항상 새 파일을 먼저 받아옵니다.
 *  - 실패할 때만 캐시로 화면을 유지합니다(오프라인에서도 마지막 브리핑 표시).
 *  - 새 버전이 설치되면 skipWaiting + clients.claim 으로 바로 교체합니다.
 */
const CACHE = 'mk-economy-v1';
const ASSETS = [
  './',
  './index.html',
  './app-data.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
