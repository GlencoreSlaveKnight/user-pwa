// --- 1. CHANGE THIS VERSION ---
const CACHE_NAME = 'v6-antamina-alertas';
const API_DOMAIN = 'script.google.com';

const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/style.css',
  '/app.js',
  '/admin.js',
  '/manifest.json',
  '/images/Logo 192.png',
  '/images/Logo 512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
  
  // --- 2. ADD THIS NEW LINE ---
  '/images/antamina-logo.png'
];


// 1. Install Event: Cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Fetch Event: Intercept network requests
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // --- IMPORTANT ---
  // If the request is for our API, always fetch it from the network.
  // Never serve API calls from the cache, as we need live data.
  if (requestUrl.hostname === API_DOMAIN) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For all other requests (HTML, CSS, JS, Images), try cache first.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If a match is found in the cache, return it
        if (response) {
          return response;
        }
        // If no match, fetch it from the network
        return fetch(event.request);
      }
    )
  );
});