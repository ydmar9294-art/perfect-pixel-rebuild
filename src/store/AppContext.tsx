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

interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_name?: string;
  notes?: string;
  created_at: number;
}

interface Delivery {
  id: string;
  distributor_name: string;
  status: string;
  notes?: string;
  created_at: number;
}

interface PendingEmployee {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  employee_type: EmployeeType;
  activation_code: string;
  is_used: boolean;
  created_at: number;
}

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

  login: (email: string, pass: string) => Promise<void>;
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
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
        const [productsRes, customersRes, salesRes, paymentsRes, purchasesRes, deliveriesRes, pendingRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_deleted', false),
          supabase.from('customers').select('*'),
          supabase.from('sales').select('*').order('created_at', { ascending: false }),
          supabase.from('collections').select('*').order('created_at', { ascending: false }),
          supabase.from('purchases').select('*').order('created_at', { ascending: false }),
          supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
          role === UserRole.OWNER ? supabase.from('pending_employees').select('*').eq('is_used', false).order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
        ]);
        
        let usersRes: any = null;
        if (role === UserRole.OWNER && organization?.id) {
          usersRes = await supabase.from('profiles').select('*').eq('organization_id', organization.id);
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

        setPurchases((purchasesRes?.data || []).map((p: any) => ({
          id: p.id,
          product_id: p.product_id,
          product_name: p.product_name,
          quantity: p.quantity,
          unit_price: Number(p.unit_price),
          total_price: Number(p.total_price),
          supplier_name: p.supplier_name,
          notes: p.notes,
          created_at: new Date(p.created_at).getTime()
        })));

        setDeliveries((deliveriesRes?.data || []).map((d: any) => ({
          id: d.id,
          distributor_name: d.distributor_name,
          status: d.status,
          notes: d.notes,
          created_at: new Date(d.created_at).getTime()
        })));

        if (role === UserRole.OWNER) {
          setPendingEmployees((pendingRes?.data || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            phone: e.phone,
            role: e.role as UserRole,
            employee_type: e.employee_type as EmployeeType,
            activation_code: e.activation_code,
            is_used: e.is_used,
            created_at: new Date(e.created_at).getTime()
          })));
        }

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
        // For employees without license_key, find license by organization
        const { data: license } = await supabase
          .from('developer_licenses')
          .select('status, expiryDate')
          .eq('status', 'ACTIVE')
          .limit(1)
          .maybeSingle();
        
        // Try to find license by owner
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

      setUser({
        id: profile.id,
        name: profile.full_name,
        email: '',
        role: profile.role as UserRole,
        phone: profile.phone || '',
        employeeType: profile.employee_type as EmployeeType
      });

      setRole(profile.role as UserRole);
      
      // Set organization with license status
      const org = (orgUser as any)?.organizations || null;
      if (org) {
        setOrganization({
          ...org,
          licenseStatus,
          expiryDate
        });
      } else {
        setOrganization(null);
      }
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
      // First try to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass
      });

      let userId: string | null = null;

      if (error) {
        // If user already exists in auth, try to login instead
        if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          });
          
          if (loginError) {
            throw new Error('البريد مسجل مسبقاً. تحقق من كلمة المرور أو استخدم بريداً آخر.');
          }
          
          userId = loginData.user?.id || null;
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
        
        // Auto login after signup (if not already logged in)
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
  };

  // Employee Sign Up (using employee activation code)
  const signUpEmployee = async (email: string, pass: string, code: string) => {
    isInternalAuthOp.current = true;
    try {
      // First try to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass
      });

      let userId: string | null = null;

      if (error) {
        // If user already exists in auth, try to login instead
        if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          });
          
          if (loginError) {
            throw new Error('البريد مسجل مسبقاً. تحقق من كلمة المرور أو استخدم بريداً آخر.');
          }
          
          userId = loginData.user?.id || null;
        } else {
          throw error;
        }
      } else {
        userId = data.user?.id || null;
      }

      if (userId) {
        // Use employee activation code
        const { error: rpcError } = await supabase.rpc('activate_employee', {
          p_user_id: userId,
          p_activation_code: code
        });
        if (rpcError) throw rpcError;

        addNotification('تم تفعيل حساب الموظف بنجاح', 'success');
        
        // Auto login after signup (if not already logged in)
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
  };

  const loginDeveloper = async (email: string, pass: string): Promise<boolean> => {
    isInternalAuthOp.current = true;
    try {
      // Check if developer exists in our tables
      const devCheck = await supabase.from('user_roles').select('id').eq('role', 'DEVELOPER').limit(1);
      const devExists = (devCheck.data?.length || 0) > 0;

      if (!devExists) {
        // No developer in system - try to create or use existing auth user
        
        // First, try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass
        });

        let userId: string | null = null;

        if (signUpError) {
          // If user already exists in auth, try to login instead
          if (signUpError.message?.includes('already registered') || signUpError.code === 'user_already_exists') {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: pass
            });
            
            if (loginError) {
              addNotification('كلمة المرور غير صحيحة', 'error');
              return false;
            }
            
            userId = loginData.user?.id || null;
          } else {
            throw signUpError;
          }
        } else {
          userId = signUpData.user?.id || null;
        }

        if (userId) {
          // Create profile if not exists
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

          // Add developer role
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: userId,
            role: 'DEVELOPER'
          });
          
          if (roleError && !roleError.message?.includes('duplicate')) {
            throw roleError;
          }

          addNotification('تم تفعيل حساب المطور بنجاح', 'success');
          
          // Resolve profile to set state
          await resolveProfile(userId);
          setDeveloperExists(true);
          return true;
        }
      } else {
        // Developer already exists - try to login (only one developer allowed)
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass
        });
        
        if (loginError) {
          addNotification('بيانات المطور غير صحيحة', 'error');
          return false;
        }
        
        if (loginData.user) {
          // Check if the logged-in user has developer role
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', loginData.user.id)
            .eq('role', 'DEVELOPER')
            .limit(1);
          
          if (!roles || roles.length === 0) {
            // User is not a developer - logout and show error
            await supabase.auth.signOut();
            addNotification('يوجد مطور مسجل بالفعل. لا يمكن إضافة مطور آخر.', 'error');
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
            
            // Get the pending employee we just created
            const { data: pendingData } = await supabase
              .from('pending_employees')
              .select('*')
              .eq('activation_code', data)
              .single();
            
            const employee: PendingEmployee | null = pendingData ? {
              id: pendingData.id,
              name: pendingData.name,
              phone: pendingData.phone,
              role: pendingData.role as UserRole,
              employee_type: pendingData.employee_type as EmployeeType,
              activation_code: pendingData.activation_code,
              is_used: pendingData.is_used,
              created_at: new Date(pendingData.created_at).getTime()
            } : null;
            
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
