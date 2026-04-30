import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface NeonButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'solid' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  neon?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function NeonButton({
  title,
  children,
  variant = 'default',
  size = 'default',
  neon = true,
  style,
  textStyle,
  ...props
}: NeonButtonProps) {
  // Determine sizing
  const sizeStyles: ViewStyle = {
    paddingVertical: size === 'sm' ? 6 : size === 'lg' ? 14 : 10,
    paddingHorizontal: size === 'sm' ? 16 : size === 'lg' ? 40 : 28,
  };

  // Determine variant styling
  let containerStyle: ViewStyle = {};
  let textColor = '#FFFFFF';

  if (variant === 'default') {
    containerStyle = {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      borderWidth: 1,
    };
  } else if (variant === 'solid') {
    containerStyle = {
      backgroundColor: '#3B82F6',
      borderColor: 'transparent',
      borderWidth: 1,
    };
  } else if (variant === 'ghost') {
    containerStyle = {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 1,
    };
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.buttonBase, sizeStyles, containerStyle, style]}
      {...props}
    >
      {neon && (
        <View style={styles.neonTopContainer}>
          <LinearGradient
            colors={['transparent', '#3B82F6', '#2563EB', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>
      )}

      {children ? children : <Text style={[styles.textBase, { color: textColor }, textStyle]}>{title}</Text>}

      {neon && (
        <View style={styles.neonBottomContainer}>
          <LinearGradient
            colors={['transparent', '#3B82F6', '#2563EB', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999, // fully rounded like 'rounded-full'
    overflow: 'hidden',
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  neonTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    alignItems: 'center',
    opacity: 0.8,
  },
  neonBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    alignItems: 'center',
    opacity: 0.4,
  },
  neonLine: {
    width: '75%',
    height: '100%',
  },
});
