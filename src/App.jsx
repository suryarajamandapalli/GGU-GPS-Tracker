import React, { useState, useEffect } from 'react';

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

export default function App() {
  const [lat, setLat] = useState(17.397251);
  const [lon, setLon] = useState(78.413768);
  const [time, setTime] = useState(() => getTime(new Date()));
  const [date, setDate] = useState(() => getDate(new Date()));

  // 1-second clock update
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(getTime(now));
      setDate(getDate(now));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Silent Location Fetch (NO BROWSER PERMISSION PROMPT EVER)
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (isMounted && data && data.success && data.latitude && data.longitude) {
          setLat(data.latitude);
          setLon(data.longitude);
          return;
        }
      } catch (e) {}

      try {
        const res2 = await fetch('https://freeipapi.com/api/json');
        const data2 = await res2.json();
        if (isMounted && data2 && data2.latitude && data2.longitude) {
          setLat(data2.latitude);
          setLon(data2.longitude);
          return;
        }
      } catch (e) {}

      try {
        const res3 = await fetch('https://ipapi.co/json/');
        const data3 = await res3.json();
        if (isMounted && data3 && data3.latitude && data3.longitude) {
          setLat(data3.latitude);
          setLon(data3.longitude);
          return;
        }
      } catch (e) {}
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container">
      <div className="grid-wrapper">
        <div className="col col-left">
          <div className="cell">
            <div className="label">Latitude</div>
            <div className="value">{Number(lat).toFixed(6)}</div>
          </div>
          <div className="cell">
            <div className="label">Longitude</div>
            <div className="value">{Number(lon).toFixed(6)}</div>
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
