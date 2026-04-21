// types/theme.ts — Aurora Design System v5
export const Colors = {
  primary:    '#7c3aed',
  primaryDk:  '#5b21b6',
  primaryLt:  '#ede9fe',
  primaryMid: '#a78bfa',
  accent:     '#06b6d4',
  accentDk:   '#0891b2',
  accentLt:   '#ecfeff',
  success:    '#10b981',
  danger:     '#ef4444',
  warning:    '#f59e0b',
  navy:       '#0c0a1d',
  surface:    '#ffffff',
  surface2:   '#f3f0ff',
  bg:         '#faf5ff',
  border:     '#e4e0f5',
  text:       '#1a1035',
  muted:      '#6b5b95',
  subtle:     '#9b8ec4',
} as const;

export const Fonts = {
  regular: { fontWeight: '400' as const },
  medium:  { fontWeight: '500' as const },
  semi:    { fontWeight: '600' as const },
  bold:    { fontWeight: '700' as const },
  black:   { fontWeight: '900' as const },
};

export const Radius = { sm: 12, md: 16, lg: 24, xl: 32 };

export const Shadow = {
  sm: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  glow: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};
