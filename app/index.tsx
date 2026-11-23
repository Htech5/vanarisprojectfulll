import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DroneModel } from '../components/DroneModel';
import { SlideToStart } from '../components/SlideToStart';
import { useAuth } from '../lib/auth-context';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MODEL_SIZE = Math.round(SCREEN_WIDTH * 1.9);

export default function Splash() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const [navigating, setNavigating] = useState(false);
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, [fade]);

  const handleStart = () => {
    // Only reveal the overlay if the next screen takes a moment to mount —
    // avoids a flash on an instant transition.
    overlayTimer.current = setTimeout(() => setNavigating(true), 180);
    router.replace(user ? '/(tabs)' : '/login');
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.brand, { opacity: fade, top: insets.top + 24 }]}>
        <Text style={styles.brandMark}>VANARIS</Text>
      </Animated.View>

      <LinearGradient
        colors={[theme.mode === 'dark' ? 'rgba(255,61,94,0.22)' : 'rgba(224,42,74,0.14)', 'transparent']}
        style={styles.glow}
        pointerEvents="none"
      />

      <View style={styles.modelStage}>
        <DroneModel
          size={MODEL_SIZE}
          autoRotateSpeed={0.5}
          swayLimit={0.16}
          baseYaw={0}
          lightColor={0xffffff}
        />
      </View>

      <Animated.View style={[styles.copy, { opacity: fade }]}>
        <Text style={styles.eyebrow}>UNMANNED AERIAL SUPPRESSION</Text>
        <Text style={styles.headline}>
          FIRST TO THE{'\n'}
          <Text style={styles.headlineAccent}>FIRELINE.</Text>
        </Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fade, paddingBottom: insets.bottom + 24 }]}>
        <SlideToStart label="Slide to start" onComplete={handleStart} />
      </Animated.View>

      {navigating && (
        <View style={styles.overlay}>
          <ActivityIndicator color={theme.text} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      overflow: 'hidden',
    },
    brand: {
      position: 'absolute',
      zIndex: 2,
    },
    brandMark: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      letterSpacing: 5,
      color: theme.text,
    },
    glow: {
      position: 'absolute',
      top: 0,
      width: SCREEN_WIDTH * 1.6,
      height: SCREEN_WIDTH * 1.6,
      borderRadius: SCREEN_WIDTH * 0.8,
      transform: [{ translateY: -SCREEN_WIDTH * 0.55 }],
    },
    modelStage: {
      width: SCREEN_WIDTH,
      height: MODEL_SIZE * 0.62,
      marginTop: 48,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    copy: {
      marginTop: 8,
      alignItems: 'flex-start',
      width: '100%',
      paddingHorizontal: 32,
    },
    eyebrow: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      letterSpacing: 3,
      color: theme.accent,
      marginBottom: 10,
    },
    headline: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 42,
      lineHeight: 44,
      letterSpacing: -1,
      color: theme.text,
      textAlign: 'left',
    },
    headlineAccent: {
      color: theme.accent,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 32,
      gap: 14,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
