import { gpsService } from './firebase.js';

class PhoneTransmitter {
  constructor() {
    this.statusEl = document.getElementById('status');
    this.latEl = document.getElementById('lat');
    this.lonEl = document.getElementById('lon');
    this.addressEl = document.getElementById('address');
    this.accuracyEl = document.getElementById('accuracy');

    this.lastCoords = { lat: null, lon: null };
    this.cachedAddress = '';

    this.init();
  }

  init() {
    if (!navigator.geolocation) {
      this.setStatus('Geolocation is not supported by your browser.', 'error');
      return;
    }

    this.setStatus('Requesting GPS permission on phone...', 'pending');

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    navigator.geolocation.watchPosition(
      (pos) => this.handleLocationUpdate(pos),
      (err) => this.handleLocationError(err),
      options
    );
  }

  async handleLocationUpdate(position) {
    const { latitude, longitude, accuracy, speed } = position.coords;

    this.latEl.textContent = latitude.toFixed(6);
    this.lonEl.textContent = longitude.toFixed(6);
    this.accuracyEl.textContent = `±${Math.round(accuracy)} m`;

    // Fetch Reverse Geocoded Address if coordinates changed significantly
    if (
      this.lastCoords.lat === null ||
      Math.abs(this.lastCoords.lat - latitude) > 0.00005 ||
      Math.abs(this.lastCoords.lon - longitude) > 0.00005
    ) {
      this.lastCoords = { lat: latitude, lon: longitude };
      this.cachedAddress = await this.reverseGeocode(latitude, longitude);
    }

    this.addressEl.textContent = this.cachedAddress || 'Fetching address...';

    // Broadcast live update to Firebase
    try {
      await gpsService.updateGPSData({
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
        formattedAddress: this.cachedAddress,
        timestamp: Date.now()
      });
      this.setStatus('Live streaming to OBS via Firebase...', 'active');
    } catch (err) {
      this.setStatus('Firebase sync error: ' + err.message, 'error');
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18`
      );
      if (!res.ok) return this.cachedAddress || '';
      const data = await res.json();
      return data.display_name || '';
    } catch (e) {
      return this.cachedAddress || '';
    }
  }

  handleLocationError(err) {
    if (err.code === err.PERMISSION_DENIED) {
      this.setStatus('Location permission denied on phone.', 'error');
    } else {
      this.setStatus('Waiting for GPS signal on phone...', 'pending');
    }
  }

  setStatus(message, type) {
    this.statusEl.textContent = message;
    this.statusEl.className = 'status ' + type;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PhoneTransmitter();
});
