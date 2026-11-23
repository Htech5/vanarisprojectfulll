import { StyleSheet, Text, View } from 'react-native';
import { DroneStatus } from '../lib/api';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

function statusInfo(theme: Theme): Record<DroneStatus, { label: string; color: string }> {
  return {
    patrolling: { label: 'Patrolling', color: theme.accent },
    charging: { label: 'Charging', color: '#f5b942' },
    standby: { label: 'Standby', color: theme.textDim },
    returning: { label: 'Returning', color: '#5ab0ff' },
  };
}

export function StatusBadge({ status }: { status: DroneStatus }) {
  const { theme } = useTheme();
  const info = statusInfo(theme)[status];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: 'Outfit_500Medium', fontSize: 12 },
});
