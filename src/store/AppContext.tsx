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
import { resolveUserProfile, checkDeveloperExists as checkDevExists } from '@/hooks/useAuthOperations';
import { 
  Purchase, Delivery, PendingEmployee, 
  fetchOrganizationData, fetchDeveloperData,
  transformUser, transformPendingEmployee
} from '@/hooks/useDataOperations';
import { extractErrorMessage, withTimeout } from '@/lib/errorHandler';
import { authMutex, refreshDeduplicator, refreshDebouncer } from '@/lib/concurrency';

// ============================================
// Context Type Definition
// ============================================

interface AppContextType {
  user: User | null;
  role: UserRole | null;
  organization: Organization | null;
  isLoading: boolean;
  developerExists: boolean;

  products: Product[];
  customers: Customer[];
  sales: Sale[];
  payments: Payment[];
  users: User[];
  licenses: License[];
  purchases: Purchase[];
  deliveries: Delivery[];
  pendingEmployees: PendingEmployee[];

  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (email: string, pass: string, code: string) => Promise<void>;
  signUpEmployee: (email: string, pass: string, code: string) => Promise<void>;
  loginDeveloper: (email: string, pass: string) => Promise<boolean>;
  refreshAllData: () => Promise<void>;

  notifications: Notification[];
  addNotification: (msg: string, type: 'success' | 'error' | 'warning') => void;

