# ⚡ SETUP RÁPIDO - Estética Unisex de Alejandra G

## 🚀 PASO 1: REQUISITOS PREVIOS

```bash
# Node.js 18+
node --version
npm --version

# Git (opcional)
git --version
```

## 📦 PASO 2: INSTALAR DEPENDENCIAS

```bash
npm install
```

## 🗂️ PASO 3: GENERAR ARCHIVOS TYPESCRIPT

Ejecuta este script para crear todos los archivos:

```bash
npm run setup:files
```

**O manualmente:**

Ve a la sección "ARCHIVOS POR CREAR" en este documento y copia cada archivo a su ubicación.

## 🔑 PASO 4: CONFIGURAR SUPABASE

### Opción A: Cloud (Recomendado)

1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta y nuevo proyecto
3. Copiar "Project URL" y "Anon Key"
4. Pegar en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Opción B: Local

```bash
npm install -g supabase
supabase login
supabase init
supabase start
```

## 🗄️ PASO 5: CREAR SCHEMA DE BD

En **Supabase SQL Editor**, copiar y ejecutar:

- **Primero:** `supabase/migrations/001_initial_schema.sql`
- **Luego:** `supabase/migrations/002_rls_policies.sql`

O:
```bash
supabase db push
```

## 👤 PASO 6: CREAR USUARIO ADMIN

En **Supabase Dashboard:**

1. Auth → Users → Add user
2. Email: `admin@example.com`
3. Password: `tu-contraseña-segura`

En **Supabase SQL Editor**:
```sql
-- Reemplazar 'uuid-aqui' con el ID del usuario creado
INSERT INTO users (id, email, full_name, phone, role)
VALUES (
  'uuid-aqui',
  'admin@example.com',
  'Alejandra G',
  '+1234567890',
  'admin'
);
```

## 🧪 PASO 7: PROBAR LOCALMENTE

```bash
npm run dev
# Abre http://localhost:3000
```

✅ Deberías ver la landing page
✅ Click "Agendar Cita Ahora" → Flujo de agendamiento

## 📊 PASO 8: AGREGAR SERVICIOS DE EJEMPLO

En **Supabase SQL Editor**:

```sql
INSERT INTO services (name, price, duration_minutes, category, is_active)
VALUES 
  ('Corte Hombre', 25.00, 30, 'hair', true),
  ('Corte Mujer', 35.00, 45, 'hair', true),
  ('Maquillaje Social', 40.00, 60, 'makeup', true),
  ('Uñas Acrílicas', 45.00, 90, 'nails', true),
  ('Facial Básico', 50.00, 60, 'skin', true);
```

## 🚀 PASO 9: DESPLEGAR A VERCEL

```bash
npm install -g vercel
vercel login
vercel
```

**En dashboard de Vercel:**
1. Agregar env vars (SUPABASE_URL, ANON_KEY, etc)
2. Deploy automático en push a Git

---

# 📋 ARCHIVOS POR CREAR

> Si `npm run setup:files` no funciona, crea estos archivos manualmente:

## 1. TIPOS (types/index.ts)
[Ver PROYECTO-RESUMEN.md para contenido]

## 2. COMPONENTES (components/)

### Landing
- `components/landing/Hero.tsx`

### Booking
- `components/booking/ServiceSelector.tsx`
- `components/booking/CalendarPicker.tsx`
- `components/booking/TimeSlotSelector.tsx`
- `components/booking/ClientDataForm.tsx`

### Providers
- `components/providers.tsx`
- `components/auth-provider.tsx`
- `components/toast-provider.tsx`

## 3. CONFIGURACIÓN (raíz)

- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`

## 4. PÚBLICOS (public/)

- `public/manifest.json`
- `public/service-worker.js`

## 5. STYLES (styles/)

- `styles/globals.css`

## 6. APP PAGES (app/)

- `app/layout.tsx`
- `app/page.tsx` (landing)
- `app/(booking)/layout.tsx`
- `app/(booking)/agendar/page.tsx`

## 7. LIB

- `lib/schemas/booking.ts`
- `lib/actions/booking.ts`
- `lib/supabase/queries.ts`
- `lib/supabase/client.ts`

---

# 🐛 TROUBLESHOOTING

### Error: "Cannot find module '@/components/ui/button'"

→ Falta instalar shadcn/ui:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
```

### Error: "RLS policies not working"

→ Verificar en Supabase:
- Tablas tienen RLS habilitado
- Policies están creadas
- Usuario tiene row en tabla `users` con role correcto

### Error: "No horarios disponibles"

→ Verificar:
- Servicios existen en BD
- Fechas son futuras
- Horarios caen dentro de 09:00 - 19:00

---

# ✅ CHECKLIST ANTES DE PRODUCCIÓN

- [ ] Supabase proyecto creado
- [ ] Schema SQL ejecutado
- [ ] RLS policies activas
- [ ] Usuario admin creado
- [ ] Servicios agregados
- [ ] Todos los archivos .tsx creados
- [ ] npm install ejecutado
- [ ] npm run dev funciona
- [ ] Flujo agendamiento completo probado
- [ ] PWA instalable en móvil
- [ ] .env.local configurado
- [ ] Deploy a Vercel exitoso

---

**¿Dudas?** Ver:
- `README.md` - Guía completa
- `GUIA-INTEGRACION.md` - Step by step
- `PROYECTO-RESUMEN.md` - Qué se incluyó

**¡A codificar! 🚀**
