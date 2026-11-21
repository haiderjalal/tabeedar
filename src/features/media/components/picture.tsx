import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius as radii } from '@/theme';

import { publicImageUrl } from '../services/media.service';

interface PictureProps {
  /** The stored picture's path, or null to show the placeholder. */
  path: string | null;
  width: DimensionValue;
  height: DimensionValue;
  /** Corner radius. Defaults to the standard rounded corner. */
  cornerRadius?: number;
}

const PLACEHOLDER_ICON_SIZE = 28;

/**
 * A picture from the catalog bucket, or a quiet placeholder when there is none yet. Always
 * decorative: the item's name is written next to it, so screen readers skip it.
 */
export function Picture({ path, width, height, cornerRadius = radii.md }: PictureProps) {
  const { colors } = useTheme();
  const uri = publicImageUrl(path);
  const frame = { width, height, borderRadius: cornerRadius, backgroundColor: colors.surface };

  if (uri === null) {
    return (
      <View accessible={false} style={[styles.placeholder, frame, { borderColor: colors.border }]}>
        <Ionicons name="image-outline" size={PLACEHOLDER_ICON_SIZE} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      // Small cross-fade instead of a pop-in, and the cache keeps a picture across screens.
      transition={150}
      cachePolicy="memory-disk"
      accessible={false}
      style={frame}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
