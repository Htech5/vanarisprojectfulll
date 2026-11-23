import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { checkPassword } from '../lib/password';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const COLORS: Record<string, string> = {
  'Too short': '#6b6b74',
  Weak: '#ff3d5e',
  Fair: '#f5b942',
  Strong: '#3ddc84',
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!password) return null;

  const { score, label, hints } = checkPassword(password);
  const color = COLORS[label];

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i < score ? color : theme.border }]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {hints.length > 0 && (
        <Text style={styles.hint}>Needs: {hints.join(', ').toLowerCase()}</Text>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { marginTop: 8, gap: 4 },
    track: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2 },
    label: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, marginTop: 2 },
    hint: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: theme.textFaint },
  });
