import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Session } from '../types';
import { theme } from '../constants/theme';

interface Props {
  session: Session;
  onPress: () => void;
  onDelete: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function SessionCard({ session, onPress, onDelete }: Props) {
  const preview = session.segments[0]?.text ?? '(sense contingut)';
  const langLabel = session.detectedLanguage.split('-')[0].toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{langLabel}</Text>
          <Text style={styles.metaText}>{formatDuration(session.duration)}</Text>
        </View>
      </View>
      <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
        <View style={styles.speakers}>
          {session.speakers.slice(0, 4).map((sp) => (
            <View key={sp.id} style={[styles.dot, { backgroundColor: sp.color }]} />
          ))}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={12}>
          <Text style={styles.delete}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  preview: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  speakers: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  delete: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger,
  },
});
