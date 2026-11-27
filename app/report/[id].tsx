import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, LoadingList } from '../../components/RequestState';
import { api, resolveImageUri } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { timeAgo } from '../../lib/time';
import { useFetch } from '../../lib/useFetch';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { data: report, loading, error, reload } = useFetch(() => api.getFireReport(id), [id], {
    reloadOnFocus: true,
  });

  const isOwner = report && user && report.userId === user.id;
  const imageUri = resolveImageUri(report?.image);

  const confirmDelete = () => {
    if (!report) return;
    Alert.alert('Delete report', 'Remove this fire report permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteFireReport(report.id);
            router.back();
          } catch (err: any) {
            Alert.alert('Could not delete', err.message ?? 'Something went wrong');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        {isOwner && (
          <View style={styles.headerActions}>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.push(`/report-form?id=${report.id}`)}
            >
              <Ionicons name="pencil" size={16} color={theme.text} />
            </Pressable>
            <Pressable style={styles.backBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color={theme.accent} />
            </Pressable>
          </View>
        )}
      </View>

      {loading && !report && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <LoadingList rows={2} />
        </View>
      )}
      {error && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      )}

      {report && (
        <>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="flame" size={36} color={theme.accent} />
            </View>
          )}
          <View style={styles.body}>
            <Text style={styles.title}>{report.title}</Text>
            <Text style={styles.meta}>Reported {timeAgo(report.createdAt)}</Text>

            <View style={styles.mapWrap}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                pointerEvents="none"
                initialRegion={{
                  latitude: report.lat,
                  longitude: report.lng,
                  latitudeDelta: 0.6,
                  longitudeDelta: 0.6,
                }}
              >
                <Marker coordinate={{ latitude: report.lat, longitude: report.lng }} pinColor={theme.accent} />
              </MapView>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={theme.textDim} />
              <Text style={styles.infoText}>
                {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
              </Text>
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
    header: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 1,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerActions: { flexDirection: 'row', gap: 8 },
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
    imagePlaceholder: {
      backgroundColor: theme.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { padding: 20, gap: 10 },
    title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: theme.text },
    meta: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: theme.textDim },
    mapWrap: {
      height: 160,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 10,
    },
    map: { flex: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    infoText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: theme.text },
  });
