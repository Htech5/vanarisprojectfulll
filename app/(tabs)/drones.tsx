import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PaginatedList } from '../../components/PaginatedList';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingList } from '../../components/RequestState';
import { StatusBadge } from '../../components/StatusBadge';
import { api, Drone, resolveImageUri } from '../../lib/api';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { useFetch } from '../../lib/useFetch';

function DroneRow({ drone, onDeleted }: { drone: Drone; onDeleted: () => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const imageUri = resolveImageUri(drone.image);

  const confirmDelete = () => {
    Alert.alert('Remove drone', `Delete ${drone.name} from the fleet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDrone(drone.id);
            onDeleted();
          } catch (err: any) {
            Alert.alert('Could not delete', err.message ?? 'Something went wrong');
          }
        },
      },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/drone/${drone.id}`)}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="airplane" size={26} color={theme.textFaint} />
        </View>
      )}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{drone.name}</Text>
          {drone.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{drone.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.tagline}>{drone.tagline}</Text>
        <View style={{ marginTop: 2 }}>
          <StatusBadge status={drone.status} />
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          hitSlop={8}
          style={styles.actionBtn}
          onPress={() => router.push(`/drone-form?id=${drone.id}`)}
        >
          <Ionicons name="pencil" size={16} color={theme.textDim} />
        </Pressable>
        <Pressable hitSlop={8} style={styles.actionBtn} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={16} color={theme.accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function Drones() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: drones, loading, error, reload } = useFetch(api.getDrones, [], { reloadOnFocus: true });

  return (
    <Screen onRefresh={reload} refreshing={loading && drones != null}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headline}>Fleet</Text>
          <Text style={styles.subhead}>Pick a unit to view specs and 3D model.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => router.push('/drone-form')}>
          <Ionicons name="add" size={22} color={theme.bg} />
        </Pressable>
      </View>

      <View style={{ marginTop: 20, gap: 14 }}>
        {loading && !drones && <LoadingList rows={5} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && drones?.length === 0 && (
          <EmptyState icon="airplane-outline" title="No units yet" message="Add your first drone to the fleet." />
        )}
        {drones && (
          <PaginatedList
            items={drones}
            renderItem={(drone) => <DroneRow key={drone.id} drone={drone} onDeleted={reload} />}
          />
        )}
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
      backgroundColor: theme.text,
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
    thumb: { width: 72, height: 72, borderRadius: 16 },
    thumbPlaceholder: {
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1, justifyContent: 'center', gap: 3 },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: theme.text },
    badge: {
      backgroundColor: theme.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    badgeText: { fontFamily: 'Outfit_500Medium', fontSize: 10, color: '#ffffff' },
    tagline: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textDim },
    rowActions: { gap: 8 },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
    },
  });
