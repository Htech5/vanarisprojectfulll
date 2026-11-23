import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

type State<T> = { data: T | null; loading: boolean; error: string | null };

export function useFetch<T>(fn: () => Promise<T>, deps: unknown[] = [], intervalMs?: number) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  // Background tabs stay mounted (expo-router keeps them alive), so without
  // this a 3s poll on an unfocused screen still re-renders every tick and
  // competes with the JS thread right when the user taps the navbar.
  const isFocused = useIsFocused();

  const load = useCallback((silent = false) => {
    setState((s) => ({ ...s, loading: silent ? s.loading : true, error: null }));
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState((s) => ({ data: s.data, loading: false, error: err.message ?? 'Something went wrong' }))
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    if (!intervalMs || !isFocused) return;
    const id = setInterval(() => load(true), intervalMs);
    return () => clearInterval(id);
  }, [load, intervalMs, isFocused]);

  return { ...state, reload: load };
}
