import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={12}>
      <Text style={styles.settingsBtn}>⚙</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingsBtn: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    paddingRight: 4,
  },
});

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          headerBackTitle: '',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Converses', headerRight: () => <SettingsButton /> }}
        />
        <Stack.Screen name="record" options={{ title: 'Nova gravació' }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Transcripció' }} />
        <Stack.Screen name="settings" options={{ title: 'Configuració' }} />
      </Stack>
    </>
  );
}
