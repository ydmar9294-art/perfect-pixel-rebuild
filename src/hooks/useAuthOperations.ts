/**
 * Auth Operations Hook - Centralized authentication logic
 * Optimized with caching for performance
 */
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, User, EmployeeType, LicenseStatus, Organization } from '@/types';
import { getCachedAuth, setCachedAuth, clearAuthCache, CachedAuthState } from '@/lib/authCache';

interface ProfileResolutionResult {
  user: User | null;
  role: UserRole | null;
  organization: Organization | null;
  success: boolean;
  fromCache?: boolean;
}

interface AuthStatusResponse {
  authenticated: boolean;
  needs_activation?: boolean;
  access_denied?: boolean;
  reason?: string;
  message?: string;
  user_id?: string;
  role?: string;
  employee_type?: string;
  organization_id?: string;
  organization_name?: string;
  license_status?: string;
  full_name?: string;
  email?: string;
  google_id?: string;
}

/**
 * Fast auth status check via lightweight edge function
 * Use this instead of multiple DB queries on page load
 */
export const checkAuthStatus = async (): Promise<AuthStatusResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { authenticated: false, reason: 'NO_SESSION' };
    }

    const { data, error } = await supabase.functions.invoke('auth-status', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('[AuthOps] auth-status error:', error);
      throw error;
    }

    return data as AuthStatusResponse;
  } catch (err) {
    console.error('[AuthOps] checkAuthStatus failed:', err);
    return { authenticated: false, reason: 'ERROR' };
  }
};

/**
 * Resolves user profile - checks cache first, then edge function
 * Optimized to minimize DB queries
 */
export const resolveUserProfile = async (uid: string): Promise<ProfileResolutionResult> => {
  console.log('[Auth] resolveProfile started for:', uid);
  
  try {
    // 1. Check cache first - but always validate license status with server
    const cached = getCachedAuth();
    const hasCachedData = cached && cached.userId === uid;
    
    if (hasCachedData) {
      console.log('[Auth] Have cached data, validating with server...');
    }

    // 2. Call lightweight auth-status endpoint
    const status = await checkAuthStatus();
    
    if (!status.authenticated) {
      console.warn('[Auth] Not authenticated:', status.reason);
      clearAuthCache();
      return { user: null, role: null, organization: null, success: false };
    }

    if (status.access_denied) {
      console.warn('[Auth] Access denied:', status.reason);
      clearAuthCache();
      return { user: null, role: null, organization: null, success: false };
    }

    if (status.needs_activation) {
      console.log('[Auth] Profile needs activation');
      return { user: null, role: null, organization: null, success: false };
    }

    // 3. Build and cache the result
    const user: User = {
      id: status.user_id!,
      name: status.full_name || '',
      email: status.email || '',
      role: status.role as UserRole,
      phone: '',
      employeeType: status.employee_type as EmployeeType
    };

    const role = status.role as UserRole;
    
    const organization: Organization | null = status.organization_id ? {
      id: status.organization_id,
      name: status.organization_name || '',
      licenseStatus: status.license_status as LicenseStatus || null,
      expiryDate: null
    } : null;

    // Cache for future requests
    setCachedAuth({
      userId: status.user_id!,
      role: role,
      employeeType: status.employee_type as EmployeeType || null,
      organizationId: status.organization_id || null,
      organizationName: status.organization_name || null,
      licenseStatus: status.license_status as LicenseStatus || null,
      fullName: status.full_name || '',
      email: status.email || ''
    });

    console.log('[Auth] Profile resolved successfully:', role);
    
    return { user, role, organization, success: true, fromCache: false };
  } catch (err) {
    console.error('[Auth] resolveProfile error:', err);
    clearAuthCache();
    return { user: null, role: null, organization: null, success: false };
  }
};

/**
 * Resolves user profile using legacy method (direct DB queries)
 * Fallback if edge function is unavailable
 */