  createSale: (customerId: string, items: any[]) => Promise<void>;
  submitInvoice: (data: any) => Promise<void>;
  submitPayment: (data: any) => Promise<void>;
  voidSale: (saleId: string, reason: string) => Promise<void>;
  addCollection: (saleId: string, amount: number, notes?: string) => Promise<void>;
  reversePayment: (paymentId: string, reason: string) => Promise<void>;
  addCustomer: (name: string, phone: string) => Promise<void>;
  addDistributor: (name: string, phone: string, role: UserRole, type: EmployeeType) => Promise<{ code: string; employee: PendingEmployee | null }>;
  addProduct: (product: Omit<Product, 'id' | 'organization_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  issueLicense: (orgName: string, type: 'TRIAL' | 'PERMANENT', days: number) => Promise<void>;
  updateLicenseStatus: (id: string, ownerId: string | null, status: LicenseStatus) => Promise<void>;
  makeLicensePermanent: (id: string, ownerId: string | null) => Promise<void>;
  addPurchase: (productId: string, quantity: number, unitPrice: number, supplierName?: string, notes?: string) => Promise<void>;
  createDelivery: (distributorName: string, items: any[], notes?: string) => Promise<void>;
  createPurchaseReturn: (items: { product_id: string; product_name: string; quantity: number; unit_price: number }[], reason?: string, supplierName?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================
// Constants
// ============================================

const AUTH_TIMEOUT_MS = 8000;
const DATA_REFRESH_DEBOUNCE_MS = 300;

// ============================================
// App Provider Component
// ============================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [developerExists, setDeveloperExists] = useState(false);

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
  // Developer Check
  // ============================================

  const checkDeveloperExists = useCallback(async () => {
    const exists = await checkDevExists();
    setDeveloperExists(exists);
  }, []);

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
  // Profile Resolution
  // ============================================

  const resolveProfile = async (uid: string) => {
    const result = await resolveUserProfile(uid);
    
    if (!result.success) {
      console.warn('[Auth] Profile resolution failed, signing out');
      await supabase.auth.signOut();
      return;
    }

    setUser(result.user);
    setRole(result.role);
    setOrganization(result.organization);
  };

  // ============================================
  // Auth Initialization
  // ============================================

  useEffect(() => {
    checkDeveloperExists();
    
    if (initializingAuth.current) return;
    initializingAuth.current = true;
    
    let isMounted = true;

    // Timeout لمنع التحميل اللانهائي
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
        
        if (isInternalAuthOp.current) {
          console.log('[Auth] Ignoring event - internal auth op in progress');
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setOrganization(null);
          setIsLoading(false);
          return;
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          if (!initializingAuth.current) {
            setIsLoading(true);
            await resolveProfile(session.user.id);
            if (isMounted) setIsLoading(false);
          }
        }
      }
    );

    // Initial session check
    const init = async () => {
      console.log('[Auth] Init starting...');
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('[Auth] Initial session:', data.session?.user?.id, error?.message);
        
        if (data.session?.user) {
          await resolveProfile(data.session.user.id);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initializingAuth.current = false;
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, [checkDeveloperExists]);

  // ============================================
  // Login - with mutex for race condition prevention
  // ============================================

  const login = async (email: string, pass: string): Promise<boolean> => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      setIsLoading(true);
      
      try {
        console.log('[Auth] Attempting login for:', email);
        
        const { data: signInData, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          }),
          AUTH_TIMEOUT_MS,
          'انتهت مهلة تسجيل الدخول'
        );
        
        if (error) {
          console.error('[Auth] Login error:', error.message);
          throw error;
        }
        
        console.log('[Auth] Login successful, user:', signInData.user?.id);
        
        if (signInData.session?.user) {
          await resolveProfile(signInData.session.user.id);
          return true;
        } else {
          console.warn('[Auth] No session created after login');
          setIsLoading(false);
          return false;
        }
      } catch (err: any) {
        console.error('[Auth] Login failed:', err);
        setIsLoading(false);
        throw err;
      } finally {
        isInternalAuthOp.current = false;
      }
    });
  };

  // ============================================
  // Logout
  // ============================================

  const logout = async () => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      try {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setOrganization(null);
      } finally {
        setIsLoading(false);
        isInternalAuthOp.current = false;
      }
    });
  };

  // ============================================
  // Sign Up (Owner with License)
  // ============================================

  const signUp = async (email: string, pass: string, code: string) => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass
        });

        let userId: string | null = null;

        if (error) {
          if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
            throw new Error('حدث خطأ في التسجيل. يرجى استخدام تسجيل الدخول إذا كان لديك حساب مسبق.');
          } else {
            throw error;
          }
        } else {
          userId = data.user?.id || null;
        }

        if (userId) {
          const { error: rpcError } = await supabase.rpc('use_license', {
            p_user_id: userId,
            p_license_key: code
          });
          if (rpcError) throw rpcError;

          addNotification('تم تفعيل الحساب بنجاح', 'success');
          
          const { data: session } = await supabase.auth.getSession();
          if (session.session?.user) {
            await resolveProfile(session.session.user.id);
          } else {
            await login(email, pass);
          }
        }
      } finally {
        isInternalAuthOp.current = false;
      }
    });
  };

  // ============================================
  // Sign Up Employee
  // ============================================

  const signUpEmployee = async (email: string, pass: string, code: string) => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass
        });

        let userId: string | null = null;

        if (error) {
          if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
            throw new Error('حدث خطأ في التسجيل. يرجى استخدام تسجيل الدخول إذا كان لديك حساب مسبق.');
          } else {
            throw error;
          }
        } else {
          userId = data.user?.id || null;
        }

        if (userId) {
          const { error: rpcError } = await supabase.rpc('activate_employee', {
            p_user_id: userId,
            p_activation_code: code
          });
          if (rpcError) throw rpcError;

          addNotification('تم تفعيل حساب الموظف بنجاح', 'success');
          
          const { data: session } = await supabase.auth.getSession();
          if (session.session?.user) {
            await resolveProfile(session.session.user.id);
          } else {
            await login(email, pass);
          }
        }
      } finally {
        isInternalAuthOp.current = false;
      }
    });
  };

  // ============================================
  // Developer Login
  // ============================================

  const loginDeveloper = async (email: string, pass: string): Promise<boolean> => {
    return authMutex.withLock(async () => {
      isInternalAuthOp.current = true;
      setIsLoading(true);
      
      try {
        console.log('[Auth] loginDeveloper started for:', email);
        
        const devCheck = await supabase.from('user_roles').select('id').eq('role', 'DEVELOPER').limit(1);
        const devExists = (devCheck.data?.length || 0) > 0;

        if (!devExists) {
          // No developer in system
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          });

          let userId: string | null = null;

          if (loginError) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email.trim(),
              password: pass
            });

            if (signUpError) {
              if (signUpError.message?.includes('already registered') || signUpError.code === 'user_already_exists') {
                addNotification('خطأ في البريد أو كلمة المرور', 'error');
                return false;
              } else {
                throw signUpError;
              }
            } else {
              userId = signUpData.user?.id || null;
            }
          } else {
            userId = loginData.user?.id || null;
          }

          if (userId) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle();
              
            if (!existingProfile) {
              await supabase.from('profiles').insert({
                id: userId,
                full_name: 'المطور الرئيسي',
                role: 'DEVELOPER'
              });
            } else {
              await supabase.from('profiles').update({
                role: 'DEVELOPER'
              }).eq('id', userId);
            }

            const { error: roleError } = await supabase.from('user_roles').insert({
              user_id: userId,
              role: 'DEVELOPER'
            });
            
            if (roleError && !roleError.message?.includes('duplicate')) {
              throw roleError;
            }

            addNotification('تم تفعيل حساب المطور بنجاح', 'success');
            await resolveProfile(userId);
            setDeveloperExists(true);
            return true;
          }
        } else {
          // Developer already exists
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          });
          
          if (loginError) {
            addNotification('بيانات المطور غير صحيحة', 'error');
            return false;
          }
          
          if (loginData.user) {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', loginData.user.id)
              .eq('role', 'DEVELOPER')
              .limit(1);
            
            if (!roles || roles.length === 0) {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', loginData.user.id)
                .maybeSingle();
              
              await supabase.auth.signOut();
              
              if (!existingProfile) {
                addNotification('هذا الحساب غير مربوط بالنظام. يرجى استخدام كود التفعيل.', 'error');
              } else {
                addNotification('يوجد مطور مسجل بالفعل. لا يمكن إضافة مطور آخر.', 'error');
              }
              return false;
            }
            
            await resolveProfile(loginData.user.id);
            return true;
          }
        }
        return false;
      } catch (err) {
        handleError(err);
        return false;
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
        developerExists,

        products,
        customers,
        sales,
        payments,
        users,
        licenses,
        purchases,
        deliveries,
        pendingEmployees,

        login,
        logout,
        signUp,
        signUpEmployee,
        loginDeveloper,
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
            await supabase.rpc('reverse_payment_rpc', {
              p_payment_id: pid,
              p_reason: r
            });
            await refreshAllData();
          } catch (e) { handleError(e); }
        },

        addCustomer: async (n, p) => {
          try {
            await supabase.from('customers').insert({
              name: n,
              phone: p,
              organization_id: organization?.id
            });
            await refreshAllData();
            addNotification('تم إضافة الزبون بنجاح', 'success');
          } catch (e) { handleError(e); }
        },

        addDistributor: async (n, p, r, t) => {
          try {
            const { data, error } = await supabase.rpc('add_employee_rpc', {
              p_name: n,
              p_phone: p,
              p_role: r,
              p_type: t
            });
            if (error) throw error;
            await refreshAllData();
            addNotification('تم إنشاء كود التفعيل', 'success');
            
            const { data: pendingData } = await supabase
              .from('pending_employees')
              .select('*')
              .eq('activation_code', data)
              .single();
            
            const employee: PendingEmployee | null = pendingData 
              ? transformPendingEmployee(pendingData)
              : null;
            
            return { code: data as string, employee };
          } catch (e) { 
            handleError(e); 
            return { code: '', employee: null };
          }
        },

        addProduct: async p => {
          try {
            await supabase.from('products').insert({
              name: p.name,
              category: p.category,
              cost_price: p.costPrice,
              base_price: p.basePrice,
              stock: p.stock,
              min_stock: p.minStock,
              unit: p.unit,
              organization_id: organization?.id
            });
            await refreshAllData();
            addNotification('تم إضافة الصنف بنجاح', 'success');
          } catch (e) { handleError(e); }
        },

        updateProduct: async p => {
          try {
            await supabase.from('products').update({
              name: p.name,
              category: p.category,
              cost_price: p.costPrice,
              base_price: p.basePrice,
              stock: p.stock,
              min_stock: p.minStock,
              unit: p.unit
            }).eq('id', p.id);
            await refreshAllData();
            addNotification('تم تحديث الصنف بنجاح', 'success');
          } catch (e) { handleError(e); }
        },

        deleteProduct: async id => {
          try {
            await supabase.from('products').update({ is_deleted: true }).eq('id', id);
            await refreshAllData();
            addNotification('تم حذف الصنف', 'success');
          } catch (e) { handleError(e); }
        },

        issueLicense: async (o, t, d) => {
          try {
            await supabase.rpc('issue_license_rpc', {
              p_org_name: o,
              p_type: t,
              p_days: d
            });
            await refreshAllData();
            addNotification('تم إصدار الترخيص بنجاح', 'success');
          } catch (e) { handleError(e); }
        },

        updateLicenseStatus: async (id, _, s) => {
          try {
            await supabase.from('developer_licenses').update({ status: s }).eq('id', id);
            await refreshAllData();
            addNotification('تم تحديث حالة الترخيص', 'success');
          } catch (e) { handleError(e); }
        },

        makeLicensePermanent: async (id, _) => {
          try {
            await supabase.from('developer_licenses').update({ type: 'PERMANENT' }).eq('id', id);
            await refreshAllData();
            addNotification('تم تحويل الترخيص إلى دائم', 'success');
          } catch (e) { handleError(e); }
        },

        addPurchase: async (productId, quantity, unitPrice, supplierName, notes) => {
          try {
            await supabase.rpc('add_purchase_rpc', {
              p_product_id: productId,
              p_quantity: quantity,
              p_unit_price: unitPrice,
              p_supplier_name: supplierName,
              p_notes: notes
            });
            await refreshAllData();
            addNotification('تم تسجيل عملية الشراء وزيادة المخزون', 'success');
          } catch (e) { handleError(e); }
        },

        createDelivery: async (distributorName, items, notes) => {
          try {
            await supabase.rpc('create_delivery_rpc', {
              p_distributor_name: distributorName,
              p_items: items,
              p_notes: notes
            });
            await refreshAllData();
            addNotification('تم تسليم البضاعة وخصمها من المخزون', 'success');
          } catch (e) { handleError(e); }
        },

        createPurchaseReturn: async (items, reason, supplierName) => {
          try {
            const formattedItems = items.map(item => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.quantity * item.unit_price
            }));
            
            await supabase.rpc('create_purchase_return_rpc', {
              p_items: formattedItems,
              p_reason: reason,
              p_supplier_name: supplierName
            });
            await refreshAllData();
            addNotification('تم تسجيل مرتجع الشراء وخصم المخزون', 'success');
          } catch (e) { handleError(e); }
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
