import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const SPEAKERS_OPTIONS = [2, 3, 4];
const SPEAKERS_KEY     = '@num_speakers';
const HAPTICS_KEY      = '@haptics_enabled';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [numSpeakers,   setNumSpeakers]   = useState(2);
  const [hapticsOn,     setHapticsOn]     = useState(true);

  useEffect(() => {
    (async () => {
      const sp = await AsyncStorage.getItem(SPEAKERS_KEY);
      if (sp) setNumSpeakers(Number(sp));
      const h = await AsyncStorage.getItem(HAPTICS_KEY);
      if (h !== null) setHapticsOn(h === '1');
    })();
  }, []);

  const pickSpeakers = (n: number) => {
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNumSpeakers(n);
    AsyncStorage.setItem(SPEAKERS_KEY, String(n));
  };

  const toggleHaptics = (val: boolean) => {
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHapticsOn(val);
    AsyncStorage.setItem(HAPTICS_KEY, val ? '1' : '0');
  };

  const onToggleTheme = () => {
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleClearAll = () => {
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Eliminar totes les gravacions',
      'Aquesta acció no es pot desfer.',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        {
          text: 'Eliminar tot',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@conv_rec_sessions');
            Alert.alert('Fet', 'Totes les gravacions han estat eliminades.');
          },
        },
      ]
    );
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>

      {/* Parlants */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Parlants per sessió</Text>
        <Text style={s.sectionHint}>Nombre màxim de parlants a detectar</Text>
        <View style={s.options}>
          {SPEAKERS_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.option, numSpeakers === n && s.optionActive]}
              onPress={() => pickSpeakers(n)}
              activeOpacity={0.7}
            >
              <Text style={[s.optionText, numSpeakers === n && s.optionTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Aparença */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Aparença</Text>
        <View style={s.row}>
          <View style={s.rowLabel}>
            <Text style={s.rowTitle}>{isDark ? '🌙 Mode fosc' : '☀️ Mode clar'}</Text>
            <Text style={s.rowHint}>Canvia l'aspecte de l'app</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={onToggleTheme}
            trackColor={{ false: colors.border, true: colors.textSecondary }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      {/* Vibració */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Interacció</Text>
        <View style={s.row}>
          <View style={s.rowLabel}>
            <Text style={s.rowTitle}>Feedback hàptic</Text>
            <Text style={s.rowHint}>Vibració en accions</Text>
          </View>
          <Switch
            value={hapticsOn}
            onValueChange={toggleHaptics}
            trackColor={{ false: colors.border, true: colors.textSecondary }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      {/* Dades */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Dades</Text>
        <TouchableOpacity style={s.dangerBtn} onPress={handleClearAll} activeOpacity={0.75}>
          <Text style={s.dangerText}>Eliminar totes les gravacions</Text>
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>Conversation Recorder v1.0</Text>
        <Text style={s.footerText}>Totes les dades es guarden al dispositiu</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container:      { flex: 1, backgroundColor: colors.background, padding: theme.spacing.md, gap: theme.spacing.xl },
    section:        { gap: theme.spacing.sm },
    sectionTitle:   { fontSize: theme.fontSize.md, color: colors.textPrimary, fontWeight: '600' },
    sectionHint:    { fontSize: theme.fontSize.sm, color: colors.textSecondary, marginBottom: theme.spacing.xs },
    options:        { flexDirection: 'row', gap: theme.spacing.sm },
    option: {
      width: 52, height: 52,
      borderRadius: theme.radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionActive:   { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
    optionText:     { fontSize: theme.fontSize.lg, color: colors.textSecondary, fontWeight: '600' },
    optionTextActive:{ color: colors.background },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    rowLabel:       { gap: 2 },
    rowTitle:       { fontSize: theme.fontSize.md, color: colors.textPrimary, fontWeight: '500' },
    rowHint:        { fontSize: theme.fontSize.xs, color: colors.textSecondary },
    dangerBtn: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.danger,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    dangerText:     { fontSize: theme.fontSize.md, color: colors.danger, fontWeight: '500' },
    footer:         { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: 4 },
    footerText:     { fontSize: theme.fontSize.xs, color: colors.textTertiary },
  });
