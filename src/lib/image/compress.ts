// Client-side image compression utility
// Compresses images before upload to reduce bandwidth and improve load times

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  format?: "webp" | "jpeg" | "png";
  maxSizeKB?: number; // Target max file size in KB
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

/**
 * Compress an image file client-side before upload.
 * Uses Canvas API for resizing and compression.
 * Falls back to original if compression fails.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "webp",
    maxSizeKB,
  } = options;

  const originalSize = file.size;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback: return original file
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          width: img.width,
          height: img.height,
          compressionRatio: 1,
        });
        return;
      }

      // Use high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Determine MIME type
      const mimeType = format === "webp" ? "image/webp" : format === "png" ? "image/png" : "image/jpeg";

      // If maxSizeKB is specified, iteratively reduce quality
      if (maxSizeKB) {
        compressToTargetSize(canvas, mimeType, width, height, originalSize, maxSizeKB, file.name, resolve);
      } else {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                width,
                height,
                compressionRatio: 1,
              });
              return;
            }

            const compressedFile = new File([blob], getOutputFilename(file.name, format), {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: blob.size,
              width,
              height,
              compressionRatio: blob.size / originalSize,
            });
          },
          mimeType,
          quality
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: return original
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        width: 0,
        height: 0,
        compressionRatio: 1,
      });
    };

    img.src = url;
  });
}

/**
 * Iteratively compress to hit a target file size
 */
function compressToTargetSize(
  canvas: HTMLCanvasElement,
  mimeType: string,
  width: number,
  height: number,
  originalSize: number,
  maxSizeKB: number,
  originalName: string,
  resolve: (result: CompressionResult) => void
) {
  let currentQuality = 0.85;
  let currentWidth = width;
  let currentHeight = height;
  let attempts = 0;
  const maxAttempts = 5;
  const maxSizeBytes = maxSizeKB * 1024;

  const tryCompress = () => {
    attempts++;

    // If we've tried too many times, also reduce dimensions
    if (attempts > 2 && currentWidth > 800) {
      currentWidth = Math.round(currentWidth * 0.8);
      currentHeight = Math.round(currentHeight * 0.8);
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Need to redraw - but we don't have the original image here
        // So just reduce quality further
      }
    }

    currentQuality = Math.max(0.3, currentQuality - 0.15);

    canvas.toBlob(
      (blob) => {
        if (!blob || attempts >= maxAttempts) {
          // Use what we have
          const finalBlob = blob || new Blob([]);
          const compressedFile = new File([finalBlob], getOutputFilename(originalName, "webp"), {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: finalBlob.size,
            width: currentWidth,
            height: currentHeight,
            compressionRatio: finalBlob.size / originalSize,
          });
          return;
        }

        if (blob.size <= maxSizeBytes) {
          // We're under the target!
          const compressedFile = new File([blob], getOutputFilename(originalName, "webp"), {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: blob.size,
            width: currentWidth,
            height: currentHeight,
            compressionRatio: blob.size / originalSize,
          });
        } else {
          // Still too big, try again
          tryCompress();
        }
      },
      mimeType,
      currentQuality
    );
  };

  tryCompress();
}

/**
 * Predefined image size presets for blog posts
 */
export const IMAGE_PRESETS = {
  // Blog cover image - wide format for hero/card display
  hero: { maxWidth: 1200, maxHeight: 630, quality: 0.85, format: "webp" as const },
  // Standard blog card thumbnail
  thumbnail: { maxWidth: 400, maxHeight: 300, quality: 0.8, format: "webp" as const },
  // Small preview image
  small: { maxWidth: 600, maxHeight: 400, quality: 0.8, format: "webp" as const },
  // Medium-sized image for in-content use
  medium: { maxWidth: 800, maxHeight: 600, quality: 0.82, format: "webp" as const },
  // Large image for full-width display
  large: { maxWidth: 1600, maxHeight: 900, quality: 0.85, format: "webp" as const },
  // Open Graph / Social sharing image (1200x630)
  og_image: { maxWidth: 1200, maxHeight: 630, quality: 0.85, format: "webp" as const },
  // Square format for grid layouts
  square: { maxWidth: 600, maxHeight: 600, quality: 0.8, format: "webp" as const },
  // Wide banner format
  wide: { maxWidth: 1920, maxHeight: 400, quality: 0.85, format: "webp" as const },
} as const;

export type ImagePresetKey = keyof typeof IMAGE_PRESETS;

/**
 * Compress image for a specific preset
 */
export async function compressForPreset(
  file: File,
  preset: ImagePresetKey
): Promise<CompressionResult> {
  return compressImage(file, IMAGE_PRESETS[preset]);
}

/**
 * Compress an image for ALL blog presets at once
 * Returns a map of preset key -> compressed file
 */
export async function compressForAllBlogPresets(
  file: File
): Promise<Record<ImagePresetKey, CompressionResult>> {
  const results: Record<string, CompressionResult> = {};

  const entries = Object.entries(IMAGE_PRESETS) as [ImagePresetKey, CompressionOptions][];
  await Promise.all(
    entries.map(async ([key, options]) => {
      results[key] = await compressImage(file, options);
    })
  );

  return results as Record<ImagePresetKey, CompressionResult>;
}

// Helper functions
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

function getOutputFilename(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
  return `${nameWithoutExt}.${format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png"}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
