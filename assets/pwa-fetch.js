const DATA_CACHE_NAME = 'pwa-json-cache-v1';

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Target only JSON requests
  if (requestUrl.pathname.endsWith('.json')) {
    
    // STEP 1: Localhost 1st
    // If the request is originating from or pointing to a local dev environment
    if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return; 
    }

    // STEP 2: Internet 2nd (Cloud Fetch & Cache Update)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            // Silently update the cache in the background
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        // STEP 3: Offline 3rd (Graceful Fallback)
        .catch(() => {
          console.log('App is offline. Loading fallback cached JSON.');
          return caches.match(event.request);
        })
    );
  }
});
