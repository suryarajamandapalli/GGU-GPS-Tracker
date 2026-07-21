import { writeLiveGPS } from './firebase.js';

class PhoneTransmitter {
  constructor() {
    this.statusEl = document.getElementById('status');
    this.latEl = document.getElementById('lat');
    this.lonEl = document.getElementById('lon');
    this.addressEl = document.getElementById('address');
    this.accuracyEl = document.getElementById('accuracy');
    this.btnStart = document.getElementById('btn-start');
    this.btnStop = document.getElementById('btn-stop');

    this.watchId = null;
    this.isStreaming = false;
    this.lastUploadTime = 0;
    this.cachedAddress = '';
    this.lastGeocodeCoords = { lat: null, lon: null };

    this.bindEvents();
    // Auto-start streaming on page load for immediate usability
    this.startStreaming();
  }

  bindEvents() {
    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => this.startStreaming());
    }
    if (this.btnStop) {
      this.btnStop.addEventListener('click', () => this.stopStreaming());
    }
  }

  startStreaming() {
    if (this.isStreaming) return;

    if (!navigator.geolocation) {
      this.setStatus("Geolocation API not supported by browser", "error");
      return;
    }

    this.isStreaming = true;
    if (this.btnStart) this.btnStart.disabled = true;
    if (this.btnStop) this.btnStop.disabled = false;

    this.setStatus("Requesting GPS permission...", "pending");

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleGPSUpdate(pos),
      (err) => this.handleGPSError(err),
      options
    );
  }

  stopStreaming() {
    if (!this.isStreaming) return;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isStreaming = false;
    if (this.btnStart) this.btnStart.disabled = false;
    if (this.btnStop) this.btnStop.disabled = true;

    this.setStatus("Streaming Stopped (Paused)", "stopped");
  }

  async handleGPSUpdate(position) {
    if (!this.isStreaming) return;

    const now = Date.now();

    // Throttle uploads to ~1 update per second
    if (now - this.lastUploadTime < 950) {
      return;
    }
    this.lastUploadTime = now;

    const { latitude, longitude, accuracy } = position.coords;
    const dateObj = new Date();

    const localTimeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const localDateStr = dateObj.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });

    if (this.latEl) this.latEl.textContent = latitude.toFixed(6);
    if (this.lonEl) this.lonEl.textContent = longitude.toFixed(6);
    if (this.accuracyEl) this.accuracyEl.textContent = `±${Math.round(accuracy)} m`;

    this.fetchAddressAsync(latitude, longitude);

    if (this.addressEl) this.addressEl.textContent = this.cachedAddress || 'Location active';

    try {
      await writeLiveGPS({
        latitude,
        longitude,
        accuracy,
        address: this.cachedAddress,
        date: localDateStr,
        time: localTimeStr,
        timestamp: now
      });
      this.setStatus("Live streaming to OBS via Firebase...", "active");
    } catch (err) {
      console.error("✖ Firebase Upload Error:", err);
      this.setStatus(`Firebase Write Failed: ${err.message}`, "error");
    }
  }

  fetchAddressAsync(lat, lon) {
    if (
      this.lastGeocodeCoords.lat === null ||
      Math.abs(this.lastGeocodeCoords.lat - lat) > 0.00005 ||
      Math.abs(this.lastGeocodeCoords.lon - lon) > 0.00005
    ) {
      this.lastGeocodeCoords = { lat, lon };
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            this.cachedAddress = data.display_name;
            if (this.addressEl) this.addressEl.textContent = this.cachedAddress;
          }
        })
        .catch((e) => {
          console.warn("⚠️ Reverse geocode non-blocking exception:", e);
        });
    }
  }

  handleGPSError(err) {
    console.error("✖ GPS Watch Error:", err);
    if (err.code === err.PERMISSION_DENIED) {
      this.setStatus("Location permission denied on phone.", "error");
      this.stopStreaming();
    } else {
      this.setStatus("Waiting for GPS signal...", "pending");
    }
  }

  setStatus(message, type) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
      this.statusEl.className = 'status ' + type;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PhoneTransmitter();
});
