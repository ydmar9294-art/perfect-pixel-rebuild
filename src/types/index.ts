// ==========================================
// SMART SALES SYSTEM - TYPES
// ==========================================

export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  OWNER = 'OWNER',
  EMPLOYEE = 'EMPLOYEE'
}

export enum EmployeeType {
  FIELD_AGENT = 'FIELD_AGENT',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum LicenseStatus {
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED'
}

export enum LicenseType {
  TRIAL = 'TRIAL',
  PERMANENT = 'PERMANENT'
}

export enum PaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  employeeType?: EmployeeType;
  licenseKey?: string;
}

export interface Organization {
  id: string;
  name: string;
  licenseStatus?: LicenseStatus;
  expiryDate?: number;
}

export interface Product {
  id: string;
  organization_id?: string;
  name: string;
  category: string;
  costPrice: number;
  basePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isDeleted: boolean;
}

export interface Customer {
  id: string;
  organization_id?: string;
  name: string;
  phone?: string;
  balance: number;
  created_at?: string;
}

export interface Sale {
  id: string;
  organization_id?: string;
  customer_id: string;
  customerName: string;
  grandTotal: number;
  paidAmount: number;
  remaining: number;
  paymentType: PaymentType;
  isVoided: boolean;
  voidReason?: string;
  timestamp: number;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  notes?: string;
  isReversed: boolean;
  reverseReason?: string;
  timestamp: number;
}

export interface License {
  id: string;
  licenseKey: string;
  orgName: string;
  type: LicenseType;
  status: LicenseStatus;
  ownerId?: string;
  issuedAt: number;
  expiryDate?: number;
  daysValid?: number;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}
