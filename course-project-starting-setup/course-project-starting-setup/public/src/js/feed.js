var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation = { lat: 0, lng: 0 };

locationBtn.addEventListener('click', function (event) {
    if (!('geolocation' in navigator)) {
        return;
    }

    let sawAlert = false;

    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition(function (position) {
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        fetchedLocation = { lat: position.coords.latitude, lng: 0 };
        locationInput.value = 'Dummy value';
        document.querySelector('#manual-location').classList.add('is-focused');
    }, function (err) {
        console.log(err);
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        if (!sawAlert) {
            alert('Couldn\'t fetch location, please enter manually!');
            sawAlert = true;
        }        
        fetchedLocation = {lat: 0, lng: 0};
        }, { timeout: 7000 });
});

function initializeLocation() {
    if (!('geolocation' in navigator)) {
        locationBtn.style.display = 'none';
    }
};

function initializeMedia() {
    if (!('mediaDevices' in navigator)) {
        // We add property mediaDevices as polyfill
        navigator.mediaDevices = {};
    }

    // We're supporting older browsers
    if (!('getUserMedia' in navigator.mediaDevices)) {
        navigator.mediaDevices.getUserMEdia = function (constraints) {
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented!'));
            }

            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function (stream) {
            videoPlayer.srcObject = stream;
            videoPlayer.style.display = 'block';
        })
        .catch(function (err) {
            imagePickerArea.style.display = 'block';
        });
}

captureButton.addEventListener('click', function (event) {
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';

    var context = canvasElement.getContext('2d'); // 2d image
    context.drawImage(videoPlayer, 0, 0, canvasElement.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width));
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
        track.stop();
    });

    picture = dataURItoBlob(canvasElement.toDataURL()); // store stream (64 representation) as blob
});

imagePicker.addEventListener('change', function (event) {
    picture = event.target.files[0];
});

function openCreatePostModal() {
    createPostArea.style.display = 'block';

    // This is a workaround for showing animation. Without it, CSS are applied at the same time and browser won't show animation.
    setTimeout(function () {
        createPostArea.style.transform = 'translateY(0)';
    }, 1);

    initializeMedia();
    initializeLocation();
    
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

    // THIS IS WE UNREGISTER SERVICE WORKER
    //if ('serviceWorker' in navigator) {
    //    navigator.serviceWorker.getRegistrations()
    //        .then(function (registrations) {
    //            for (var i = 0; i < registrations.length; i++) {
    //                registrations[i].unregister();
    //            }
    //        })
    //}
}

function closeCreatePostModal() {
    //createPostArea.style.display = 'none';
    imagePickerArea.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    captureButton.style.display = 'inline';

    if (videoPlayer.srcObject) {
        videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    }

    // This is a workaround for showing animation. Without it, CSS are applied at the same time and browser won't show animation.
    setTimeout(function () {
        createPostArea.style.transform = 'translateY(100vh)';
    }, 300);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// ON DEMAND CACHING
function onSaveButtonClicked(event) {
    console.log('clicked');
    
    if ('caches' in window) {
        caches.open('user-requested')
            .then(function (cache) {
                cache.add('https://httpbin.org/get');
                cache.add('/src/images/sf-boat.jpg');
            });
    }
}

function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';
    // DYNAMIC CACHING BUTTON
    //var cardSaveButton = document.createElement('button');
    //cardSaveButton.textContent = 'Save';
    //cardSaveButton.addEventListener('click', onSaveButtonClicked);
    //cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
    clearCards();
    for (let i = 0; i < data.length; i++) {
        createCard(data[i]);
    }
}

var url = 'https://pwagram-6eb38.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        networkDataReceived = true;
        console.log('From web ', data);

        let dataArray = [];
        for (let key in data) {
            dataArray.push(data[key]);
        }
        
        updateUI(dataArray);
    });

// We're checking if browser supports indexDB
if ('indexedDB' in window) {
    readAllData('posts')
        .then(function (data) {
            if (!networkDataReceived) {
                console.log('From cache', data);
                updateUI(data);
            }
        });
}

function sendData() {
    var id = new Date().toISOString();
    var postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('rawLocationLat', fetchedLocation.lat);
    postData.append('rawLocationLng', fetchedLocation.lng);
    postData.append('file', picture, id + '.png');
    
    fetch('https://us-central1-pwagram-6eb38.cloudfunctions.net/storePostData', {
        method: 'POST',
        //headers: {
        //    'Content-Type': 'application/json',
        //    'Accept': 'application/json'
        //},
        //body: JSON.stringify({
        //    id: new Date().toISOString(),
        //    title: titleInput.value,
        //    location: locationInput.value,
        //    image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-6eb38.appspot.com/o/sf-boat.jpg?alt=media&token=2ba1a2f7-3c76-435b-a47e-1768cdc6e458'
        body: postData
        })
            .then(function (res) {
                console.log('Sent data', res);
                updateUI();
            })
};


form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('Please enter valid data!');
        return;
    }

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(function (sw) { // function get access to service worker, whenever it is ready
                var post = {
                    id: new Date().toISOString(),
                    title: titleInput.value,
                    location: locationInput.value,
                    picture: picture,
                    rawLocation: fetchedLocation
                };

                console.log('Location: ' + fetchedLocation.lat + '' + fetchedLocation.lng);

                writeData('sync-posts', post)
                    .then(function () {
                        sw.sync.register('sync-new-posts'); // we register only the tag
                    })
                    .then(function () {
                        let snackbarContainer = document.querySelector('#confirmation-toast');
                        let data = { message: 'Your Post was saved for syncing!' };
                        snackbarContainer.MaterialSnackbar.showSnackbar(data);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    } else {
        sendData();
    }
});

// We're checking if browser supports caches
//if ('caches' in window) {
//    caches.match(url)
//        .then(function (response) {
//            if (response) {
//                return response.json();
//            }
//        })
//        .then(function (data) {
//            console.log('From cache ', data);
//            if (!networkDataReceived) {
//                let dataArray = [];
//                for (let key in data) {
//                    dataArray.push(data[key]);
//                }

//                updateUI(dataArray);
//            }            
//        });
//}