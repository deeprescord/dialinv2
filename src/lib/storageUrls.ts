import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from './safeLocalStorage';

/**
 * Cache TTL for signed URLs (25 minutes)
 * Supabase signed URLs typically last 1 hour, we cache for less to be safe
 */
const CACHE_TTL_MS = 25 * 60 * 1000;

interface CachedUrl {
  url: string;
  exp: number;
}

/**
 * Get cached URL if still valid
 */
function getCachedUrl(bucket: string, path: string): string | null {
  try {
    const key = `signed-url-cache:${bucket}:${path}`;
    const raw = safeLocalStorage.getItem(key);
    if (!raw) return null;
    
    const cached = JSON.parse(raw) as CachedUrl;
    if (!cached?.url || !cached?.exp) return null;
    
    // Check if expired
    if (cached.exp < Date.now()) {
      safeLocalStorage.removeItem(key);
      return null;
    }
    
    return cached.url;
  } catch {
    return null;
  }
}

/**
 * Cache a URL with expiration
 */
function setCachedUrl(bucket: string, path: string, url: string): void {
  try {
    const key = `signed-url-cache:${bucket}:${path}`;
    const cached: CachedUrl = {
      url,
      exp: Date.now() + CACHE_TTL_MS
    };
    safeLocalStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Normalize storage path by removing bucket prefix if present
 */
export function normalizePath(path: string, bucket: string): string {
  if (!path) return path;
  const prefix = `${bucket}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/**
 * Get object URL with smart fallback:
 * 1. Try signed URL (works for both public and private buckets, auth not required)
 * 2. Fall back to public URL if signing fails
 * 3. Cache results for performance
 */
export async function getObjectUrl(
  path: string | undefined,
  bucket: 'user-files' | 'space-covers' | 'profile-media' = 'user-files'
): Promise<string | null> {
  if (!path) return null;
  
  // Handle absolute URLs
  if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
    return path;
  }
  
  // Normalize path
  const normalizedPath = normalizePath(path, bucket);
  
  // Check cache first
  const cached = getCachedUrl(bucket, normalizedPath);
  if (cached) {
    return cached;
  }
  
  // Try signed URL first (works for public users on private buckets)
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, 3600); // 1 hour
      
    if (data?.signedUrl && !error) {
      setCachedUrl(bucket, normalizedPath, data.signedUrl);
      return data.signedUrl;
    }
  } catch (err) {
    console.warn(`Signed URL failed for ${bucket}/${normalizedPath}, trying public URL`, err);
  }
  
  // Fall back to public URL
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
      
    if (data?.publicUrl) {
      // Don't cache public URLs as they don't expire
      return data.publicUrl;
    }
  } catch (err) {
    console.error(`Public URL also failed for ${bucket}/${normalizedPath}`, err);
  }
  
  return null;
}

/**
 * Get thumbnail URL for an item with smart bucket detection
 */
export async function getThumbUrlForItem(item: {
  thumbnail_path?: string;
  storage_path?: string;
  file_type: string;
}): Promise<string | null> {
  // Prefer explicit thumbnail
  if (item.thumbnail_path) {
    // Detect bucket from path
    if (item.thumbnail_path.startsWith('space-covers/')) {
      return getObjectUrl(item.thumbnail_path, 'space-covers');
    }
    if (item.thumbnail_path.startsWith('profile-media/')) {
      return getObjectUrl(item.thumbnail_path, 'profile-media');
    }
    // Default to user-files
    return getObjectUrl(item.thumbnail_path, 'user-files');
  }
  
  // For images, use the original file as thumbnail
  if (item.file_type === 'image' && item.storage_path) {
    return getObjectUrl(item.storage_path, 'user-files');
  }
  
  // No thumbnail available
  return null;
}

/**
 * Batch get URLs for multiple items
 */
export async function batchGetUrls(
  items: Array<{ path: string; bucket?: 'user-files' | 'space-covers' | 'profile-media' }>
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  
  await Promise.all(
    items.map(async ({ path, bucket = 'user-files' }) => {
      const url = await getObjectUrl(path, bucket);
      if (url) {
        urls[path] = url;
      }
    })
  );
  
  return urls;
}
