import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShinyWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  borderWidth?: number;
  backgroundColor?: string;
}

export default function ShinyWrapper({
  children,
  style,
  borderRadius = 14,
  borderWidth = 1.5,
  backgroundColor = '#1E2030', // inner background color
}: ShinyWrapperProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* Animated Border Wrapper */}
      <View style={[styles.borderWrapper, { borderRadius }]}>
        <Animated.View style={[styles.shimmerBackground, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={['#1E2030', '#8484ff', '#1E2030', '#1E2030']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      
      {/* Inner Content */}
      <View style={[styles.innerContent, { borderRadius: borderRadius - 1, margin: borderWidth, backgroundColor }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  borderWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerBackground: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    top: '-50%',
    left: '-50%',
  },
  innerContent: {
    flex: 1,
    overflow: 'hidden',
  },
});
