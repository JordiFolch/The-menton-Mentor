export const darkColors = {
  background:       '#000000',
  surface:          '#111111',
  surfaceElevated:  '#1A1A1A',
  border:           '#222222',
  borderLight:      '#333333',
  textPrimary:      '#FFFFFF',
  textSecondary:    '#888888',
  textTertiary:     '#444444',
  accent:           '#FFFFFF',
  danger:           '#FF4444',
  recording:        '#FF3B30',
};

export const lightColors = {
  background:       '#F8F9FA',
  surface:          '#FFFFFF',
  surfaceElevated:  '#EEEFF1',
  border:           '#E5E7EB',
  borderLight:      '#D1D5DB',
  textPrimary:      '#111827',
  textSecondary:    '#6B7280',
  textTertiary:     '#9CA3AF',
  accent:           '#111827',
  danger:           '#EF4444',
  recording:        '#EF4444',
};

export type AppColors = typeof darkColors;

export const theme = {
  // colors is the dark palette by default; components read from ThemeContext instead
  colors: darkColors,
  speakerColors: [
    '#4A9EFF',
    '#FF6B6B',
    '#4DFFA3',
    '#FFD166',
    '#C77DFF',
    '#FF9F43',
  ],
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
  },
  radius: {
    sm:   8,
    md:   12,
    lg:   20,
    full: 9999,
  },
  fontSize: {
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  22,
    xxl: 28,
  },
};
