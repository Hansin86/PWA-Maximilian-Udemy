importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');
importScripts('workbox-sw.prod.v2.1.3.js');

const workboxSW = new self.WorkboxSW();

// Dynamic caching
workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'google-fonts',
        cacheExpiration: {
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30 // s * min * h * day
        }
    }
));

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'material-css'
    }
));

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'post-images'
    }
));

workboxSW.router.registerRoute('https://pwagram-6eb38.firebaseio.com/posts', function (args) {
    return fetch(args.event.request)
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
        });
});

workbox.precaching.precacheAndRoute([]);