/**
 * Centralized design tokens for the 6500 English Words app.
 * Imported by tailwind.config.js and consumed directly in components.
 */

export const colors = {
  // Brand accent — strong yellow/orange
  primary: {
    50: '#FFF9EC',
    100: '#FFF0CC',
    200: '#FFE199',
    300: '#FFCD5C',
    400: '#FFB424',
    500: '#F59E0B', // core accent
    600: '#D97D06',
    700: '#B45E08',
    800: '#8A470C',
    900: '#6B380E',
  },
  // Soft green for success states
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
  },
  accent: {
    400: '#FB923C',
    500: '#F97316',
  },
  // Neutral dark palette (dark theme default)
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    850: '#172033',
    900: '#0F172A',
    950: '#080B14',
  },
  // Semantic aliases
  bg: '#0B1120',
  surface: '#111A2E',
  'surface-raised': '#16213A',
  'surface-overlay': '#1B2942',
  border: '#22304F',
  'text-primary': '#F8FAFC',
  'text-secondary': '#AEB9D1',
  'text-muted': '#6B7A99',
} as const;

export const spacing = {
  // 8px base system
  '0.5': '4px',
  '1': '8px',
  '2': '16px',
  '3': '24px',
  '4': '32px',
  '5': '40px',
  '6': '48px',
  '8': '64px',
  '10': '80px',
  '12': '96px',
} as const;

export const typography = {
  fontFamily: {
    sans: ['"Cairo"', '"Tajawal"', 'system-ui', 'sans-serif'],
    arabic: ['"Cairo"', '"Tajawal"', 'system-ui', 'sans-serif'],
    english: ['"Inter"', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    '2xs': ['0.75rem', { lineHeight: '1rem' }],
    xs: ['0.875rem', { lineHeight: '1.25rem' }],
    sm: ['0.95rem', { lineHeight: '1.4rem' }],
    base: ['1rem', { lineHeight: '1.6rem' }],
    lg: ['1.125rem', { lineHeight: '1.7rem' }],
    xl: ['1.375rem', { lineHeight: '1.9rem' }],
    '2xl': ['1.75rem', { lineHeight: '2.1rem' }],
    '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '4xl': ['2.75rem', { lineHeight: '3rem' }],
  },
} as const;

export const radii = {
  sm: '8px',
  DEFAULT: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
  '3xl': '32px',
  pill: '9999px',
} as const;

export const shadows = {
  card: '0 2px 8px rgba(0,0,0,0.25)',
  raised: '0 8px 24px rgba(0,0,0,0.35)',
  glow: '0 0 24px rgba(245,158,11,0.35)',
  tab: '0 -2px 16px rgba(0,0,0,0.4)',
} as const;

/** Tailwind-facing color ramp keys, exported for convenience. */
export const theme = { colors, spacing, typography, radii, shadows };
export default theme;
