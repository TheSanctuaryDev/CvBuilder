const CACHE_NAME = 'thecvbuilder-v1';

// ✅ Assets statiques à mettre en cache
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/favicon.ico',
    '/favicon.svg',
    '/favicon-96x96.png',
    '/apple-touch-icon.png',
    '/web-app-manifest-192x192.png',
    '/web-app-manifest-512x512.png',
    '/site.webmanifest',
    '/css/site.css',
    '/js/site.js',
    '/lib/bootstrap/dist/css/bootstrap.min.css',
    '/lib/bootstrap/dist/js/bootstrap.bundle.min.js',
    '/lib/bootstrap-icons/font/bootstrap-icons.css',
    '/lib/intl-tel-input/css/intlTelInput.min.css',
    '/lib/intl-tel-input/js/intlTelInput.min.js'
];

// ========================================
// INSTALLATION — mise en cache des assets
// ========================================
self.addEventListener('install', event => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Mise en cache des assets statiques');
                // On ignore les erreurs individuelles pour ne pas bloquer l'install
                return Promise.allSettled(
                    STATIC_ASSETS.map(url =>
                        cache.add(url).catch(err =>
                            console.warn('[SW] Impossible de cacher:', url, err)
                        )
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ========================================
// ACTIVATION — nettoyage anciens caches
// ========================================
self.addEventListener('activate', event => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Suppression ancien cache:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ========================================
// FETCH — stratégie selon le type de ressource
// ========================================
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non GET
    if (request.method !== 'GET') return;

    // Ignorer les requêtes externes (FedaPay, CDN, etc.)
    if (url.origin !== location.origin) return;

    // Ignorer les requêtes API et handlers Razor
    if (url.pathname.includes('handler=') ||
        url.pathname.includes('/api/') ||
        url.pathname.includes('?')) return;

    // ── Assets statiques → Cache First ──
    if (
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/lib/') ||
        url.pathname.startsWith('/img/') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff|woff2|ttf|webp)$/)
    ) {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    if (cached) return cached;

                    return fetch(request)
                        .then(response => {
                            if (!response || response.status !== 200) return response;
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, clone));
                            return response;
                        })
                        .catch(() => {
                            console.warn('[SW] Asset non disponible:', url.pathname);
                        });
                })
        );
        return;
    }

    // ── Pages Razor → Network First avec fallback cache ──
    event.respondWith(
        fetch(request)
            .then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, clone));
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then(cached => {
                        if (cached) return cached;
                        // Page pas en cache → page offline
                        return caches.match('/offline.html');
                    });
            })
    );
});

// ========================================
// MESSAGE — forcer la mise à jour
// ========================================
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});