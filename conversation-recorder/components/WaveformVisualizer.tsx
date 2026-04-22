import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface Props {
  amplitude: number;
  isRecording: boolean;
  barCount?: number;
}

const NUM_BARS = 24;

function Bar({ index, amplitude, isRecording, total }: {
  index: number;
  amplitude: number;
  isRecording: boolean;
  total: number;
}) {
  const height = useSharedValue(4);
  const phase = (index / total) * Math.PI * 2;

  useEffect(() => {
    if (!isRecording) {
      height.value = withSpring(4, { damping: 10 });
      return;
    }
    const centerFactor = 1 - Math.abs((index / (total - 1)) - 0.5) * 1.2;
    const wave = Math.sin(phase) * 0.3 + 0.7;
    const target = Math.max(4, amplitude * 60 * centerFactor * wave + 4);
    height.value = withSpring(target, { damping: 8, stiffness: 120 });
  }, [amplitude, isRecording]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animStyle,
        { opacity: isRecording ? 1 : 0.25 },
      ]}
    />
  );
}

export default function WaveformVisualizer({ amplitude, isRecording }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: NUM_BARS }).map((_, i) => (
        <Bar
          key={i}
          index={i}
          amplitude={amplitude}
          isRecording={isRecording}
          total={NUM_BARS}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 80,
    paddingHorizontal: theme.spacing.lg,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.textPrimary,
  },
});
