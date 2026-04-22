-- ============================================
-- Lifemax Database Schema
-- PostGIS-enabled PostgreSQL
-- ============================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_points  INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Routes
-- ============================================
CREATE TABLE IF NOT EXISTS routes (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    difficulty    VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    total_points  INTEGER DEFAULT 0,
    bonus_points  INTEGER DEFAULT 100,
    polyline      GEOMETRY(LineString, 4326),
    image_url     TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Stops (belong to a route)
-- ============================================
CREATE TABLE IF NOT EXISTS stops (
    id            SERIAL PRIMARY KEY,
    route_id      INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    location      GEOMETRY(Point, 4326),
    rarity        VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
    points        INTEGER DEFAULT 10,
    stop_order    INTEGER NOT NULL,
    image_url     TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Check-ins
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stop_id       INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    route_id      INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    user_location GEOMETRY(Point, 4326),
    distance_m    DOUBLE PRECISION,
    points_earned INTEGER NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stop_id)
);

-- ============================================
-- User Route Progress (denormalized for perf)
-- ============================================
CREATE TABLE IF NOT EXISTS user_route_progress (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    route_id        INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    stops_completed INTEGER DEFAULT 0,
    total_stops     INTEGER NOT NULL,
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    UNIQUE(user_id, route_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_stop_id ON checkins(stop_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_location ON checkins USING GIST(user_location);
CREATE INDEX IF NOT EXISTS idx_user_route_progress_user ON user_route_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_route_progress_route ON user_route_progress(route_id);

-- ============================================
-- Trigger: auto-populate stop location from lat/lng
-- ============================================
CREATE OR REPLACE FUNCTION set_stop_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_stop_location ON stops;
CREATE TRIGGER trigger_set_stop_location
    BEFORE INSERT OR UPDATE ON stops
    FOR EACH ROW
    EXECUTE FUNCTION set_stop_location();

-- ============================================
-- Trigger: update route total_points when stops change
-- ============================================
CREATE OR REPLACE FUNCTION update_route_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE routes
    SET total_points = COALESCE((
        SELECT SUM(points) FROM stops WHERE route_id = COALESCE(NEW.route_id, OLD.route_id)
    ), 0) + bonus_points
    WHERE id = COALESCE(NEW.route_id, OLD.route_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_route_points ON stops;
CREATE TRIGGER trigger_update_route_points
    AFTER INSERT OR UPDATE OR DELETE ON stops
    FOR EACH ROW
    EXECUTE FUNCTION update_route_total_points();
