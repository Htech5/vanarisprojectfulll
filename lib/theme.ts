export type Theme = Omit<typeof darkTheme, 'mode'> & { mode: 'dark' | 'light' };

export const darkTheme = {
  mode: 'dark' as const,
  bg: '#0a0a0c',
  surface: '#141417',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#f4f4f5',
  textDim: '#9a9aa2',
  textFaint: '#6b6b74',
  accent: '#ff3d5e',
  accentDim: 'rgba(255,61,94,0.16)',
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#f7f7f8',
  surface: '#ffffff',
  border: 'rgba(10,10,12,0.08)',
  borderStrong: 'rgba(10,10,12,0.14)',
  text: '#0e0e10',
  textDim: '#5b5b63',
  textFaint: '#8d8d95',
  accent: '#e02a4a',
  accentDim: 'rgba(224,42,74,0.12)',
};

/** Back-compat default for any stray static import; prefer useTheme(). */
export const theme = darkTheme;

export const radius = {
  lg: 28,
  md: 20,
  sm: 14,
};
