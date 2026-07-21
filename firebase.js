import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase App, Database & Anonymous Auth
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  
  // Auto-authenticate anonymously to satisfy Firebase Security Rules
  signInAnonymously(auth)
    .then(() => console.log("✔ Firebase Anonymous Auth Signed In"))
    .catch((err) => console.warn("⚠️ Anonymous Auth note:", err.message));

  console.log("✔ Firebase initialized successfully");
} catch (err) {
  console.error("✖ Firebase initialization failed:", err);
}

// Write to exact path: `gps/live`
export async function writeLiveGPS(data) {
  if (!db) {
    const error = new Error("Firebase DB not initialized");
    console.error("✖ writeLiveGPS error:", error);
    throw error;
  }

  // Ensure user is signed in if auth is enabled
  if (auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {}
  }

  const gpsRef = ref(db, 'gps/live');

  const payload = {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    address: data.address || "",
    accuracy: Number(data.accuracy || 0),
    date: data.date || "",
    time: data.time || "",
    timestamp: data.timestamp || Date.now(),
    lastUpdated: serverTimestamp()
  };

  try {
    await set(gpsRef, payload);
    console.log("✔ Firebase writeLiveGPS successful:", payload);
    return true;
  } catch (error) {
    console.error("✖ Firebase writeLiveGPS failed:", error);
    throw error;
  }
}

// Realtime subscription on exact path: `gps/live`
export function listenLiveGPS(onUpdate, onError) {
  if (!db) {
    const error = new Error("Firebase DB not initialized");
    console.error("✖ listenLiveGPS error:", error);
    if (onError) onError(error);
    return () => {};
  }

  const gpsRef = ref(db, 'gps/live');

  const unsubscribe = onValue(
    gpsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        console.log("✔ Firebase realtime update received on gps/live:", val);
        onUpdate(val);
      } else {
        console.warn("⚠️ Firebase node gps/live does not exist yet");
        onUpdate(null);
      }
    },
    (error) => {
      console.error("✖ Firebase listenLiveGPS error:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}
