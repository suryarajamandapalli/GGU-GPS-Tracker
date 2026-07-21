import { gpsService } from './firebase.js';

class OBSOverlay {
  constructor() {
    this.containerEl = document.getElementById('overlay-container');
    this.statusEl = document.getElementById('status-message');
    this.contentEl = document.getElementById('content-list');
    this.addressEl = document.getElementById('address-val');
    this.latEl = document.getElementById('lat-val');
    this.lonEl = document.getElementById('lon-val');
    this.timeEl = document.getElementById('time-val');

    this.initClock();
    this.listenToFirebase();
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      if (this.timeEl) {
        this.timeEl.textContent = now.toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  listenToFirebase() {
    this.showStatus('Waiting for GPS...');

    gpsService.subscribeToGPSData(
      (data) => {
        if (!data || data.latitude === undefined || data.longitude === undefined) {
          this.showStatus('Waiting for GPS...');
          return;
        }

        this.latEl.textContent = Number(data.latitude).toFixed(6);
        this.lonEl.textContent = Number(data.longitude).toFixed(6);
        this.addressEl.textContent = data.formattedAddress || 'Location active';

        this.showContent();
      },
      (error) => {
        console.error('Firebase connection error:', error);
        this.showStatus('Connection Lost');
      }
    );
  }

  showStatus(msg) {
    this.statusEl.textContent = msg;
    this.statusEl.style.display = 'block';
    this.contentEl.style.display = 'none';
  }

  showContent() {
    this.statusEl.style.display = 'none';
    this.contentEl.style.display = 'flex';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OBSOverlay();
});
