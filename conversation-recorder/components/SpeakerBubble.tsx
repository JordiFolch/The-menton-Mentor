import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Segment, Speaker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  segment:     Segment;
  speakers:    Speaker[];
  onLongPress?: (segment: Segment) => void;
}

export default function SpeakerBubble({ segment, speakers, onLongPress }: Props) {
  const { colors } = useTheme();
  const speaker = speakers.find((s) => s.id === segment.speakerId) ?? speakers[0];
  const isFirst = speaker?.id === speakers[0]?.id;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(segment);
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.75}
      style={[styles.row, isFirst ? styles.rowLeft : styles.rowRight]}
    >
      <View style={[styles.avatar, { backgroundColor: speaker?.color ?? colors.textSecondary }]}>
        <Text style={[styles.avatarText, { color: colors.background }]}>
          {(speaker?.name ?? 'P')[0]}
        </Text>
      </View>
      <View style={[styles.bubble, {
        backgroundColor: colors.surface,
        borderColor: speaker?.color ?? colors.border,
      }]}>
        <Text style={[styles.speakerName, { color: colors.textSecondary }]}>
          {speaker?.name ?? 'Parlant'}
        </Text>
        <Text style={[styles.text, { color: colors.textPrimary }]}>{segment.text}</Text>
        {segment.language && (
          <Text style={[styles.lang, { color: colors.textTertiary }]}>
            {segment.language.split('-')[0].toUpperCase()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-start', marginVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm },
  rowLeft:      { flexDirection: 'row' },
  rowRight:     { flexDirection: 'row-reverse' },
  avatar:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avatarText:   { fontSize: theme.fontSize.sm, fontWeight: '700' },
  bubble:       { maxWidth: '75%', borderRadius: theme.radius.md, borderWidth: 1, padding: theme.spacing.sm, gap: 2 },
  speakerName:  { fontSize: theme.fontSize.xs, fontWeight: '600', marginBottom: 2 },
  text:         { fontSize: theme.fontSize.md, lineHeight: 21 },
  lang:         { fontSize: theme.fontSize.xs, marginTop: 4, alignSelf: 'flex-end' },
});
