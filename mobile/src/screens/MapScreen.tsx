import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useLocation } from '../hooks/useLocation';
import { getRoutes } from '../services/api';
import { Route, RARITY_COLORS, DIFFICULTY_COLORS } from '../types';

// Set your Mapbox access token here or via env
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
MapboxGL.setAccessToken(mapboxToken);

const { height } = Dimensions.get('window');

const ROUTE_COLORS = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#E17055'];

export default function MapScreen({ navigation }: any) {
  const { location, isLoading: locationLoading } = useLocation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cameraRef = useRef<MapboxGL.Camera>(null);

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

  if (isLoading || locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>
          {locationLoading ? 'Getting your location...' : 'Loading routes...'}
        </Text>
      </View>
    );
  }

  const initialCenter = location
    ? [location.longitude, location.latitude]
    : [-79.3832, 43.6532]; // Default: Toronto

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        compassEnabled
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={initialCenter}
          zoomLevel={12}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* User Location */}
        <MapboxGL.UserLocation visible animated />

        {/* Route Polylines */}
        {routes.map((route, index) => {
          if (!route.polyline?.coordinates) return null;

          const lineColor = ROUTE_COLORS[index % ROUTE_COLORS.length];

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
                  lineWidth: 8,
                  lineOpacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Main line */}
              <MapboxGL.LineLayer
                id={`route-line-${route.id}`}
                style={{
                  lineColor: lineColor,
                  lineWidth: 3,
                  lineOpacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}

        {/* Stop Markers — placed at actual stop coordinates */}
        {routes.map((route, routeIndex) => {
          if (!route.stops?.length) return null;
          const markerColor = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];

          return route.stops.map((stop) => (
            <MapboxGL.PointAnnotation
              key={`stop-${route.id}-${stop.id}`}
              id={`stop-${route.id}-${stop.id}`}
              coordinate={[stop.longitude, stop.latitude]}
              onSelected={() => handleRoutePress(route)}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { borderColor: markerColor }]}>
                  <View style={[styles.markerInner, { backgroundColor: markerColor }]} />
                </View>
              </View>
            </MapboxGL.PointAnnotation>
          ));
        })}
      </MapboxGL.MapView>

      {/* Bottom Route Cards */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.bottomTitle}>Nearby Routes</Text>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => handleRoutePress(route)}
            activeOpacity={0.7}
          >
            <View style={[styles.routeColorBar, { backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
              <View style={styles.routeMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[route.difficulty] + '22' }]}>
                  <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[route.difficulty] }]}>
                    {route.difficulty.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.stopCount}>{route.stop_count} stops</Text>
                <Text style={styles.routePoints}>⭐ {route.total_points} pts</Text>
              </View>
            </View>
            {route.stops_completed !== undefined && route.stops_completed > 0 && (
              <View style={styles.progressChip}>
                <Text style={styles.progressChipText}>
                  {route.is_completed ? '✅' : `${route.stops_completed}/${route.stop_count}`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    backgroundColor: '#1E2030',
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
    backgroundColor: '#1A1B2E',
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
    backgroundColor: '#2A2D3A',
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2030',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
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
    marginRight: 14,
    backgroundColor: '#6C5CE722',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressChipText: {
    fontSize: 13,
    color: '#6C5CE7',
    fontWeight: '700',
  },
});
