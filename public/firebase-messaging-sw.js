
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyDbdBY4aip5vXqh3bqYJN9oWBoyvPYr3h8",
  authDomain: "qfs1-386fe.firebaseapp.com",
  projectId: "qfs1-386fe",
  storageBucket: "qfs1-386fe.firebasestorage.app",
  messagingSenderId: "41325311992",
  appId: "1:41325311992:web:6c7f90794ecbe17e26080d",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
