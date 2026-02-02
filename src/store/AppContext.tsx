import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, User, Product, License, LicenseStatus, EmployeeType, Organization, Customer, Sale, Payment, Notification } from '@/types';
import { resolveUserProfile } from '@/hooks/useAuthOperations';
import { 
  Purchase, Delivery, PendingEmployee, 
  fetchOrganizationData, fetchDeveloperData,
  transformUser, transformPendingEmployee
} from '@/hooks/useDataOperations';
import { extractErrorMessage, withTimeout } from '@/lib/errorHandler';
import { authMutex, refreshDeduplicator, refreshDebouncer } from '@/lib/concurrency';
import { getCachedAuth, clearAuthCache, setCachedAuth, CachedAuthState } from '@/lib/authCache';

// ============================================
// Context Type Definition
// ============================================

interface AppContextType {
  user: User | null;
  role: UserRole | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsActivation: boolean;

  products: Product[];
  customers: Customer[];
  sales: Sale[];
  payments: Payment[];
  users: User[];
  licenses: License[];
  purchases: Purchase[];
  deliveries: Delivery[];
  pendingEmployees: PendingEmployee[];

  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  notifications: Notification[];
  addNotification: (msg: string, type: 'success' | 'error' | 'warning') => void;

  createSale: (customerId: string, items: any[]) => Promise<void>;
  submitInvoice: (data: any) => Promise<void>;
  submitPayment: (data: any) => Promise<void>;
  voidSale: (saleId: string, reason: string) => Promise<void>;
  addCollection: (saleId: string, amount: number, notes?: string) => Promise<void>;
  reversePayment: (paymentId: string, reason: string) => Promise<void>;
  addCustomer: (name: string, phone: string, location?: string) => Promise<void>;
  addDistributor: (name: string, phone: string, role: UserRole, type: EmployeeType) => Promise<{ code: string; employee: PendingEmployee | null }>;
  addProduct: (product: Omit<Product, 'id' | 'organization_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  issueLicense: (orgName: string, type: 'TRIAL' | 'PERMANENT', days: number) => Promise<void>;
  updateLicenseStatus: (id: string, ownerId: string | null, status: LicenseStatus) => Promise<void>;
  makeLicensePermanent: (id: string, ownerId: string | null) => Promise<void>;
  addPurchase: (productId: string, quantity: number, unitPrice: number, supplierName?: string, notes?: string) => Promise<void>;
  createDelivery: (distributorName: string, items: any[], notes?: string, distributorId?: string) => Promise<void>;
  createPurchaseReturn: (items: { product_id: string; product_name: string; quantity: number; unit_price: number }[], reason?: string, supplierName?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================
// Constants - OPTIMIZED for instant loading
// ============================================

const AUTH_TIMEOUT_MS = 3000; // Reduced from 5000
const DATA_REFRESH_DEBOUNCE_MS = 300;

// Helper to build user from cache
const buildUserFromCache = (cached: CachedAuthState): { user: User; role: UserRole; organization: Organization | null } => {
  const user: User = {
    id: cached.userId,
    name: cached.fullName,
    email: cached.email,
    role: cached.role,
    phone: '',
    employeeType: cached.employeeType || undefined
  };
  const organization: Organization | null = cached.organizationId ? {
    id: cached.organizationId,
    name: cached.organizationName || '',
    licenseStatus: cached.licenseStatus || null,
    expiryDate: null
  } : null;
  return { user, role: cached.role, organization };
};

// ============================================
// App Provider Component
// ============================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Refs for auth management
  const initializingAuth = useRef(false);
  const isInternalAuthOp = useRef(false);

  // ============================================
  // Notifications
  // ============================================

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setNotifications(prev => [{ id: Date.now(), message, type }, ...prev]);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('[App Error]:', err);
    const msg = extractErrorMessage(err);
    addNotification(msg, 'error');
  }, [addNotification]);

  // ============================================
  // Data Refresh - with deduplication and debouncing
  // ============================================

  const refreshAllData = useCallback(async () => {
    if (!organization?.id && role !== UserRole.DEVELOPER) return;

    try {
      // Use deduplication to prevent concurrent refresh calls
      await refreshDeduplicator.dedupe('refreshAllData', async () => {
        if (role !== UserRole.DEVELOPER && organization?.id) {
          const data = await fetchOrganizationData(organization.id, role!);
          
          setProducts(data.products || []);
          setCustomers(data.customers || []);
          setSales(data.sales || []);
          setPayments(data.payments || []);
          setPurchases(data.purchases || []);
          setDeliveries(data.deliveries || []);
          setPendingEmployees(data.pendingEmployees || []);
          if (data.users) setUsers(data.users);
        }

        if (role === UserRole.DEVELOPER) {
          const data = await fetchDeveloperData();
          setLicenses(data.licenses || []);
        }
      });
    } catch (err) {
      console.error('refreshAllData failed:', err);
    }
  }, [organization?.id, role]);

