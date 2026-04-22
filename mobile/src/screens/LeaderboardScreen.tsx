import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/api';
import { LeaderboardEntry } from '../types';

const RANK_COLORS = ['#F39C12', '#8B9DC3', '#CD7F32'];
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getLeaderboard();
      setEntries(data.leaderboard);
    } catch {
      // empty list shown on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    load();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.id === user?.id;
    const medal = item.rank <= 3 ? RANK_MEDALS[item.rank - 1] : null;
    const rankColor = item.rank <= 3 ? RANK_COLORS[item.rank - 1] : '#5A5E6D';

    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor + '22' }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            {medal ?? `#${item.rank}`}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
            {item.username}{isMe ? ' (you)' : ''}
          </Text>
          <Text style={styles.meta}>
            {item.completed_routes} routes · {item.stops_visited} stops
          </Text>
        </View>
        <Text style={[styles.points, item.rank <= 3 && { color: rankColor }]}>
          ⭐ {item.total_points.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A1B2E', '#0F1123']} style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top explorers by points</Text>
      </LinearGradient>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No explorers yet. Be the first!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1123' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1123', paddingTop: 60 },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#8E99A4', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2030',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2D3A',
    gap: 12,
  },
  rowMe: {
    borderColor: '#6C5CE7',
    backgroundColor: '#6C5CE711',
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: { fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  usernameMe: { color: '#A29BFE' },
  meta: { fontSize: 12, color: '#8E99A4', marginTop: 2 },
  points: { fontSize: 14, fontWeight: '700', color: '#F39C12' },
  emptyText: { color: '#8E99A4', fontSize: 16 },
});
