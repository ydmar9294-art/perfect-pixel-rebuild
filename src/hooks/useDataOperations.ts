/**
 * Data Operations Hook - Centralized data fetching and mutation logic
 * Internal refactoring - no behavior changes
 */
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Product, Customer, Sale, Payment, License, EmployeeType } from '@/types';

// ============================================
// Types
// ============================================

export interface Purchase {
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

export interface Delivery {
  id: string;
  distributor_name: string;
  status: string;
  notes?: string;
  created_at: number;
}

export interface PendingEmployee {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  employee_type: EmployeeType;
  activation_code: string;
  is_used: boolean;
  created_at: number;
}

export interface FetchedData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  payments: Payment[];
  purchases: Purchase[];
  deliveries: Delivery[];
  pendingEmployees: PendingEmployee[];
  users: any[];
  licenses: License[];
}

// ============================================
// Data Transformation Utilities
// ============================================

export const transformProduct = (p: any): Product => ({
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
});

export const transformCustomer = (c: any): Customer => ({
  id: c.id,
  organization_id: c.organization_id,
  name: c.name,
  phone: c.phone,
  balance: Number(c.balance),
  created_at: c.created_at,
  created_by: c.created_by,
  location: c.location
});

export const transformSale = (s: any): Sale => ({
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
});

export const transformPayment = (p: any): Payment => ({
  id: p.id,
  saleId: p.sale_id,
  amount: Number(p.amount),
  notes: p.notes,
  isReversed: p.is_reversed,
  reverseReason: p.reverse_reason,
  timestamp: new Date(p.created_at).getTime()
});

export const transformPurchase = (p: any): Purchase => ({
  id: p.id,
  product_id: p.product_id,
  product_name: p.product_name,
  quantity: p.quantity,
  unit_price: Number(p.unit_price),
  total_price: Number(p.total_price),
  supplier_name: p.supplier_name,
  notes: p.notes,
  created_at: new Date(p.created_at).getTime()
});

export const transformDelivery = (d: any): Delivery => ({
  id: d.id,
  distributor_name: d.distributor_name,
  status: d.status,
  notes: d.notes,
  created_at: new Date(d.created_at).getTime()
});

export const transformPendingEmployee = (e: any): PendingEmployee => ({
  id: e.id,
  name: e.name,
  phone: e.phone,
  role: e.role as UserRole,
  employee_type: e.employee_type as EmployeeType,
  activation_code: e.activation_code,
  is_used: e.is_used,
  created_at: new Date(e.created_at).getTime()
});

export const transformLicense = (l: any): License => ({
  id: l.id,
  licenseKey: l.licenseKey,
  orgName: l.orgName,
  type: l.type,
  status: l.status,
  ownerId: l.ownerId,
  issuedAt: new Date(l.issuedAt).getTime(),
  expiryDate: l.expiryDate ? new Date(l.expiryDate).getTime() : undefined,
  daysValid: l.days_valid
});

export const transformUser = (u: any) => ({
  id: u.id,
  name: u.full_name,
  email: '',
  phone: u.phone || '',
  role: u.role,
  employeeType: u.employee_type,
  licenseKey: u.license_key
});

// ============================================
// Fetch Operations
// ============================================

/**
 * Fetch all organization data in parallel
 * Uses Promise.all for efficiency
 */
export const fetchOrganizationData = async (
  organizationId: string,
  role: UserRole
): Promise<Partial<FetchedData>> => {
  const [productsRes, customersRes, salesRes, paymentsRes, purchasesRes, deliveriesRes, pendingRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_deleted', false),
    supabase.from('customers').select('*'),
    supabase.from('sales').select('*').order('created_at', { ascending: false }),
    supabase.from('collections').select('*').order('created_at', { ascending: false }),
    supabase.from('purchases').select('*').order('created_at', { ascending: false }),
    supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
    role === UserRole.OWNER 
      ? supabase.from('pending_employees').select('*').eq('is_used', false).order('created_at', { ascending: false }) 
      : Promise.resolve({ data: [] })
  ]);

  let usersRes: any = null;
  if (role === UserRole.OWNER && organizationId) {
    usersRes = await supabase.from('profiles').select('*').eq('organization_id', organizationId);
  }

  return {
    products: (productsRes?.data || []).map(transformProduct),
    customers: (customersRes?.data || []).map(transformCustomer),
    sales: (salesRes?.data || []).map(transformSale),
    payments: (paymentsRes?.data || []).map(transformPayment),
    purchases: (purchasesRes?.data || []).map(transformPurchase),
    deliveries: (deliveriesRes?.data || []).map(transformDelivery),
    pendingEmployees: role === UserRole.OWNER ? (pendingRes?.data || []).map(transformPendingEmployee) : [],
    users: role === UserRole.OWNER && usersRes?.data ? usersRes.data.map(transformUser) : []
  };
};

/**
 * Fetch developer-specific data (licenses)
 */
export const fetchDeveloperData = async (): Promise<Partial<FetchedData>> => {
  const licensesRes = await supabase
    .from('developer_licenses')
    .select('*')
    .order('issuedAt', { ascending: false });

  return {
    licenses: (licensesRes?.data || []).map(transformLicense)
  };
};

// ============================================
// Request Deduplication Hook
// ============================================

/**
 * Hook to prevent duplicate concurrent requests
 * Useful for preventing race conditions when multiple components
 * trigger the same data refresh
 */
export const useRequestDeduplication = () => {
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  const deduplicateRequest = useCallback(async <T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> => {
    // If there's already a pending request with this key, return it
    const existing = pendingRequests.current.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    // Create new request and store it
    const promise = request().finally(() => {
      pendingRequests.current.delete(key);
    });

    pendingRequests.current.set(key, promise);
    return promise;
  }, []);

  return { deduplicateRequest };
};

// ============================================
// Debounce Hook for Data Refresh
// ============================================

/**
 * Hook to debounce rapid consecutive data refresh calls
 */
export const useDebounce = (delay: number = 300) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const debounce = useCallback((callback: () => void) => {
    pendingCallbackRef.current = callback;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (pendingCallbackRef.current) {
        pendingCallbackRef.current();
        pendingCallbackRef.current = null;
      }
      timeoutRef.current = null;
    }, delay);
  }, [delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingCallbackRef.current = null;
  }, []);

  return { debounce, cancel };
};
