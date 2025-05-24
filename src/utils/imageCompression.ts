/**
 * Image compression utilities for resizing and compressing images
 * before uploading to Supabase Storage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Compress and resize an image from a data URL
 * @param dataUrl - The image data URL
 * @param options - Compression options
 * @returns Promise<string> - Compressed image data URL
 */
export const compressImage = async (
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed data URL
      const mimeType = `image/${format}`;
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
};

/**
 * Convert data URL to File object
 * @param dataUrl - The image data URL
 * @param filename - The filename for the file
 * @returns File object
 */
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Get file size in KB from data URL
 * @param dataUrl - The image data URL
 * @returns File size in KB
 */
export const getDataURLSize = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1];
  const bytes = atob(base64).length;
  return Math.round(bytes / 1024);
};