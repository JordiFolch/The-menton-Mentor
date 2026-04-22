import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';

const SPEAKERS_OPTIONS = [2, 3, 4];

export default function SettingsScreen() {
  const [numSpeakers, setNumSpeakers] = useState(2);

  const handleClearAll = () => {
    Alert.alert(
      'Eliminar totes les gravacions',
      'Aquesta acció no es pot desfer.',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        {
          text: 'Eliminar tot',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Fet', 'Totes les gravacions han estat eliminades.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parlants per sessió</Text>
        <Text style={styles.sectionHint}>
          Nombre màxim de parlants a detectar en una conversa
        </Text>
        <View style={styles.options}>
          {SPEAKERS_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.option, numSpeakers === n && styles.optionActive]}
              onPress={() => setNumSpeakers(n)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, numSpeakers === n && styles.optionTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dades</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll} activeOpacity={0.75}>
          <Text style={styles.dangerText}>Eliminar totes les gravacions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Conversation Recorder v1.0</Text>
        <Text style={styles.footerText}>Totes les dades es guarden al dispositiu</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  options: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  option: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  optionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: theme.colors.background,
  },
  dangerBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.danger,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
});
