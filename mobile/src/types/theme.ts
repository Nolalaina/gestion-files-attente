// types/theme.ts — Dark Premium (V8)
export const Colors = {
  // Emerald Green (Primary)
  primary:    '#10b981',
  primaryDk:  '#059669',
  primaryLt:  'rgba(16, 185, 129, 0.12)',
  primaryMid: '#34d399',
  
  // Imperial Gold (Accent)
  accent:     '#f59e0b',
  accentDk:   '#d97706',
  accentLt:   'rgba(245, 158, 11, 0.15)',
  
  // Status
  success:    '#10b981',
  danger:     '#ef4444',
  warning:    '#f59e0b',
  info:       '#3b82f6',
  
  // Midnight Theme / Surfaces
  navy:       '#0c0a1d',
  bg:         '#080718',
  surface:    '#120f26',
  surface2:   '#1c1836',
  
  // Borders & Text
  border:     'rgba(255, 255, 255, 0.06)',
  text:       '#f8fafc',
  muted:      '#94a3b8',
  subtle:     '#64748b',
} as const;

export const Fonts = {
  regular: { fontWeight: '400' as const },
  medium:  { fontWeight: '500' as const },
  semi:    { fontWeight: '600' as const },
  bold:    { fontWeight: '700' as const },
  black:   { fontWeight: '900' as const },
};

export const Radius = { sm: 12, md: 18, lg: 24, xl: 32 };

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 12,
  },
  glow: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 6,
  },
  glowGold: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 6,
  },
};
