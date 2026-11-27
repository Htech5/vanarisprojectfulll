import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useTheme } from '../lib/theme-context';

type Props = {
  title: string;
  topInset: number;
  onClose: () => void;
};

export function SaveSuccessModal({ title, topInset, onClose }: Props) {
  const { theme } = useTheme();
  const progress = useAnimatedValue(0);
  const closing = useRef(false);

  const onShow = async () => {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => true);
    if (closing.current) return;
    if (reduceMotion) {
      progress.setValue(1);
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    AccessibilityInfo.announceForAccessibility(title);
  };

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    onClose();
  };

  return (
    <Modal transparent statusBarTranslucent onShow={onShow} onRequestClose={close}>
      <View style={[styles.backdrop, { paddingTop: topInset + 16 }]} accessibilityViewIsModal>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderStrong,
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-96, 0] }) }],
            },
          ]}
        >
          <View style={styles.heading}>
            <View style={[styles.icon, { backgroundColor: theme.accentDim }]}>
              <Ionicons name="checkmark" size={22} color={theme.text} />
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
              {title}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: theme.bg }]}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.48)' },
  card: { width: '100%', maxWidth: 480, borderRadius: 18, borderWidth: 1, padding: 16, gap: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  button: { minHeight: 48, padding: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
});
