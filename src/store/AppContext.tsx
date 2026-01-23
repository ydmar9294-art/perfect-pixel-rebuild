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

  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, pass: string, code: string) => Promise<void>;
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
  addDistributor: (name: string, phone: string, role: UserRole, type: EmployeeType) => Promise<string>;
  addProduct: (product: Omit<Product, 'id' | 'organization_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  issueLicense: (orgName: string, type: 'TRIAL' | 'PERMANENT', days: number) => Promise<void>;
  updateLicenseStatus: (id: string, ownerId: string | null, status: LicenseStatus) => Promise<void>;
  makeLicensePermanent: (id: string, ownerId: string | null) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const initializingAuth = useRef(false);
  const isInternalAuthOp = useRef(false);

  // Notifications
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setNotifications(prev => [{ id: Date.now(), message, type }, ...prev]);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('[App Error]:', err);
    let msg = err?.message || 'حدث خطأ غير متوقع';

    if (msg.includes('Invalid login credentials'))
      msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    if (msg.includes('Failed to fetch'))
      msg = 'خطأ في الاتصال بالسيرفر';

    addNotification(msg, 'error');
  }, [addNotification]);

  // Check if developer exists
  const checkDeveloperExists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'DEVELOPER')
        .limit(1);
      
      if (error) throw error;
      setDeveloperExists((data?.length || 0) > 0);
    } catch (err) {
      console.error('Error checking developer:', err);
      setDeveloperExists(false);
    }
  }, []);

  // Data Refresh
  const refreshAllData = useCallback(async () => {
    if (!organization?.id && role !== UserRole.DEVELOPER) return;

    try {
      if (role !== UserRole.DEVELOPER) {
        const [productsRes, customersRes, salesRes, paymentsRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_deleted', false),
          supabase.from('customers').select('*'),
          supabase.from('sales').select('*').order('created_at', { ascending: false }),
          supabase.from('collections').select('*').order('created_at', { ascending: false })
        ]);
        
        let usersRes: any = null;
        if (role === UserRole.OWNER) {
          usersRes = await supabase.from('profiles').select('*');
        }

        setProducts((productsRes?.data || []).map((p: any) => ({
          id: p.id,
          organization_id: p.organization_id,
          name: p.name,
          category: p.category,
          costPrice: Number(p.cost_price),
          basePrice: Number(p.base_price),
          stock: p.stock,
          minStock: p.min_stock,
          unit: p.unit,
          isDeleted: p.is_deleted
        })));
        
        setCustomers((customersRes?.data || []).map((c: any) => ({
          id: c.id,
          organization_id: c.organization_id,
          name: c.name,
          phone: c.phone,
          balance: Number(c.balance),
          created_at: c.created_at
        })));
        
        setSales((salesRes?.data || []).map((s: any) => ({
          id: s.id,
          organization_id: s.organization_id,
          customer_id: s.customer_id,
          customerName: s.customer_name,
          grandTotal: Number(s.grand_total),
          paidAmount: Number(s.paid_amount),
          remaining: Number(s.remaining),
          paymentType: s.payment_type,
          isVoided: s.is_voided,
          voidReason: s.void_reason,
          timestamp: new Date(s.created_at).getTime(),
          items: []
        })));
        
        setPayments((paymentsRes?.data || []).map((p: any) => ({
          id: p.id,
          saleId: p.sale_id,
          amount: Number(p.amount),
          notes: p.notes,
          isReversed: p.is_reversed,
          reverseReason: p.reverse_reason,
          timestamp: new Date(p.created_at).getTime()
        })));

        if (role === UserRole.OWNER && usersRes?.data) {
          setUsers((usersRes.data || []).map((u: any) => ({
            id: u.id,
            name: u.full_name,
            email: '',
            phone: u.phone || '',
            role: u.role,
            employeeType: u.employee_type,
            licenseKey: u.license_key
          })));
        }
      }

      if (role === UserRole.DEVELOPER) {
        const licensesRes = await supabase
          .from('developer_licenses')
          .select('*')
          .order('issuedAt', { ascending: false });
          
        setLicenses((licensesRes?.data || []).map((l: any) => ({
          id: l.id,
          licenseKey: l.licenseKey,
          orgName: l.orgName,
          type: l.type,
          status: l.status,
          ownerId: l.ownerId,
          issuedAt: new Date(l.issuedAt).getTime(),
          expiryDate: l.expiryDate ? new Date(l.expiryDate).getTime() : undefined,
          daysValid: l.days_valid
        })));
      }
    } catch (err) {
      console.error('refreshAllData failed:', err);
    }
  }, [organization?.id, role]);

  // Profile Resolver
  const resolveProfile = async (uid: string) => {
    try {
      setIsLoading(true);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;
      if (!profile) throw new Error('PROFILE_NOT_READY');

      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', uid)
        .maybeSingle();

      setUser({
        id: profile.id,
        name: profile.full_name,
        email: '',
        role: profile.role as UserRole,
        phone: profile.phone || '',
        employeeType: profile.employee_type as EmployeeType
      });

      setRole(profile.role as UserRole);
      setOrganization((orgUser as any)?.organizations || null);
    } catch (err) {
      handleError(err);
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Init
  useEffect(() => {
    checkDeveloperExists();

    const init = async () => {
      if (initializingAuth.current) return;
      initializingAuth.current = true;

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          await resolveProfile(data.session.user.id);
        } else {
          setIsLoading(false);
        }
      } finally {
        initializingAuth.current = false;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isInternalAuthOp.current || initializingAuth.current) return;

        if (session?.user && event === 'SIGNED_IN') {
          await resolveProfile(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setOrganization(null);
          setIsLoading(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [handleError, checkDeveloperExists]);

  // Auth Actions
  const login = async (email: string, pass: string) => {
    isInternalAuthOp.current = true;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });
      if (error) throw error;
      
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await resolveProfile(data.session.user.id);
      }
    } finally {
      isInternalAuthOp.current = false;
    }
  };

  const logout = async () => {
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
  };

  const signUp = async (email: string, pass: string, code: string) => {
    isInternalAuthOp.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass
      });

      if (error) throw error;

      if (data.user) {
        const { error: rpcError } = await supabase.rpc('use_license', {
          p_user_id: data.user.id,
          p_license_key: code
        });
        if (rpcError) throw rpcError;

        addNotification('تم تفعيل الحساب بنجاح', 'success');
        
        // Auto login after signup
        await login(email, pass);
      }
    } finally {
      isInternalAuthOp.current = false;
    }
  };

  const loginDeveloper = async (email: string, pass: string): Promise<boolean> => {
    isInternalAuthOp.current = true;
    try {
      // Check if developer exists
      const devCheck = await supabase.from('user_roles').select('id').eq('role', 'DEVELOPER').limit(1);
      const devExists = (devCheck.data?.length || 0) > 0;

      if (!devExists) {
        // First developer - create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Create profile
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: 'المطور الرئيسي',
            role: 'DEVELOPER'
          });

          // Add developer role
          await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: 'DEVELOPER'
          });

          addNotification('تم إنشاء حساب المطور بنجاح', 'success');
          
          // Login
          await login(email, pass);
          return true;
        }
      } else {
        // Developer already exists - try to login (only one developer allowed)
        try {
          await login(email, pass);
          
          // Check if the logged-in user has developer role
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user) {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.session.user.id)
              .eq('role', 'DEVELOPER')
              .limit(1);
            
            if (!roles || roles.length === 0) {
              // User is not a developer - logout and show error
              await supabase.auth.signOut();
              addNotification('يوجد مطور مسجل بالفعل. لا يمكن إضافة مطور آخر.', 'error');
              return false;
            }
          }
          return true;
        } catch (loginErr) {
          // If login fails, it's not the developer account
          addNotification('بيانات المطور غير صحيحة أو يوجد مطور آخر بالفعل', 'error');
          return false;
        }
      }
      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      isInternalAuthOp.current = false;
    }
  };

  useEffect(() => {
    if (organization?.id || role === UserRole.DEVELOPER) {
      refreshAllData();
    }
  }, [organization?.id, role, refreshAllData]);

  // Provider
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

        login,
        logout,
        signUp,
        loginDeveloper,
        refreshAllData,
        notifications,
        addNotification,

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
            return data as string;
          } catch (e) { 
            handleError(e); 
            return '';
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
