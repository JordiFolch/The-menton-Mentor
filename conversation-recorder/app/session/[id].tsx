import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { Session, Segment, Speaker } from '../../types';
import { getSession, saveSession } from '../../services/StorageService';
import { reassignSegmentSpeaker } from '../../services/SpeakerService';
import SpeakerBubble from '../../components/SpeakerBubble';
import LanguageBadge from '../../components/LanguageBadge';
import RenameModal from '../../components/RenameModal';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SpeakerStats({ session }: { session: Session }) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of session.speakers) counts[sp.id] = 0;
    for (const seg of session.segments) {
      if (counts[seg.speakerId] !== undefined) counts[seg.speakerId]++;
    }
    const total = session.segments.length || 1;
    return session.speakers.map((sp) => ({
      ...sp,
      count:   counts[sp.id] ?? 0,
      percent: Math.round(((counts[sp.id] ?? 0) / total) * 100),
    }));
  }, [session]);

  if (session.speakers.length === 0) return null;

  return (
    <View style={[statStyles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[statStyles.heading, { color: colors.textSecondary }]}>ESTADÍSTIQUES</Text>
      {stats.map((sp) => (
        <View key={sp.id} style={statStyles.row}>
          <View style={[statStyles.avatar, { backgroundColor: sp.color }]}>
            <Text style={[statStyles.avatarText, { color: colors.background }]}>{sp.name[0]}</Text>
          </View>
          <View style={statStyles.barArea}>
            <View style={statStyles.barLabel}>
              <Text style={[statStyles.name, { color: colors.textPrimary }]}>{sp.name}</Text>
              <Text style={[statStyles.pct, { color: colors.textSecondary }]}>
                {sp.count} seg · {sp.percent}%
              </Text>
            </View>
            <View style={[statStyles.trackBg, { backgroundColor: colors.surfaceElevated }]}>
              <View
                style={[statStyles.trackFill, { width: `${sp.percent}%`, backgroundColor: sp.color }]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const statStyles = StyleSheet.create({
  box:        { margin: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: 1, padding: theme.spacing.md, gap: theme.spacing.sm },
  heading:    { fontSize: theme.fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  avatar:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: theme.fontSize.xs, fontWeight: '700' },
  barArea:    { flex: 1, gap: 4 },
  barLabel:   { flexDirection: 'row', justifyContent: 'space-between' },
  name:       { fontSize: theme.fontSize.sm, fontWeight: '600' },
  pct:        { fontSize: theme.fontSize.xs },
  trackBg:    { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill:  { height: 6, borderRadius: 3 },
});

export default function SessionViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [session, setSession]             = useState<Session | null>(null);
  const [renameTarget, setRenameTarget]   = useState<Speaker | null>(null);

  useEffect(() => {
    if (id) getSession(id).then(setSession);
  }, [id]);

  const handleLongPress = (segment: Segment) => {
    if (!session) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Canviar parlant', 'Quin parlant ha dit aquest text?', [
      ...session.speakers.map((sp) => ({
        text: sp.name,
        onPress: async () => {
          const updated: Session = {
            ...session,
            segments: reassignSegmentSpeaker(session.segments, segment.id, sp.id),
          };
          setSession(updated);
          await saveSession(updated);
        },
      })),
      { text: 'Cancel·lar', style: 'cancel' },
    ]);
  };

  const handleRenameSpeaker = async (newName: string) => {
    if (!session || !renameTarget) return;
    const updated: Session = {
      ...session,
      speakers: session.speakers.map((sp) =>
        sp.id === renameTarget.id ? { ...sp, name: newName } : sp
      ),
    };
    setSession(updated);
    await saveSession(updated);
    setRenameTarget(null);
  };

  const handleExport = async () => {
    if (!session) return;
    const lines = session.segments.map((seg) => {
      const sp = session.speakers.find((s) => s.id === seg.speakerId);
      return `[${sp?.name ?? 'Parlant'}] ${seg.text}`;
    });
    const content = [
      session.title,
      `Data: ${new Date(session.createdAt).toLocaleString('ca-ES')}`,
      `Durada: ${formatDuration(session.duration)}`,
      `Idioma: ${session.detectedLanguage}`,
      '',
      ...lines,
    ].join('\n');
    await Share.share({ message: content, title: session.title });
  };

  if (!session) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregant...</Text>
      </View>
    );
  }

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerMain}>
          <Text style={s.title} numberOfLines={1}>{session.title}</Text>
          <LanguageBadge locale={session.detectedLanguage} />
        </View>
        <View style={s.meta}>
          <Text style={s.metaText}>{formatDuration(session.duration)}</Text>
          <Text style={s.metaText}>·</Text>
          <Text style={s.metaText}>
            {session.segments.length} segment{session.segments.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {/* Speaker chips — tap to rename */}
        <View style={s.speakerChips}>
          {session.speakers.map((sp) => (
            <TouchableOpacity
              key={sp.id}
              style={[s.speakerChip, { borderColor: sp.color }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRenameTarget(sp);
              }}
              activeOpacity={0.7}
            >
              <View style={[s.chipDot, { backgroundColor: sp.color }]} />
              <Text style={s.chipName}>{sp.name}</Text>
              <Text style={s.chipEdit}>✎</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <SpeakerStats session={session} />
        {session.segments.map((seg) => (
          <SpeakerBubble
            key={seg.id}
            segment={seg}
            speakers={session.speakers}
            onLongPress={handleLongPress}
          />
        ))}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.exportBtn} onPress={handleExport} activeOpacity={0.75}>
          <Text style={s.exportText}>Exportar transcripció</Text>
        </TouchableOpacity>
      </View>

      <RenameModal
        visible={renameTarget !== null}
        title="Canviar nom del parlant"
        currentValue={renameTarget?.name ?? ''}
        onConfirm={handleRenameSpeaker}
        onCancel={() => setRenameTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: theme.fontSize.md },
});

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: theme.spacing.sm,
    },
    headerMain:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    title:       { flex: 1, fontSize: theme.fontSize.lg, color: colors.textPrimary, fontWeight: '600' },
    meta:        { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    metaText:    { fontSize: theme.fontSize.xs, color: colors.textSecondary },
    speakerChips:{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    speakerChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    chipDot:     { width: 8, height: 8, borderRadius: 4 },
    chipName:    { fontSize: theme.fontSize.xs, color: colors.textPrimary, fontWeight: '600' },
    chipEdit:    { fontSize: 11, color: colors.textTertiary },
    scroll:      { flex: 1 },
    scrollContent: { paddingBottom: theme.spacing.xxl, gap: 2 },
    footer:      { padding: theme.spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    exportBtn: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    exportText: { fontSize: theme.fontSize.md, color: colors.textPrimary, fontWeight: '500' },
  });
