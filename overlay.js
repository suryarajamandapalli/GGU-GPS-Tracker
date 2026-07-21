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
    console.log("✔ OBS Overlay connecting to Firebase realtime listener on gps/live...");

    listenLiveGPS(
      (data) => {
        if (!data || data.latitude === undefined || data.longitude === undefined) {
          console.log("⚠️ No active GPS data on gps/live node");
          this.showStatus('Waiting for Phone...');
          return;
        }

        this.lastReceivedTimestamp = data.timestamp || Date.now();

        // Update 2x2 grid values in realtime
        if (this.latEl) this.latEl.textContent = Number(data.latitude).toFixed(6);
        if (this.lonEl) this.lonEl.textContent = Number(data.longitude).toFixed(6);
        if (this.timeEl) this.timeEl.textContent = data.time || '--';
        if (this.dateEl) this.dateEl.textContent = data.date || '--';

        this.showGrid();
      },
      (error) => {
        console.error('✖ OBS Overlay Firebase Listener Error:', error);
        this.showStatus('Connection Lost');
      }
    );
  }

  initStaleCheck() {
    setInterval(() => {
      if (this.lastReceivedTimestamp > 0) {
        const diff = Date.now() - this.lastReceivedTimestamp;
        if (diff > 12000) {
          this.showStatus('Phone Offline');
        }
      }
    }, 3000);
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
