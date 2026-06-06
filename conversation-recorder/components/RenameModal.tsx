import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  currentValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ visible, title, currentValue, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    if (visible) setValue(currentValue);
  }, [visible, currentValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
              color: colors.textPrimary,
            }]}
            value={value}
            onChangeText={setValue}
            autoFocus
            selectTextOnFocus
            maxLength={40}
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.borderLight }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel·lar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.accent, borderColor: colors.accent }]}
              onPress={() => { if (value.trim()) onConfirm(value.trim()); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, { color: colors.background }]}>Desar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  btn: {
    flex: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimary: {},
  btnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
