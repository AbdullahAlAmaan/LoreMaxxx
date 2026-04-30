import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  completed: number;
  total: number;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ completed, total, height = 8, showLabel = true }: ProgressBarProps) {
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>
            {completed}/{total} stops
          </Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <LinearGradient
          colors={progress >= 1 ? ['#27AE60', '#2ECC71'] : ['#FFFFFF', '#AAAAAA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            {
              width: `${percentage}%` as any,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 13,
    color: '#8E99A4',
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  track: {
    width: '100%',
    backgroundColor: '#222222',
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 100,
  },
});
