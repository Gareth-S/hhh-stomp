const CACHE_NAME = "hhh-stomp-v1.2";
const UPDATE_FILE = "./assets/update.json";


/*
 * Get the list of application/install files.
 */
async function getUpdateList() {

    const response =
        await fetch(
            UPDATE_FILE,
            { cache: "no-cache" }
        );

    if (!response.ok) {

        throw new Error(
            `Could not load ${UPDATE_FILE}: HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    if (!Array.isArray(data.files)) {

        throw new Error(
            "update.json does not contain a files array"
        );
    }

    return data.files;
}


/*
 * Cache application/install files.
 *
 * progressCallback is optional.
 *
 * During installation there is no callback.
 * During "Update now", settings.js supplies one.
 */
async function cacheInstallFiles(progressCallback = null) {

    const files =
        await getUpdateList();

    const cache =
        await caches.open(CACHE_NAME);

    const results = [];


    for (let i = 0; i < files.length; i++) {

        const file =
            files[i];


        /*
         * Tell settings.js what we are about to load.
         */
        if (progressCallback) {

            progressCallback({
                phase: "core",
                current: i + 1,
                total: files.length,
                file: file
            });
        }


        try {

            const response =
                await fetch(
                    file,
                    { cache: "no-cache" }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            await cache.put(
                file,
                response.clone()
            );


            results.push({
                file: file,
                ok: true
            });


        } catch (error) {

            console.warn(
                "Song2HTML: could not cache",
                file,
                error
            );


            results.push({
                file: file,
                ok: false,
                error: String(error)
            });
        }
    }


    return results;
}


/*
 * Fetch from the network first.
 *
 * If the network does not respond within
 * the timeout, use the cached response.
 */
async function networkFirst(
    request,
    cacheRequest = request,
    timeout = 4000
) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            () => {
                controller.abort();
            },
            timeout
        );


    try {

        const response =
            await fetch(
                request,
                {
                    signal:
                        controller.signal
                }
            );


        if (response.ok) {

            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(
                cacheRequest,
                response.clone()
            );
        }


        return response;


    } catch (error) {

        const cachedResponse =
            await caches.match(
                cacheRequest
            );


        if (cachedResponse) {

            return cachedResponse;
        }


        throw error;


    } finally {

        clearTimeout(timer);
    }
}



/*
 * Cache content files.
 *
 * The file list is supplied by settings.js.
 *
 * During installation there is no content update.
 * During "Update now", progress is reported back
 * through the supplied callback.
 */

async function cacheContentFiles(
    files,
    progressCallback = null
) {

    const cache =
        await caches.open(CACHE_NAME);

    const results = [];


    for (let i = 0; i < files.length; i++) {

        const file =
            files[i];


        /*
         * Tell settings.js what we are about to load.
         */
        if (progressCallback) {

            progressCallback({

                phase: "content",

                current: i + 1,

                total: files.length,

                file: file

            });
        }


        try {

            const response =
                await fetch(
                    file,
                    { cache: "no-cache" }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            /*
             * Explicitly put the file into
             * the Song2HTML cache.
             */
            await cache.put(
                file,
                response.clone()
            );


            results.push({

                file: file,

                ok: true

            });


        } catch (error) {

            console.warn(
                "Song2HTML: could not cache content",
                file,
                error
            );


            results.push({

                file: file,

                ok: false,

                error: String(error)

            });
        }
    }


    return results;
}


/*
 * Service worker installation.
 */
self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            cacheInstallFiles()

                .then(() => {

                    return self.skipWaiting();
                })

                .catch(error => {

                    console.error(
                        "Song2HTML: service worker install failed",
                        error
                    );

                    throw error;
                })
        );
    }
);


/*
 * Service worker activation.
 */
self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()

                .then(keys => {

                    return Promise.all(

                        keys

                            .filter(
                                key =>
                                    key.startsWith("hhh-stomp-")
                            )

                            .filter(
                                key =>
                                    key !== CACHE_NAME
                            )

                            .map(
                                key =>
                                    caches.delete(key)
                            )
                    );
                })

                .then(() => {

                    return self.clients.claim();
                })
        );
    }
);


/*
 * Fetch handling.
 */
self.addEventListener(
    "fetch",
    event => {
        
/*        
        console.log(
    "SW FETCH:",
    event.request.url,
    event.request.cache
            );       
*/

        const request =
            event.request;


        /*
         * Only GET requests.
         */
        if (request.method !== "GET") {
            return;
        }


        const url =
            new URL(request.url);


        /*
         * Never cache PHP/server-side requests.
         */
        if (
            url.pathname
                .toLowerCase()
                .endsWith(".php")
        ) {
            return;
        }


        /*
         * Only handle requests belonging
         * to this Song2HTML origin.
         */
        if (
            url.origin !==
            self.location.origin
        ) {
            return;
        }



        const scopePath =
            new URL(
                self.registration.scope
            ).pathname;

        const relativePath =
            url.pathname.startsWith(scopePath)
                ? url.pathname.slice(
                    scopePath.length
                )
                : url.pathname;


        const isCurrentSetlist =
            relativePath
                .toLowerCase()
                === "assets/current.setlist.json";
                
                

const isUserData =
    url.searchParams.has("user-data") &&
    relativePath
        .toLowerCase()
        .startsWith("songs/") &&
    relativePath
        .toLowerCase()
        .endsWith(".json");
        
        
        
          const isSongHtml =
    relativePath
        .toLowerCase()
        .startsWith("songs/") &&
    relativePath
        .toLowerCase()
        .endsWith(".html");


const isAllSetlists =
    relativePath
        .toLowerCase()
        === "assets/all.setlists.json";


const isSavedSetlist =
    relativePath
        .toLowerCase()
        .startsWith("setlists/") &&
    relativePath
        .toLowerCase()
        .endsWith(".setlist.json");
        

        /*
         * Current setlist:
         * network first, cached fallback.
         */
        if (isCurrentSetlist) {

            const cleanRequest =
                new Request(
                    url.origin +
                    url.pathname
                );

            event.respondWith(
                networkFirst(
                    request,
                    cleanRequest
                )
            );

            return;
        }


        /*
         * User JSON:
         * network first, cached fallback.
         */
        if (isUserData) {
            

/*            
                console.log(
        "SW USER DATA:",
        url.pathname,
        "cache mode:",
        request.cache
    );

*/
            const cleanRequest =
                new Request(
                    url.origin +
                    url.pathname
                );

            event.respondWith(
                networkFirst(
                    request,
                    cleanRequest
                )
            );

            return;
        }


        event.respondWith(

            caches.match(request)

                .then(
                    async cachedResponse => {

                        /*
                         * Normal exact cache lookup.
                         */
                        if (cachedResponse) {

                            return cachedResponse;
                        }


                        
if (isAllSetlists) {

    const cleanRequest =
        new Request(
            url.origin +
            url.pathname
        );

    const cleanCachedResponse =
        await caches.match(
            cleanRequest
        );

    if (cleanCachedResponse) {

        return cleanCachedResponse;
    }
}


/*
 * Look for the clean cached saved setlist.
 */
if (isSavedSetlist) {

    const cleanRequest =
        new Request(
            url.origin +
            url.pathname
        );

    const cleanCachedResponse =
        await caches.match(
            cleanRequest
        );

    if (cleanCachedResponse) {

        return cleanCachedResponse;
    }
}       
        
        
/*
 * Existing song handling.
 */

        
                        if (isSongHtml) {

                            const cleanRequest =
                                new Request(
                                    url.origin +
                                    url.pathname
                                );


                            const cleanCachedResponse =
                                await caches.match(
                                    cleanRequest
                                );


                            if (cleanCachedResponse) {

                                return cleanCachedResponse;
                            }
                        }


                        /*
                         * Nothing cached.
                         * Go to the network.
                         */
                        const response =
                            await fetch(request);


                        /*
                         * Only cache successful responses.
                         */
                        if (response.ok) {

                            const cache =
                                await caches.open(
                                    CACHE_NAME
                                );


                            /*
                             * Store song HTML without
                             * query parameters.
                             */
                            
                            if (
                                isSongHtml ||
                                isCurrentSetlist ||
                                isSavedSetlist
                                ) {
                            

                                const cleanRequest =
                                    new Request(
                                        url.origin +
                                        url.pathname
                                    );


                                await cache.put(
                                    cleanRequest,
                                    response.clone()
                                );

                            } else {

                                await cache.put(
                                    request,
                                    response.clone()
                                );
                            }
                        }


                        return response;
                    }
                )
        );
    }
);


/*
 * Settings can send:
 *
 *     { type: "UPDATE_CORE" }
 *
 * to refresh the application/install files.
 */
self.addEventListener(
    "message",
    event => {

        if (
            !event.data ||
            event.data.type !== "UPDATE_CORE"
        ) {
            return;
        }


        event.waitUntil(

            cacheInstallFiles(

                progress => {

                    /*
                     * Send progress back to settings.js.
                     */
                    if (
                        event.ports &&
                        event.ports[0]
                    ) {

                        event.ports[0].postMessage({

                            type: "UPDATE_PROGRESS",

                            phase: progress.phase,

                            current:
                                progress.current,

                            total:
                                progress.total,

                            file:
                                progress.file
                        });
                    }
                }
            )

                .then(results => {

                    if (
                        event.ports &&
                        event.ports[0]
                    ) {

                        event.ports[0].postMessage({

                            type: "UPDATE_COMPLETE",

                            ok: true,

                            results: results
                        });
                    }
                })

                .catch(error => {

                    console.error(
                        "Song2HTML: core update failed",
                        error
                            
                            );
                } ) );
            }
);
                        
/*
 * Settings can send:
 *
 *     {
 *         type: "UPDATE_CONTENT",
 *         files: [...]
 *     }
 *
 * to download and cache all content files.
 */
self.addEventListener(
    "message",
    event => {

        if (
            !event.data ||
            event.data.type !== "UPDATE_CONTENT"
        ) {
            return;
        }


        const files =
            event.data.files;


        if (!Array.isArray(files)) {

            console.error(
                "Song2HTML: UPDATE_CONTENT requires a files array"
            );

            return;
        }


        event.waitUntil(

            cacheContentFiles(

                files,

                progress => {

                    /*
                     * Send progress back to settings.js.
                     */
                    if (
                        event.ports &&
                        event.ports[0]
                    ) {

                        event.ports[0].postMessage({

                            type:
                                "UPDATE_PROGRESS",

                            phase:
                                progress.phase,

                            current:
                                progress.current,

                            total:
                                progress.total,

                            file:
                                progress.file
                        });
                    }
                }
            )

                .then(results => {

                    if (
                        event.ports &&
                        event.ports[0]
                    ) {

                        event.ports[0].postMessage({

                            type:
                                "UPDATE_COMPLETE",

                            ok: true,

                            results:
                                results
                        });
                    }
                })

                .catch(error => {

                    console.error(
                        "Song2HTML: content update failed",
                        error
                    );


                    if (
                        event.ports &&
                        event.ports[0]
                    ) {

                        event.ports[0].postMessage({

                            type:
                                "UPDATE_COMPLETE",

                            ok: false,

                            error:
                                String(error)
                        });
                    }
                })
        );
    });
               
                
                
