import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { data: T | null; loading: boolean; error: string | null };
type Options = { intervalMs?: number; reloadOnFocus?: boolean };

export function useFetch<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  { intervalMs, reloadOnFocus = false }: Options = {},
) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const activeRequest = useRef<symbol | null>(null);
  // Background tabs stay mounted (expo-router keeps them alive), so without
  // this a 3s poll on an unfocused screen still re-renders every tick and
  // competes with the JS thread right when the user taps the navbar.
  const isFocused = useIsFocused();
  const shouldLoad = !reloadOnFocus || isFocused;

  const load = useCallback((silent: boolean) => {
    if (silent && activeRequest.current) return;
    const request = Symbol();
    activeRequest.current = request;
    setState((s) => ({ ...s, loading: silent ? s.loading : true, error: null }));
    fn()
      .then((data) => {
        if (activeRequest.current === request) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (activeRequest.current === request) {
          setState((s) => ({ data: s.data, loading: false, error: err.message ?? 'Something went wrong' }));
        }
      })
      .finally(() => {
        if (activeRequest.current === request) activeRequest.current = null;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (shouldLoad) load(false);
  }, [load, shouldLoad]);

  useEffect(() => {
    if (!intervalMs || !isFocused) return;
    const id = setInterval(() => load(true), intervalMs);
    return () => clearInterval(id);
  }, [load, intervalMs, isFocused]);

  const reload = useCallback(() => load(false), [load]);
  return { ...state, reload };
}
