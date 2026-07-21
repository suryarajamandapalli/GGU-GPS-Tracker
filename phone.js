import { gpsService } from './firebase.js';

class PhoneTransmitter {
  constructor() {
    this.statusEl = document.getElementById('status');
    this.latEl = document.getElementById('lat');
    this.lonEl = document.getElementById('lon');
    this.addressEl = document.getElementById('address');
    this.accuracyEl = document.getElementById('accuracy');

    this.lastUploadTime = 0;
    this.cachedAddress = '';
    this.lastGeocodeCoords = { lat: null, lon: null };

    this.initGPS();
  }

  initGPS() {
    if (!navigator.geolocation) {
      this.setStatus('Geolocation not supported by browser', 'error');
      return;
    }

    this.setStatus('Requesting GPS permission on phone...', 'pending');

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    // Watch continuously
    navigator.geolocation.watchPosition(
      (pos) => this.handleGPSUpdate(pos),
      (err) => this.handleGPSError(err),
      options
    );
  }

  async handleGPSUpdate(position) {
    const now = Date.now();
    
    // Throttle uploads to approx 1 update per second
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

    // Update Phone UI
    this.latEl.textContent = latitude.toFixed(6);
    this.lonEl.textContent = longitude.toFixed(6);
    this.accuracyEl.textContent = `±${Math.round(accuracy)} m`;

    // Reverse Geocode if coordinates moved significantly (> ~5 meters)
    if (
      this.lastGeocodeCoords.lat === null ||
      Math.abs(this.lastGeocodeCoords.lat - latitude) > 0.00005 ||
      Math.abs(this.lastGeocodeCoords.lon - longitude) > 0.00005
    ) {
      this.lastGeocodeCoords = { lat: latitude, lon: longitude };
      this.cachedAddress = await this.reverseGeocode(latitude, longitude);
    }

    this.addressEl.textContent = this.cachedAddress || 'Location active';

    // Upload to Firebase gps/live node immediately
    try {
      await gpsService.writeLiveGPS({
        latitude,
        longitude,
        accuracy,
        address: this.cachedAddress,
        date: localDateStr,
        time: localTimeStr,
        timestamp: now
      });
      this.setStatus('Broadcasting live to OBS via Firebase...', 'active');
    } catch (err) {
      this.setStatus('Firebase Connection Lost - Retrying...', 'pending');
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

  handleGPSError(err) {
    if (err.code === err.PERMISSION_DENIED) {
      this.setStatus('Location permission denied on phone.', 'error');
    } else {
      this.setStatus('Waiting for GPS signal... Retrying...', 'pending');
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
