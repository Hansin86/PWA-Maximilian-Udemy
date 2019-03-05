var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var fs = require("fs");
var UUID = require("uuid-v4");
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-firebase.key.json");

var googleConfig = {
    projectId: 'pwagram-6eb38',
    keyFilename: 'pwagram-firebase.key.json'
};

var googleCloudStorage = require("@google-cloud/storage")(googleConfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagram-6eb38.firebaseio.com"
});

exports.storePostData = functions.https.onRequest(function (request, response) {
    cors(request, response, function () {
        var uuid = UUID();

        const busboy = new Busboy({ headers: request.headers });
        // These objects will store the values (file + fields) extracted from busboy
        let upload;
        const fields = {};

        // This callback will be invoked for each file uploaded
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            console.log(
                `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
            );
            const filepath = path.join(os.tmpdir(), filename);
            upload = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        // This will invoked on every field detected
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            fields[fieldname] = val;
        });

        // This callback will be invoked after all uploaded files are saved.
        busboy.on("finish", () => {
            var bucket = googleCloudStorage.bucket('pwagram-6eb38.appspot.com');
            bucket.upload(
                upload.file,
                {
                    uploadType: "media",
                    metadata: {
                        metadata: {
                            contentType: upload.type,
                            firebaseStorageDownloadTokens: uuid
                        }
                    }
                },
                function (err, uploadedFile) {
                    if (!err) {
                        admin
                            .database()
                            .ref("posts")
                            .push({
                                id: fields.id,
                                title: fields.title,
                                location: fields.location,
                                rawLocation: {
                                    lat: fields.rawLocationLat,
                                    lng: fields.rawLocationLng
                                },
                                image:
                                    "https://firebasestorage.googleapis.com/v0/b/" +
                                    bucket.name +
                                    "/o/" +
                                    encodeURIComponent(uploadedFile.name) +
                                    "?alt=media&token=" +
                                    uuid
                            })
                            .then(function () {
                                webpush.setVapidDetails('mailto:pwacourse-testaddress@gmail.com',
                                    'BCfV2crNDU0NmMUbLc-Sq-2xxL3vjCQBzd6jJt_e__NBjnsduE4gLBZrfJUc6Bz364T1IJd2piAdz8mPW4vJq5E',
                                    '2rG2llcHjCfC9RhW8vzZwGd8aFoNyoWjOxv7IJVlTuk');
                                return admin
                                    .database()
                                    .ref("subscriptions")
                                    .once("value");
                            })
                            .then(function (subscriptions) {
                                subscriptions.forEach(function (sub) {
                                    var pushConfig = {
                                        endpoint: sub.val().endpoint, // We extract endpoint from firebase
                                        keys: {
                                            auth: sub.val().keys.auth,
                                            p256dh: sub.val().keys.p256dh
                                        }
                                    };

                                    webpush
                                        .sendNotification(
                                            pushConfig,
                                            JSON.stringify({
                                                title: "New Post",
                                                content: "New Post added!",
                                                openUrl: "/help"
                                            })
                                        )
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                                response
                                    .status(201)
                                    .json({ message: "Data stored", id: fields.id });
                            })
                            .catch(function (err) {
                                response.status(500).json({ error: err });
                            });
                    } else {
                        console.log(err);
                    }
                }
            );
        });

        // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(request.rawBody);
        // formData.parse(request, function(err, fields, files) {
        //   fs.rename(files.file.path, "/tmp/" + files.file.name);
        //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
        // });
    });
});