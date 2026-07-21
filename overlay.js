import { listenLiveGPS } from './firebase.js';

class OBSOverlay {
  constructor() {
    this.statusEl = document.getElementById('status-message');
    this.gridEl = document.getElementById('grid-content');
    this.latEl = document.getElementById('lat-val');
    this.lonEl = document.getElementById('lon-val');
    this.timeEl = document.getElementById('time-val');
    this.dateEl = document.getElementById('date-val');

    this.lastReceivedTimestamp = 0;

    this.showStatus('Waiting for Phone...');
    this.initRealtimeListener();
    this.initStaleCheck();
  }

  initRealtimeListener() {
    console.log("✔ OBS Overlay connecting to Firebase realtime listener on path: gps/live");

    listenLiveGPS(
      (data) => {
        if (!data || data.latitude === undefined || data.longitude === undefined) {
          console.warn("⚠️ Node gps/live has no valid coordinates yet");
          this.showStatus('Waiting for Phone...');
          return;
        }

        // Record exact local receipt time to avoid clock-skew false offline states
        this.lastReceivedTimestamp = Date.now();
        console.log("✔ [REALTIME RECEIVED] Data on path gps/live:", {
          latitude: data.latitude,
          longitude: data.longitude,
          time: data.time,
          date: data.date,
          localReceiptTime: new Date(this.lastReceivedTimestamp).toLocaleTimeString()
        });

        // Update 2x2 grid values in sub-second realtime
        if (this.latEl) this.latEl.textContent = Number(data.latitude).toFixed(6);
        if (this.lonEl) this.lonEl.textContent = Number(data.longitude).toFixed(6);
        if (this.timeEl) this.timeEl.textContent = data.time || '--';
        if (this.dateEl) this.dateEl.textContent = data.date || '--';

        this.showGrid();
      },
      (error) => {
        console.error('✖ OBS Overlay Firebase Listener Error on path gps/live:', error);
        this.showStatus('Connection Lost');
      }
    );
  }

  initStaleCheck() {
    // Only mark Phone Offline if NO update has been received for > 15 seconds
    setInterval(() => {
      if (this.lastReceivedTimestamp > 0) {
        const diff = Date.now() - this.lastReceivedTimestamp;
        if (diff > 15000) {
          console.warn(`⚠️ Offline trigger: No update received for ${Math.round(diff/1000)}s (>15s limit)`);
          this.showStatus('Phone Offline');
        }
      }
    }, 1000);
  }

  showStatus(message) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
      this.statusEl.style.display = 'block';
    }
    if (this.gridEl) {
      this.gridEl.style.display = 'none';
    }
  }

  showGrid() {
    if (this.statusEl) {
      this.statusEl.style.display = 'none';
    }
    if (this.gridEl) {
      this.gridEl.style.display = 'flex';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OBSOverlay();
});
