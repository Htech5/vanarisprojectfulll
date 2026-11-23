import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, LoadingList } from '../components/RequestState';
import { api, DroneStatus, resolveImageUri, uploadImage } from '../lib/api';
import { prepareUpload } from '../lib/image';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useFetch } from '../lib/useFetch';

const STATUSES: DroneStatus[] = ['patrolling', 'charging', 'standby', 'returning'];

export default function DroneForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const existing = useFetch(() => (id ? api.getDrone(id) : Promise.resolve(null)), [id]);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [badge, setBadge] = useState('');
  const [status, setStatus] = useState<DroneStatus>('standby');
  const [imageUri, setImageUri] = useState<string | null>(null);
  // Separate from imageUri (which also holds the resolved remote URL used
  // just for preview on edit) so an unchanged photo isn't re-uploaded as if
  // it were a new local file. Holds the locally compressed file until
  // submit, when it's actually uploaded to Blob storage.
  const [newImage, setNewImage] = useState<{ uri: string; mimeType: string } | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing.data) {
      setName(existing.data.name);
      setTagline(existing.data.tagline);
      setBadge(existing.data.badge ?? '');
      setStatus(existing.data.status);
      setImageUri(resolveImageUri(existing.data.image));
    }
  }, [existing.data]);

  const nameError = touched.name && !name.trim() ? 'Name is required' : null;
  const taglineError = touched.tagline && !tagline.trim() ? 'Tagline is required' : null;
  const canSubmit = name.trim().length > 0 && tagline.trim().length > 0 && !submitting;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to attach a drone image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      aspect: [4, 3],
      allowsEditing: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const prepared = await prepareUpload(asset.uri, asset.width, asset.height);
      setImageUri(prepared.uri);
      setNewImage(prepared);
    }
  };

  const onSubmit = async () => {
    setTouched({ name: true, tagline: true });
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const image = newImage ? await uploadImage(newImage.uri, newImage.mimeType) : undefined;
      const input = { name, tagline, status, badge: badge || null, image };
      if (isEdit && id) await api.updateDrone(id, input);
      else await api.createDrone(input);
      router.back();
    } catch (err: any) {
      setError(err.message ?? 'Could not save drone');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>{isEdit ? 'Edit Drone' : 'Add Drone'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {existing.loading && isEdit ? (
        <View style={{ padding: 20 }}>
          <LoadingList rows={3} />
        </View>
      ) : existing.error && isEdit ? (
        <View style={{ padding: 20 }}>
          <ErrorState message={existing.error} onRetry={existing.reload} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={28} color={theme.textFaint} />
                <Text style={styles.imagePlaceholderText}>Add photo</Text>
              </View>
            )}
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Vanaris FX-4"
              placeholderTextColor={theme.textFaint}
            />
            {nameError && <Text style={styles.fieldError}>{nameError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tagline *</Text>
            <TextInput
              style={[styles.input, taglineError && styles.inputError]}
              value={tagline}
              onChangeText={setTagline}
              onBlur={() => setTouched((t) => ({ ...t, tagline: true }))}
              placeholder="Role or description"
              placeholderTextColor={theme.textFaint}
            />
            {taglineError && <Text style={styles.fieldError}>{taglineError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Badge (optional)</Text>
            <TextInput
              style={styles.input}
              value={badge}
              onChangeText={setBadge}
              placeholder="e.g. New, Pro"
              placeholderTextColor={theme.textFaint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {STATUSES.map((value) => (
                <Pressable
                  key={value}
                  style={[styles.statusChip, status === value && styles.statusChipActive]}
                  onPress={() => setStatus(value)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      status === value && styles.statusChipTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.submit, (!canSubmit || submitting) && styles.submitDisabled]}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Drone'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
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
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: theme.text },
    body: { padding: 20, gap: 16, paddingBottom: 48 },
    imagePicker: { alignSelf: 'center' },
    imagePreview: { width: 160, height: 120, borderRadius: 18 },
    imagePlaceholder: {
      width: 160,
      height: 120,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    imagePlaceholderText: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textFaint },
    error: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: theme.accent },
    field: { gap: 8 },
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
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusChipActive: { backgroundColor: theme.accentDim, borderColor: theme.accent },
    statusChipText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.textDim,
      textTransform: 'capitalize',
    },
    statusChipTextActive: { color: theme.accent },
    submit: {
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: theme.bg },
  });
