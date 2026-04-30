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
import { getRouteById, checkin, startTrip, finishTrip } from '../services/api';
import { Route as RouteType, Stop, DIFFICULTY_COLORS, RARITY_COLORS } from '../types';
import { useLocation } from '../hooks/useLocation';
import ProgressBar from '../components/ProgressBar';
import { getTimeOfDayPreset } from '../utils/getTimeOfDayPreset';
import NeonButton from '../components/NeonButton';
import { Star, MapPin, CheckCircle, ChevronLeft, Flag, Lock, Gift, Play } from 'lucide-react-native';

const { height } = Dimensions.get('window');
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
const TRIP_RADIUS = 5000;

export default function RouteScreen({ route, navigation }: any) {
  const { routeId, routeName } = route.params;
  const { location, refreshLocation } = useLocation();
  const [routeData, setRouteData] = useState<RouteType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'start' | 'finish' | number | null>(null);
  
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [currentZoom, setCurrentZoom] = useState(13);

  const handleZoomIn = () => {
    cameraRef.current?.setCamera({ zoomLevel: currentZoom + 0.5, animationDuration: 800 });
  };

  const handleZoomOut = () => {
    cameraRef.current?.setCamera({ zoomLevel: Math.max(1, currentZoom - 0.5), animationDuration: 800 });
  };

  useEffect(() => {
    navigation.setOptions({ title: routeName || 'Route', headerShown: false });
    loadRoute();
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
    refreshLocation();
    loadRoute();
  }, [routeId, refreshLocation]);

  const handleStartTrip = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }
    setLoadingAction('start');
    try {
      const res = await startTrip(routeId, location.latitude, location.longitude);
      if (res.success) {
        Alert.alert('Journey Started!', res.message);
        loadRoute();
      }
    } catch (err: any) {
      Alert.alert('Start Failed', err.response?.data?.error || err.message || 'Failed to start trip');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFinishTrip = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }
    setLoadingAction('finish');
    try {
      const res = await finishTrip(routeId, location.latitude, location.longitude);
      if (res.success) {
        Alert.alert('🏆 Route Completed!', res.message);
        loadRoute();
      }
    } catch (err: any) {
      Alert.alert('Finish Failed', err.response?.data?.error || err.message || 'Failed to finish trip');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckin = async (stopId: number) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }
    setLoadingAction(stopId);
    try {
      const result = await checkin(stopId, location.latitude, location.longitude);
      if (result.success) {
        Alert.alert('✅ Checked In!', result.message);
        loadRoute();
      }
    } catch (err: any) {
      Alert.alert('Check-in Failed', err.response?.data?.error || 'Check-in failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const isStopNearby = (stopLat: number, stopLon: number, radius = CHECKIN_RADIUS): boolean => {
    if (!location) return false;
    return haversineDistance(location.latitude, location.longitude, stopLat, stopLon) <= radius;
  };

  const fitRouteOnMap = () => {
    if (!routeData?.stops?.length || !cameraRef.current) return;
    const coords = routeData.stops.map((s) => [s.longitude, s.latitude]);
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const padding = 60;
    cameraRef.current.setCamera({
      bounds: {
        ne: [Math.max(...lngs), Math.max(...lats)],
        sw: [Math.min(...lngs), Math.min(...lats)],
        paddingTop: padding,
        paddingBottom: padding,
        paddingLeft: padding,
        paddingRight: padding,
      },
      pitch: 60,
      heading: 20,
      animationDuration: 1200,
    });
  };

  const handleMapLoaded = () => {
    const preset = getTimeOfDayPreset();
    try {
      (mapRef.current as any)?.setMapStyleImportConfigValue?.('basemap', 'lightPreset', preset);
    } catch (e) {
      console.log('lightPreset not supported, using default');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
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
  const journeyStarted = !!routeData.user_progress?.started_at && !isCompleted;
  const routeColor = ROUTE_COLORS[routeData.difficulty] || '#FFFFFF';
  const stops = routeData.stops || [];

  const centerLng = stops.length ? stops.reduce((s, p) => s + p.longitude, 0) / stops.length : -79.3832;
  const centerLat = stops.length ? stops.reduce((s, p) => s + p.latitude, 0) / stops.length : 43.6532;

  // Distances
  let distToFirst = 0;
  let firstStopNearby = false;
  if (stops.length > 0 && location) {
    distToFirst = haversineDistance(location.latitude, location.longitude, stops[0].latitude, stops[0].longitude);
    firstStopNearby = distToFirst <= TRIP_RADIUS;
  }

  let distToLast = 0;
  let lastStopNearby = false;
  let allCheckedIn = false;
  if (stops.length > 0 && location) {
    const lastStop = stops[stops.length - 1];
    distToLast = haversineDistance(location.latitude, location.longitude, lastStop.latitude, lastStop.longitude);
    lastStopNearby = distToLast <= TRIP_RADIUS;
    allCheckedIn = stopsCompleted >= totalStops;
  }

  return (
    <View style={styles.container}>
      {/* ── MAP SECTION ── */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          ref={mapRef}
          style={styles.map}
          styleURL="mapbox://styles/mapbox/standard"
          projection="globe"
          compassEnabled={false}
          scaleBarEnabled={false}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          onDidFinishLoadingMap={() => {
            handleMapLoaded();
            fitRouteOnMap();
          }}
          onRegionDidChange={(e) => setCurrentZoom(e.properties.zoom)}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: [centerLng, centerLat],
              zoomLevel: 13,
              pitch: 45,
            }}
            animationMode="flyTo"
            animationDuration={800}
          />
          <MapboxGL.UserLocation visible animated />

          {routeData.polyline?.coordinates && (
            <MapboxGL.ShapeSource id="route-source" shape={{ type: 'Feature', geometry: routeData.polyline, properties: {} }}>
              <MapboxGL.LineLayer id="route-glow" style={{ lineColor: routeColor, lineWidth: 10, lineOpacity: 0.25, lineCap: 'round', lineJoin: 'round' }} />
              <MapboxGL.LineLayer id="route-line" style={{ lineColor: routeColor, lineWidth: journeyStarted ? 4 : 2.5, lineOpacity: journeyStarted ? 1 : 0.7, lineCap: 'round', lineJoin: 'round' }} />
            </MapboxGL.ShapeSource>
          )}

          {stops.map((stop, index) => {
            const checked = (stop as any).is_checked_in;
            const nearby = isStopNearby(stop.latitude, stop.longitude);
            return (
              <MapboxGL.PointAnnotation 
                key={`stop-${stop.id}`} 
                id={`stop-${stop.id}`} 
                coordinate={[stop.longitude, stop.latitude]}
                children={
                  <View collapsable={false} style={styles.pinWrapper}>
                    {nearby && journeyStarted && (
                      <Animated.View style={[styles.pingRing, { transform: [{ scale: pulseAnim }], borderColor: routeColor }]} />
                    )}
                    <View style={[styles.stopPin, checked ? styles.stopPinChecked : { borderColor: routeColor }, nearby && journeyStarted && { backgroundColor: routeColor }]}>
                      <Text style={[styles.stopPinText, checked && styles.stopPinTextChecked]}>{checked ? '✓' : `${index + 1}`}</Text>
                    </View>
                    <View style={[styles.pinTail, { backgroundColor: checked ? '#27AE60' : routeColor }]} />
                  </View>
                }
              />
            );
          })}
        </MapboxGL.MapView>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>

        <View style={[styles.difficultyOverlay, { backgroundColor: routeColor + '22', borderColor: routeColor + '55' }]}>
          <Text style={[styles.difficultyOverlayText, { color: routeColor }]}>{routeData.difficulty.toUpperCase()}</Text>
        </View>

        {/* Zoom Controls */}
        <View style={{ position: 'absolute', right: 16, top: 100, gap: 10 }}>
          <NeonButton variant="solid" size="sm" neon={true} style={{ width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#111111', borderColor: '#222222', borderWidth: 1 }} onPress={handleZoomIn}>
            <Text style={styles.zoomBtnText}>+</Text>
          </NeonButton>
          <NeonButton variant="solid" size="sm" neon={true} style={{ width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#111111', borderColor: '#222222', borderWidth: 1 }} onPress={handleZoomOut}>
            <Text style={styles.zoomBtnText}>−</Text>
          </NeonButton>
        </View>

        <LinearGradient colors={['transparent', '#000000']} style={styles.mapFade} pointerEvents="none" />
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={routeColor} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.routeName}>{routeData.name}</Text>
          <Text style={styles.routeDescription}>{routeData.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalStops}</Text>
              <Text style={styles.statLabel}>STOPS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={styles.statIconRow}>
                <Star size={14} color="#F39C12" style={{ marginRight: 4 }} />
                <Text style={[styles.statValue, { color: '#F39C12' }]}>{routeData.total_points}</Text>
              </View>
              <Text style={styles.statLabel}>POINTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={styles.statIconRow}>
                <Gift size={14} color="#DDDDDD" style={{ marginRight: 4 }} />
                <Text style={[styles.statValue, { color: '#DDDDDD' }]}>{routeData.bonus_points}</Text>
              </View>
              <Text style={styles.statLabel}>BONUS</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <ProgressBar completed={stopsCompleted} total={totalStops} />
          </View>
        </View>

        {/* ── START / END BUTTONS ── */}
        {!isCompleted && !journeyStarted && (
          <View style={styles.actionSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={14} color="#8E99A4" style={{ marginRight: 6 }} />
              <Text style={styles.distanceText}>
                {location ? `${(distToFirst / 1000).toFixed(1)} km from start` : 'Locating...'}
              </Text>
            </View>
            <NeonButton
              variant="solid"
              size="lg"
              neon={firstStopNearby}
              style={[!firstStopNearby && { backgroundColor: '#222222', opacity: 0.8 }, { width: '90%', alignSelf: 'center' }]}
              onPress={handleStartTrip}
              disabled={!firstStopNearby || loadingAction === 'start'}
            >
              {loadingAction === 'start' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {firstStopNearby ? <Play color="#FFF" size={18} /> : <Lock color="#8E99A4" size={18} />}
                  <Text style={{ fontSize: 17, fontWeight: '700', color: firstStopNearby ? '#FFF' : '#8E99A4' }}>Start Journey</Text>
                </View>
              )}
            </NeonButton>
          </View>
        )}

        {!isCompleted && journeyStarted && allCheckedIn && (
          <View style={styles.actionSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={14} color="#8E99A4" style={{ marginRight: 6 }} />
              <Text style={styles.distanceText}>
                {location ? `${(distToLast / 1000).toFixed(1)} km from finish` : 'Locating...'}
              </Text>
            </View>
            <NeonButton
              variant="solid"
              size="lg"
              neon={lastStopNearby}
              style={[!lastStopNearby && { backgroundColor: '#222222', opacity: 0.8 }, { width: '90%', alignSelf: 'center', backgroundColor: lastStopNearby ? '#27AE60' : undefined }]}
              onPress={handleFinishTrip}
              disabled={!lastStopNearby || loadingAction === 'finish'}
            >
              {loadingAction === 'finish' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {lastStopNearby ? <Flag color="#FFF" size={18} /> : <Lock color="#8E99A4" size={18} />}
                  <Text style={{ fontSize: 17, fontWeight: '700', color: lastStopNearby ? '#FFF' : '#8E99A4' }}>End Trip</Text>
                </View>
              )}
            </NeonButton>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBanner}>
            <CheckCircle color="#27AE60" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.completedBannerText}>Route Completed!</Text>
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
                <View style={styles.stopLeft}>
                  <View style={[styles.stopNumber, checked ? styles.stopNumberDone : { borderColor: routeColor }]}>
                    <Text style={[styles.stopNumberText, checked && { color: '#fff' }]}>{checked ? '✓' : index + 1}</Text>
                  </View>
                  {index < stops.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: checked ? '#27AE60' : '#222222' }]} />
                  )}
                </View>

                <View style={styles.stopContent}>
                  <View style={styles.stopHeader}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
                      <Text style={[styles.rarityText, { color: rarityColor }]}>{stop.rarity.toUpperCase()}</Text>
                    </View>
                  </View>
                  {stop.description ? <Text style={styles.stopDesc} numberOfLines={2}>{stop.description}</Text> : null}
                  <View style={styles.stopFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Star size={12} color="#F39C12" style={{ marginRight: 4 }} />
                      <Text style={styles.stopPoints}>{stop.points} pts</Text>
                    </View>
                    {checked ? (
                      <View style={styles.checkedBadge}>
                        <CheckCircle size={12} color="#27AE60" style={{ marginRight: 4 }} />
                        <Text style={styles.checkedText}>Visited</Text>
                      </View>
                    ) : nearby && journeyStarted ? (
                      <NeonButton 
                        variant="solid" 
                        size="sm" 
                        style={{ backgroundColor: routeColor }} 
                        onPress={() => handleCheckin(stop.id)} 
                        disabled={loadingAction === stop.id}
                      >
                        {loadingAction === stop.id ? <ActivityIndicator size="small" color="#fff" /> : (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.checkinBtnText}>Check In</Text>
                            <MapPin size={14} color="#FFF" style={{ marginLeft: 6 }} />
                          </View>
                        )}
                      </NeonButton>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Lock size={12} color="#5A5E6D" style={{ marginRight: 4 }} />
                        <Text style={styles.visitToUnlock}>{journeyStarted ? 'Go here to unlock' : 'Start journey to unlock'}</Text>
                      </View>
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
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  loadingText: { color: '#8E99A4', marginTop: 12, fontSize: 15 },
  errorText: { color: '#E74C3C', fontSize: 16 },
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { flex: 1 },
  mapFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  backBtn: { position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(17, 17, 17, 0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222222' },
  backBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28, marginTop: -2 },
  difficultyOverlay: { position: 'absolute', top: 54, right: 16, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  difficultyOverlayText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  pinWrapper: { alignItems: 'center' },
  pingRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, top: -8 },
  stopPin: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#111111', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  stopPinChecked: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  stopPinText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stopPinTextChecked: { color: '#fff' },
  pinTail: { width: 2, height: 6, marginTop: -1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  routeName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  routeDescription: { fontSize: 14, color: '#8E99A4', lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111111', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: '#8E99A4', fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: '#222222' },
  progressSection: { marginBottom: 16 },
  actionSection: { alignItems: 'center', marginBottom: 24 },
  distanceText: { color: '#8E99A4', fontSize: 13, fontWeight: '600' },
  startBtn: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', width: '90%' },
  startBtnDisabled: { opacity: 0.8 },
  startBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 10 },
  startBtnIcon: { fontSize: 18 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  completedBanner: { marginHorizontal: 20, marginBottom: 24, backgroundColor: '#27AE6022', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27AE6044' },
  completedBannerText: { color: '#27AE60', fontSize: 16, fontWeight: '700' },
  stopsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  stopCard: { flexDirection: 'row', marginBottom: 4 },
  stopCardChecked: { opacity: 0.7 },
  stopLeft: { alignItems: 'center', marginRight: 14, width: 28 },
  stopNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#111111', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  stopNumberDone: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  stopNumberText: { fontSize: 12, fontWeight: '700', color: '#8E99A4' },
  connector: { width: 2, flex: 1, minHeight: 20, marginVertical: 4 },
  stopContent: { flex: 1, backgroundColor: '#111111', borderRadius: 14, padding: 14, marginBottom: 8 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stopName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rarityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stopDesc: { fontSize: 12, color: '#8E99A4', lineHeight: 17, marginBottom: 10 },
  stopFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stopPoints: { fontSize: 13, color: '#F39C12', fontWeight: '600' },
  checkedBadge: { backgroundColor: '#27AE6022', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  checkedText: { fontSize: 12, color: '#27AE60', fontWeight: '600' },
  checkinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  checkinBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  visitToUnlock: { fontSize: 12, color: '#5A5E6D', fontWeight: '500' },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 100, // below difficulty overlay
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
  },
  zoomBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 28,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#222222',
    width: '100%',
  },
});
