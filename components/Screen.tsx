import { router, usePathname } from 'expo-router';
import { ReactNode, useMemo, useRef } from 'react';
import { PanResponder, RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  /** Pull-to-refresh: pass the same `reload` you got from useFetch. */
  onRefresh?: () => void;
  refreshing?: boolean;
};

// Matches the (tabs) screen order in app/(tabs)/_layout.tsx — group segments
// don't appear in the URL, so these are the real pathnames.
const TAB_ORDER = ['/', '/drones', '/notifications', '/profile'];

export function Screen({ children, scroll = true, style, onRefresh, refreshing = false }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pathname = usePathname();
  const padding = { paddingTop: insets.top + 16, paddingBottom: 140 };

  // Swipe left/right anywhere on a tab screen to switch tabs, same as
  // tapping the navbar. Only claims the gesture once it's clearly
  // horizontal, so vertical scrolling is unaffected.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.8,
      onPanResponderRelease: (_evt, gesture) => {
        if (Math.abs(gesture.dx) < 60) return;
        const index = TAB_ORDER.indexOf(pathname);
        if (index === -1) return;
        const next = gesture.dx < 0 ? index + 1 : index - 1;
        if (next < 0 || next >= TAB_ORDER.length) return;
        router.replace(TAB_ORDER[next] as never);
      },
    })
  ).current;

  if (!scroll) {
    return (
      <View style={[styles.root, padding, style]} {...panResponder.panHandlers}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[padding, style]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingHorizontal: 20,
    },
    scroll: { flex: 1 },
  });
