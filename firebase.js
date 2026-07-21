import { firebaseConfig } from './config.js';

// Firebase Realtime Database Service for sub-second OBS streaming
class FirebaseGPSService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (window.firebase) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      this.db = window.firebase.database();
      this.isInitialized = true;
    }
  }

  // Called by Phone client to broadcast live GPS coordinates
  async updateGPSData(data) {
    if (!this.db) this.init();
    if (!this.db) throw new Error("Firebase DB not initialized");

    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      formattedAddress: data.formattedAddress || "",
      accuracy: data.accuracy || 0,
      speed: data.speed || 0,
      timestamp: data.timestamp || Date.now(),
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP
    };

    return this.db.ref('liveGPS').set(payload);
  }

  // Called by OBS Overlay client to listen for real-time changes
  subscribeToGPSData(onData, onError) {
    if (!this.db) this.init();
    if (!this.db) {
      if (onError) onError(new Error("Firebase DB unavailable"));
      return () => {};
    }

    const gpsRef = this.db.ref('liveGPS');
    const callback = (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.val());
      } else {
        onData(null);
      }
    };

    gpsRef.on('value', callback, onError);

    // Return unsubscribe function
    return () => gpsRef.off('value', callback);
  }
}

export const gpsService = new FirebaseGPSService();
