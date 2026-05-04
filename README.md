# Waterline

The map, market & messaging app for the UK's inland waterways.

## Project Structure

```
waterline/
├── client/          # React frontend (Vite)
│   ├── src/
│   └── public/
├── server/          # Node.js + Express backend
└── README.md
```

## Getting Started

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Stack

- **Frontend:** React 18, Vite, React Router v6, Leaflet
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Hosting:** Vercel (frontend), Render (backend)
- **Maps:** OpenStreetMap + Leaflet.js
- **Auth:** JWT (localStorage)

## MVP Features

- Free peer-to-peer marketplace (products)
- Boat-to-boat messaging (hails & regular messages)
- Crowdsourced hazard map (30-day expiry)
- Logbook (stays, miles, locks, @mentions)
- Friends / following system
- Check-ins on map
- CRT boat verification (admin approval)
- Profile photos & usernames

## Phase 2 (Deferred)

- Trade profiles / Services marketplace
- Ratings & reviews
- Google OAuth
- Payments (Stripe)
- Push notifications
