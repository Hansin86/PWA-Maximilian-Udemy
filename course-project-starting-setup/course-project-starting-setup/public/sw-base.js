


importScripts('workbox-sw.prod.v2.0.0.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'google-fonts',
  cacheExpiration: {
    maxEntries: 3,
    maxAgeSeconds: 60 * 60 * 24 * 30
  }
}));

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'material-css'
}));

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'post-images'
}));

workboxSW.router.registerRoute('https://pwagram-6eb38.firebaseio.com/posts.json', function(args) {
  return fetch(args.event.request)
    .then(function (res) {
      var clonedRes = res.clone();
      clearAllData('posts')
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData('posts', data[key])
          }
        });
      return res;
    });
});

workboxSW.router.registerRoute(function (routeData) {
    return (routeData.event.request.headers.get('accept').includes('text/html'));
}, function (args) {
    return caches.match(args.event.request) // keys are stored as reqests
        .then(function (response) {
            if (response) { // response might be null if it wasnt cached before, this response is from cache
                return response;
            } else {
                return fetch(args.event.request)
                    .then(function (res) { // this is a response from server after fetching it
                        return caches.open('dynamic')
                            .then(function (cache) {
                                //trimCache(CACHE_DYNAMIC_NAME, 40);
                                cache.put(args.event.request.url, res.clone()); // response can be used only once, after that, they're cleared
                                return res;
                            });
                    })
                    .catch(function (err) {
                        // RETURN FALLBACK PAGE IF NETWORK ERROR
                        return caches.match('/offline.html')
                            .then(function (res) {
                                return res;
                            });
                    });
            }
        });
});

workboxSW.precache([]);

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

    let data = { title: 'New!', content: 'Something new happend!', openUrl: '/' };

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