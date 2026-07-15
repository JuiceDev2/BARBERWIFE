# GUÍA RÁPIDA DE INTEGRACIÓN

## FASE 1: SETUP INICIAL (30 minutos)

### 1. Crear proyecto Next.js 15
```bash
npx create-next-app@latest estilo-alejandra --typescript --tailwind
cd estilo-alejandra
```

### 2. Instalar dependencias
```bash
npm install
# Ya están en package.json
```

### 3. Copiar archivos
```bash
# Estructura de carpetas
mkdir -p app/{auth,booking,admin,stylist,client} components/{landing,booking,admin,ui,common} lib/{supabase,actions,schemas,hooks} types supabase/migrations public/icons

# Copiar archivos .tsx
# (El asistente generó todos los archivos)
```

### 4. Setup Supabase
```bash
# Opción 1: Cloud (recomendado)
# 1. Ir a supabase.com
# 2. Crear proyecto
# 3. Copiar URL y ANON KEY

# Opción 2: Local
npm install -g supabase
supabase login
supabase init
supabase start
```

### 5. Configurar variables de entorno
```bash
cp .env.local.example .env.local
# Editar con tu SUPABASE_URL y ANON_KEY
```

---

## FASE 2: BASE DE DATOS (20 minutos)

### 1. Ejecutar schema
```bash
# En Supabase SQL Editor, ejecutar:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_rls_policies.sql

# O via CLI:
supabase db push
```

### 2. Verificar tablas
```sql
-- En Supabase SQL Editor, ejecutar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Debe mostrar:
-- appointments
-- appointment_services
-- inventory_supplies
-- notification_queue
-- products
-- sales
-- sale_items
-- services
-- tickets
-- users
```

### 3. Habilitar RLS
```sql
-- Verificar que RLS está habilitado:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Todos deben tener: rowsecurity = true
```

### 4. Crear usuario admin (primero)
```sql
-- En Supabase SQL Editor
-- 1. Primero crear user en Auth tab
-- 2. Copiar el UUID generado
-- 3. Ejecutar:

INSERT INTO users (id, email, full_name, phone, role)
VALUES (
  'uuid-copiado-aqui',
  'admin@example.com',
  'Alejandra G',
  '+1234567890',
  'admin'
);
```

---

## FASE 3: FRONTEND (1 hora)

### 1. Copiar componentes
```bash
# Desde /home/claude/ copiar:
components/landing/Hero.tsx
components/booking/ServiceSelector.tsx
components/booking/CalendarPicker.tsx
components/booking/TimeSlotSelector.tsx
components/booking/ClientDataForm.tsx
components/providers.tsx
components/auth-provider.tsx
components/toast-provider.tsx
```

### 2. Copiar lib
```bash
lib/actions/booking.ts
lib/schemas/booking.ts
lib/supabase/queries.ts
```

### 3. Copiar app layout
```bash
app/layout.tsx (app-layout.tsx)
app/(booking)/layout.tsx (booking-layout.tsx)
app/(booking)/agendar/page.tsx (booking-page.tsx)
app/page.tsx (landing - crear con Hero)
```

### 4. Copiar config
```bash
next.config.ts
public/manifest.json
```

---

## FASE 4: TESTING LOCAL (30 minutos)

### 1. Iniciar dev server
```bash
npm run dev
# http://localhost:3000
```

### 2. Probar landing
```
✓ Visita http://localhost:3000
✓ Verifica Hero se ve bien
✓ Click en "Agendar Cita Ahora" → /agendar/servicios
```

### 3. Probar selección de servicios
```
✓ La página debería estar vacía (sin servicios en BD)
✓ Ir a Supabase → insert servicios de ejemplo
```

### 4. Agregar servicios de ejemplo
En Supabase SQL Editor:
```sql
INSERT INTO services (name, price, duration_minutes, category, is_active)
VALUES 
  ('Corte Hombre', 25.00, 30, 'hair', true),
  ('Corte Mujer', 35.00, 45, 'hair', true),
  ('Maquillaje Social', 40.00, 60, 'makeup', true),
  ('Uñas Acrílicas', 45.00, 90, 'nails', true),
  ('Facial Básico', 50.00, 60, 'skin', true);
```

### 5. Volver a probar
```
✓ Recarga http://localhost:3000/agendar/servicios
✓ Deberías ver servicios
✓ Click en checkbox → suma precio/duración
✓ Click en "Continuar" → Calendario
✓ Selecciona fecha → Time slots
✓ Selecciona hora → Datos cliente
✓ Ingresa nombre + teléfono → Confirmación
```

### 6. Verificar en BD
En Supabase:
```sql
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
-- Debe mostrar tu cita creada
```

---

## FASE 5: AUTENTICACIÓN (30 minutos)

### 1. Crear página login
`app/(auth)/login/page.tsx`
```typescript
'use client';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

### 2. Crear componente LoginForm
`components/auth/LoginForm.tsx`
```typescript
'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/perfil');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 text-white p-2 rounded"
      >
        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### 3. Probar auth
