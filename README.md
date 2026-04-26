# BusTrack — Setup & Run Guide

## 🗂️ Project Structure
```
real-bus/
├── backend/       ← Node.js/Express API + Socket.IO
└── frontend/      ← Vite + React 19 + Tailwind CSS PWA
```

## ⚡ Quick Start

### 1. Get a Free MongoDB Database
- Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create free cluster
- Get your connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/bustrack`

### 2. Configure Backend
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<your-atlas-uri>
JWT_SECRET=bustrack_super_secret_jwt_key_2024
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend
```powershell
cd backend
npm install         # already done
npm run seed        # creates admin, driver, student + sample bus
npm run dev         # starts on http://localhost:5000
```

### 4. Start Frontend
```powershell
cd frontend
npm run dev         # starts on http://localhost:5173
```

### 5. Login Credentials (after seeding)
| Role    | Phone/ID       | Password    |
|---------|---------------|-------------|
| Admin   | `admin`        | `admin123`  |
| Driver  | `driver1`      | `driver123` |
| Student | `9876543210`   | `student123`|

---

## 🚀 Features

### Admin Panel
- Dashboard with live stats (buses, drivers, students, active trips)
- Create/Edit/Delete drivers, students, buses
- Assign drivers to buses, assign students to buses
- Live map showing all active buses in real-time
- Send push notifications with quick templates
- Trip history with duration and attendance

### Driver Panel
- Start Trip / Stop Trip buttons
- Real GPS location tracking via browser geolocation API
- Socket.IO location broadcast every GPS event (~5s)
- SOS Emergency button (alerts admin instantly)
- Trip history view

### Student Panel
- Live bus tracking map (Leaflet)
- My Bus / All Buses toggle
- ETA calculation (Haversine distance ÷ avg speed)
- Real-time notifications (trip started, approaching stop)
- Notification feed with mark-as-read

---

## 🔌 Real-Time Events (Socket.IO)
| Event | Direction | Description |
|-------|-----------|-------------|
| `send-location` | Driver → Server | GPS coordinates |
| `location-update` | Server → Students/Admin | Bus position update |
| `trip-started` | Server → Bus room | Bus started |
| `trip-stopped` | Server → Bus room | Bus stopped |
| `approaching-stop` | Server → Bus room | Geofence: 150m radius |
| `sos-alert` | Server → Admin | Emergency alert |
| `notification` | Server → Role room | Push notification |

---

## 🌍 Deployment

### Frontend → Vercel
```bash
cd frontend
# Build and deploy
vercel --prod
# Set env var: VITE_API_URL=https://your-backend.render.com
```

### Backend → Render
1. Push to GitHub
2. Create new Web Service on Render
3. Set environment variables from `.env`
4. Start command: `npm start`

### Update vite.config.js for production
Replace proxy with env variable:
```js
// In src/services/api.js — change:
baseURL: import.meta.env.VITE_API_URL || '/api'
```

---

## 📲 PWA Install
Visit the deployed frontend URL in Chrome on your phone → tap **"Add to Home Screen"**

---

## 🧪 Test the Real-Time Flow
1. Log in as **Driver** → Start Trip → allow location access
2. In another tab log in as **Student** → go to Track Bus
3. Watch the bus marker move on the student's map in real-time!