  // Debounced refresh for rapid operations
  const debouncedRefresh = useCallback(() => {
    refreshDebouncer.debounce(() => {
      refreshAllData();
    }, DATA_REFRESH_DEBOUNCE_MS);
  }, [refreshAllData]);

  // ============================================
  // Profile Resolution - Uses caching
  // ============================================

  const resolveProfile = async (uid: string) => {
    const result = await resolveUserProfile(uid);
    
    if (!result.success) {
      console.warn('[Auth] Profile resolution failed - needs activation');
      setNeedsActivation(true);
      setIsAuthenticated(true);
      return false;
    }

    setUser(result.user);
    setRole(result.role);
    setOrganization(result.organization);
    setNeedsActivation(false);
    setIsAuthenticated(true);
    
    // Log cache hit for debugging
    if (result.fromCache) {
      console.log('[Auth] Loaded from cache - fast path');
    }
    
    return true;
  };

  // ============================================
  // Refresh Auth (after activation)
  // ============================================

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await resolveProfile(session.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // Auth Initialization - INSTANT CACHE-FIRST
  // ============================================

  useEffect(() => {
    if (initializingAuth.current) return;
    initializingAuth.current = true;
    
    let isMounted = true;

    // INSTANT: Load from cache immediately (no async wait)
    const cached = getCachedAuth();
    if (cached) {
      console.log('[Auth] INSTANT load from cache');
      const { user: cachedUser, role: cachedRole, organization: cachedOrg } = buildUserFromCache(cached);
      setUser(cachedUser);
      setRole(cachedRole);
      setOrganization(cachedOrg);
      setIsAuthenticated(true);
      setNeedsActivation(false);
      setIsLoading(false); // Stop loading immediately!
    }

    // Timeout only for non-cached scenarios
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('[Auth] Timeout reached, stopping loading');
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    // Auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.id);
        
        if (isInternalAuthOp.current) return;

        if (event === 'SIGNED_OUT') {
          clearAuthCache();
          setUser(null);
          setRole(null);
          setOrganization(null);
          setIsAuthenticated(false);
          setNeedsActivation(false);
          setIsLoading(false);
          return;
        }

        if (session?.user && event === 'SIGNED_IN') {
          if (!cached || cached.userId !== session.user.id) {
            clearAuthCache();
            if (!initializingAuth.current) {
              setIsLoading(true);
              await resolveProfile(session.user.id);
              if (isMounted) setIsLoading(false);
            }
          }
        }
      }
    );

    // Background validation (don't block UI)
    const validateInBackground = async () => {
      console.log('[Auth] Background validation starting...');
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!data.session?.user) {
          // No session - clear cache and reset state
          if (cached) {
            console.log('[Auth] Session expired - clearing cache');
            clearAuthCache();
            if (isMounted) {
              setUser(null);
              setRole(null);
              setOrganization(null);
              setIsAuthenticated(false);
            }
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        // Session exists - validate/refresh profile in background
        if (!cached || cached.userId !== data.session.user.id) {
          // Different user or no cache - do full resolve
          await resolveProfile(data.session.user.id);
        } else {
          // Same user - refresh profile silently (don't set loading)
          resolveProfile(data.session.user.id).catch(console.error);
        }
      } catch (err) {
        console.error('[Auth] Background validation error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initializingAuth.current = false;
        }
      }
    };

    validateInBackground();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // Logout - Clear cache
  // ============================================

  const logout = async () => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      try {
        setIsLoading(true);
        clearAuthCache();
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setOrganization(null);
        setIsAuthenticated(false);
        setNeedsActivation(false);
      } finally {
        setIsLoading(false);
        isInternalAuthOp.current = false;
      }
    });
  };

  // ============================================
  // Auto-refresh data when organization/role changes
  // ============================================

  useEffect(() => {
    if (organization?.id || role === UserRole.DEVELOPER) {
      refreshAllData();
    }
  }, [organization?.id, role, refreshAllData]);

  // ============================================
  // Provider Value
  // ============================================

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        organization,
        isLoading,
        isAuthenticated,
        needsActivation,

        products,
        customers,
        sales,
        payments,
        users,
        licenses,
        purchases,
        deliveries,
        pendingEmployees,

        logout,
        refreshAuth,
        refreshAllData,
        notifications,
        addNotification,

        // ============================================
        // Data Operations - Using RPC for atomicity
        // ============================================

        createSale: async (cid, items) => {
          try {
            await supabase.rpc('create_sale_rpc', { p_customer_id: cid, p_items: items });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        submitInvoice: async d => {
          try {
            await supabase.rpc('create_sale_rpc', {
              p_customer_id: d.customerId,
              p_items: d.items
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        submitPayment: async d => {
          try {
            await supabase.rpc('add_collection_rpc', {
              p_sale_id: d.saleId,
              p_amount: d.amount
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        voidSale: async (sid, r) => {
          try {
            await supabase.rpc('void_sale_rpc', { p_sale_id: sid, p_reason: r });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        addCollection: async (sid, a, n) => {
          try {
            await supabase.rpc('add_collection_rpc', {
              p_sale_id: sid,
              p_amount: a,
              p_notes: n
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        reversePayment: async (pid, r) => {
          try {
            await supabase.rpc('reverse_payment_rpc', { p_payment_id: pid, p_reason: r });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        addCustomer: async (name, phone, location) => {
          try {
            if (!organization?.id) throw new Error('لا توجد منشأة');
            await supabase.from('customers').insert({
              name,
              phone,
              location,
              organization_id: organization.id
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        addDistributor: async (name, phone, role, type) => {
          try {
            const { data, error } = await supabase.rpc('add_employee_rpc', {
              p_name: name,
              p_phone: phone,
              p_role: role,
              p_type: type
            });
            if (error) throw error;
            await refreshAllData();
            const latest = pendingEmployees.find(e => e.activation_code === data);
            return { code: data as string, employee: latest || null };
          } catch (e) {
            handleError(e);
            return { code: '', employee: null };
          }
        },

        addProduct: async (product) => {
          try {
            if (!organization?.id) throw new Error('لا توجد منشأة');
            await supabase.from('products').insert({
              name: product.name,
              category: product.category,
              cost_price: product.costPrice,
              base_price: product.basePrice,
              stock: product.stock,
              min_stock: product.minStock,
              unit: product.unit,
              organization_id: organization.id
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        updateProduct: async (product) => {
          try {
            await supabase.from('products').update({
              name: product.name,
              category: product.category,
              cost_price: product.costPrice,
              base_price: product.basePrice,
              stock: product.stock,
              min_stock: product.minStock,
              unit: product.unit
            }).eq('id', product.id);
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        deleteProduct: async (id) => {
          try {
            await supabase.from('products').update({ is_deleted: true }).eq('id', id);
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        issueLicense: async (orgName, type, days) => {
          try {
            const { error } = await supabase.rpc('issue_license_rpc', {
              p_org_name: orgName,
              p_type: type,
              p_days: days
            });
            if (error) throw error;
            await refreshAllData();
            addNotification('تم إصدار الترخيص بنجاح', 'success');
          } catch (e) { handleError(e); }
        },

        updateLicenseStatus: async (id, ownerId, status) => {
          try {
            await supabase.from('developer_licenses')
              .update({ status })
              .eq('id', id);
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        makeLicensePermanent: async (id, ownerId) => {
          try {
            await supabase.from('developer_licenses')
              .update({ type: 'PERMANENT', expiryDate: null })
              .eq('id', id);
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        addPurchase: async (productId, quantity, unitPrice, supplierName, notes) => {
          try {
            const { error } = await supabase.rpc('add_purchase_rpc', {
              p_product_id: productId,
              p_quantity: quantity,
              p_unit_price: unitPrice,
              p_supplier_name: supplierName,
              p_notes: notes
            });
            if (error) throw error;
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        createDelivery: async (distributorName, items, notes, distributorId) => {
          try {
            const { error } = await supabase.rpc('create_delivery_rpc', {
              p_distributor_name: distributorName,
              p_items: items,
              p_notes: notes,
              p_distributor_id: distributorId
            });
            if (error) throw error;
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        createPurchaseReturn: async (items, reason, supplierName) => {
          try {
            const { error } = await supabase.rpc('create_purchase_return_rpc', {
              p_items: items,
              p_reason: reason,
              p_supplier_name: supplierName
            });
            if (error) throw error;
            await refreshAllData();
          } catch (e) { handleError(e); }
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ============================================
// Context Hook
// ============================================

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
