import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth-context';
import { theme } from '../lib/theme';
import { ThemeProvider, useTheme } from '../lib/theme-context';

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigation() {
  const { theme, mode } = useTheme();
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0.3);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [mode, fade]);

  return (
    <Animated.View style={{ flex: 1, opacity: fade, backgroundColor: theme.bg }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="drone/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="drone-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="alert/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
