import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
}

/** Colours for the current light/dark appearance. Spacing and sizes are static tokens. */
export function useTheme(): UseThemeResult {
  const isDark = useColorScheme() === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
