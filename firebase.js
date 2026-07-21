import { firebaseConfig } from './config.js';

class FirebaseGPSService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    if (window.firebase) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      this.db = window.firebase.database();
    }
  }

  // Write live GPS payload under `gps/live` node
  async writeLiveGPS(data) {
    if (!this.db) this.init();
    if (!this.db) throw new Error("Firebase DB not initialized");

    const payload = {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      address: data.address || "",
      accuracy: Number(data.accuracy || 0),
      date: data.date,
      time: data.time,
      timestamp: data.timestamp || Date.now(),
      lastUpdated: window.firebase.database.ServerValue.TIMESTAMP
    };

    return this.db.ref('gps/live').set(payload);
  }

  // Realtime subscription to `gps/live` node for OBS Overlay
  listenLiveGPS(onUpdate, onError) {
    if (!this.db) this.init();
    if (!this.db) {
      if (onError) onError(new Error("Firebase unavailable"));
      return () => {};
    }

    const liveRef = this.db.ref('gps/live');
    const handleValue = (snapshot) => {
      onUpdate(snapshot.exists() ? snapshot.val() : null);
    };

    liveRef.on('value', handleValue, onError);

    return () => liveRef.off('value', handleValue);
  }
}

export const gpsService = new FirebaseGPSService();
