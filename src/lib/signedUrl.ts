import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from './safeLocalStorage';

const CACHE_PREFIX = 'signed-url-cache';
const PUBLIC_BUCKETS = ['space-covers', 'profile-media'];
const PRIVATE_BUCKETS = ['user-files'];

interface CachedUrl {
  url: string;
  exp: number;
}

interface GetAssetUrlOptions {
  path: string;
  fileId?: string;
  isPublicView?: boolean;
  forceRefresh?: boolean;
}

/**
 * Get cache key for a bucket and path
 */
function getCacheKey(bucket: string, path: string): string {
  return `${CACHE_PREFIX}:${bucket}:${path}`;
}

/**
 * Get cached URL if valid
 */
function getFromCache(bucket: string, path: string): string | null {
  try {
    const cached = safeLocalStorage.getItem(getCacheKey(bucket, path));
    if (!cached) return null;
    
    const parsed: CachedUrl = JSON.parse(cached);
    if (!parsed.url || !parsed.exp || parsed.exp < Date.now()) {
      safeLocalStorage.removeItem(getCacheKey(bucket, path));
      return null;
    }
    
    return parsed.url;
  } catch {
    return null;
  }
}

/**
 * Save URL to cache with TTL
 */
function saveToCache(bucket: string, path: string, url: string, ttlMinutes: number): void {
  try {
    const exp = Date.now() + (ttlMinutes * 60 * 1000);
    safeLocalStorage.setItem(
      getCacheKey(bucket, path),
      JSON.stringify({ url, exp })
    );
  } catch (err) {
    console.warn('Failed to cache URL:', err);
  }
}

/**
 * Detect bucket from storage path
 */
function detectBucket(path: string): string {
  if (path.startsWith('space-covers/')) return 'space-covers';
  if (path.startsWith('profile-media/')) return 'profile-media';
  if (path.startsWith('user-files/')) return 'user-files';
  return 'user-files'; // default
}

/**
 * Strip bucket prefix from path
 */
function normalizePath(path: string): string {
  return path
    .replace(/^space-covers\//, '')
    .replace(/^profile-media\//, '')
    .replace(/^user-files\//, '');
}

/**
 * Get asset URL with intelligent caching and signing
 * 
 * @param options.path - Storage path (may include bucket prefix) or absolute URL
 * @param options.fileId - File ID for public-asset gateway (required for public view of private files)
 * @param options.isPublicView - Whether this is a public page (uses gateway for private files)
 * @param options.forceRefresh - Skip cache and generate fresh URL
 * @returns Promise<string | null> - Asset URL or null if failed
 */
export async function getAssetUrl({
  path,
  fileId,
  isPublicView = false,
  forceRefresh = false
}: GetAssetUrlOptions): Promise<string | null> {
  if (!path) {
    console.warn('getAssetUrl: Empty path provided');
    return null;
  }

  // Pass-through for absolute URLs (http/https/data URIs)
  if (/^(https?:|data:)/i.test(path)) {
    return path;
  }

  const bucket = detectBucket(path);
  const normalizedPath = normalizePath(path);
  
  // Public buckets: use public URL directly
  if (PUBLIC_BUCKETS.includes(bucket)) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
    return data.publicUrl;
  }

  // Private buckets on public pages: use gateway
  if (isPublicView && PRIVATE_BUCKETS.includes(bucket)) {
    if (!fileId) {
      console.warn('getAssetUrl: fileId required for public view of private file');
      return null;
    }
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${projectUrl}/functions/v1/public-asset?fileId=${encodeURIComponent(fileId)}&cb=${Date.now()}`;
  }

  // Private buckets (authenticated): check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedUrl = getFromCache(bucket, normalizedPath);
    if (cachedUrl) {
      return cachedUrl;
    }
  }

  // Generate signed URL (authenticated only)
  const ttl = 120; // 2 hours for authenticated
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, ttl * 60);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      return null;
    }

    // Cache the signed URL
    saveToCache(bucket, normalizedPath, data.signedUrl, ttl);
    
    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
}

/**
 * Batch fetch URLs for multiple paths
 */
export async function getBatchAssetUrls(
  paths: string[],
  isPublicView = false
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  await Promise.all(
    paths.map(async (path) => {
      const url = await getAssetUrl({ path, isPublicView });
      if (url) {
        results[path] = url;
      }
    })
  );
  
  return results;
}

/**
 * Clear all cached URLs (useful for logout or refresh)
 */
export function clearUrlCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        safeLocalStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Failed to clear URL cache:', err);
  }
}

/**
 * Get TTL for refresh timing (in milliseconds)
 */
export function getRefreshTiming(isPublicView = false): number {
  const ttl = isPublicView ? 15 : 120; // minutes
  return ttl * 60 * 1000 * 0.75; // Refresh at 75% of TTL
}
