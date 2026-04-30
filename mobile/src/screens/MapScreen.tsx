import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useLocation } from '../hooks/useLocation';
import { getRoutes } from '../services/api';
import { Route, DIFFICULTY_COLORS } from '../types';
import { getTimeOfDayPreset } from '../utils/getTimeOfDayPreset';
import SearchBar from '../components/SearchBar';
import NeonButton from '../components/NeonButton';
import ShinyWrapper from '../components/ShinyWrapper';
import { Star, CheckCircle, ChevronRight } from 'lucide-react-native';

// Set your Mapbox access token here or via env
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
MapboxGL.setAccessToken(mapboxToken);

const { height, width } = Dimensions.get('window');

const ROUTE_COLORS = ['#74B9FF', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#E17055'];

export default function MapScreen({ navigation }: any) {
  const { location, isLoading: locationLoading } = useLocation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const data = await getRoutes();
      setRoutes(data.routes);
    } catch (err) {
      console.error('Failed to load routes:', err);
      Alert.alert('Error', 'Failed to load routes. Make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoutePress = (route: Route) => {
    navigation.navigate('Route', { routeId: route.id, routeName: route.name });
  };

  const handleRouteCardPress = (route: Route) => {
    setSelectedRouteId(route.id);

    // Fly to the route's bounding box
    if (route.stops?.length) {
      const coords = route.stops.map((s: any) => [s.longitude, s.latitude]);
      const lngs = coords.map((c: number[]) => c[0]);
      const lats = coords.map((c: number[]) => c[1]);
      const padding = 80;

      cameraRef.current?.fitBounds(
        [Math.max(...lngs), Math.max(...lats)],
        [Math.min(...lngs), Math.min(...lats)],
        [padding, padding, padding, padding + 180], // extra bottom padding for cards
        1200
      );
    }
  };

  const handleSearchResult = (coordinates: [number, number], _name: string) => {
    setSelectedRouteId(null);
    cameraRef.current?.setCamera({
      centerCoordinate: coordinates,
      zoomLevel: 14,
      pitch: 45,
      animationDuration: 2000,
      animationMode: 'flyTo',
    });
  };

  const handleSearchClear = () => {
    setSelectedRouteId(null);
    // Fly back to globe view
    cameraRef.current?.setCamera({
      centerCoordinate: [0, 20],
      zoomLevel: 1,
      pitch: 0,
      animationDuration: 2000,
      animationMode: 'flyTo',
    });
  };

  const handleMapLoaded = () => {
    // Apply light preset based on time of day
    const preset = getTimeOfDayPreset();
    try {
      (mapRef.current as any)?.setMapStyleImportConfigValue?.('basemap', 'lightPreset', preset);
    } catch (e) {
      // Fallback — some versions may not support this method
      console.log('lightPreset not supported, using default');
    }
  };

  const handleZoomIn = () => {
    cameraRef.current?.setCamera({ zoomLevel: currentZoom + 0.5, animationDuration: 800 });
  };

  const handleZoomOut = () => {
    cameraRef.current?.setCamera({ zoomLevel: Math.max(1, currentZoom - 0.5), animationDuration: 800 });
  };

  if (isLoading || locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>
          {locationLoading ? 'Getting your location...' : 'Loading routes...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/standard"
        projection="globe"
        compassEnabled
        scaleBarEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        onDidFinishLoadingMap={handleMapLoaded}
        onRegionDidChange={(e) => setCurrentZoom(e.properties.zoom)}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [0, 20],
            zoomLevel: 1,
            pitch: 0,
          }}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* User Location */}
        <MapboxGL.UserLocation visible animated />

        {/* Route Polylines */}
        {routes.map((route, index) => {
          if (!route.polyline?.coordinates) return null;

          const lineColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
          const isSelected = selectedRouteId === route.id;

          return (
            <MapboxGL.ShapeSource
              key={`route-${route.id}`}
              id={`route-source-${route.id}`}
              shape={{
                type: 'Feature',
                geometry: route.polyline,
                properties: { id: route.id },
              }}
              onPress={() => handleRoutePress(route)}
            >
              {/* Glow effect */}
              <MapboxGL.LineLayer
                id={`route-glow-${route.id}`}
                style={{
                  lineColor: lineColor,
                  lineWidth: isSelected ? 12 : 8,
                  lineOpacity: isSelected ? 0.4 : 0.2,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Main line */}
              <MapboxGL.LineLayer
                id={`route-line-${route.id}`}
                style={{
                  lineColor: lineColor,
                  lineWidth: isSelected ? 5 : 3,
                  lineOpacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}

        {/* Stop Markers */}
        {routes.map((route, routeIndex) => {
          if (!route.stops?.length) return null;
          const markerColor = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];

          return route.stops.map((stop) => (
            <MapboxGL.PointAnnotation
              key={`stop-${route.id}-${stop.id}`}
              id={`stop-${route.id}-${stop.id}`}
              coordinate={[stop.longitude, stop.latitude]}
              children={
                <View collapsable={false}>
                  <TouchableOpacity onPress={() => handleRoutePress(route)} activeOpacity={0.8}>
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, { borderColor: markerColor }]}>
                        <View style={[styles.markerInner, { backgroundColor: markerColor }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              }
            />
          ));
        })}
      </MapboxGL.MapView>

      {/* Search Bar Overlay */}
      <SearchBar
        onSelectResult={handleSearchResult}
        onClear={handleSearchClear}
        userLocation={location}
      />

      {/* Zoom Controls */}
      <View style={{ position: 'absolute', right: 16, top: 180, gap: 10 }}>
        <NeonButton variant="solid" size="sm" neon={true} style={{ width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#111111', borderColor: '#222222', borderWidth: 1 }} onPress={handleZoomIn}>
          <Text style={styles.zoomBtnText}>+</Text>
        </NeonButton>
        <NeonButton variant="solid" size="sm" neon={true} style={{ width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#111111', borderColor: '#222222', borderWidth: 1 }} onPress={handleZoomOut}>
          <Text style={styles.zoomBtnText}>−</Text>
        </NeonButton>
      </View>

      {/* Bottom Route Cards */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.bottomTitle}>Nearby Routes</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
        >
          {routes.map((route, index) => {
            const isSelected = selectedRouteId === route.id;
            return (
              <TouchableOpacity
                key={route.id}
                style={{ marginBottom: 10 }}
                onPress={() => handleRoutePress(route)}
                onLongPress={() => handleRouteCardPress(route)}
                activeOpacity={0.7}
              >
                <ShinyWrapper
                  borderRadius={14}
                  backgroundColor={isSelected ? 'rgba(255, 255, 255, 0.08)' : '#111111'}
                  style={[styles.routeCardInner, isSelected && { borderColor: 'transparent' }]}
                >
                  <View style={styles.routeCardContent}>
                    <View
                      style={[
                        styles.routeColorBar,
                        { backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] },
                      ]}
                    />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName} numberOfLines={1}>
                        {route.name}
                      </Text>
                      <View style={styles.routeMeta}>
                        <View
                          style={[
                            styles.difficultyBadge,
                            {
                              backgroundColor:
                                DIFFICULTY_COLORS[route.difficulty] + '22',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.difficultyText,
                              { color: DIFFICULTY_COLORS[route.difficulty] },
                            ]}
                          >
                            {route.difficulty.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.stopCount}>{route.stop_count} stops</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Star size={12} color="#F39C12" style={{ marginRight: 4 }} />
                          <Text style={styles.routePoints}>{route.total_points} pts</Text>
                        </View>
                      </View>
                    </View>
                    {route.stops_completed !== undefined && route.stops_completed > 0 && (
                      <View style={styles.progressChip}>
                        {route.is_completed ? (
                          <CheckCircle size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.progressChipText}>
                            {route.stops_completed}/{route.stop_count}
                          </Text>
                        )}
                      </View>
                    )}
                    {/* Tap hint */}
                    <View style={styles.tapHint}>
                      <ChevronRight size={20} color="#5A5E6D" />
                    </View>
                  </View>
                </ShinyWrapper>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#8E99A4',
    fontSize: 16,
    marginTop: 16,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111111',
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    maxHeight: height * 0.4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#222222',
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    paddingBottom: 8,
  },
  routeCardInner: {
    flex: 1,
  },
  routeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeColorBar: {
    width: 4,
    height: '100%',
    minHeight: 60,
  },
  routeInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stopCount: {
    fontSize: 12,
    color: '#8E99A4',
    fontWeight: '500',
  },
  routePoints: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '600',
  },
  progressChip: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressChipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tapHint: {
    marginRight: 14,
  },
  tapHintText: {
    fontSize: 20,
    color: '#5A5E6D',
    fontWeight: '600',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 180, // below search bar
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
    width: 44,
    height: 44,
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
