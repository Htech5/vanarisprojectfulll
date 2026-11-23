import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  drones: 'airplane',
  reports: 'flame',
  notifications: 'notifications',
  profile: 'person',
};

function TabIcon({ name, focused, theme }: { name: string; focused: boolean; theme: Theme }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.86)).current;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.86,
      useNativeDriver: true,
      stiffness: 220,
      damping: 16,
      mass: 0.6,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View
      style={[styles.iconWrap, focused && styles.iconWrapActive, { transform: [{ scale }] }]}
    >
      <Ionicons
        name={ICONS[name] ?? 'ellipse'}
        size={focused ? 24 : 21}
        color={focused ? theme.text : theme.textFaint}
      />
    </Animated.View>
  );
}

export function PillTabBar({ state, emitter, navigateToTab }: any) {
  const insets = useSafeAreaInsets();
  const { theme, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 18 }]}>
      <BlurView intensity={48} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.pill}>
        <View style={styles.pillBorder} />
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              }}
              style={styles.tab}
              hitSlop={10}
            >
              <TabIcon name={route.name} focused={focused} theme={theme} />
            </Pressable>
          );
        })}
        <View style={styles.divider} />
        <Pressable onPress={toggle} style={styles.tab} hitSlop={10}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={21}
              color={theme.textFaint}
            />
          </View>
        </Pressable>
      </BlurView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.mode === 'dark' ? 'rgba(20,20,23,0.55)' : 'rgba(255,255,255,0.6)',
    },
    pillBorder: {
      ...StyleSheet.absoluteFill,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
    },
    tab: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: theme.accentDim,
    },
  });
