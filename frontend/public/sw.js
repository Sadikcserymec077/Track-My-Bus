const CACHE_NAME = 'bustrack-v1';
const STATIC_ASSETS = ['/', '/index.html'];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    // Skip non-GET and socket.io requests
    if (request.method !== 'GET' || request.url.includes('socket.io')) return;

    event.respondWith(
        fetch(request)
            .then((res) => {
                // Cache successful responses
                if (res.ok && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return res;
            })
            .catch(() => caches.match(request))
    );
});

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'BusTrack', {
            body: data.message || data.body || 'New notification',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: data.url || '/' },
            vibrate: [200, 100, 200]
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