export const resolveUserProfileLegacy = async (uid: string): Promise<ProfileResolutionResult> => {
  console.log('[Auth] resolveProfile (legacy) started for:', uid);
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    console.log('[Auth] Profile query result:', profile?.role, error?.message);

    if (error) {
      console.error('[Auth] Profile query error:', error);
      throw error;
    }
    
    if (!profile) {
      console.warn('[Auth] No profile found for user:', uid);
      return { user: null, role: null, organization: null, success: false };
    }

    // Get organization data (may be null for developers)
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', uid)
      .maybeSingle();

    console.log('[Auth] Org user result:', orgUser);

    // Fetch license status for owner/employee
    let licenseStatus: LicenseStatus | null = null;
    let expiryDate: number | null = null;
    
    if (profile.license_key) {
      const { data: license } = await supabase
        .from('developer_licenses')
        .select('status, expiryDate')
        .eq('licenseKey', profile.license_key)
        .maybeSingle();
      
      if (license) {
        licenseStatus = license.status as LicenseStatus;
        expiryDate = license.expiryDate ? new Date(license.expiryDate).getTime() : null;
      }
    } else if ((orgUser as any)?.organizations?.id) {
      // For employees without license_key, find license by owner
      const { data: ownerLicense } = await supabase
        .from('profiles')
        .select('license_key')
        .eq('organization_id', (orgUser as any).organizations.id)
        .eq('role', 'OWNER')
        .maybeSingle();
      
      if (ownerLicense?.license_key) {
        const { data: lic } = await supabase
          .from('developer_licenses')
          .select('status, expiryDate')
          .eq('licenseKey', ownerLicense.license_key)
          .maybeSingle();
        
        if (lic) {
          licenseStatus = lic.status as LicenseStatus;
          expiryDate = lic.expiryDate ? new Date(lic.expiryDate).getTime() : null;
        }
      }
    }

    // Build user object
    const user: User = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email || '',
      role: profile.role as UserRole,
      phone: profile.phone || '',
      employeeType: profile.employee_type as EmployeeType
    };

    const role = profile.role as UserRole;
    
    // Build organization with license status
    const org = (orgUser as any)?.organizations || null;
    const organization: Organization | null = org ? {
      ...org,
      licenseStatus,
      expiryDate
    } : null;

    // Cache the result
    setCachedAuth({
      userId: user.id,
      role: role,
      employeeType: user.employeeType || null,
      organizationId: organization?.id || null,
      organizationName: organization?.name || null,
      licenseStatus: organization?.licenseStatus || null,
      fullName: user.name,
      email: user.email
    });
    
    console.log('[Auth] Profile resolved successfully:', profile.role);
    
    return { user, role, organization, success: true };
  } catch (err) {
    console.error('[Auth] resolveProfile error:', err);
    return { user: null, role: null, organization: null, success: false };
  }
};

/**
 * Check if developer exists in the system
 */
export const checkDeveloperExists = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'DEVELOPER')
      .limit(1);
    
    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (err) {
    console.error('Error checking developer:', err);
    return false;
  }
};

/**
 * Hook for managing concurrent auth operations
 * Prevents race conditions during login/logout
 */
export const useAuthMutex = () => {
  const isOperationInProgress = useRef(false);
  const operationQueue = useRef<(() => void)[]>([]);

  const acquireLock = useCallback((): boolean => {
    if (isOperationInProgress.current) {
      return false;
    }
    isOperationInProgress.current = true;
    return true;
  }, []);

  const releaseLock = useCallback(() => {
    isOperationInProgress.current = false;
    // Process next queued operation if any
    const next = operationQueue.current.shift();
    if (next) {
      next();
    }
  }, []);

  const queueOperation = useCallback((operation: () => void) => {
    if (isOperationInProgress.current) {
      operationQueue.current.push(operation);
      return false;
    }
    return true;
  }, []);

  return { acquireLock, releaseLock, queueOperation, isLocked: () => isOperationInProgress.current };
};
