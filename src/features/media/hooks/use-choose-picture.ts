import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import type { ImageKind } from '../constants';
import { pickImageFromLibrary, uploadStoreImage } from '../services/media.service';

interface ChoosePictureInput {
  storeId: number;
  kind: ImageKind;
}

/**
 * Lets the store owner choose a picture and uploads it. Resolves to the new picture's path, or to
 * null if they closed the picker without choosing. `isPending` covers both the picker and the
 * upload, so the button shows one busy state.
 */
export function useChoosePicture(): UseMutationResult<string | null, Error, ChoosePictureInput> {
  return useMutation({
    mutationFn: async ({ storeId, kind }: ChoosePictureInput) => {
      const localUri = await pickImageFromLibrary(kind);
      if (localUri === null) return null;
      return uploadStoreImage({ storeId, kind, localUri });
    },
  });
}
