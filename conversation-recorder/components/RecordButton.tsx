import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  isRecording: boolean;
  onPress: () => void;
}

export default function RecordButton({ isRecording, onPress }: Props) {
  const { colors } = useTheme();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1,    { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 700 }),
          withTiming(1,   { duration: 700 })
        ),
        -1
      );
    } else {
      scale.value   = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.outer,
          pulseStyle,
          { backgroundColor: isRecording ? colors.recording : colors.textPrimary },
        ]}
      >
        <Animated.View
          style={[
            styles.inner,
            { backgroundColor: colors.background },
            isRecording && styles.innerRecording,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer:          { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  inner:          { width: 28, height: 28, borderRadius: 14 },
  innerRecording: { width: 24, height: 24, borderRadius: 4 },
});
