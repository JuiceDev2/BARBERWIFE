-- supabase/migrations/004_fix_rls_recursion.sql
-- Corrige "infinite recursion detected in policy for relation users".
-- Causa: las políticas de la tabla `users` consultaban la propia tabla
-- `users` para saber si auth.uid() es admin, lo cual dispara sus propias
-- políticas de nuevo -> recursión infinita. Esto rompía la consulta del
-- perfil en AuthProvider para TODOS los usuarios (no solo admins).
--
-- Solución estándar de Supabase: funciones SECURITY DEFINER que leen
-- el rol saltándose RLS, y referenciar esas funciones en las políticas
-- en lugar de subconsultas directas sobre `users`.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_my_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_stylist()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_my_role() IN ('admin', 'stylist');
$$;

-- ============ users ============
DROP POLICY IF EXISTS "admins_see_all_users" ON users;
DROP POLICY IF EXISTS "clients_see_own_profile" ON users;
DROP POLICY IF EXISTS "stylists_see_clients" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;

CREATE POLICY "users_select_own_or_admin" ON users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "stylists_see_clients" ON users
  FOR SELECT USING (role = 'client' OR public.is_admin_or_stylist());

CREATE POLICY "admins_update_users" ON users
  FOR UPDATE USING (public.is_admin());

-- clients_update_own_profile no es recursiva, se deja igual.

-- ============ services ============
DROP POLICY IF EXISTS "admins_see_all_services" ON services;
DROP POLICY IF EXISTS "admins_manage_services" ON services;

CREATE POLICY "admins_see_all_services" ON services
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_manage_services" ON services
  FOR ALL USING (public.is_admin());

-- ============ appointments ============
DROP POLICY IF EXISTS "admins_see_all_appointments" ON appointments;
DROP POLICY IF EXISTS "clients_see_own_appointments" ON appointments;
DROP POLICY IF EXISTS "stylists_see_assigned_appointments" ON appointments;
DROP POLICY IF EXISTS "stylists_update_assigned_appointments" ON appointments;
DROP POLICY IF EXISTS "admins_manage_appointments" ON appointments;

CREATE POLICY "admins_see_all_appointments" ON appointments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "clients_see_own_appointments" ON appointments
  FOR SELECT USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "stylists_see_assigned_appointments" ON appointments
  FOR SELECT USING (stylist_id = auth.uid() OR public.is_admin());

CREATE POLICY "stylists_update_assigned_appointments" ON appointments
  FOR UPDATE USING (stylist_id = auth.uid() OR public.is_admin());

CREATE POLICY "admins_manage_appointments" ON appointments
  FOR ALL USING (public.is_admin());

-- ============ appointment_services ============
DROP POLICY IF EXISTS "users_see_appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "admins_manage_appointment_services" ON appointment_services;

CREATE POLICY "users_see_appointment_services" ON appointment_services
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE
        client_id = auth.uid() OR
        stylist_id = auth.uid() OR
        public.is_admin()
    )
  );

CREATE POLICY "admins_manage_appointment_services" ON appointment_services
  FOR ALL USING (public.is_admin());

-- ============ products ============
DROP POLICY IF EXISTS "admins_see_all_products" ON products;
DROP POLICY IF EXISTS "stylists_see_products" ON products;
DROP POLICY IF EXISTS "admins_manage_products" ON products;

CREATE POLICY "admins_see_all_products" ON products
  FOR SELECT USING (public.is_admin());

CREATE POLICY "stylists_see_products" ON products
  FOR SELECT USING (is_active = true OR public.is_admin_or_stylist());

CREATE POLICY "admins_manage_products" ON products
  FOR ALL USING (public.is_admin());

-- ============ inventory_supplies ============
DROP POLICY IF EXISTS "admins_see_inventory_supplies" ON inventory_supplies;
DROP POLICY IF EXISTS "admins_manage_inventory_supplies" ON inventory_supplies;

CREATE POLICY "admins_see_inventory_supplies" ON inventory_supplies
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_manage_inventory_supplies" ON inventory_supplies
  FOR ALL USING (public.is_admin());

-- ============ sales ============
DROP POLICY IF EXISTS "admins_see_all_sales" ON sales;
DROP POLICY IF EXISTS "stylists_see_own_sales" ON sales;
DROP POLICY IF EXISTS "clients_see_own_sales" ON sales;
DROP POLICY IF EXISTS "admins_manage_sales" ON sales;

CREATE POLICY "admins_see_all_sales" ON sales
  FOR SELECT USING (public.is_admin());

CREATE POLICY "stylists_see_own_sales" ON sales
  FOR SELECT USING (stylist_id = auth.uid() OR public.is_admin());

CREATE POLICY "clients_see_own_sales" ON sales
  FOR SELECT USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "admins_manage_sales" ON sales
  FOR ALL USING (public.is_admin());

-- ============ sale_items ============
DROP POLICY IF EXISTS "users_see_sale_items" ON sale_items;
DROP POLICY IF EXISTS "admins_manage_sale_items" ON sale_items;

CREATE POLICY "users_see_sale_items" ON sale_items
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE
        stylist_id = auth.uid() OR
        client_id = auth.uid() OR
        public.is_admin()
    )
  );

CREATE POLICY "admins_manage_sale_items" ON sale_items
  FOR ALL USING (public.is_admin());

-- ============ tickets ============
DROP POLICY IF EXISTS "admins_see_all_tickets" ON tickets;
DROP POLICY IF EXISTS "stylists_see_own_tickets" ON tickets;
DROP POLICY IF EXISTS "clients_see_own_tickets" ON tickets;

CREATE POLICY "admins_see_all_tickets" ON tickets
  FOR SELECT USING (public.is_admin());

CREATE POLICY "stylists_see_own_tickets" ON tickets
  FOR SELECT USING (
    sale_id IN (SELECT id FROM sales WHERE stylist_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "clients_see_own_tickets" ON tickets
  FOR SELECT USING (
    sale_id IN (SELECT id FROM sales WHERE client_id = auth.uid())
    OR public.is_admin()
  );

-- ============ notification_queue ============
DROP POLICY IF EXISTS "admins_see_notifications" ON notification_queue;

CREATE POLICY "admins_see_notifications" ON notification_queue
  FOR SELECT USING (public.is_admin());