```
✓ Click en "Iniciar Sesión" en ClientDataForm
✓ Ir a /login
✓ Usar email admin@example.com que creaste
✓ Contraseña que configuraste en Supabase Auth
✓ Deberías redirectar a /perfil
```

---

## FASE 6: PANEL DEL ESTILISTA (1 hora)

### 1. Crear layout stylist
`app/(stylist)/layout.tsx`
```typescript
'use client';
import { useAuth } from '@/components/auth-provider';
import { redirect } from 'next/navigation';

export default function StylistLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (user?.role !== 'stylist' && user?.role !== 'admin') {
    redirect('/');
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
```

### 2. Crear lista de citas
`app/(stylist)/citas-hoy/page.tsx`
```typescript
'use server';
import { getTodayAppointments } from '@/lib/supabase/queries';

export default async function TodayAppointmentsPage() {
  const appointments = await getTodayAppointments(['confirmed', 'in_progress']);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Citas de Hoy</h1>
      
      {appointments.length === 0 ? (
        <p>No hay citas para hoy</p>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-4 rounded-lg border">
              <p className="font-semibold">
                {apt.guest_name || apt.user?.full_name}
              </p>
              <p className="text-sm text-gray-600">
                {apt.start_time} - {apt.end_time}
              </p>
              <p className="text-sm">
                ${apt.total_price.toFixed(2)}
              </p>
              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
                Iniciar Servicio
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Probar panel estilista
```
✓ Login como admin
✓ Visita /stylist/citas-hoy
✓ Deberías ver las citas creadas
✓ (Botón "Iniciar Servicio" sin funcionalidad aún)
```

---

## FASE 7: PANEL DE ADMIN (1.5 horas)

### 1. Dashboard
`app/(admin)/dashboard/page.tsx`
```typescript
'use server';
import { getDashboardMetrics } from '@/lib/supabase/queries';

export default async function AdminDashboard() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Citas Hoy</p>
          <p className="text-3xl font-bold">{metrics.appointmentsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Confirmadas</p>
          <p className="text-3xl font-bold">{metrics.confirmedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Completadas</p>
          <p className="text-3xl font-bold">{metrics.completedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Ingresos</p>
          <p className="text-3xl font-bold">${metrics.totalRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
```

### 2. CRUD Servicios
`app/(admin)/servicios/page.tsx`
```typescript
'use server';
import { getServices } from '@/lib/supabase/queries';

export default async function ServicesPage() {
  const services = await getServices(false); // Show all, even inactive

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios</h1>
        <a href="/admin/servicios/new" className="bg-green-600 text-white px-4 py-2 rounded">
          + Nuevo Servicio
        </a>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Nombre</th>
              <th className="p-4 text-left">Precio</th>
              <th className="p-4 text-left">Duración</th>
              <th className="p-4 text-left">Categoría</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t">
                <td className="p-4">{service.name}</td>
                <td className="p-4">${service.price}</td>
                <td className="p-4">{service.duration_minutes} min</td>
                <td className="p-4">{service.category}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4">
                  <a href={`/admin/servicios/${service.id}/edit`} className="text-blue-600 hover:underline">
                    Editar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## FASE 8: PWA & DEPLOYMENT (30 minutos)

### 1. Probar PWA local
```bash
npm run build
npm run start
# Abre http://localhost:3000
# En Chrome: Menu → "Instalar aplicación"
# En Android: "Instalar app"
```

### 2. Desplegar a Vercel
```bash
npm install -g vercel
vercel
# Seguir prompts
# Agregar env vars en Vercel dashboard
```

### 3. Verificar en producción
```
✓ https://tu-app.vercel.app funciona
✓ PWA instalable
✓ RLS activo
✓ Agendamiento funcionando
```

---

## 🎯 ORDEN DE PRIORIDAD PARA IMPLEMENTAR

1. **CRÍTICO (Día 1)**
   - Setup Supabase + schema
   - Landing page
   - Flujo de agendamiento (guest)
   - Base de datos funcionando

2. **IMPORTANTE (Día 2-3)**
   - Autenticación (login/register)
   - Panel estilista (citas hoy)
   - Dashboard admin

3. **DESEABLE (Día 4-5)**
   - CRUD servicios completo
   - Caja de cobro
   - Gestión de inventario

4. **FUTURO**
   - WhatsApp API
   - Pasarelas de pago
   - Reportes avanzados

---

## ⚠️ PROBLEMAS COMUNES

### "RLS policies no funcionan"
```
→ Verificar que RLS está HABILITADO en table
→ Usuarios deben tener row en tabla users con rol correcto
→ Probar con SQL: SELECT * FROM tabla
```

### "Horarios no se cargan"
```
→ Asegurar citas en BD tienen status = 'confirmed'
→ Verificar formato de time (HH:mm)
→ Revisar queries con SELECT * FROM appointments WHERE scheduled_at::date = current_date
```

### "Error: "No autorizado""
```
→ Verificar policy RLS permite operación
→ Probar con admin primero (debería funcionar siempre)
→ Revisar auth().uid() en policies
```

---

**TIEMPO TOTAL ESTIMADO**: ~4 horas
**RESULTADO**: ✅ Aplicación funcionando MVP

¡A codificar! 🚀
