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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/api';
import { ProfileResponse, RARITY_COLORS, DIFFICULTY_COLORS } from '../types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
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
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Profile Header */}
        <LinearGradient colors={['#1A1B2E', '#0F1123']} style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#6C5CE7', '#A29BFE']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.username}>{user?.username || 'Explorer'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Points Display */}
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <Text style={styles.pointsValue}>{profile?.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>Total Points</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🗺️</Text>
            <Text style={styles.statValue}>{profile?.completedRoutes || 0}</Text>
            <Text style={styles.statLabel}>Routes{'\n'}Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>{profile?.totalStopsVisited || 0}</Text>
            <Text style={styles.statLabel}>Stops{'\n'}Visited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{profile?.totalRoutesAvailable || 0}</Text>
            <Text style={styles.statLabel}>Routes{'\n'}Available</Text>
          </View>
        </View>

        {/* Route Progress */}
        {profile?.routeProgress && profile.routeProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Progress</Text>
            {profile.routeProgress.map((rp) => (
              <View key={rp.route_id} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressRouteName} numberOfLines={1}>
                    {rp.route_name}
                  </Text>
                  {rp.difficulty && (
                    <View
                      style={[
                        styles.diffBadge,
                        { backgroundColor: (DIFFICULTY_COLORS[rp.difficulty] || '#8B9DC3') + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.diffText,
                          { color: DIFFICULTY_COLORS[rp.difficulty] || '#8B9DC3' },
                        ]}
                      >
                        {rp.difficulty?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressBarRow}>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={rp.is_completed ? ['#27AE60', '#2ECC71'] : ['#6C5CE7', '#A29BFE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${Math.min(
                              (rp.stops_completed / rp.total_stops) * 100,
                              100
                            )}%` as any,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {rp.is_completed ? '✅' : `${rp.stops_completed}/${rp.total_stops}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
                      { backgroundColor: RARITY_COLORS[ci.rarity] || '#8B9DC3' },
                    ]}
                  />
                  <View>
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
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#8E99A4',
    marginTop: 4,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#1E2030',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  pointsEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 13,
    color: '#8E99A4',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: -12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E2030',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2D3A',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E99A4',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  progressCard: {
    backgroundColor: '#1E2030',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2D3A',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressRouteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#2A2D3A',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 100,
  },
  progressText: {
    fontSize: 13,
    color: '#8E99A4',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  checkinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E2030',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2D3A',
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  checkinStop: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkinRoute: {
    fontSize: 12,
    color: '#8E99A4',
    marginTop: 2,
  },
  checkinRight: {
    alignItems: 'flex-end',
  },
  checkinPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F39C12',
  },
  checkinTime: {
    fontSize: 11,
    color: '#5A5E6D',
    marginTop: 2,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: '#1E2030',
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
