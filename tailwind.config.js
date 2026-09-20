import { colors, typography, radii, shadows } from './src/theme/index'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic aliases (flat keys used as bg-bg, bg-surface, etc.)
        bg: colors.bg,
        surface: colors.surface,
        'surface-raised': colors['surface-raised'],
        'surface-overlay': colors['surface-overlay'],
        border: colors.border,
        'text-primary': colors['text-primary'],
        'text-secondary': colors['text-secondary'],
        'text-muted': colors['text-muted'],
        // Ramps
        primary: colors.primary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        accent: colors.accent,
        neutral: colors.neutral,
        // Legacy ink/gold (kept for older components)
        ink: {
          950: '#0a0a0b',
          900: '#111113',
          850: '#161618',
          800: '#1c1c1f',
          700: '#26262a',
          600: '#33333a',
          500: '#4a4a52',
          400: '#6b6b76',
          300: '#9a9aa6',
          200: '#c5c5cf',
          100: '#e5e5ea',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: typography.fontFamily.sans,
        arabic: typography.fontFamily.arabic,
        english: typography.fontFamily.english,
      },
      fontSize: typography.fontSize,
      borderRadius: radii,
      boxShadow: shadows,
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        pop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
      },
    },
  },
  plugins: [],
}
