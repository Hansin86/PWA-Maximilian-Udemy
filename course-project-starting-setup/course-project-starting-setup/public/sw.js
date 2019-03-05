importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v42';
var CACHE_DYNAMIC_NAME = 'dynamic-v12';
var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/utility.js',
    '/src/js/feed.js',
    '/src/js/idb.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// THIS IS A HELPER FUNCTION TO CLEAR SOME CACHE
//function trimCache(cacheName, maxItems) {
//    caches.open(cacheName)
//        .then(function (cache) {
//            return cache.keys()
//                .then(function (keys) {
//                    if (keys.length > maxItems) {
//                        cache.delete(keys[0]) // WE CAN PROPOSE OUR CLEANING ALGORITHM HERE
//                            .then(trimCache(cacheName, maxItems));
//                    }
//                });
//        })        
//}

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.log('[Service Worker] Precaching App Shell');
                // We want to store only nessesary files used as a backbone of application (to show index page)
                cache.addAll(STATIC_FILES);
                // This is how we can add files one by one
                //cache.add('/');
                //cache.add('/index.html');
                //cache.add('/src/js/app.js');
            })
    )
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activating Service Worker ...', event);
    event.waitUntil(
        caches.keys()
            .then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
}

// Cache then Network strategy
self.addEventListener('fetch', function (event) {
    var url = 'https://pwagram-6eb38.firebaseio.com/posts';

    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            fetch(event.request)
                .then(function (res) {
                    let clonedRes = res.clone();
                    clearAllData('posts')
                        .then(function () {
                            return clonedRes.json();
                        })
                        .then(function (data) {
                            for (let key in data) {
                                writeData('posts', data[key]); // wrtieData comes from utility.js
                            }
                        });                    
                    return res;
                })
        );
    } else if (isInArray(event.request.url, STATIC_FILES)) { // we're checking if request is part of STATIC_FILES array
        event.respondWith(
            caches.match(event.request)
        );
    } else {
        event.respondWith(
            caches.match(event.request) // keys are stored as reqests
                .then(function (response) {
                    if (response) { // response might be null if it wasnt cached before, this response is from cache
                        return response;
                    } else {
                        return fetch(event.request) 
                            .then(function (res) { // this is a response from server after fetching it
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function (cache) {
                                        //trimCache(CACHE_DYNAMIC_NAME, 40);
                                        cache.put(event.request.url, res.clone()); // response can be used only once, after that, they're cleared
                                        return res;
                                    });
                            })
                            .catch(function (err) {
                                // RETURN FALLBACK PAGE IF NETWORK ERROR
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function (cache) {
                                        if (event.request.headers.get('accept').includes('text/html')) { // this is if we want to reteurn page, for images eg. avatars we can also create this condition
                                            return cache.match('/offline.html');
                                        }                                        
                                    });
                            });
                    }
                    })
        )
    }    
});


// network with cache fallback strategy - not good for really slow connections
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        fetch(event.request)
//            .catch(function (err) {
//                return caches.match(event.request)
//            })        
//    );
//});

// cache with network fallback strategy
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        caches.match(event.request) // keys are stored as reqests
//            .then(function (response) {
//                if (response) { // response might be null if it wasnt cached before, this response is from cache
//                    return response;
//                } else {
//                    return fetch(event.request) 
//                        .then(function (res) { // this is a response from server after fetching it
//                            return caches.open(CACHE_DYNAMIC_NAME)
//                                .then(function (cache) {
//                                    cache.put(event.request.url, res.clone()); // response can be used only once, after that, they're cleared
//                                    return res;
//                                });
//                        })
//                        .catch(function (err) {
//                            // RETURN FALLBACK PAGE IF NETWORK ERROR
//                            return caches.open(CACHE_STATIC_NAME)
//                                .then(function (cache) {
//                                    return cache.match('/offline.html');
//                                });
//                        });
//                }
//            })
//    );
//});

// network only strategy - no sense in it, same as normal network req / resp
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        fetch.(event.request)
//    );
//});

// cache only strategy - might me worth for some special assets
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        caches.match(event.request)
//    );
//});

self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);

    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntil(
            readAllData('sync-posts')
                .then(function (data) {
                    for (let dt of data) {
                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.lat);
                        postData.append('rawLocationLng', dt.rawLocation.lng);
                        postData.append('file', dt.picture, dt.id + '.png');

                        fetch('https://us-central1-pwagram-6eb38.cloudfunctions.net/storePostData', {
                            method: 'POST',
                            //headers: {
                            //    'Content-Type': 'application/json',
                            //    'Accept': 'application/json'
                            //},
                            //body: JSON.stringify({
                            //    id: dt.id,
                            //    title: dt.title,
                            //    location: dt.location,
                            //    image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-6eb38.appspot.com/o/sf-boat.jpg?alt=media&token=2ba1a2f7-3c76-435b-a47e-1768cdc6e458'
                            //})                                
                            body: postData
                        })
                        .then(function (res) {
                            console.log('Sent data', res);
                            if (res.ok) {
                                res.json()
                                    .then(function (resData) {
                                        deleteItemFromData('sync-posts', resData.id);
                                    });                                
                            }
                        })
                        .catch(function (err) {
                            console.log('Error while sending data', err);
                        })
                    }                    
                })
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    let notification = event.notification;
    let action = event.action;

    console.log(notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen');
        notification.close();
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll()
                .then(function (clis) {
                    let client = clis.find(function (c) {
                        return c.visibilityState === 'visible';
                    });

                    if (client !== undefined) {
                        client.navigate(notification.data.url);
                        client.focus();
                    } else {
                        clients.openWindow(notification.data.url);
                    }

                    notification.close();
                })
        );        
    }
});

self.addEventListener('notificationclose', function (event) {
    console.log('Notification was closed', event);
});

self.addEventListener('push', function (event) {
    console.log('Push Notification received', event);

    let data = { title: 'New!', content: 'Something new happend!', openUrl: '/'};

    if (event.data) {
        data = JSON.parse(event.data.text());
    }

    let options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});