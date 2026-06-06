import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { Segment, Speaker, Session } from '../types';
import {
  startRecording,
  stopRecording,
  requestAudioPermissions,
} from '../services/AudioService';
import {
  setupSpeechService,
  startListening,
  stopListening,
  switchLocale,
  destroySpeechService,
} from '../services/SpeechService';
import {
  assignSpeakers,
  clearPitchHistory,
  recordPitch,
} from '../services/SpeakerService';
import { detectLanguage } from '../services/LanguageService';
import { saveSession } from '../services/StorageService';
import WaveformVisualizer from '../components/WaveformVisualizer';
import RecordButton from '../components/RecordButton';
import SpeakerBubble from '../components/SpeakerBubble';
import LanguageBadge from '../components/LanguageBadge';

const DEFAULT_LOCALE = 'es-ES';
const NUM_SPEAKERS = 2;
const LANG_CHECK_INTERVAL = 15000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateTitle(): string {
  const now = new Date();
  return `Conversa ${now.toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
  })} ${now.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function RecordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [interimText, setInterimText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef<number>(0);
  const accTextRef = useRef('');
  const currentSegIdRef = useRef(generateId());
  const langCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const handleNewText = useCallback((text: string, isFinal: boolean) => {
    if (!isFinal) {
      setInterimText(text);
      return;
    }

    setInterimText('');
    const segId = currentSegIdRef.current;
    const newSeg: Segment = {
      id: segId,
      text,
      speakerId: `speaker-0`,
      startTime: Date.now() - startTimeRef.current,
      language: locale,
    };

    accTextRef.current += ' ' + text;
    currentSegIdRef.current = generateId();

    setSegments((prev) => {
      const updated = [...prev, newSeg];
      const { segments: assigned, speakers: spk } = assignSpeakers(
        updated,
        NUM_SPEAKERS
      );
      setSpeakers(spk);
      return assigned;
    });

    scrollRef.current?.scrollToEnd({ animated: true });
  }, [locale]);

  useEffect(() => {
    setupSpeechService(handleNewText, (err) => {
      console.warn('Speech error:', err);
    });
    return () => {
      destroySpeechService();
    };
  }, [handleNewText]);

  const checkLanguage = useCallback(() => {
    const text = accTextRef.current.trim();
    const detected = detectLanguage(text);
    if (detected && detected !== locale) {
      setLocale(detected);
      switchLocale(detected);
    }
  }, [locale]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await stopRecording();
      await stopListening();
      if (langCheckTimerRef.current) {
        clearInterval(langCheckTimerRef.current);
        langCheckTimerRef.current = null;
      }
      setIsRecording(false);
      setAmplitude(0);
    } else {
      const permitted = await requestAudioPermissions();
      if (!permitted) {
        Alert.alert('Permís denegat', 'Cal accés al micròfon per gravar.');
        return;
      }

      clearPitchHistory();
      accTextRef.current = '';
      startTimeRef.current = Date.now();
      currentSegIdRef.current = generateId();

      await startRecording(setAmplitude);
      await startListening(locale);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      langCheckTimerRef.current = setInterval(checkLanguage, LANG_CHECK_INTERVAL);
      setIsRecording(true);
    }
  };

  const handleSave = async () => {
    if (segments.length === 0) {
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const session: Session = {
      id: generateId(),
      title: generateTitle(),
      createdAt: new Date().toISOString(),
      duration,
      segments,
      speakers: speakers.length > 0
        ? speakers
        : [{ id: 'speaker-0', name: 'Parlant 1', color: theme.speakerColors[0], pitchMean: 0, pitchSamples: [] }],
      detectedLanguage: locale,
    };
    await saveSession(session);
    setIsSaving(false);
    router.replace('/');
  };

  const handleDiscard = () => {
    Alert.alert('Descartar gravació?', 'Es perdran tots els segments enregistrats.', [
      { text: 'Cancel·lar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={s.topBtn}>Descartar</Text>
        </TouchableOpacity>
        <LanguageBadge locale={locale} />
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[s.topBtn, s.topBtnSave]}>
            {isSaving ? '...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.transcript}
        contentContainerStyle={s.transcriptContent}
      >
        {segments.map((seg) => (
          <SpeakerBubble key={seg.id} segment={seg} speakers={speakers} />
        ))}
        {interimText ? (
          <View style={s.interimRow}>
            <Text style={s.interim}>{interimText}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={s.controls}>
        {isRecording && (
          <Text style={s.recordingLabel}>● GRAVANT</Text>
        )}
        <WaveformVisualizer amplitude={amplitude} isRecording={isRecording} />
        <RecordButton isRecording={isRecording} onPress={handleToggleRecord} />
        <Text style={s.hint}>
          {isRecording ? 'Prem per aturar' : 'Prem per gravar'}
        </Text>
      </View>
    </View>
  );
}

type Colors = ReturnType<typeof useTheme>['colors'];

const makeStyles = (colors: Colors) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBtn:           { fontSize: theme.fontSize.md, color: colors.textSecondary, paddingVertical: 4, paddingHorizontal: 4 },
  topBtnSave:       { color: colors.textPrimary, fontWeight: '600' },
  transcript:       { flex: 1 },
  transcriptContent:{ paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl, gap: 2 },
  interimRow:       { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs },
  interim:          { fontSize: theme.fontSize.md, color: colors.textTertiary, fontStyle: 'italic' },
  controls: {
    paddingBottom: 40,
    paddingTop: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  recordingLabel:   { fontSize: theme.fontSize.xs, color: colors.recording, fontWeight: '700', letterSpacing: 1.5 },
  hint:             { fontSize: theme.fontSize.sm, color: colors.textTertiary, marginTop: -theme.spacing.xs },
});
