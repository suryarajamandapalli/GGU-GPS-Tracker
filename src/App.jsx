import React, { useState, useEffect, useRef } from 'react';

const getTime = (d) =>
  d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

const getDate = (d) =>
  d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

function flashElement(ref) {
  if (!ref.current) return;
  ref.current.classList.add('updated');
  setTimeout(() => ref.current && ref.current.classList.remove('updated'), 300);
}

export default function App() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [time, setTime] = useState(() => getTime(new Date()));
  const [date, setDate] = useState(() => getDate(new Date()));
  const [loading, setLoading] = useState(true);

  const latRef = useRef(null);
  const lonRef = useRef(null);
  const prevCoords = useRef({ lat: null, lon: null });

  // 1-second clock update
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(getTime(now));
      setDate(getDate(now));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-fetch location WITHOUT requiring browser permission prompt
  useEffect(() => {
    let isMounted = true;

    const fetchIPLocation = async () => {
      try {
        const res = await fetch('https://freeipapi.com/api/json');
        const data = await res.json();
        if (isMounted && data && data.latitude && data.longitude) {
          setLat(data.latitude);
          setLon(data.longitude);
          setLoading(false);
          return;
        }
      } catch (e) {
        try {
          const res2 = await fetch('https://ipapi.co/json/');
          const data2 = await res2.json();
          if (isMounted && data2 && data2.latitude && data2.longitude) {
            setLat(data2.latitude);
            setLon(data2.longitude);
            setLoading(false);
            return;
          }
        } catch (err) {}
      }
    };

    fetchIPLocation();

    if (navigator.geolocation) {
      const updatePosition = (position) => {
        if (!position || !position.coords) return;
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;

        if (prevCoords.current.lat !== newLat || prevCoords.current.lon !== newLon) {
          prevCoords.current = { lat: newLat, lon: newLon };
          flashElement(latRef);
          flashElement(lonRef);
        }

        setLat(newLat);
        setLon(newLon);
        setLoading(false);
      };

      const watchId = navigator.geolocation.watchPosition(updatePosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      });

      return () => {
        isMounted = false;
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || lat === null) {
    return (
      <div className="container">
        <div className="status-message">Loading location...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="grid-wrapper">
        <div className="col col-left">
          <div className="cell">
            <div className="label">Latitude</div>
            <div className="value" ref={latRef}>
              {Number(lat).toFixed(6)}
            </div>
          </div>
          <div className="cell">
            <div className="label">Longitude</div>
            <div className="value" ref={lonRef}>
              {Number(lon).toFixed(6)}
            </div>
          </div>
        </div>

        <div className="col col-right">
          <div className="cell">
            <div className="label">Time</div>
            <div className="value">{time}</div>
          </div>
          <div className="cell">
            <div className="label">Date</div>
            <div className="value">{date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
