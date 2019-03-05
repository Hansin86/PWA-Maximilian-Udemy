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

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "4b6f75471df54ae4f337eff3fe2c552e"
  },
  {
    "url": "manifest.json",
    "revision": "eef9a31a7008a2534324fc0e2d33e0e9"
  },
  {
    "url": "offline.html",
    "revision": "ad5a7db79a1584607374260ca4c6bfae"
  },
  {
    "url": "src/css/app.css",
    "revision": "36291de7135e1c3dfb74542d0ab715b6"
  },
  {
    "url": "src/css/feed.css",
    "revision": "b7bd78b546e53897b4a896a779265718"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "fd9b16ba88b459c02d67cacc0c1da829"
  },
  {
    "url": "src/js/feed.js",
    "revision": "f15be34b0c481c2d0feccfff7522aae0"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "545151a4b616c9a3d185a61db899fca4"
  },
  {
    "url": "sw-base.js",
    "revision": "60345f2a2cc9a80cda9bba7c1e6248b0"
  },
  {
    "url": "sw.js",
    "revision": "e4e7610403d1080d7495f7d9289a7575"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);