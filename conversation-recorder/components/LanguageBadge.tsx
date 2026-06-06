import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { localeLabel } from '../services/LanguageService';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  locale:     string;
  detecting?: boolean;
}

export default function LanguageBadge({ locale, detecting }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {detecting ? '...' : localeLabel(locale)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius:     theme.radius.sm,
    borderWidth:      1,
    paddingHorizontal: 8,
    paddingVertical:  3,
  },
  text: {
    fontSize:     theme.fontSize.xs,
    fontWeight:   '600',
    letterSpacing: 0.5,
  },
});
