// ============================================
// Lifemax — Shared TypeScript Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  total_points: number;
  created_at: string;
}

export interface Route {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_points: number;
  bonus_points: number;
  polyline: { type: 'LineString'; coordinates: [number, number][] } | null;
  image_url: string | null;
  created_at: string;
  // Computed fields
  stop_count?: number;
  stops?: Stop[];
  user_progress?: UserRouteProgress;
}

export interface Stop {
  id: number;
  route_id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  points: number;
  stop_order: number;
  image_url: string | null;
  created_at: string;
  // Computed fields
  is_checked_in?: boolean;
  checked_in_at?: string | null;
}

export interface Checkin {
  id: number;
  user_id: number;
  stop_id: number;
  route_id: number;
  distance_m: number;
  points_earned: number;
  checked_in_at: string;
  // Joined fields
  stop_name?: string;
  route_name?: string;
}

export interface UserRouteProgress {
  id: number;
  user_id: number;
  route_id: number;
  stops_completed: number;
  total_stops: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CheckinRequest {
  stopId: number;
  latitude: number;
  longitude: number;
}

export interface CheckinResponse {
  success: boolean;
  pointsEarned: number;
  totalPoints: number;
  distance: number;
  routeCompleted: boolean;
  message: string;
}

export interface ProfileResponse {
  user: User;
  totalPoints: number;
  completedRoutes: number;
  totalRoutesAvailable: number;
  totalStopsVisited: number;
  recentCheckins: Checkin[];
  routeProgress: UserRouteProgress[];
}

export interface AuthPayload {
  userId: number;
  email: string;
}

// Rarity points mapping
export const RARITY_POINTS: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  legendary: 100,
};
