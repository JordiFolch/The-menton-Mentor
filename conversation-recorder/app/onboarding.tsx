import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🎙',
    title: 'Grava converses',
    body:  'Prem el botó per enregistrar qualsevol conversa. La transcripció es genera en temps real.',
  },
  {
    icon: '👥',
    title: 'Detecta els parlants',
    body:  "L'app identifica automàticament qui parla analitzant el to de veu. Pots corregir-ho amb un toc llarg.",
  },
  {
    icon: '📤',
    title: 'Exporta i comparteix',
    body:  'Guarda la transcripció i comparteix-la fàcilment amb qualsevol app del teu dispositiu.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('@onboarding_done', '1');
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_W }]}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.slideBody, { color: colors.textSecondary }]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === activeIndex ? colors.textPrimary : colors.border },
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
          onPress={next}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryBtnText, { color: colors.background }]}>
            {activeIndex < SLIDES.length - 1 ? 'Següent' : 'Comencem'}
          </Text>
        </TouchableOpacity>
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} hitSlop={12}>
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>Saltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
    paddingBottom: 120,
  },
  icon:        { fontSize: 72 },
  slideTitle:  { fontSize: theme.fontSize.xxl, fontWeight: '700', textAlign: 'center' },
  slideBody:   { fontSize: theme.fontSize.md, lineHeight: 24, textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: theme.spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 48,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: theme.fontSize.lg, fontWeight: '700' },
  skipText:       { fontSize: theme.fontSize.sm },
});
