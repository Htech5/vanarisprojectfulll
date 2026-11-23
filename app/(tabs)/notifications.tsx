import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertRow } from '../../components/AlertRow';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingList } from '../../components/RequestState';
import { api } from '../../lib/api';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { useFetch } from '../../lib/useFetch';

export default function Notifications() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: alerts, loading, error, reload } = useFetch(api.getAlerts, [], 30000);

  return (
    <Screen onRefresh={reload} refreshing={loading && alerts != null}>
      <Text style={styles.headline}>Notifications</Text>
      <Text style={styles.subhead}>Every fire detection the fleet has reported.</Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        {loading && !alerts && <LoadingList rows={4} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && alerts?.length === 0 && (
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications yet"
            message="Fire detections from the fleet will show up here."
          />
        )}
        {alerts?.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    headline: { fontFamily: 'Outfit_700Bold', fontSize: 30, color: theme.text },
    subhead: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: theme.textDim, marginTop: 6 },
  });
