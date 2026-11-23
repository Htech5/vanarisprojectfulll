import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FireAlert } from '../lib/api';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { timeAgo } from '../lib/time';

function severityColor(theme: Theme): Record<FireAlert['severity'], string> {
  return { low: '#f5b942', moderate: '#ff8a3d', high: theme.accent };
}

export function AlertRow({ alert }: { alert: FireAlert }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/alert/${alert.id}`)}
    >
      <Image source={{ uri: alert.image }} style={styles.thumb} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: severityColor(theme)[alert.severity] }]} />
          <Text style={styles.title}>{alert.title}</Text>
        </View>
        <Text style={styles.meta}>
          {alert.lat.toFixed(3)}, {alert.lng.toFixed(3)} · {timeAgo(alert.detectedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 10,
    },
    pressed: { opacity: 0.85 },
    thumb: { width: 56, height: 56, borderRadius: 12 },
    body: { flex: 1, justifyContent: 'center', gap: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: theme.text },
    meta: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: theme.textDim },
  });
