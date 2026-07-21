import React, { useState, useEffect, useRef } from 'react';

const formatTime = (date) => {
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export default function App() {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [address, setAddress] = useState('');
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));
  const [permissionError, setPermissionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const lastCoordsRef = useRef({ lat: null, lon: null });

  // Time interval (updates every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Geolocation Watcher with Maximum GPS Accuracy
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionError(true);
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true, // Forces precise GNSS/GPS hardware positioning
      maximumAge: 0,            // Prevents returning cached location data
      timeout: 15000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setIsLoading(false);
        setPermissionError(false);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionError(true);
        }
      },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // OpenStreetMap Nominatim High-Precision Reverse Geocoding (zoom=18 for max detail)
  useEffect(() => {
    if (location.latitude === null || location.longitude === null) return;

    // Avoid redundant network calls if coordinates haven't changed significantly (> 5 meters approx)
    const prev = lastCoordsRef.current;
    if (
      prev.lat !== null &&
      prev.lon !== null &&
      Math.abs(prev.lat - location.latitude) < 0.00005 &&
      Math.abs(prev.lon - location.longitude) < 0.00005
    ) {
      return;
    }

    lastCoordsRef.current = { lat: location.latitude, lon: location.longitude };

    let isMounted = true;
    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`
        );
        if (!res.ok) throw new Error('Geocoding request failed');
        const data = await res.json();
        if (isMounted && data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (e) {
        if (isMounted && !address) {
          setAddress('Address unavailable');
        }
      }
    };

    fetchAddress();

    return () => {
      isMounted = false;
    };
  }, [location.latitude, location.longitude]);

  return (
    <div className="container">
      {/* Top Header with Logo on Left and Live Badge on Right */}
      <div className="header-row">
        <div className="logo-brand">
          <div className="logo-top-row">
            <span className="logo-title">GGU</span>
            <svg className="logo-cap-icon" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L4 18L32 32L60 18L32 4Z" fill="#1A1A1A"/>
              <path d="M14 26.5V36.5C14 36.5 22 43 32 43C42 43 50 36.5 50 36.5V26.5L32 35L14 26.5Z" fill="#1A1A1A"/>
              <path d="M57 20V36H59V20H57Z" fill="#1A1A1A"/>
              <circle cx="58" cy="38" r="2.5" fill="#1A1A1A"/>
            </svg>
          </div>
          <div className="logo-divider"></div>
          <div className="logo-subtitle">GODAVARI GLOBAL UNIVERSITY</div>
        </div>

        <div className="live-badge">
          <span className="live-dot"></span>
          <span className="live-label">LIVE</span>
        </div>
      </div>

      {permissionError ? (
        <div className="status-message">
          Location permission denied.
          <br />
          Please enable location access to continue.
        </div>
      ) : isLoading || location.latitude === null ? (
        <div className="status-message">Waiting for GPS signal...</div>
      ) : (
        <div className="content-list">
          <div className="info-item">
            <div className="label">Place :</div>
            <div className="value">{address || 'Fetching address...'}</div>
          </div>

          {/* Latitude & Longitude in one single line */}
          <div className="info-item">
            <div className="lat-long-row">
              <span className="label">Latitude :</span>
              <span className="value">{location.latitude.toFixed(6)}</span>
              <span className="lat-long-spacer"></span>
              <span className="label">Longitude :</span>
              <span className="value">{location.longitude.toFixed(6)}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="label">Time :</div>
            <div className="value">{currentTime}</div>
          </div>
        </div>
      )}
    </div>
  );
}
