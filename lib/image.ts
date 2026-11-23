import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Vercel's serverless functions reject request bodies over ~4.5MB — a phone
// camera photo easily exceeds that even at the picker's own JPEG quality, so
// every upload is resized/recompressed down to a safe size first.
const MAX_DIMENSION = 1440;
const COMPRESS_QUALITY = 0.6;

export async function prepareUpload(
  uri: string,
  originalWidth: number,
  originalHeight: number
): Promise<{ uri: string; mimeType: string }> {
  let context = ImageManipulator.manipulate(uri);
  // Only downscale — never upscale a smaller source image.
  if (Math.max(originalWidth, originalHeight) > MAX_DIMENSION) {
    context =
      originalWidth >= originalHeight
        ? context.resize({ width: MAX_DIMENSION })
        : context.resize({ height: MAX_DIMENSION });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG });
  return { uri: result.uri, mimeType: 'image/jpeg' };
}
