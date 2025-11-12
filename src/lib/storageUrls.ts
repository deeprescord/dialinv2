import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from './safeLocalStorage';

/**
 * Cache TTL for signed URLs (25 minutes)
 * Supabase signed URLs typically last 1 hour, we cache for less to be safe
 */
const CACHE_TTL_MS = 25 * 60 * 1000;

/**
 * Cache version - increment to invalidate all cached URLs
 */
const CACHE_VERSION = 'v2';

type Bucket = 'user-files' | 'space-covers' | 'profile-media';

interface CachedUrl {
  url: string;
  exp: number;
}

interface BucketDetection {
  bucket: Bucket;
  key: string;
  isAppAsset: boolean;
}

/**
 * Detect bucket and normalize key from various path formats
 */
function detectBucketAndKey(path: string, fallbackBucket: Bucket): BucketDetection {
  let p = path.trim();
  
  // Absolute URLs pass through
  if (/^https?:\/\//i.test(p)) {
    return { bucket: fallbackBucket, key: p, isAppAsset: true };
  }
  
  // App-relative public assets (not in storage buckets)
  if (p.startsWith('/')) {
    // If doesn't start with known bucket prefixes, it's a public app asset
    if (!p.startsWith('/user-files/') && !p.startsWith('/space-covers/') && !p.startsWith('/profile-media/')) {
      return { bucket: fallbackBucket, key: p, isAppAsset: true };
    }
    // Strip leading slashes for bucket paths
    p = p.replace(/^\/+/, '');
  }
  
  // Detect bucket from path prefix
  if (p.startsWith('space-covers/')) {
    return { bucket: 'space-covers', key: p.slice('space-covers/'.length), isAppAsset: false };
  }
  if (p.startsWith('profile-media/')) {
    return { bucket: 'profile-media', key: p.slice('profile-media/'.length), isAppAsset: false };
  }
  if (p.startsWith('user-files/')) {
    p = p.slice('user-files/'.length);
  }
  
  return { bucket: fallbackBucket, key: p, isAppAsset: false };
}

/**
 * Get cached URL if still valid
 */
function getCachedUrl(bucket: string, path: string): string | null {
  try {
    const key = `signed-url-cache:${CACHE_VERSION}:${bucket}:${path}`;
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
    const key = `signed-url-cache:${CACHE_VERSION}:${bucket}:${path}`;
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
 * Get object URL with smart fallback and cache bypass option
 */
export async function getObjectUrl(
  path: string | undefined,
  bucket: Bucket = 'user-files',
  options?: { bypassCache?: boolean }
): Promise<string | null> {
  if (!path) return null;
  
  // Detect bucket and normalize key
  const { bucket: detectedBucket, key, isAppAsset } = detectBucketAndKey(path, bucket);
  
  // App assets and absolute URLs pass through
  if (isAppAsset) return key;
  
  // Check cache first (unless bypassed)
  if (!options?.bypassCache) {
    const cached = getCachedUrl(detectedBucket, key);
    if (cached) return cached;
  }
  
  // Try signed URL first (works for authenticated and unauthenticated users)
  try {
    const { data, error } = await supabase.storage
      .from(detectedBucket)
      .createSignedUrl(key, 3600); // 1 hour
      
    if (data?.signedUrl && !error) {
      // Only cache successful signed URLs
      if (!options?.bypassCache) {
        setCachedUrl(detectedBucket, key, data.signedUrl);
      }
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('[storageUrls] Signed URL failed', {
      bucket: detectedBucket,
      originalPath: path,
      normalizedKey: key,
      error: err
    });
  }
  
  // Fall back to public URL
  try {
    const { data } = supabase.storage
      .from(detectedBucket)
      .getPublicUrl(key);
      
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.error('[storageUrls] Public URL failed', {
      bucket: detectedBucket,
      originalPath: path,
      normalizedKey: key,
      error: err
    });
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
  items: Array<{ path: string; bucket?: Bucket }>
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
