import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

export function LoadingList({ rows = 3 }: { rows?: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={32} color={theme.textFaint} />
      <Text style={styles.title}>Could not reach the API</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.retry} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={32} color={theme.textFaint} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    skeleton: {
      height: 92,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    center: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    title: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: theme.text,
      marginTop: 4,
    },
    message: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.textDim,
      textAlign: 'center',
    },
    retry: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    retryText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.text,
    },
  });
