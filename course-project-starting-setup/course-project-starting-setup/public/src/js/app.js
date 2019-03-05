var deferredPrompt;
var enableNotoficationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        //.register('/sw.js')
        .register('/service-worker.js') //workbos service worker
        .then(function () {
            console.log('Service worker registered!');
        })
        .catch(function (err) {
            console.log(err);
        });
}

window.addEventListener('beforeinstallprompt', function (event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
});

// Notification triggered from web page
function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        let options = {
            body: 'You successfully subsribed to our Notification service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr', //text direction: left to right
            lang: 'en-US', // BCP 47
            vibrate: [100, 50, 200], // vibration, pause, vibration, pause and so on
            badge: '/src/images/icons/app-icon-96x96.png', // right now used only on android
            tag: 'confirm-notification', // multiple notifications will stack on each other
            renotify: true, // true: event if we use the same tag, new notifications will still vibrate | false: same tag, new motifications won't vibrate
            actions: [ // depending on system, actions might not be displayed, we shouldn't depend on them (treat as extra sugar)
                { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' }, // action is id
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
            ]
        };

        navigator.serviceWorker.ready
            .then(function (serviceWorkerRegistration) {
                serviceWorkerRegistration.showNotification('Successfully subscribed!', options);
            });
    }    
        
    //new Notification('Successfully subscribed!', options);
}

function configurePushSub() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let reg;

    navigator.serviceWorker.ready
        .then(function (serviceWorkerRegistration) {
            reg = serviceWorkerRegistration;
            return serviceWorkerRegistration.pushManager.getSubscription();
        })
        .then(function (sub) {
            if (sub == null) {
                // Create a new subscription
                let vapidPublicKey = 'BCfV2crNDU0NmMUbLc-Sq-2xxL3vjCQBzd6jJt_e__NBjnsduE4gLBZrfJUc6Bz364T1IJd2piAdz8mPW4vJq5E';
                let convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            } else {
                // We have subscription
            }
        })
        .then(function (newSub) {
            return fetch('https://pwagram-6eb38.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub)
            });
        })
        .then(function (res) {
            if (res.ok) {
                displayConfirmNotification();
            }            
        })
        .catch(function (err) {
            console.log(err);
        });
}

function askForNotificationPermission() {
    Notification.requestPermission(function (result) {
        console.log('User Choice', result);
        if (result !== 'granted') {
            console.log('No notification permission granted!');
        } else {
            configurePushSub();
            //displayConfirmNotification();
        }
    });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
    for (var i = 0; i < enableNotoficationsButtons.length; i++) {
        enableNotoficationsButtons[i].style.display = 'inline-block';
        enableNotoficationsButtons[i].addEventListener('click', askForNotificationPermission);
    }
}

// PROMISES EXPLANATION
//var promise = new Promise(function (resolve, reject) {
//    setTimeout(() => {
//        //resolve('This is executed once the timer is done!');
//        reject({ code: 500, message: 'An error occurred!' });
//        //console.log('This is executed once the timer is done!');
//    }, 3000);
//});

//fetch('http://httpbin.org/ip')
//    .then(function (response) {
//        console.log(response);
//        return response.json();
//    })
//    .then(function (data) {
//        console.log(data);
//    })
//    .catch((err) => {
//        console.log(err);
//    });

//fetch('http://httpbin.org/post', {
//    method: 'POST',
//    headers: {
//        'Content-Type': 'application/json',
//        'Accept': 'application/json'
//    },
//    mode: 'cors',
//    body: JSON.stringify({
//        message: 'Does this work?'
//    })
//})
//    .then(function (response) {
//        console.log(response);
//        return response.json();
//    })
//    .then(function (data) {
//        console.log(data);
//    })
//    .catch((err) => {
//        console.log(err);
//    });

// ONE WAY OF DEALING WITH PROMISE REJECTION
//promise.then(function (text) {
//    console.log(text);
//}, function (err) {
//    console.log(err.code, err.message);
//});

// ANOTHER MORE COMMON WAY OF DEALING WITH PROMISE REJECTION
//promise.then(function (text) {
//    console.log(text);
//}).catch(function (err) {
//    console.log(err.code, err.message);
//});

//console.log('This is executed right after setTimeout()');