import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setError('Location permission denied');
            setHasPermission(false);
            setIsLoading(false);
          }
          Alert.alert(
            'Location Required',
            'Lifemax needs your location to validate check-ins. Please enable location access in your device settings.',
          );
          return;
        }

        if (isMounted) setHasPermission(true);

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
            timestamp: currentLocation.timestamp,
          });
          setIsLoading(false);
        }

        // Watch for location changes
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (loc) => {
            if (isMounted) {
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                timestamp: loc.timestamp,
              });
            }
          }
        );
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to get location');
          setIsLoading(false);
        }
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const refreshLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: currentLocation.timestamp,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { location, isLoading, error, hasPermission, refreshLocation };
}
