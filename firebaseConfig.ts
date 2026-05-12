
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';
import 'firebase/compat/messaging'; // Import Messaging

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDbdBY4aip5vXqh3bqYJN9oWBoyvPYr3h8",
  authDomain: "qfs1-386fe.firebaseapp.com",
  projectId: "qfs1-386fe",
  storageBucket: "qfs1-386fe.firebasestorage.app",
  messagingSenderId: "41325311992",
  appId: "1:41325311992:web:6c7f90794ecbe17e26080d",
  measurementId: "G-Q4YPJRPQFB"
};

// Use a singleton pattern to ensure Firebase is only initialized once
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Initialize Cloud Services
export const db = app.firestore();

// Apply settings to improve connectivity and enable offline persistence
db.settings({
  ignoreUndefinedProperties: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED // Enable unlimited caching for slow networks
});

// Enable persistence for weak networks, wrapping in try/catch to bypass iframe/incognito limitations without breaking the app
try {
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    console.warn("Firestore offline persistence fallback:", err.code);
  });
} catch (err) {
  console.warn("Firestore offline persistence could not be enabled.");
}

export const auth = app.auth();

// Initialize Messaging
export let messaging: firebase.messaging.Messaging | null = null;
if (typeof window !== 'undefined' &&  firebase.messaging.isSupported()) {
  try {
    messaging = app.messaging();
  } catch (err) {
    console.error("Firebase Messaging failed to initialize", err);
  }
}

// Protect Analytics initialization as it may fail in some browsing environments
if (typeof window !== 'undefined') {
  try {
    firebase.analytics(app);
  } catch (err) {
    console.warn("Firebase Analytics failed to initialize (this is usually non-critical):", err);
  }
}

export default app;
