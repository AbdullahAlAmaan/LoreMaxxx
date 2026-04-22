// ============================================
// Lifemax Mobile — Shared Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  total_points: number;
}

export interface Route {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_points: number;
  bonus_points: number;
  polyline: {
    type: 'LineString';
    coordinates: [number, number][];
  } | null;
  image_url: string | null;
  stop_count: number;
  stops?: Stop[];
  user_progress?: UserRouteProgress | null;
  // From list endpoint
  stops_completed?: number;
  is_completed?: boolean;
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
  is_checked_in?: boolean;
  checked_in_at?: string | null;
}

export interface Checkin {
  id: number;
  stop_id: number;
  route_id: number;
  distance_m: number;
  points_earned: number;
  checked_in_at: string;
  stop_name: string;
  route_name: string;
  rarity: string;
}

export interface UserRouteProgress {
  id: number;
  user_id: number;
  route_id: number;
  stops_completed: number;
  total_stops: number;
  is_completed: boolean;
  completed_at: string | null;
  route_name?: string;
  difficulty?: string;
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

export interface LeaderboardEntry {
  id: number;
  username: string;
  total_points: number;
  completed_routes: number;
  stops_visited: number;
  rank: number;
}

// Rarity color mapping
export const RARITY_COLORS: Record<string, string> = {
  common: '#8B9DC3',
  uncommon: '#27AE60',
  rare: '#8E44AD',
  legendary: '#F39C12',
};

export const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#27AE60',
  medium: '#F39C12',
  hard: '#E74C3C',
};
