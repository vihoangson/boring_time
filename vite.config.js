import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function offlinePrecache() {
  return {
    name: 'offline-precache',
    apply: 'build',
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file !== 'service-worker.js')
        .map((file) => `/${file}`)
      const worker = `
const CACHE = 'boring-time-${Date.now()}';
const ASSETS = ${JSON.stringify(['/', '/index.html', '/manifest.webmanifest', '/icon.svg', ...assets])};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('boring-time-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(new URL(event.request.url).pathname);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(new URL(event.request.url).pathname, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const appShell = await cache.match('/index.html');
        if (appShell) return appShell;
      }
      throw error;
    }
  })());
});`
      this.emitFile({ type: 'asset', fileName: 'service-worker.js', source: worker })
    },
  }
}

export default defineConfig({
  plugins: [vue(), offlinePrecache()],
})
