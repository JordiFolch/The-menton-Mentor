import React, { useEffect, useState } from 'react';
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
import { theme } from '../../constants/theme';
import { Session, Segment, Speaker } from '../../types';
import { getSession } from '../../services/StorageService';
import { reassignSegmentSpeaker } from '../../services/SpeakerService';
import { saveSession } from '../../services/StorageService';
import SpeakerBubble from '../../components/SpeakerBubble';
import LanguageBadge from '../../components/LanguageBadge';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SessionViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (id) getSession(id).then(setSession);
  }, [id]);

  const handleLongPress = (segment: Segment) => {
    if (!session) return;
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
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregant...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
          <LanguageBadge locale={session.detectedLanguage} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDuration(session.duration)}</Text>
          <Text style={styles.metaText}>·</Text>
          <Text style={styles.metaText}>
            {session.segments.length} segment{session.segments.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.metaText}>·</Text>
          <View style={styles.speakerDots}>
            {session.speakers.map((sp) => (
              <View key={sp.id} style={[styles.dot, { backgroundColor: sp.color }]} />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {session.segments.map((seg) => (
          <SpeakerBubble
            key={seg.id}
            segment={seg}
            speakers={session.speakers}
            onLongPress={handleLongPress}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.75}>
          <Text style={styles.exportText}>Exportar transcripció</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  speakerDots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: theme.spacing.md,
    gap: 2,
    paddingBottom: theme.spacing.xxl,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exportBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  exportText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
});
