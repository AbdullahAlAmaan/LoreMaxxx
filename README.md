# 🏔️ Lifemax

A route-based travel app where users explore routes on a map, visit stops, check in with GPS validation, earn points, and track progress.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) |
| Map | Mapbox GL |
| Backend | Node.js + Express (TypeScript) |
| Database | PostgreSQL + PostGIS |
| Auth | JWT (JSON Web Tokens) |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostGIS database)
- Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))

### 1. Start the Database

```bash
docker compose up -d
```

This starts a PostGIS-enabled PostgreSQL container on port **5433** and automatically runs the schema + seed data.

### 2. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3001`.

### 3. Start the Mobile App

```bash
cd mobile
npm install

# Add your Mapbox token in src/screens/MapScreen.tsx
npx expo start
```

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

## Seed Data

3 Toronto-area routes with 18 stops total:

1. **Toronto Waterfront Walk** (Easy, 5 stops)
2. **Downtown Discovery** (Medium, 7 stops)
3. **Royal Parks Trail** (Hard, 6 stops)

## Architecture

```
LoreMaxxx/
├── docker-compose.yml       # PostGIS database
├── backend/                 # Express API server
│   └── src/
│       ├── config/          # DB connection
│       ├── db/              # Schema + seed SQL
│       ├── middleware/      # JWT auth
│       ├── routes/          # API route handlers
│       ├── services/        # Business logic
│       └── types/           # TypeScript types
└── mobile/                  # Expo React Native app
    └── src/
        ├── components/      # Reusable UI
        ├── context/         # Auth state
        ├── hooks/           # Location hook
        ├── navigation/      # Tab + stack nav
        ├── screens/         # App screens
        ├── services/        # API client
        └── types/           # Shared types
```
