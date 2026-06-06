import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={12}>
      <Text style={[styles.settingsBtn, { color: colors.textSecondary }]}>⚙</Text>
    </TouchableOpacity>
  );
}

function AppStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle:       { backgroundColor: colors.background },
          headerTintColor:   colors.textPrimary,
          headerShadowVisible: false,
          headerBackTitle:   '',
          contentStyle:      { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Converses', headerRight: () => <SettingsButton /> }}
        />
        <Stack.Screen name="record"       options={{ title: 'Nova gravació' }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Transcripció' }} />
        <Stack.Screen name="settings"     options={{ title: 'Configuració' }} />
        <Stack.Screen name="onboarding"   options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  settingsBtn: { fontSize: 20, paddingRight: 4 },
});
