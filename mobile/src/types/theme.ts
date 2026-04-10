// types/theme.ts — Constantes de design partagées
export const Colors = {
  primary:    '#4f46e5',
  primaryDk:  '#3730a3',
  primaryLt:  '#eef2ff',
  accent:     '#10b981',
  danger:     '#f43f5e',
  warning:    '#f59e0b',
  navy:       '#0f172a',
  surface:    '#ffffff',
  surface2:   '#f1f5f9',
  bg:         '#f8fafd',
  border:     '#e2e8f0',
  text:       '#1e293b',
  muted:      '#64748b',
  subtle:     '#94a3b8',
} as const;

export const Fonts = {
  regular: { fontWeight: '400' as const },
  medium:  { fontWeight: '500' as const },
  bold:    { fontWeight: '700' as const },
  black:   { fontWeight: '900' as const },
};

export const Radius = { sm: 8, md: 14, lg: 20, xl: 28 };

export const Shadow = {
  sm: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
};
