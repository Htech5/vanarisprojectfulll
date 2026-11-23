import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Telemetry } from '../lib/api';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

function batteryIcon(pct: number): keyof typeof Ionicons.glyphMap {
  if (pct > 80) return 'battery-full';
  if (pct > 40) return 'battery-half';
  return 'battery-dead';
}

export function TelemetryCard({ telemetry }: { telemetry: Telemetry }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const waterPct = telemetry.water.current / telemetry.water.max;

  return (
    <View style={styles.card}>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE TELEMETRY · {telemetry.droneName.toUpperCase()}</Text>
      </View>

      <Text style={styles.position}>
        {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}
      </Text>
      <Text style={styles.positionSub}>
        {Math.round(telemetry.altitude)} m alt · {Math.round(telemetry.speed)} km/h
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name={batteryIcon(telemetry.battery)} size={18} color={theme.accent} />
          <Text style={styles.statValue}>{Math.round(telemetry.battery)}%</Text>
          <Text style={styles.statLabel}>Battery</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="water" size={18} color={theme.accent} />
          <Text style={styles.statValue}>
            {telemetry.water.current.toFixed(1)}
            <Text style={styles.statUnit}> / {telemetry.water.max}{telemetry.water.unit}</Text>
          </Text>
          <Text style={styles.statLabel}>Water capacity</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.max(4, waterPct * 100)}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent },
    liveText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 11,
      letterSpacing: 1.5,
      color: theme.textDim,
    },
    position: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 18, color: theme.text },
    positionSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textDim, marginTop: 2 },
    statsRow: { flexDirection: 'row', marginTop: 16, gap: 16 },
    stat: { flex: 1, gap: 2 },
    statDivider: { width: 1, backgroundColor: theme.border },
    statValue: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 16, color: theme.text, marginTop: 4 },
    statUnit: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.textDim },
    statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: theme.textDim },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      marginTop: 14,
      overflow: 'hidden',
    },
    trackFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 2 },
  });
