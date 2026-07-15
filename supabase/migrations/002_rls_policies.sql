-- supabase/migrations/002_rls_policies.sql
-- POLÍTICAS RLS AGRESIVAS

-- TABLA: users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_all_users" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_see_own_profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_see_clients" ON users
  FOR SELECT USING (
    role = 'client' OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin' OR role = 'stylist')
  );

CREATE POLICY "admins_update_users" ON users
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_update_own_profile" ON users
  FOR UPDATE USING (
    auth.uid() = id
  ) WITH CHECK (
    auth.uid() = id AND role = 'client'
  );

-- TABLA: services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_sees_active_services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "admins_see_all_services" ON services
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "admins_manage_services" ON services
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_all_appointments" ON appointments
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_see_own_appointments" ON appointments
  FOR SELECT USING (
    client_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_see_assigned_appointments" ON appointments
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_insert_own_appointments" ON appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
  );

CREATE POLICY "clients_update_own_appointments" ON appointments
  FOR UPDATE USING (
    client_id = auth.uid() AND status IN ('pending', 'confirmed')
  );

CREATE POLICY "stylists_update_assigned_appointments" ON appointments
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "admins_manage_appointments" ON appointments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: appointment_services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_appointment_services" ON appointment_services
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE 
        client_id = auth.uid() OR
        stylist_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    )
  );

CREATE POLICY "admins_manage_appointment_services" ON appointment_services
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_sees_active_products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "admins_see_all_products" ON products
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_see_products" ON products
  FOR SELECT USING (
    is_active = true OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin' OR role = 'stylist')
  );

CREATE POLICY "admins_manage_products" ON products
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: inventory_supplies
ALTER TABLE inventory_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_inventory_supplies" ON inventory_supplies
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "admins_manage_inventory_supplies" ON inventory_supplies
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_all_sales" ON sales
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_see_own_sales" ON sales
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_see_own_sales" ON sales
  FOR SELECT USING (
    client_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_create_sales" ON sales
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid()
  );

CREATE POLICY "stylists_update_own_sales" ON sales
  FOR UPDATE USING (
    stylist_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "admins_manage_sales" ON sales
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: sale_items
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_sale_items" ON sale_items
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE
        stylist_id = auth.uid() OR
        client_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    )
  );

CREATE POLICY "admins_manage_sale_items" ON sale_items
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_all_tickets" ON tickets
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "stylists_see_own_tickets" ON tickets
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE stylist_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "clients_see_own_tickets" ON tickets
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE client_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- TABLA: notification_queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_notifications" ON notification_queue
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
