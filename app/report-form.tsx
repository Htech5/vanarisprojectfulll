import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, LoadingList } from '../components/RequestState';
import { api, resolveImageUri } from '../lib/api';
import { prepareUpload } from '../lib/image';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useFetch } from '../lib/useFetch';

// Central Kalimantan — same patrol area the fleet already operates in.
const KALIMANTAN_REGION = {
  latitude: -1.75,
  longitude: 113.25,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

export default function ReportForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const existing = useFetch(() => (id ? api.getFireReport(id) : Promise.resolve(null)), [id]);

  const [title, setTitle] = useState('');
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<{ uri: string; mimeType?: string | null } | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setPin({ latitude: existing.data.lat, longitude: existing.data.lng });
      setImageUri(resolveImageUri(existing.data.image));
    }
  }, [existing.data]);

  const titleError = touched && !title.trim() ? 'A short title is required' : null;
  const canSubmit = title.trim().length > 0 && pin != null && !submitting;

  const applyPickedImage = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    const prepared = await prepareUpload(asset.uri, asset.width, asset.height);
    setImageUri(prepared.uri);
    setNewImage(prepared);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      aspect: [4, 3],
      allowsEditing: true,
    });
    await applyPickedImage(result);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      aspect: [4, 3],
      allowsEditing: true,
    });
    await applyPickedImage(result);
  };

  const pickImage = () => {
    Alert.alert('Add photo', undefined, [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmit = async () => {
    setTouched(true);
    setError(null);
    if (!canSubmit || !pin) return;
    setSubmitting(true);
    try {
      const input = {
        title,
        lat: pin.latitude,
        lng: pin.longitude,
        imageUri: newImage?.uri ?? null,
        imageMimeType: newImage?.mimeType,
      };
      if (isEdit && id) await api.updateFireReport(id, input);
      else await api.createFireReport(input);
      router.back();
    } catch (err: any) {
      setError(err.message ?? 'Could not save report');
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
        <Text style={styles.title}>{isEdit ? 'Edit Report' : 'Report a Fire'}</Text>
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
            <Text style={styles.label}>What did you see? *</Text>
            <TextInput
              style={[styles.input, titleError && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Smoke near the peat canal"
              placeholderTextColor={theme.textFaint}
            />
            {titleError && <Text style={styles.fieldError}>{titleError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location *</Text>
            <Text style={styles.hint}>Tap the map to drop a pin where you spotted it.</Text>
            <View style={styles.mapWrap}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={KALIMANTAN_REGION}
                onPress={(e) => setPin(e.nativeEvent.coordinate)}
              >
                {pin && <Marker coordinate={pin} pinColor={theme.accent} />}
              </MapView>
            </View>
            {pin && (
              <Text style={styles.coords}>
                {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <Pressable
            style={[styles.submit, (!canSubmit || submitting) && styles.submitDisabled]}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Report'}
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
    hint: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: theme.textFaint, marginTop: -4 },
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
    mapWrap: {
      height: 220,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    map: { flex: 1 },
    coords: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 12, color: theme.accent },
    submit: {
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: '#ffffff' },
  });
