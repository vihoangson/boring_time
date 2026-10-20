import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function offlinePrecache() {
  return {
    name: 'offline-precache',
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file !== 'service-worker.js')
        .map((file) => `/${file}`)
      const worker = `
const CACHE = 'boring-time-${Date.now()}';
const ASSETS = ${JSON.stringify(['/', '/index.html', ...assets])};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('boring-time-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : Promise.reject(new Error('Không có nội dung ngoại tuyến')))));
});`
      this.emitFile({ type: 'asset', fileName: 'service-worker.js', source: worker })
    },
  }
}

export default defineConfig({
  plugins: [vue(), offlinePrecache()],
})
