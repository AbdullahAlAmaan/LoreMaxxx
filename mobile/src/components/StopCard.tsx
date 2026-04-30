import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stop, RARITY_COLORS, RARITY_LABELS } from '../types';

interface StopCardProps {
  stop: Stop;
  onCheckIn?: () => void;
  isNearby?: boolean;
  isCheckinLoading?: boolean;
}

export default function StopCard({ stop, onCheckIn, isNearby = false, isCheckinLoading = false }: StopCardProps) {
  const rarityColor = RARITY_COLORS[stop.rarity] || '#8B9DC3';

  return (
    <View style={[styles.card, stop.is_checked_in && styles.checkedIn]}>
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{stop.stop_order}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{stop.name}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
            <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {RARITY_LABELS[stop.rarity]}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{stop.description}</Text>

        <View style={styles.footer}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.pointsText}>{stop.points} pts</Text>
          </View>

          {stop.is_checked_in ? (
            <View style={styles.checkedBadge}>
              <Text style={styles.checkedIcon}>✅</Text>
              <Text style={styles.checkedText}>Visited</Text>
            </View>
          ) : isNearby ? (
            <TouchableOpacity
              style={styles.checkinButton}
              onPress={onCheckIn}
              disabled={isCheckinLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.checkinButtonText}>
                {isCheckinLoading ? 'Checking in...' : '📍 Check In'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedText}>Visit to unlock</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  checkedIn: {
    borderColor: '#27AE6044',
    backgroundColor: '#11111199',
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  orderText: {
    color: '#8E99A4',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: '#8E99A4',
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pointsText: {
    fontSize: 13,
    color: '#F39C12',
    fontWeight: '600',
  },
  checkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkedIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  checkedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  checkinButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  checkinButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  lockedText: {
    fontSize: 12,
    color: '#5A5E6D',
    fontWeight: '500',
  },
});
