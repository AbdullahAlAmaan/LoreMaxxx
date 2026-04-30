# 🏔️ Lifemax

A route-based travel app where users explore routes on a map, visit stops, check in with GPS validation, earn points, and track progress — like Strava meets geocaching.

## Project Status

| Area | Status | Notes |
|------|--------|-------|
| Backend API | ✅ Running | Express + TypeScript on port 3001 |
| Database | ✅ Connected | Supabase PostgreSQL + PostGIS (Session Pooler for IPv4) |
| Mobile App | ✅ Running | Expo dev build on iOS Simulator |
| Auth (JWT) | ✅ Working | Login / Register / Token refresh |
| Map (Mapbox) | ✅ Working | Dark theme, route polylines, stop markers |
| Route Detail | ✅ Working | Strava-style map + "Start Journey" CTA |
| GPS Check-in | ✅ Working | PostGIS distance validation (100m radius) |
| Leaderboard | ✅ Working | Top 50 users by total points |
| Profile | ✅ Working | Stats, recent check-ins, route progress |

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) |
| Map | Mapbox GL (`@rnmapbox/maps`) |
| Backend | Node.js + Express (TypeScript) |
| Database | PostgreSQL + PostGIS (Supabase) |
| Auth | JWT (JSON Web Tokens) |

## Quick Start

### Prerequisites
- Node.js 18+
- Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))
- Xcode (for iOS Simulator)

### 1. Start the Backend

```bash
cd backend
cp ../.env.example .env   # then fill in your Supabase + JWT values
npm install
npm run dev
```

Server runs on `http://localhost:3001`.

### 2. Start the Mobile App

```bash
cd mobile
npm install
npx expo prebuild --clean   # generates native ios/ folder
npm run ios                  # builds + launches iOS Simulator
```

### Environment Variables

**`backend/.env`**
```
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.<project-ref>
DB_PASSWORD=<your-password>
DB_SSL=true
PORT=3001
JWT_SECRET=<random-secret>
CHECKIN_RADIUS_METERS=100
```

**`mobile/.env`**
```
EXPO_PUBLIC_MAPBOX_TOKEN=pk.<your-mapbox-token>
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.<your-mapbox-secret-token>
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> **Note:** If connecting from an Android emulator, change `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:3001`.

## Features

### 🗺️ Interactive Map
- Mapbox dark-themed map with user location tracking
- Route polylines with glow effects and color-coded difficulty
- Tappable stop markers on the map

### 🚀 Route Detail (Strava-style)
- Full-width map showing the route path and all stop pins
- **"Start Journey"** button to begin tracking — toggles to live mode
- Numbered stop pins that turn green with a ✓ when visited
- Pulsing ping ring on nearby stops when journey is active
- Timeline-connected stops list with rarity badges

### 📍 GPS Check-in
- PostGIS-powered distance validation (100m radius by default)
- Check-in button only appears when user is nearby + journey is active
- Points awarded per stop based on rarity (Common → Legendary)
- Route completion bonus when all stops visited

### 🏆 Leaderboard
- Top 50 users ranked by total points
- Displays username, points, completed routes, and stops visited

### 👤 Profile
- Total points, completed routes, and stops visited
- Recent check-in history
- Per-route progress tracking

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Sign in |
| GET | `/routes` | Yes | List all routes |
| GET | `/routes/:id` | Yes | Route detail + stops |
| POST | `/checkin` | Yes | Check in at a stop |
| GET | `/profile` | Yes | User profile + stats |
| GET | `/leaderboard` | Yes | Top 50 users by points |
| GET | `/health` | No | Server health check |

## Seed Data

3 Toronto-area routes with 18 stops total:

1. **Toronto Waterfront Walk** (Easy, 5 stops)
2. **Downtown Discovery** (Medium, 7 stops)
3. **Royal Parks Trail** (Hard, 6 stops)

## Architecture

```
LoreMaxxx/
├── backend/                     # Express API server
│   └── src/
│       ├── config/
│       │   └── database.ts      # PostgreSQL pool (Supabase)
│       ├── db/
│       │   ├── schema.sql       # PostGIS tables
│       │   └── seed.sql         # 3 routes, 18 stops
│       ├── middleware/
│       │   └── auth.ts          # JWT verification
│       ├── routes/
│       │   ├── auth.ts          # Register / Login
│       │   ├── checkin.ts       # GPS check-in
│       │   ├── leaderboard.ts   # Top users
│       │   ├── profile.ts       # User stats
│       │   └── routes.ts        # Route CRUD
│       ├── services/
│       │   ├── checkin.service.ts
│       │   ├── route.service.ts
│       │   └── scoring.service.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts             # Express entry point
└── mobile/                      # Expo React Native app
    ├── App.tsx                  # Root component
    ├── index.ts                 # Entry point
    └── src/
        ├── components/
        │   ├── ProgressBar.tsx
        │   └── StopCard.tsx
        ├── context/
        │   └── AuthContext.tsx   # Auth state + token management
        ├── hooks/
        │   └── useLocation.ts   # GPS location hook
        ├── navigation/
        │   └── AppNavigator.tsx # Tab + stack navigation
        ├── screens/
        │   ├── LoginScreen.tsx
        │   ├── RegisterScreen.tsx
        │   ├── MapScreen.tsx        # Main map with all routes
        │   ├── RouteScreen.tsx      # Strava-style route detail
        │   ├── ProfileScreen.tsx
        │   └── LeaderboardScreen.tsx
        ├── services/
        │   └── api.ts           # Axios client + interceptors
        └── types/
            └── index.ts         # Shared TypeScript types
```

## Known Issues / Dev Notes

- **IPv4 networks:** Supabase direct connections are IPv6-only. Use the Session Pooler URL (`aws-*.pooler.supabase.com`) on home Wi-Fi. University networks with IPv6 support can use the direct connection.
- **iOS only:** Currently tested on iOS Simulator. Android requires `EXPO_PUBLIC_API_URL=http://10.0.2.2:3001`.
- **Mapbox tokens:** The public token (`pk.*`) goes in `mobile/.env`. The secret download token (`sk.*`) is needed by `@rnmapbox/maps` during the native build.
