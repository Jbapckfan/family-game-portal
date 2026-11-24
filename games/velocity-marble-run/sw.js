/**
 * Service Worker for Velocity Marble Run
 * Provides offline support and caching
 */

const CACHE_PREFIX = 'velocity-marble-run-';
const CACHE_NAME = CACHE_PREFIX + 'v29';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/game.css',
    './js/vendor/three.module.min.js',
    './js/engine/MusicThemes.js',
    './js/engine/MusicEngine.js',
    './js/engine/BeatMap.js',
    './js/engine/AudioManager.js',
    './js/engine/HapticManager.js',
    './js/game/Marble.js',
    './js/game/Shop.js',
    './js/game/LevelData.js',
    './js/game/Rivals.js',
    './js/game/GameState.js',
    './js/game/Daily.js',
    './js/game/Challenge.js',
    './js/game/ScoreCard.js',
    './js/game/Progression.js',
    './js/ui/UIManager.js',
    './js/ui/Animations.js',
    './js/ui/PremiumUI.js',
    './js/three/TrackFixes.js',
    './js/three/Track.js',
    './js/three/MarbleLooks.js',
    './js/three/Scene3D.js',
    './js/three/MarbleFX.js',
    './js/Game.js',
    './js/main.js',
    './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Other pages on the same site keep their own caches
                    if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.open(CACHE_NAME)
            .then((cache) => cache.match(event.request))
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
