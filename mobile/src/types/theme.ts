// types/theme.ts — Aurora Midnight
export const Colors = {
  // Emerald primary
  primary: '#34d399',
  primaryDk: '#10b981',
  primaryMid: '#6ee7b7',
  primaryLt: 'rgba(52, 211, 153, 0.14)',
  onPrimary: '#052e22',

  // Amber accent
  accent: '#fbbf24',
  accentDk: '#f59e0b',
  accentLt: 'rgba(251, 191, 36, 0.14)',
  onAccent: '#3b2405',

  // Status
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  neutral: '#94a3b8',
  successSoft: 'rgba(52, 211, 153, 0.14)',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  infoSoft: 'rgba(96, 165, 250, 0.14)',
  neutralSoft: 'rgba(148, 163, 184, 0.14)',
  accentSoft: 'rgba(251, 191, 36, 0.14)',

  // Midnight navy surfaces
  navy: '#0a1220',
  bg: '#070d18',
  surface: '#0e1828',
  surface2: '#162235',
  surface3: '#1d2c42',

  border: 'rgba(148, 180, 220, 0.12)',
  borderStrong: 'rgba(148, 180, 220, 0.24)',
  wash: 'rgba(148, 180, 220, 0.06)',
  overlay: 'rgba(3, 7, 14, 0.72)',

  text: '#f1f5f9',
  muted: '#94a3b8',
  subtle: '#64748b',
  black: '#000000',
} as const;

export const Fonts = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semi: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  black: { fontWeight: '800' as const },
};

export const Radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Type = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 10,
  },
};
