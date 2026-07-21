# GGU Live GPS Overlay System for OBS Studio 🎥📡

A modular, sub-second latency real-time GPS tracking overlay system designed specifically for **OBS Studio Browser Sources** and **Android Mobile Transmitters** via **Firebase Realtime Database**.

---

## 🏗️ System Architecture

```text
Android Phone (Transmitter)
  └── GPS Hardware (Permission requested ONCE on phone)
      └── OpenStreetMap Nominatim Reverse Geocoding
          └── Firebase Realtime Database (< 200ms latency)
              └── OBS Studio Browser Source Overlay (Zero permission prompts)
```

---

## 📁 Project File Structure

- **`config.js`**: Firebase credentials and configuration settings.
- **`firebase.js`**: Firebase Realtime Database publish & subscribe services.
- **`phone.html` / `phone.js`**: Android Phone Client for location recording and reverse geocoding.
- **`overlay.html` / `overlay.js`**: Transparent OBS Studio Browser Source Overlay.
- **`index.html`**: Entry point for OBS Overlay.

---

## 📱 1. Android Phone Client (`phone.html`)

1. Open `phone.html` on your Android phone browser (e.g. Chrome).
2. Allow location access **ONCE** when prompted.
3. The phone connects to GPS hardware (`enableHighAccuracy: true`, `maximumAge: 0`, `timeout: 10000`).
4. Every movement reverse geocodes via OpenStreetMap Nominatim and streams live coordinates to Firebase.

---

## 🎥 2. OBS Studio Browser Source Setup (`overlay.html` / `index.html`)

1. Open **OBS Studio**.
2. Add a new **Browser Source** to your scene.
3. Set **URL** to your deployed Vercel link (`https://ggu-gps-tracker-6x3mdvhuv-msrs-projects-8b648886.vercel.app`) or local path.
4. Set **Width**: `1920`, **Height**: `1080`.
5. Check **"Shutdown source when not visible"** (optional).
6. **No location permissions** will ever be requested by the OBS overlay.
7. Displays sub-second updates directly from Firebase!

---

## 🎨 Overlay Display Specifications

```text
GGU

Place :
<Live Formatted Address>

Latitude :
17.397251

Longitude :
78.413768

Time :
7/21/2026 2:50:49 PM
```

- **Transparent Background** (`background: transparent`)
- **No cards, borders, shadows, buttons, or controls**
- **Google Font Figtree** with large, high-legibility typography.
