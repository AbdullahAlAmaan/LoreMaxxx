import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapboxGL from '@rnmapbox/maps';
import { getRouteById, checkin } from '../services/api';
import { Route as RouteType, Stop, DIFFICULTY_COLORS, RARITY_COLORS } from '../types';
import { useLocation } from '../hooks/useLocation';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.42;

const ROUTE_COLORS: Record<string, string> = {
  easy: '#00B894',
  medium: '#FDCB6E',
  hard: '#E17055',
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CHECKIN_RADIUS = 100;

export default function RouteScreen({ route, navigation }: any) {
  const { routeId, routeName } = route.params;
  const { location } = useLocation();
  const [routeData, setRouteData] = useState<RouteType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState<number | null>(null);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    navigation.setOptions({ title: routeName || 'Route', headerShown: false });
    loadRoute();
    // Pulse animation for stop markers
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
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
        Alert.alert(result.routeCompleted ? '🎉 Route Complete!' : '✅ Checked In!', result.message);
        loadRoute();
      }
    } catch (err: any) {
      Alert.alert('Check-in Failed', err.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckinLoading(null);
    }
  };

  const isStopNearby = (stopLat: number, stopLon: number): boolean => {
    if (!location) return false;
    return haversineDistance(location.latitude, location.longitude, stopLat, stopLon) <= CHECKIN_RADIUS;
  };

  const fitRouteOnMap = () => {
    if (!routeData?.stops?.length || !cameraRef.current) return;
    const coords = routeData.stops.map((s) => [s.longitude, s.latitude]);
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const padding = 60;
    cameraRef.current.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      [padding, padding, padding, padding],
      600
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Loading route...</Text>
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
  const routeColor = ROUTE_COLORS[routeData.difficulty] || '#6C5CE7';

  // Compute center from stops
  const stops = routeData.stops || [];
  const centerLng = stops.length ? stops.reduce((s, p) => s + p.longitude, 0) / stops.length : -79.3832;
  const centerLat = stops.length ? stops.reduce((s, p) => s + p.latitude, 0) / stops.length : 43.6532;

  return (
    <View style={styles.container}>
      {/* ── MAP SECTION ── */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL="mapbox://styles/mapbox/dark-v11"
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={fitRouteOnMap}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[centerLng, centerLat]}
            zoomLevel={13}
            animationMode="flyTo"
            animationDuration={800}
          />

          {/* User location */}
          <MapboxGL.UserLocation visible animated />

          {/* Route polyline */}
          {routeData.polyline?.coordinates && (
            <MapboxGL.ShapeSource
              id="route-source"
              shape={{ type: 'Feature', geometry: routeData.polyline, properties: {} }}
            >
              {/* Glow */}
              <MapboxGL.LineLayer
                id="route-glow"
                style={{ lineColor: routeColor, lineWidth: 10, lineOpacity: 0.25, lineCap: 'round', lineJoin: 'round' }}
              />
              {/* Main line */}
              <MapboxGL.LineLayer
                id="route-line"
                style={{
                  lineColor: routeColor,
                  lineWidth: journeyStarted ? 4 : 2.5,
                  lineOpacity: journeyStarted ? 1 : 0.7,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* Stop pins */}
          {stops.map((stop, index) => {
            const checked = (stop as any).is_checked_in;
            const nearby = isStopNearby(stop.latitude, stop.longitude);
            return (
              <MapboxGL.PointAnnotation
                key={`stop-${stop.id}`}
                id={`stop-${stop.id}`}
                coordinate={[stop.longitude, stop.latitude]}
              >
                <View style={styles.pinWrapper}>
                  {/* Ping ring for nearby stops */}
                  {nearby && journeyStarted && (
                    <Animated.View
                      style={[styles.pingRing, { transform: [{ scale: pulseAnim }], borderColor: routeColor }]}
                    />
                  )}
                  <View style={[
                    styles.stopPin,
                    checked ? styles.stopPinChecked : { borderColor: routeColor },
                    nearby && journeyStarted && { backgroundColor: routeColor },
                  ]}>
                    <Text style={[styles.stopPinText, checked && styles.stopPinTextChecked]}>
                      {checked ? '✓' : `${index + 1}`}
                    </Text>
                  </View>
                  <View style={[styles.pinTail, { backgroundColor: checked ? '#27AE60' : routeColor }]} />
                </View>
              </MapboxGL.PointAnnotation>
            );
          })}
        </MapboxGL.MapView>

        {/* Back button overlay */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Difficulty badge overlay */}
        <View style={[styles.difficultyOverlay, { backgroundColor: routeColor + '22', borderColor: routeColor + '55' }]}>
          <Text style={[styles.difficultyOverlayText, { color: routeColor }]}>
            {routeData.difficulty.toUpperCase()}
          </Text>
        </View>

        {/* Bottom gradient fade */}
        <LinearGradient
          colors={['transparent', '#0F1123']}
          style={styles.mapFade}
          pointerEvents="none"
        />
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={routeColor} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Route title + meta */}
        <View style={styles.titleSection}>
          <Text style={styles.routeName}>{routeData.name}</Text>
          <Text style={styles.routeDescription}>{routeData.description}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalStops}</Text>
              <Text style={styles.statLabel}>STOPS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#F39C12' }]}>⭐ {routeData.total_points}</Text>
              <Text style={styles.statLabel}>POINTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#A29BFE' }]}>🎁 {routeData.bonus_points}</Text>
              <Text style={styles.statLabel}>BONUS</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <ProgressBar completed={stopsCompleted} total={totalStops} />
          </View>
        </View>

        {/* ── START JOURNEY BUTTON ── */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.startBtn, journeyStarted && styles.startBtnActive]}
            onPress={() => {
              setJourneyStarted(!journeyStarted);
              if (!journeyStarted) fitRouteOnMap();
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={journeyStarted ? ['#2d3436', '#1e2030'] : [routeColor, routeColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Text style={styles.startBtnIcon}>{journeyStarted ? '⏸' : '▶'}</Text>
              <Text style={styles.startBtnText}>
                {journeyStarted ? 'Journey in Progress' : stopsCompleted > 0 ? 'Continue Journey' : 'Start Journey'}
              </Text>
              {journeyStarted && (
                <View style={[styles.liveChip, { backgroundColor: routeColor + '33' }]}>
                  <View style={[styles.liveDot, { backgroundColor: routeColor }]} />
                  <Text style={[styles.liveText, { color: routeColor }]}>LIVE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>🏆 Route Completed!</Text>
          </View>
        )}

        {/* ── STOPS LIST ── */}
        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Stops</Text>
          {stops.map((stop, index) => {
            const checked = (stop as any).is_checked_in;
            const nearby = isStopNearby(stop.latitude, stop.longitude);
            const rarityColor = RARITY_COLORS[stop.rarity] || '#8E99A4';
            return (
              <View key={stop.id} style={[styles.stopCard, checked && styles.stopCardChecked]}>
                {/* Left: number + connector line */}
                <View style={styles.stopLeft}>
                  <View style={[styles.stopNumber, checked ? styles.stopNumberDone : { borderColor: routeColor }]}>
                    <Text style={[styles.stopNumberText, checked && { color: '#fff' }]}>
                      {checked ? '✓' : index + 1}
                    </Text>
                  </View>
                  {index < stops.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: checked ? '#27AE60' : '#2A2D3A' }]} />
                  )}
                </View>

                {/* Right: content */}
                <View style={styles.stopContent}>
                  <View style={styles.stopHeader}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
                      <Text style={[styles.rarityText, { color: rarityColor }]}>{stop.rarity.toUpperCase()}</Text>
                    </View>
                  </View>
                  {stop.description ? (
                    <Text style={styles.stopDesc} numberOfLines={2}>{stop.description}</Text>
                  ) : null}
                  <View style={styles.stopFooter}>
                    <Text style={styles.stopPoints}>⭐ {stop.points} pts</Text>
                    {checked ? (
                      <View style={styles.checkedBadge}>
                        <Text style={styles.checkedText}>✅ Visited</Text>
                      </View>
                    ) : nearby && journeyStarted ? (
                      <TouchableOpacity
                        style={[styles.checkinBtn, { backgroundColor: routeColor }]}
                        onPress={() => handleCheckin(stop.id)}
                        disabled={checkinLoading === stop.id}
                      >
                        {checkinLoading === stop.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.checkinBtnText}>Check In 📍</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.visitToUnlock}>
                        {journeyStarted ? '🔒 Go here to unlock' : '🔒 Start journey to unlock'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1123' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1123' },
  loadingText: { color: '#8E99A4', marginTop: 12, fontSize: 15 },
  errorText: { color: '#E74C3C', fontSize: 16 },

  // Map
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { flex: 1 },
  mapFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1B2Ecc',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  backBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28, marginTop: -2 },
  difficultyOverlay: {
    position: 'absolute', top: 54, right: 16,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  difficultyOverlayText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Stop pins
  pinWrapper: { alignItems: 'center' },
  pingRing: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, top: -8,
  },
  stopPin: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1A1B2E', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  stopPinChecked: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  stopPinText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stopPinTextChecked: { color: '#fff' },
  pinTail: { width: 2, height: 6, marginTop: -1 },

  // Content
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  routeName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  routeDescription: { fontSize: 14, color: '#8E99A4', lineHeight: 20, marginBottom: 16 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E2030', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 8, marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  statLabel: { fontSize: 10, color: '#8E99A4', fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: '#2A2D3A' },

  progressSection: { marginBottom: 16 },

  // Start Journey button
  startBtn: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  startBtnActive: { opacity: 0.9 },
  startBtnGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20, gap: 10,
  },
  startBtnIcon: { fontSize: 18 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  completedBanner: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: '#27AE6022', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#27AE6044',
  },
  completedBannerText: { color: '#27AE60', fontSize: 16, fontWeight: '700' },

  // Stops list
  stopsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },

  stopCard: {
    flexDirection: 'row', marginBottom: 4,
  },
  stopCardChecked: { opacity: 0.7 },

  stopLeft: { alignItems: 'center', marginRight: 14, width: 28 },
  stopNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1E2030', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  stopNumberDone: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  stopNumberText: { fontSize: 12, fontWeight: '700', color: '#8E99A4' },
  connector: { width: 2, flex: 1, minHeight: 20, marginVertical: 4 },

  stopContent: {
    flex: 1, backgroundColor: '#1E2030', borderRadius: 14,
    padding: 14, marginBottom: 8,
  },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stopName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rarityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stopDesc: { fontSize: 12, color: '#8E99A4', lineHeight: 17, marginBottom: 10 },
  stopFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stopPoints: { fontSize: 13, color: '#F39C12', fontWeight: '600' },
  checkedBadge: { backgroundColor: '#27AE6022', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  checkedText: { fontSize: 12, color: '#27AE60', fontWeight: '600' },
  checkinBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, minWidth: 100, alignItems: 'center',
  },
  checkinBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  visitToUnlock: { fontSize: 12, color: '#5A5E6D', fontWeight: '500' },
});
