import { listenLiveGPS } from './firebase.js';

class OBSOverlay {
  constructor() {
    this.statusEl = document.getElementById('status-message');
    this.contentEl = document.getElementById('content-list');
    this.addressEl = document.getElementById('address-val');
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

    // Pure realtime synchronization with Firebase gps/live node
    listenLiveGPS(
      (data) => {
        if (!data || data.latitude === undefined || data.longitude === undefined) {
          console.log("⚠️ No active GPS data found on gps/live node");
          this.showStatus('Waiting for Phone...');
          return;
        }

        this.lastReceivedTimestamp = data.timestamp || Date.now();

        // Update UI immediately upon Firebase change (sub-second latency)
        if (this.latEl) this.latEl.textContent = Number(data.latitude).toFixed(6);
        if (this.lonEl) this.lonEl.textContent = Number(data.longitude).toFixed(6);
        if (this.addressEl) this.addressEl.textContent = data.address || 'Location active';
        if (this.timeEl) this.timeEl.textContent = data.time || '--';
        if (this.dateEl) this.dateEl.textContent = data.date || '--';

        this.showContent();
      },
      (error) => {
        console.error('✖ OBS Overlay Firebase Listener Error:', error);
        this.showStatus('Connection Lost');
      }
    );
  }

  initStaleCheck() {
    // Check every 3 seconds if Phone has stopped streaming for > 12 seconds
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
    if (this.contentEl) {
      this.contentEl.style.display = 'none';
    }
  }

  showContent() {
    if (this.statusEl) {
      this.statusEl.style.display = 'none';
    }
    if (this.contentEl) {
      this.contentEl.style.display = 'flex';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OBSOverlay();
});
