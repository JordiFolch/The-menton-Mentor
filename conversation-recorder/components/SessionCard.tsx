import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  session:  Session;
  onPress:  () => void;
  onDelete: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ca-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function SessionCard({ session, onPress, onDelete }: Props) {
  const { colors } = useTheme();
  const preview   = session.segments[0]?.text ?? '(sense contingut)';
  const langLabel = session.detectedLanguage.split('-')[0].toUpperCase();

  const s = makeStyles(colors);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.header}>
        <Text style={s.title} numberOfLines={1}>{session.title}</Text>
        <View style={s.meta}>
          <Text style={s.metaText}>{langLabel}</Text>
          <Text style={s.metaText}>{formatDuration(session.duration)}</Text>
        </View>
      </View>
      <Text style={s.preview} numberOfLines={2}>{preview}</Text>
      <View style={s.footer}>
        <Text style={s.date}>{formatDate(session.createdAt)}</Text>
        <View style={s.speakers}>
          {session.speakers.slice(0, 4).map((sp) => (
            <View key={sp.id} style={[s.dot, { backgroundColor: sp.color }]} />
          ))}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={12}>
          <Text style={s.delete}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius:    theme.radius.md,
      padding:         theme.spacing.md,
      marginHorizontal: theme.spacing.md,
      marginVertical:  theme.spacing.xs,
      borderWidth:     1,
      borderColor:     colors.border,
      gap:             theme.spacing.sm,
    },
    header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
    title:    { flex: 1, fontSize: theme.fontSize.lg, color: colors.textPrimary, fontWeight: '600' },
    meta:     { flexDirection: 'row', gap: theme.spacing.sm },
    metaText: {
      fontSize:        theme.fontSize.xs,
      color:           colors.textSecondary,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius:    theme.radius.sm,
    },
    preview:  { fontSize: theme.fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
    footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    date:     { fontSize: theme.fontSize.xs, color: colors.textTertiary },
    speakers: { flexDirection: 'row', gap: 4 },
    dot:      { width: 8, height: 8, borderRadius: 4 },
    delete:   { fontSize: theme.fontSize.xs, color: colors.danger },
  });
