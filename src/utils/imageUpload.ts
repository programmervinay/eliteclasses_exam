import { supabase } from '../lib/supabase';

interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  extension: string;
  contentType: string;
}

const MAX_QUESTION_DIMENSION = 1200;
const MAX_OPTION_DIMENSION = 700;

const readFileAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

/**
 * Compresses raster images via an offscreen canvas into WebP/JPEG to keep exam loading fast.
 */
export const compressImageFile = async (
  file: File,
  maxDimension: number = MAX_QUESTION_DIMENSION
): Promise<CompressedImageResult> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WebP, GIF, or SVG).');
  }

  // Keep SVG / animated GIF untouched so vector quality or animation is preserved
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      blob: file,
      dataUrl,
      extension: file.type === 'image/svg+xml' ? 'svg' : 'gif',
      contentType: file.type,
    };
  }

  const sourceDataUrl = await readFileAsDataUrl(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageEl = new Image();
    imageEl.onload = () => resolve(imageEl);
    imageEl.onerror = () => reject(new Error('Could not decode selected image.'));
    imageEl.src = sourceDataUrl;
  });

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      blob: file,
      dataUrl: sourceDataUrl,
      extension: file.name.split('.').pop()?.toLowerCase() || 'png',
      contentType: file.type,
    };
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Preserve transparency cleanly with PNG/WebP; use WebP where supported (fallback to JPEG/PNG)
  const targetType = 'image/webp';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), targetType, 0.85)
  );

  if (!blob) {
    return {
      blob: file,
      dataUrl: sourceDataUrl,
      extension: 'png',
      contentType: file.type,
    };
  }

  const finalDataUrl = await readFileAsDataUrl(blob);
  const actualType = blob.type || 'image/webp';
  const extension = actualType === 'image/png' ? 'png' : actualType === 'image/jpeg' ? 'jpg' : 'webp';

  return {
    blob,
    dataUrl: finalDataUrl,
    extension,
    contentType: actualType,
  };
};

/**
 * Compresses and uploads an image to the public Supabase Storage bucket `question-images`,
 * falling back seamlessly to an embedded compressed Data URL if storage upload fails.
 */
export const uploadQuestionImage = async (
  file: File,
  folder: 'questions' | 'options'
): Promise<string> => {
  const maxDim = folder === 'options' ? MAX_OPTION_DIMENSION : MAX_QUESTION_DIMENSION;
  const compressed = await compressImageFile(file, maxDim);

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filePath = `${folder}/${uniqueId}.${compressed.extension}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(filePath, compressed.blob, {
        contentType: compressed.contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      return urlData.publicUrl;
    }
  } catch (err) {
    console.warn('Supabase Storage upload unavailable, using compressed inline image:', err);
  }

  return compressed.dataUrl;
};
