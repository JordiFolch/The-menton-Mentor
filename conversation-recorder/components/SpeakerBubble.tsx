import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Segment, Speaker } from '../types';
import { theme } from '../constants/theme';

interface Props {
  segment: Segment;
  speakers: Speaker[];
  onLongPress?: (segment: Segment) => void;
}

export default function SpeakerBubble({ segment, speakers, onLongPress }: Props) {
  const speaker = speakers.find((s) => s.id === segment.speakerId) ?? speakers[0];
  const isFirst = speaker?.id === speakers[0]?.id;

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress?.(segment)}
      activeOpacity={0.75}
      style={[styles.row, isFirst ? styles.rowLeft : styles.rowRight]}
    >
      <View style={[styles.avatar, { backgroundColor: speaker?.color ?? theme.colors.textSecondary }]}>
        <Text style={styles.avatarText}>
          {(speaker?.name ?? 'P')[0]}
        </Text>
      </View>
      <View style={[styles.bubble, { borderColor: speaker?.color ?? theme.colors.border }]}>
        <Text style={styles.speakerName}>{speaker?.name ?? 'Parlant'}</Text>
        <Text style={styles.text}>{segment.text}</Text>
        {segment.language && (
          <Text style={styles.lang}>{segment.language.split('-')[0].toUpperCase()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
  },
  rowRight: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '75%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
    gap: 2,
  },
  speakerName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 21,
  },
  lang: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
