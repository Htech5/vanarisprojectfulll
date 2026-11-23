import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ErrorState, LoadingList } from '../components/RequestState';
import { api, resolveImageUri, uploadImage } from '../lib/api';
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
  const [newImage, setNewImage] = useState<{ uri: string; mimeType: string } | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
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
    setPhotoSheetVisible(false);
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
    setPhotoSheetVisible(false);
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

  const onSubmit = async () => {
    setTouched(true);
    setError(null);
    if (!canSubmit || !pin) return;
    setSubmitting(true);
    try {
      const image = newImage ? await uploadImage(newImage.uri, newImage.mimeType) : undefined;
      const input = { title, lat: pin.latitude, lng: pin.longitude, image };
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
          <Pressable style={styles.imagePicker} onPress={() => setPhotoSheetVisible(true)}>
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

      <Modal
        visible={photoSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setPhotoSheetVisible(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add photo</Text>

            <Pressable style={styles.sheetOption} onPress={takePhoto}>
              <View style={styles.sheetIcon}>
                <Ionicons name="camera" size={20} color={theme.accent} />
              </View>
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable style={styles.sheetOption} onPress={pickFromLibrary}>
              <View style={styles.sheetIcon}>
                <Ionicons name="images" size={20} color={theme.accent} />
              </View>
              <Text style={styles.sheetOptionText}>Choose from Library</Text>
            </Pressable>

            <Pressable style={styles.sheetCancel} onPress={() => setPhotoSheetVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 4,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    sheetTitle: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: theme.text,
      marginBottom: 8,
    },
    sheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
    },
    sheetIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetOptionText: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: theme.text },
    sheetCancel: {
      marginTop: 8,
      paddingVertical: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    sheetCancelText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: theme.textDim },
  });
