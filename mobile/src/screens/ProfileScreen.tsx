import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Map, MapPin, Trophy, Star } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/api';
import { ProfileResponse, RARITY_COLORS } from '../types';
import OrbitalTimeline, { OrbitalItem } from '../components/OrbitalTimeline';

export default function ProfileScreen({ route }: any) {
  const { user, signOut } = useAuth();
  const userId = route?.params?.userId;
  const isCurrentUser = !userId || userId === user?.id;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProfile();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const initial = profile?.user?.username?.charAt(0).toUpperCase() || '?';

  const totalRoutes = profile?.totalRoutesAvailable || 0;
  const completedRoutes = profile?.completedRoutes || 0;
  const stopsVisited = profile?.totalStopsVisited || 0;
  const totalPoints = profile?.totalPoints || 0;

  const orbitalItems: OrbitalItem[] = [
    {
      id: 1,
      title: 'Routes',
      icon: Map,
      value: completedRoutes,
      detail: `${completedRoutes} of ${totalRoutes} routes completed`,
      status: completedRoutes > 0 ? 'completed' : 'pending',
      energy: totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0,
    },
    {
      id: 2,
      title: 'Stops',
      icon: MapPin,
      value: stopsVisited,
      detail: `${stopsVisited} stops visited`,
      status: stopsVisited > 0 ? 'in-progress' : 'pending',
      energy: Math.min(100, Math.round((stopsVisited / 20) * 100)),
    },
    {
      id: 3,
      title: 'Available',
      icon: Trophy,
      value: totalRoutes,
      detail: `${totalRoutes} routes to explore`,
      status: 'pending',
      energy: 0,
    },
    {
      id: 4,
      title: 'Points',
      icon: Star,
      value: totalPoints,
      detail: `${totalPoints} total points earned`,
      status: totalPoints > 0 ? 'in-progress' : 'pending',
      energy: Math.min(100, Math.round((totalPoints / 1000) * 100)),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.username}>{profile?.user?.username || 'Explorer'}</Text>
          <Text style={styles.email}>{profile?.user?.email}</Text>

          <View style={styles.pointsContainer}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <Text style={styles.pointsValue}>{profile?.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>Total Points</Text>
          </View>
        </View>

        {/* Orbital Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <Text style={styles.sectionSubtitle}>Tap a node to explore</Text>
          <OrbitalTimeline items={orbitalItems} />
        </View>

        {/* Recent Check-ins */}
        {profile?.recentCheckins && profile.recentCheckins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {profile.recentCheckins.map((ci) => (
              <View key={ci.id} style={styles.checkinCard}>
                <View style={styles.checkinLeft}>
                  <View
                    style={[
                      styles.rarityDot,
                      { backgroundColor: RARITY_COLORS[ci.rarity] || '#555555' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkinStop} numberOfLines={1}>
                      {ci.stop_name}
                    </Text>
                    <Text style={styles.checkinRoute}>{ci.route_name}</Text>
                  </View>
                </View>
                <View style={styles.checkinRight}>
                  <Text style={styles.checkinPoints}>+{ci.points_earned}</Text>
                  <Text style={styles.checkinTime}>
                    {new Date(ci.checked_in_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sign Out */}
        {isCurrentUser && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#111111',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#222222',
  },
  pointsEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 20,
  },
  checkinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    flexShrink: 0,
  },
  checkinStop: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkinRoute: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  checkinRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  checkinPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkinTime: {
    fontSize: 11,
    color: '#444444',
    marginTop: 2,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C44',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
});
