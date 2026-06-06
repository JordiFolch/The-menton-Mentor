import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { Session } from '../types';
import { loadSessions, deleteSession } from '../services/StorageService';
import SessionCard from '../components/SessionCard';

const LANG_FILTERS = ['Tots', 'CA', 'ES', 'EN', 'FR', 'DE', 'IT'];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [onboarded, setOnboarded]   = useState<boolean | null>(null);
  const [query, setQuery]           = useState('');
  const [langFilter, setLangFilter] = useState('Tots');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const done = await AsyncStorage.getItem('@onboarding_done');
        setOnboarded(!!done);
        setSessions(await loadSessions());
      })();
    }, [])
  );

  const filtered = useMemo(() => {
    let list = sessions;
    if (langFilter !== 'Tots') {
      list = list.filter((s) =>
        s.detectedLanguage.toUpperCase().startsWith(langFilter)
      );
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.segments.some((seg) => seg.text.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sessions, query, langFilter]);

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Eliminar sessió',
      'Segur que vols eliminar aquesta gravació?',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
          },
        },
      ]
    );
  };

  if (onboarded === null) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Converses</Text>
              <Text style={styles.subtitle}>
                {sessions.length === 0
                  ? 'Comença la primera gravació'
                  : `${sessions.length} gravació${sessions.length !== 1 ? 'ns' : ''}`}
              </Text>
            </View>
            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca..."
                placeholderTextColor={colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>
            {/* Language filters */}
            <View style={styles.filters}>
              {LANG_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.chip,
                    langFilter === f && styles.chipActive,
                    langFilter === f && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLangFilter(f);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, langFilter === f && { color: colors.background }]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎙</Text>
            <Text style={styles.emptyText}>
              {query || langFilter !== 'Tots' ? 'Cap resultat' : 'Cap gravació encara'}
            </Text>
            <Text style={styles.emptyHint}>
              {query || langFilter !== 'Tots' ? 'Prova altres filtres' : 'Prem el botó + per gravar'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() => router.push(`/session/${item.id}`)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.textPrimary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/record');
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { color: colors.background }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background },
    list:        { paddingBottom: 100 },
    header:      { gap: theme.spacing.sm, paddingTop: theme.spacing.lg },
    titleRow:    { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xs },
    title:       { fontSize: theme.fontSize.xxl, color: colors.textPrimary, fontWeight: '700' },
    subtitle:    { fontSize: theme.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
    searchRow:   { paddingHorizontal: theme.spacing.md },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius:    theme.radius.md,
      borderWidth:     1,
      borderColor:     colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical:   10,
      fontSize:        theme.fontSize.md,
      color:           colors.textPrimary,
    },
    filters: {
      flexDirection:   'row',
      paddingHorizontal: theme.spacing.md,
      gap:             theme.spacing.xs,
      flexWrap:        'wrap',
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical:   6,
      borderRadius:      theme.radius.full,
      backgroundColor:   colors.surface,
      borderWidth:       1,
      borderColor:       colors.border,
    },
    chipActive:  { borderColor: colors.accent },
    chipText:    { fontSize: theme.fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
    empty: {
      alignItems: 'center',
      paddingTop: 60,
      gap: theme.spacing.sm,
    },
    emptyIcon:  { fontSize: 48, marginBottom: theme.spacing.md },
    emptyText:  { fontSize: theme.fontSize.lg, color: colors.textSecondary, fontWeight: '500' },
    emptyHint:  { fontSize: theme.fontSize.sm, color: colors.textTertiary },
    fab: {
      position:     'absolute',
      bottom:       40,
      right:        24,
      width:        60,
      height:       60,
      borderRadius: 30,
      alignItems:   'center',
      justifyContent: 'center',
      shadowColor:  '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius:  8,
      elevation:     6,
    },
    fabText: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  });
