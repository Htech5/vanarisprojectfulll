import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PasswordField } from '../../components/PasswordField';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { Screen } from '../../components/Screen';
import { resolveImageUri } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { checkPassword } from '../../lib/password';
import { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

export default function Profile() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, logout, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [password, setPassword] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is needed to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      aspect: [1, 1],
      allowsEditing: true,
    });
    if (result.canceled) return;
    setAvatarUploading(true);
    try {
      await updateProfile({
        avatarUri: result.assets[0].uri,
        avatarMimeType: result.assets[0].mimeType,
      });
    } catch (err: any) {
      Alert.alert('Could not update photo', err.message ?? 'Something went wrong');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveName = async () => {
    setNameError(null);
    if (!displayName.trim()) {
      setNameError('Display name cannot be empty');
      return;
    }
    setNameSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
    } catch (err: any) {
      setNameError(err.message ?? 'Could not save name');
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordError(null);
    const check = checkPassword(password);
    if (!check.valid) {
      setPasswordError(check.hints[0]);
      return;
    }
    setPasswordSaving(true);
    try {
      await updateProfile({ password });
      setPassword('');
    } catch (err: any) {
      setPasswordError(err.message ?? 'Could not save password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Sign out', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const avatarUri = resolveImageUri(user?.avatar);
  const nameChanged = displayName.trim() !== (user?.displayName ?? '') && displayName.trim().length > 0;

  return (
    <Screen>
      <Pressable style={styles.avatarWrap} onPress={pickAvatar} disabled={avatarUploading}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={theme.accent} />
          </View>
        )}
        <View style={styles.avatarBadge}>
          <Ionicons name={avatarUploading ? 'hourglass-outline' : 'camera'} size={14} color={theme.bg} />
        </View>
      </Pressable>
      <Text style={styles.username}>@{user?.username ?? 'unknown'}</Text>

      <Text style={styles.sectionLabel}>Display name</Text>
      <View style={styles.editRow}>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor={theme.textFaint}
        />
        <Pressable
          style={[styles.saveBtn, !nameChanged && styles.saveBtnDisabled]}
          onPress={saveName}
          disabled={!nameChanged || nameSaving}
        >
          <Text style={styles.saveBtnText}>{nameSaving ? '…' : 'Save'}</Text>
        </Pressable>
      </View>
      {nameError && <Text style={styles.fieldError}>{nameError}</Text>}

      <Text style={styles.sectionLabel}>Change password</Text>
      <PasswordField
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
      />
      <PasswordStrengthMeter password={password} />
      {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
      <Pressable
        style={[styles.updatePasswordBtn, !checkPassword(password).valid && styles.saveBtnDisabled]}
        onPress={savePassword}
        disabled={!checkPassword(password).valid || passwordSaving}
      >
        <Text style={styles.updatePasswordText}>
          {passwordSaving ? 'Updating…' : 'Update password'}
        </Text>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={theme.accent} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    avatarWrap: { alignSelf: 'center', marginBottom: 10 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: { width: 88, height: 88, borderRadius: 44 },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.bg,
    },
    username: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: theme.textDim,
      textAlign: 'center',
      marginBottom: 8,
    },
    sectionLabel: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 13,
      color: theme.textDim,
      marginTop: 24,
      marginBottom: 10,
    },
    editRow: { flexDirection: 'row', gap: 10 },
    input: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      color: theme.text,
      fontFamily: 'Outfit_400Regular',
      fontSize: 15,
    },
    saveBtn: {
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: theme.bg },
    fieldError: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.accent, marginTop: 6 },
    updatePasswordBtn: {
      marginTop: 12,
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    updatePasswordText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: theme.bg },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 32,
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    logoutText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: theme.accent },
  });
