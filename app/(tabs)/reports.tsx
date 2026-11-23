import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingList } from '../../components/RequestState';
import { api, FireReport, resolveImageUri } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { useFetch } from '../../lib/useFetch';
import { timeAgo } from '../../lib/time';

function ReportRow({ report, mine }: { report: FireReport; mine: boolean }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const imageUri = resolveImageUri(report.image);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/report/${report.id}`)}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="flame" size={24} color={theme.accent} />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.meta}>
          {report.lat.toFixed(3)}, {report.lng.toFixed(3)} · {timeAgo(report.createdAt)}
        </Text>
        {mine && <Text style={styles.mineTag}>Your report</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textFaint} />
    </Pressable>
  );
}

export default function Reports() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { data: reports, loading, error, reload } = useFetch(api.getFireReports);

  return (
    <Screen onRefresh={reload} refreshing={loading && reports != null}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headline}>Fire Reports</Text>
          <Text style={styles.subhead}>Spotted a hotspot? Mark it on the map.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => router.push('/report-form')}>
          <Ionicons name="add" size={22} color={theme.bg} />
        </Pressable>
      </View>

      <View style={{ marginTop: 20, gap: 12 }}>
        {loading && !reports && <LoadingList rows={5} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && reports?.length === 0 && (
          <EmptyState
            icon="flame-outline"
            title="No reports yet"
            message="Be the first to report a fire sighting."
          />
        )}
        {reports?.map((report) => (
          <ReportRow key={report.id} report={report} mine={report.userId === user?.id} />
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headline: { fontFamily: 'Outfit_700Bold', fontSize: 30, color: theme.text },
    subhead: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: theme.textDim, marginTop: 6 },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    pressed: { opacity: 0.85 },
    thumb: { width: 64, height: 64, borderRadius: 16 },
    thumbPlaceholder: {
      backgroundColor: theme.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1, justifyContent: 'center', gap: 3 },
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: theme.text },
    meta: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textDim },
    mineTag: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: theme.accent, marginTop: 2 },
  });
