import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DroneModel } from '../../components/DroneModel';
import { ErrorState, LoadingList } from '../../components/RequestState';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { useFetch } from '../../lib/useFetch';

export default function DroneDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const drone = useFetch(() => api.getDrone(id), [id]);
  const specs = useFetch(api.getSpecs);
  const [activeSpec, setActiveSpec] = useState(0);

  const currentSpec = specs.data?.[activeSpec];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
      </View>

      {drone.loading && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <LoadingList rows={2} />
        </View>
      )}
      {drone.error && (
        <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
          <ErrorState message={drone.error} onRetry={drone.reload} />
        </View>
      )}

      {drone.data && (
        <>
          <View style={styles.stage}>
            <DroneModel size={280} autoRotateSpeed={0.25} />
          </View>

          <Text style={styles.name}>{drone.data.name}</Text>
          <Text style={styles.tagline}>{drone.data.tagline}</Text>
          <View style={styles.statusRow}>
            <StatusBadge status={drone.data.status} />
          </View>

          <View style={styles.tabRow}>
            {specs.data?.map((spec, index) => (
              <Pressable
                key={spec.id}
                onPress={() => setActiveSpec(index)}
                style={[styles.tab, activeSpec === index && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeSpec === index && styles.tabTextActive]}>
                  {spec.title}
                </Text>
              </Pressable>
            ))}
          </View>

          {currentSpec && (
            <View style={styles.specGrid}>
              {currentSpec.items.map((item) => (
                <View key={item.label} style={styles.specCard}>
                  <Text style={styles.specValue}>{item.value}</Text>
                  <Text style={styles.specLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ paddingBottom: insets.bottom + 24 }} />
        </>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 20 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: { alignItems: 'center', marginTop: -8 },
  name: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: theme.text,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: theme.textDim,
    textAlign: 'center',
    marginTop: 4,
  },
  statusRow: { alignItems: 'center', marginTop: 10 },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: theme.accentDim },
  tabText: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: theme.textDim },
  tabTextActive: { color: theme.accent },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  specCard: {
    width: '47%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  specValue: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 18, color: theme.text },
  specLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textDim, marginTop: 4 },
});
