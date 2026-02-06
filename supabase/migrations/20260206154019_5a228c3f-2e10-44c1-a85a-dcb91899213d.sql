
-- =====================================================
-- SECURITY FIX: Replace ineffective PERMISSIVE false policies
-- with proper RESTRICTIVE authentication requirements
-- =====================================================

-- COLLECTIONS
DROP POLICY IF EXISTS "Block unauthenticated access to collections" ON public.collections;
CREATE POLICY "Require auth for collections" ON public.collections AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- CUSTOMERS
DROP POLICY IF EXISTS "Default deny customers access" ON public.customers;
DROP POLICY IF EXISTS "Default deny customers delete" ON public.customers;
DROP POLICY IF EXISTS "Default deny customers insert" ON public.customers;
DROP POLICY IF EXISTS "Default deny customers update" ON public.customers;
CREATE POLICY "Require auth for customers" ON public.customers AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- DELIVERIES
DROP POLICY IF EXISTS "Block unauthenticated access to deliveries" ON public.deliveries;
CREATE POLICY "Require auth for deliveries" ON public.deliveries AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- DEVELOPER_LICENSES
DROP POLICY IF EXISTS "Block unauthenticated access to licenses" ON public.developer_licenses;
CREATE POLICY "Require auth for licenses" ON public.developer_licenses AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ORGANIZATIONS
DROP POLICY IF EXISTS "Block unauthenticated access to organizations" ON public.organizations;
CREATE POLICY "Require auth for organizations" ON public.organizations AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCTS
DROP POLICY IF EXISTS "Block unauthenticated access to products" ON public.products;
CREATE POLICY "Require auth for products" ON public.products AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- PURCHASES
DROP POLICY IF EXISTS "Block unauthenticated access to purchases" ON public.purchases;
CREATE POLICY "Require auth for purchases" ON public.purchases AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- SALES
DROP POLICY IF EXISTS "Block unauthenticated access to sales" ON public.sales;
CREATE POLICY "Require auth for sales" ON public.sales AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- USER_ROLES
DROP POLICY IF EXISTS "Block unauthenticated access to user_roles" ON public.user_roles;
CREATE POLICY "Require auth for user_roles" ON public.user_roles AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- PROFILES
DROP POLICY IF EXISTS "Default deny profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Block unauthenticated delete to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block unauthenticated insert to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block unauthenticated update to profiles" ON public.profiles;
CREATE POLICY "Require auth for profiles" ON public.profiles AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- TABLES WITHOUT ANY AUTH GATE (add RESTRICTIVE auth requirement)
CREATE POLICY "Require auth for invoice_snapshots" ON public.invoice_snapshots AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for organization_legal_info" ON public.organization_legal_info AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for pending_employees" ON public.pending_employees AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for stock_movements" ON public.stock_movements AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for delivery_items" ON public.delivery_items AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for distributor_inventory" ON public.distributor_inventory AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for purchase_returns" ON public.purchase_returns AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for purchase_return_items" ON public.purchase_return_items AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for sale_items" ON public.sale_items AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for sales_returns" ON public.sales_returns AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for sales_return_items" ON public.sales_return_items AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
