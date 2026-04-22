import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRouteById, checkin } from '../services/api';
import { Route as RouteType, DIFFICULTY_COLORS } from '../types';
import { useLocation } from '../hooks/useLocation';
import StopCard from '../components/StopCard';
import ProgressBar from '../components/ProgressBar';

// Haversine formula to calculate distance between two coordinates (meters)
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CHECKIN_RADIUS = 100; // meters

export default function RouteScreen({ route, navigation }: any) {
  const { routeId, routeName } = route.params;
  const { location } = useLocation();
  const [routeData, setRouteData] = useState<RouteType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: routeName || 'Route' });
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    try {
      const data = await getRouteById(routeId);
      setRouteData(data.route);
    } catch (err) {
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRoute();
  }, [routeId]);

  const handleCheckin = async (stopId: number) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to check in.');
      return;
    }

    setCheckinLoading(stopId);
    try {
      const result = await checkin(stopId, location.latitude, location.longitude);

      if (result.success) {
        Alert.alert(
          result.routeCompleted ? '🎉 Route Complete!' : '✅ Checked In!',
          result.message
        );
        // Reload route to update check-in status
        loadRoute();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Check-in failed';
      Alert.alert('Check-in Failed', msg);
    } finally {
      setCheckinLoading(null);
    }
  };

  const isStopNearby = (stopLat: number, stopLon: number): boolean => {
    if (!location) return false;
    const distance = haversineDistance(
      location.latitude, location.longitude,
      stopLat, stopLon
    );
    return distance <= CHECKIN_RADIUS;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (!routeData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    );
  }

  const stopsCompleted = routeData.user_progress?.stops_completed || 0;
  const totalStops = routeData.stops?.length || 0;
  const isCompleted = routeData.user_progress?.is_completed || false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Route Header */}
        <LinearGradient
          colors={['#1A1B2E', '#0F1123']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLORS[routeData.difficulty] + '22' },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: DIFFICULTY_COLORS[routeData.difficulty] },
                ]}
              >
                {routeData.difficulty.toUpperCase()}
              </Text>
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✅ COMPLETED</Text>
              </View>
            )}
          </View>

          <Text style={styles.routeName}>{routeData.name}</Text>
          <Text style={styles.routeDescription}>{routeData.description}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalStops}</Text>
              <Text style={styles.statLabel}>Stops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>⭐ {routeData.total_points}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>🎁 {routeData.bonus_points}</Text>
              <Text style={styles.statLabel}>Bonus</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <ProgressBar completed={stopsCompleted} total={totalStops} />
          </View>
        </LinearGradient>

        {/* Stops List */}
        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Stops</Text>
          {routeData.stops?.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              isNearby={isStopNearby(stop.latitude, stop.longitude)}
              onCheckIn={() => handleCheckin(stop.id)}
              isCheckinLoading={checkinLoading === stop.id}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1123',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1123',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#27AE6022',
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#27AE60',
    letterSpacing: 0.5,
  },
  routeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  routeDescription: {
    fontSize: 14,
    color: '#8E99A4',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2030',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E99A4',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2D3A',
  },
  progressSection: {
    marginBottom: 8,
  },
  stopsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
});
