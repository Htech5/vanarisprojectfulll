import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Theme } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

/** Password TextInput with an Instagram-style show/hide toggle. */
export function PasswordField(props: TextInputProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        style={[styles.input, props.style]}
        secureTextEntry={!visible}
        placeholderTextColor={theme.textFaint}
      />
      <Pressable
        style={styles.toggle}
        hitSlop={10}
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color={theme.textDim} />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { position: 'relative', justifyContent: 'center' },
    input: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingRight: 46,
      color: theme.text,
      fontFamily: 'Outfit_400Regular',
      fontSize: 15,
    },
    toggle: {
      position: 'absolute',
      right: 14,
      height: 52,
      justifyContent: 'center',
    },
  });
