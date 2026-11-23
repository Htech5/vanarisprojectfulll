import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertRow } from '../../components/AlertRow';
import { FleetMap } from '../../components/FleetMap';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingList } from '../../components/RequestState';
import { TelemetryCard } from '../../components/TelemetryCard';
import { api } from '../../lib/api';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { useFetch } from '../../lib/useFetch';

export default function Home() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const telemetry = useFetch(api.getTelemetry, [], 3000);
  const alerts = useFetch(api.getAlerts, [], 30000);

  // The native map view is expensive to mount (react-native-maps); deferring
  // it until the tab-switch/navigation animation finishes keeps that
  // transition itself smooth instead of janking while the map initializes.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMapReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const refresh = () => {
    telemetry.reload();
    alerts.reload();
  };

  return (
    <Screen onRefresh={refresh} refreshing={telemetry.loading && alerts.loading && !telemetry.data}>
      <Text style={styles.eyebrow}>VANARIS FIELD UNITS</Text>
      <Text style={styles.headline}>Suppression{'\n'}in the air, first.</Text>

      <View style={styles.mapWrap}>
        {mapReady && telemetry.data && telemetry.data.length > 0 && (
          <FleetMap telemetry={telemetry.data} />
        )}
      </View>

      <Text style={styles.sectionLabel}>Live telemetry</Text>
      {telemetry.loading && !telemetry.data && <LoadingList rows={2} />}
      {telemetry.error && <ErrorState message={telemetry.error} onRetry={telemetry.reload} />}
      {telemetry.data?.length === 0 && (
        <EmptyState
          icon="airplane-outline"
          title="No drones reporting"
          message="Add a drone to the fleet to see it here."
        />
      )}
      <View style={{ gap: 12 }}>
        {telemetry.data?.map((t) => (
          <TelemetryCard key={t.droneId} telemetry={t} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Fire detection feed</Text>
      {alerts.loading && !alerts.data && <LoadingList rows={2} />}
      {alerts.error && <ErrorState message={alerts.error} onRetry={alerts.reload} />}
      {alerts.data?.length === 0 && (
        <EmptyState
          icon="flame-outline"
          title="No fires detected"
          message="The fleet is patrolling with a clear feed."
        />
      )}
      <View style={{ gap: 10 }}>
        {alerts.data?.slice(0, 4).map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    eyebrow: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 12,
      letterSpacing: 3,
      color: theme.accent,
      marginBottom: 8,
    },
    headline: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -0.5,
      color: theme.text,
    },
    mapWrap: { marginVertical: 16 },
    sectionLabel: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 13,
      color: theme.textDim,
      marginTop: 28,
      marginBottom: 12,
    },
  });
