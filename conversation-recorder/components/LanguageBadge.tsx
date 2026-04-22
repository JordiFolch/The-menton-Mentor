import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { localeLabel } from '../services/LanguageService';
import { theme } from '../constants/theme';

interface Props {
  locale: string;
  detecting?: boolean;
}

export default function LanguageBadge({ locale, detecting }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {detecting ? '...' : localeLabel(locale)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
