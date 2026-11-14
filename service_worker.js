const CACHE_NAME = 'emilcina-kocicka-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Helper to resize icon.png to exact 192x192 PNG on the fly for Android PWA check
async function get192Icon() {
  try {
    const resp = await fetch('./icon.png');
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob, { resizeWidth: 192, resizeHeight: 192, resizeQuality: 'high' });
    const canvas = new OffscreenCanvas(192, 192);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    return new Response(pngBlob, { headers: { 'Content-Type': 'image/png' } });
  } catch (e) {
    return fetch('./icon.png');
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('icon-192.png')) {
    event.respondWith(get192Icon());
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => caches.match('./index.html'));
    })
  );
});