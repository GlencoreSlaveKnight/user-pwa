// --- 1. CHANGE THIS VERSION ---
const CACHE_NAME = 'v11-antamina-alertas'; // Incremented version
const API_DOMAIN = 'script.google.com';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/Logo 192.png',
  '/images/Logo 512.png',
  '/images/antamina-logo.png',
  
  // --- 2. ADDED ALL SIREN IMAGES ---
  '/images/Red siren.png',
  '/images/Orange siren.png',
  '/images/Yellow siren.png',
  '/images/Green siren.png',
  '/images/Blue siren.png', // For "Probando"
  
  '/sounds/alarm.mp3',
  
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
  
  // --- 3. REMOVED admin.html and admin.js ---
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

  if (requestUrl.hostname === API_DOMAIN) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      }
    )
  );
});