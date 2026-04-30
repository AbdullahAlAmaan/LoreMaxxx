import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route, CheckinResponse, ProfileResponse, User, LeaderboardEntry, TripStartResponse, TripFinishResponse } from '../types';

// Set EXPO_PUBLIC_API_URL in your .env file:
//   iOS simulator / web:   http://localhost:3001
//   Android emulator:      http://10.0.2.2:3001
//   Physical device:       http://<your-local-ip>:3001
//   Production:            https://your-api.example.com
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

// ============================================
// Routes API
// ============================================

export async function getRoutes(): Promise<{ routes: Route[]; total: number }> {
  const response = await api.get('/routes');
  return response.data;
}

export async function getRouteById(id: number): Promise<{ route: Route }> {
  const response = await api.get(`/routes/${id}`);
  return response.data;
}

// ============================================
// Check-in API
// ============================================

export async function checkin(
  stopId: number,
  latitude: number,
  longitude: number
): Promise<CheckinResponse> {
  const response = await api.post('/checkin', { stopId, latitude, longitude });
  return response.data;
}

// ============================================
// Trip API (Start / Finish with GPS validation)
// ============================================

export async function startTrip(
  routeId: number,
  latitude: number,
  longitude: number
): Promise<TripStartResponse> {
  const response = await api.post('/trips/start', { routeId, latitude, longitude });
  return response.data;
}

export async function finishTrip(
  routeId: number,
  latitude: number,
  longitude: number
): Promise<TripFinishResponse> {
  const response = await api.post('/trips/finish', { routeId, latitude, longitude });
  return response.data;
}

// ============================================
// Profile API
// ============================================

export async function getProfile(userId?: string): Promise<ProfileResponse> {
  const url = userId ? `/profile/${userId}` : '/profile';
  const response = await api.get(url);
  return response.data;
}

// ============================================
// Leaderboard API
// ============================================

export async function getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const response = await api.get('/leaderboard');
  return response.data;
}

export default api;
