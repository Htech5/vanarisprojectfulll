import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordField } from '../components/PasswordField';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { useAuth } from '../lib/auth-context';
import { checkPassword } from '../lib/password';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

export default function Register() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (field: 'displayName' | 'username' | 'password') => {
    if (!touched[field]) return null;
    if (field === 'displayName' && !displayName.trim()) return 'Display name is required';
    if (field === 'username' && !username.trim()) return 'Username is required';
    if (field === 'password' && !checkPassword(password).valid) {
      return checkPassword(password).hints[0] ?? 'Password is required';
    }
    return null;
  };

  const canSubmit =
    displayName.trim() && username.trim() && checkPassword(password).valid && !submitting;

  const onSubmit = async () => {
    setTouched({ displayName: true, username: true, password: true });
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await register(username.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message ?? 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>JOIN THE FLEET</Text>
        <Text style={styles.headline}>Create your account</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.field}>
          <Text style={styles.label}>Display name *</Text>
          <TextInput
            style={[styles.input, fieldError('displayName') && styles.inputError]}
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            placeholder="Field Operator"
            placeholderTextColor={theme.textFaint}
          />
          {fieldError('displayName') && <Text style={styles.fieldError}>{fieldError('displayName')}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={[styles.input, fieldError('username') && styles.inputError]}
            value={username}
            onChangeText={setUsername}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="fieldops"
            placeholderTextColor={theme.textFaint}
          />
          {fieldError('username') && <Text style={styles.fieldError}>{fieldError('username')}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password *</Text>
          <PasswordField
            style={fieldError('password') ? styles.inputError : undefined}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="At least 8 characters"
          />
          <PasswordStrengthMeter password={password} />
          {fieldError('password') && <Text style={styles.fieldError}>{fieldError('password')}</Text>}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && { transform: [{ scale: 0.98 }] },
            !canSubmit && styles.ctaDisabled,
          ]}
          onPress={onSubmit}
        >
          <Text style={styles.ctaText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingHorizontal: 28, gap: 4 },
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
    inputError: { borderColor: theme.accent },
    fieldError: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.accent },
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
      marginTop: 8,
      marginBottom: 16,
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
