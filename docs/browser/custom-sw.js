const CACHE_NAME = 'weather-app-cache-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache opened');
      return cache.addAll([
        '/',               // Entry point
        '/index.html',      // HTML
        '/styles.css',      // CSS
        '/main.js',         // JS
      ]);
    })
  );
  self.skipWaiting(); // Immediately activate the new service worker
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of all open clients
});

self.addEventListener('fetch', (event) => {
  console.log('Fetch event for ', event.request.url);
  if (event.request.url.includes('/api/login')) {
    console.log('Handling login request');
  }

  if (event.request.method === 'POST') {
    event.respondWith(handlePostRequest(event.request));
    return;
  }
  event.respondWith(cacheAndFetch(event.request));
});

// ngsw-worker.js or custom service worker
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Default body',
    icon: 'assets/icons/icon-192x192.png',
    badge: 'assets/icons/icon-192x192.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'New Notification', options)
  );
});



function cacheAndFetch(request) {
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Serving from cache:', request.url);
        return cachedResponse;
      } else {
        console.log('Fetching from network:', request.url);
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response; // Return the network error response if any
            }
            cache.put(request, response.clone()); // Cache the network response
            return response;
          })
          .catch(() => {
            return new Response('Network error occurred.', { status: 503 });
          });
      }
    });
  });
}

// Fetch the resource from the network and cache it
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response; // Only cache valid responses
      }
      const responseClone = response.clone(); // Clone response for caching
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return response;
    })
    .catch(() => {
      return new Response('Offline content unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    });
}

async function handlePostRequest(request) {
  const requestClone = request.clone();
  const requestBody = await requestClone.json(); // Extract request body for caching

  try {
    // Try to fetch from the network
    const networkResponse = await fetch(request);
    const responseClone = networkResponse.clone();
    const responseBody = await responseClone.json();

    // Save both the request and response data in IndexedDB
    await savePostRequest(request.url, requestBody, responseBody);

    return networkResponse;
  } catch (error) {
    // If network fails, attempt to retrieve the response from IndexedDB
    const cachedResponseBody = await getCachedPostResponse(request.url);
    if (cachedResponseBody) {
      console.log('Serving cached response for', request.url);
      return new Response(JSON.stringify(cachedResponseBody), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Network error and no cached data available', { status: 500 });
    }
  }
}

// IndexedDB setup
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('post-cache-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('post-requests', { keyPath: 'url' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function savePostRequest(url, requestBody, responseBody) {
  console.log('Saving cached response for', url);
  return openDatabase().then((db) => {
    const tx = db.transaction('post-requests', 'readwrite');
    const store = tx.objectStore('post-requests');
    store.put({ url, requestBody, responseBody });
    return tx.complete;
  });
}

function getCachedPostResponse(url) {
  console.log('Getting cached response for', url);
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('post-requests', 'readonly');
      const store = tx.objectStore('post-requests');
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result ? request.result.responseBody : null);
      request.onerror = (event) => reject(event.target.error);
    });
  });
}
