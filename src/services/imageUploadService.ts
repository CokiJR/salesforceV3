/**
 * Image upload service for Supabase Storage
 * Handles compression and upload to compressed_images folder
 */

import { supabase } from '@/integrations/supabase/client';
import { compressImage, dataURLtoFile, getDataURLSize } from '@/utils/imageCompression';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

/**
 * Upload compressed image to Supabase Storage
 * @param dataUrl - Original image data URL
 * @param filename - Optional custom filename
 * @returns Promise<UploadResult>
 */
export const uploadCompressedImage = async (
  dataUrl: string,
  filename?: string
): Promise<UploadResult> => {
  try {
    console.log('Starting image compression and upload...');
    
    // Get original size
    const originalSize = getDataURLSize(dataUrl);
    console.log(`Original image size: ${originalSize}KB`);
    
    // Compress image (max 800px, quality 70%)
    const compressedDataUrl = await compressImage(dataUrl, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
      format: 'jpeg'
    });
    
    // Get compressed size
    const compressedSize = getDataURLSize(compressedDataUrl);
    console.log(`Compressed image size: ${compressedSize}KB`);
    
    // Convert to file
    const fileName = filename || `photo_${Date.now()}.jpg`;
    const file = dataURLtoFile(compressedDataUrl, fileName);
    
    // Upload to Supabase Storage in compressed_images folder
    const filePath = `compressed_images/${fileName}`;
    
    console.log(`Uploading to: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from('photos') // Bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
        originalSize,
        compressedSize
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);
    
    console.log('Upload successful, URL:', urlData.publicUrl);
    
    return {
      success: true,
      url: urlData.publicUrl,
      originalSize,
      compressedSize
    };
    
  } catch (error: any) {
    console.error('Image upload service error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Delete image from Supabase Storage
 * @param filePath - Path to the file in storage
 * @returns Promise<boolean>
 */
export const deleteImage = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('photos')
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete service error:', error);
    return false;
  }
};

/**
 * Get image URL from storage path
 * @param filePath - Path to the file in storage
 * @returns string - Public URL
 */
export const getImageUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};