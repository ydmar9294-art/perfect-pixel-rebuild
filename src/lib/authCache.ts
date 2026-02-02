/**
 * Auth Cache - Secure session caching for optimized auth flow
 * Prevents redundant OAuth/License checks on every page load
 */

import { UserRole, EmployeeType, LicenseStatus } from '@/types';

// Cache keys
const CACHE_KEY = 'auth_cache_v1';
const CACHE_VERSION = 1;

// Cache TTL: 15 minutes for session validation
const CACHE_TTL_MS = 15 * 60 * 1000;

export interface CachedAuthState {
  userId: string;
  role: UserRole;
  employeeType?: EmployeeType | null;
  organizationId?: string | null;
  organizationName?: string | null;
  licenseStatus?: LicenseStatus | null;
  fullName: string;
  email: string;
  cachedAt: number;
  version: number;
}

/**
 * Check if cached auth is still valid
 */
export const isCacheValid = (cache: CachedAuthState | null): boolean => {
  if (!cache) return false;
  if (cache.version !== CACHE_VERSION) return false;
  
  const age = Date.now() - cache.cachedAt;
  return age < CACHE_TTL_MS;
};

/**
 * Get cached auth state from sessionStorage
 * Returns null if cache is invalid or expired
 */
export const getCachedAuth = (): CachedAuthState | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached) as CachedAuthState;
    
    if (!isCacheValid(parsed)) {
      clearAuthCache();
      return null;
    }
    
    return parsed;
  } catch {
    clearAuthCache();
    return null;
  }
};

/**
 * Cache auth state after successful authentication
 */
export const setCachedAuth = (state: Omit<CachedAuthState, 'cachedAt' | 'version'>): void => {
  try {
    const cacheData: CachedAuthState = {
      ...state,
      cachedAt: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('[AuthCache] Failed to cache auth state:', e);
  }
};

/**
 * Clear auth cache on logout or invalidation
 */
export const clearAuthCache = (): void => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
};

/**
 * Validate that cached user matches current session
 */
export const validateCacheWithSession = (sessionUserId: string): boolean => {
  const cached = getCachedAuth();
  return cached?.userId === sessionUserId;
};
