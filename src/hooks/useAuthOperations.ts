/**
 * Auth Operations Hook - Centralized authentication logic
 * Internal refactoring - no behavior changes
 */
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, User, EmployeeType, LicenseStatus, Organization } from '@/types';

interface ProfileResolutionResult {
  user: User | null;
  role: UserRole | null;
  organization: Organization | null;
  success: boolean;
}

/**
 * Resolves user profile from database
 * Used after successful authentication
 */
export const resolveUserProfile = async (uid: string): Promise<ProfileResolutionResult> => {
  console.log('[Auth] resolveProfile started for:', uid);
  
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
      email: '',
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
