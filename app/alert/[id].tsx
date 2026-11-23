import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, LoadingList } from '../../components/RequestState';
import { api, FireAlert, resolveImageUri } from '../../lib/api';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { timeAgo } from '../../lib/time';
import { useFetch } from '../../lib/useFetch';

const SEVERITY_LABEL: Record<FireAlert['severity'], string> = {
  low: 'Low severity',
  moderate: 'Moderate severity',
  high: 'High severity',
};

export default function AlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: alert, loading, error, reload } = useFetch(() => api.getAlert(id), [id]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
      </View>

      {loading && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <LoadingList rows={2} />
        </View>
      )}
      {error && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      )}

      {alert && (
        <>
          <Image source={{ uri: resolveImageUri(alert.image) ?? undefined }} style={styles.image} />
          <View style={styles.body}>
            <Text style={styles.severity}>{SEVERITY_LABEL[alert.severity].toUpperCase()}</Text>
            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.meta}>Detected {timeAgo(alert.detectedAt)}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={theme.textDim} />
              <Text style={styles.infoText}>
                {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="airplane-outline" size={16} color={theme.textDim} />
              <Text style={styles.infoText}>Reported by {alert.droneName}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { position: 'absolute', left: 0, zIndex: 1, paddingHorizontal: 20 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,23,0.7)',
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: 320 },
  body: { padding: 20, gap: 10 },
  severity: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: theme.accent,
  },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: theme.text },
  meta: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: theme.textDim },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  infoText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: theme.text },
});
