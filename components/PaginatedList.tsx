import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme-context';

const PAGE_SIZE = 5;

type Props<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
};

export function PaginatedList<T>({ items, renderItem }: Props<T>) {
  const { theme } = useTheme();
  const [selectedPage, setSelectedPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(selectedPage, pageCount);
  if (page !== selectedPage) setSelectedPage(page);

  const start = (page - 1) * PAGE_SIZE;
  const canGoBack = page > 1;
  const canGoNext = page < pageCount;

  return (
    <>
      {pageCount > 1 && (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            accessibilityState={{ disabled: !canGoBack }}
            disabled={!canGoBack}
            onPress={() => setSelectedPage(page - 1)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.surface, borderColor: theme.border },
              (!canGoBack || pressed) && styles.dimmed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </Pressable>
          <Text accessibilityLiveRegion="polite" style={[styles.page, { color: theme.textDim }]}>
            Page {page} of {pageCount}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next page"
            accessibilityState={{ disabled: !canGoNext }}
            disabled={!canGoNext}
            onPress={() => setSelectedPage(page + 1)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.surface, borderColor: theme.border },
              (!canGoNext || pressed) && styles.dimmed,
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </Pressable>
        </View>
      )}
      {items.slice(start, start + PAGE_SIZE).map(renderItem)}
    </>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.45 },
  page: { flex: 1, textAlign: 'center', fontFamily: 'Outfit_500Medium', fontSize: 14 },
});
