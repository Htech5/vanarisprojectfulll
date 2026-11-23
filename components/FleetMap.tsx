import { useMemo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { Telemetry } from '../lib/api';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const KALIMANTAN_REGION = {
  latitude: -1.75,
  longitude: 113.25,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#14141a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a9aa2' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0c' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a3a42' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1420' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#17171d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f3f3f0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b5b63' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#c6c6c2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe0e8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#eaeae5' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export function FleetMap({ telemetry, height = 260 }: { telemetry: Telemetry[]; height?: number }) {
  const { theme, mode } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={KALIMANTAN_REGION}
        customMapStyle={mode === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {telemetry.map((t) => (
          <Marker key={t.droneId} coordinate={{ latitude: t.lat, longitude: t.lng }}>
            <View style={styles.pin}>
              <View style={styles.pinDot} />
            </View>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>{t.droneName}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    pin: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.accent,
    },
    callout: {
      alignSelf: 'center',
      marginTop: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: theme.mode === 'dark' ? 'rgba(10,10,12,0.85)' : 'rgba(255,255,255,0.9)',
    },
    calloutText: { fontFamily: 'Outfit_500Medium', fontSize: 10, color: theme.text },
  });
