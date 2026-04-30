import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/api';
import { LeaderboardEntry } from '../types';
import { supabase } from '../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RANK_COLORS = ['#F39C12', '#AAAAAA', '#CD7F32'];
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.old && payload.new && payload.old.total_points !== payload.new.total_points) {
            load(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const load = async (animate = false) => {
    try {
      const data = await getLeaderboard();
      if (animate) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
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
    load(true);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.id === user?.id;
    const medal = item.rank <= 3 ? RANK_MEDALS[item.rank - 1] : null;
    const rankColor = item.rank <= 3 ? RANK_COLORS[item.rank - 1] : '#555555';

    return (
      <TouchableOpacity
        style={[styles.row, isMe && styles.rowMe]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
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
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <Text style={styles.headerSub}>Top explorers by points</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: '#000000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingTop: 60,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#666666', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
    gap: 12,
  },
  rowMe: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  usernameMe: { color: '#FFFFFF' },
  meta: { fontSize: 12, color: '#666666', marginTop: 2 },
  points: { fontSize: 14, fontWeight: '700', color: '#F39C12' },
  chevron: { fontSize: 20, color: '#444444', marginLeft: 4, fontWeight: '600' },
  emptyText: { color: '#666666', fontSize: 16 },
});
