import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';

interface AvatarProps {
  /** Used for the fallback initial. */
  name: string;
  /** A picture address. Anything that is not a web address is ignored (shows the initial). */
  uri: string | null;
  size?: number;
}

const DEFAULT_SIZE = 56;

/** A store's picture, or its first letter on a coloured circle when it has none yet. */
export function Avatar({ name, uri, size = DEFAULT_SIZE }: AvatarProps) {
  const { colors } = useTheme();
  const hasPicture = uri !== null && /^https?:\/\//i.test(uri);
  const frame = { width: size, height: size, borderRadius: size / 2 };

  if (hasPicture) {
    return (
      <Image
        source={{ uri }}
        contentFit="cover"
        // Decorative: the store's name is always written next to it.
        accessible={false}
        style={[frame, { backgroundColor: colors.surface }]}
      />
    );
  }

  return (
    <View
      accessible={false}
      style={[
        styles.fallback,
        frame,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text variant="heading" tone="primary">
        {name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
