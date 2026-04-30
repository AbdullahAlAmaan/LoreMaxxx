import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 32, 340);
const CENTER = CONTAINER_SIZE / 2;
const ORBIT_RADIUS = CENTER * 0.65;
const NODE_SIZE = 44;
const CARD_WIDTH = 192;
const LABEL_WIDTH = 112;

export interface OrbitalItem {
  id: number;
  title: string;
  icon: React.ElementType;
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
  detail: string;
  value?: string | number;
}

interface Props {
  items: OrbitalItem[];
}

export default function OrbitalTimeline({ items }: Props) {
  const [rotation, setRotation] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const autoRotate = useRef(true);
  const rotRef = useRef(0);

  const pingScale1 = useRef(new Animated.Value(1)).current;
  const pingOpacity1 = useRef(new Animated.Value(0.55)).current;
  const pingScale2 = useRef(new Animated.Value(1)).current;
  const pingOpacity2 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const ping = (scale: Animated.Value, opacity: Animated.Value, delay: number, initOpacity: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 2.4, duration: 1300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: initOpacity, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    ping(pingScale1, pingOpacity1, 0, 0.55);
    ping(pingScale2, pingOpacity2, 650, 0.35);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      if (autoRotate.current) {
        rotRef.current = (rotRef.current + 0.3) % 360;
        setRotation(rotRef.current);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [items.length]);

  const getPos = (index: number, total: number, rot: number) => {
    const angle = ((index / total) * 360 + rot) % 360;
    const rad = (angle * Math.PI) / 180;
    return {
      x: ORBIT_RADIUS * Math.cos(rad),
      y: ORBIT_RADIUS * Math.sin(rad),
      opacity: Math.max(0.35, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2)),
      zIndex: Math.round(100 + 50 * Math.cos(rad)),
    };
  };

  const toggle = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      autoRotate.current = true;
    } else {
      setExpandedId(id);
      autoRotate.current = false;
    }
  };

  const handleBgPress = () => {
    if (expandedId !== null) {
      setExpandedId(null);
      autoRotate.current = true;
    }
  };

  const statusLabel = (s: OrbitalItem['status']) =>
    s === 'completed' ? 'COMPLETE' : s === 'in-progress' ? 'IN PROGRESS' : 'PENDING';

  const statusColor = (s: OrbitalItem['status']) =>
    s === 'completed' ? '#FFFFFF' : s === 'in-progress' ? '#888888' : '#555555';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleBgPress}
      style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, alignSelf: 'center' }}
    >
      {/* Orbit ring */}
      <View
        style={[
          styles.ring,
          {
            width: ORBIT_RADIUS * 2,
            height: ORBIT_RADIUS * 2,
            borderRadius: ORBIT_RADIUS,
            top: CENTER - ORBIT_RADIUS,
            left: CENTER - ORBIT_RADIUS,
          },
        ]}
      />

      {/* Center orb */}
      <View style={[styles.centerWrapper, { top: CENTER - 32, left: CENTER - 32 }]}>
        <Animated.View
          style={[styles.pingRing, { transform: [{ scale: pingScale1 }], opacity: pingOpacity1 }]}
        />
        <Animated.View
          style={[styles.pingRing, { transform: [{ scale: pingScale2 }], opacity: pingOpacity2 }]}
        />
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerOrb}
        >
          <View style={styles.centerDot} />
        </LinearGradient>
      </View>

      {/* Orbital nodes */}
      {items.map((item, i) => {
        const pos = getPos(i, items.length, rotation);
        const expanded = expandedId === item.id;
        const nL = CENTER + pos.x - NODE_SIZE / 2;
        const nT = CENTER + pos.y - NODE_SIZE / 2;
        // Flip card to the opposite side so it doesn't go off-screen
        const cardLeft = pos.x >= 0 ? -(CARD_WIDTH + 8) : NODE_SIZE + 8;
        const cardTop = pos.y <= 0 ? NODE_SIZE + 16 : -(CARD_WIDTH * 0.9);
        const sc = statusColor(item.status);
        const Icon = item.icon;

        return (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              left: nL,
              top: nT,
              zIndex: expanded ? 200 : pos.zIndex,
            }}
          >
            <TouchableOpacity onPress={() => toggle(item.id)} activeOpacity={0.75}>
              <View
                style={[
                  styles.node,
                  expanded && styles.nodeOn,
                  { opacity: expanded ? 1 : pos.opacity },
                ]}
              >
                <Icon size={18} color={expanded ? '#000000' : 'rgba(255,255,255,0.8)'} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.label, expanded && styles.labelOn]} numberOfLines={1}>
              {item.title}
            </Text>

            {expanded && (
              <View style={[styles.card, { left: cardLeft, top: cardTop }]}>
                <View style={[styles.badge, { borderColor: sc + '55' }]}>
                  <Text style={[styles.badgeText, { color: sc }]}>{statusLabel(item.status)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.value !== undefined && (
                  <Text style={styles.cardBigValue}>{item.value}</Text>
                )}
                <Text style={styles.cardDetail}>{item.detail}</Text>
                <View style={styles.barSection}>
                  <View style={styles.barRow}>
                    <Text style={styles.barLabel}>Progress</Text>
                    <Text style={styles.barPct}>{item.energy}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={['#3B82F6', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.barFill, { width: `${item.energy}%` as any }]}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  centerWrapper: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  pingRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  centerOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#141414',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeOn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.25 }],
  },
  label: {
    position: 'absolute',
    top: NODE_SIZE + 6,
    left: -(LABEL_WIDTH / 2 - NODE_SIZE / 2),
    width: LABEL_WIDTH,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  labelOn: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#0D0D0D',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 300,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBigValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 14,
    marginBottom: 12,
  },
  barSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barPct: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  barTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: 2,
    borderRadius: 1,
  },
});
