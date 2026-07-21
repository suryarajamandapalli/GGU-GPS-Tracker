import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase App & Realtime Database using Modular SDK
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
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
    console.error("✖ Firebase writeLiveGPS failed (Permission Denied or Network Error):", error);
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
      console.error("✖ Firebase listenLiveGPS error (Permission Denied / Disconnected):", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}
