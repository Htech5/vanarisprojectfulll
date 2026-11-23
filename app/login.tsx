import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../lib/auth-context';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message ?? 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}>
        <View>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.headline}>Sign in to Vanaris</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              placeholder="fieldops"
              placeholderTextColor={theme.textFaint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <PasswordField
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
              placeholder="••••••••"
            />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              pressed && { transform: [{ scale: 0.98 }] },
              (!username || !password || submitting) && styles.ctaDisabled,
            ]}
            onPress={onSubmit}
            disabled={!username || !password || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <Text style={styles.ctaText}>Sign In</Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/register')} disabled={submitting}>
            <Text style={styles.link}>No account yet? Create one</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 28,
    },
    eyebrow: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 12,
      letterSpacing: 3,
      color: theme.accent,
      marginBottom: 8,
    },
    headline: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 30,
      color: theme.text,
      marginBottom: 32,
    },
    field: { marginBottom: 16, gap: 8 },
    label: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: theme.textDim },
    input: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      color: theme.text,
      fontFamily: 'Outfit_400Regular',
      fontSize: 15,
    },
    error: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.accent,
      marginBottom: 16,
    },
    cta: {
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaDisabled: { opacity: 0.5 },
    ctaText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: theme.bg },
    link: {
      textAlign: 'center',
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.textDim,
    },
  });
