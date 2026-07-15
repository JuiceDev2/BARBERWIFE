# Estética Unisex de Alejandra G - Sistema de Agendamiento

Sistema completo de agendamiento y gestión de citas para un salón de estética unisex.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Hosting**: Vercel
- **PWA**: Instalable en Android/iOS/Desktop
- **Validación**: Zod
- **UI Components**: shadcn/ui + Radix UI

## 📋 Características Principales

- **Agendamiento**: Flujo intuitivo con selección de servicios, fecha, hora
- **Autenticación**: Email/password + Google (opcional)
- **Roles**: Admin, Estilista, Cliente
- **Panel del Estilista**: Gestión de citas del día, caja de cobro
- **Panel de Admin**: CRUD de servicios, inventario, usuarios
- **PWA**: Instalable nativo-like en móviles
- **Seguridad**: RLS estricto, validaciones Zod, protección contra inyección

## 🛠️ Instalación

### 1. Clonar repositorio y dependencias

```bash
git clone <repo-url>
cd estilo-alejandra
npm install
```

### 2. Configurar Supabase

#### a. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear cuenta
2. Crear nuevo proyecto
3. Copiar URL y anon key

#### b. Setup local (opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Inicializar local
supabase init

# Empezar servidor local
supabase start
```

#### c. Ejecutar migraciones

```bash
# Copiar schema
psql $SUPABASE_DB_URL < supabase/migrations/001_initial_schema.sql
psql $SUPABASE_DB_URL < supabase/migrations/002_rls_policies.sql

# O usando Supabase CLI
supabase db push
```

### 3. Variables de entorno

```bash
# Copiar archivo ejemplo
cp .env.local.example .env.local

# Editar con tus credenciales Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Crear usuario admin

En Supabase SQL Editor:

```sql
-- Crear user admin
INSERT INTO users (id, email, full_name, phone, role)
VALUES (
  'uuid-aqui',
  'admin@example.com',
  'Alejandra G',
  '+1234567890',
  'admin'
);
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
# Abre http://localhost:3000
```

## 📁 Estructura de Carpetas

```
estilo-alejandra/
├── app/                      # App Router de Next.js
│   ├── (auth)/              # Rutas de autenticación
│   ├── (booking)/           # Flujo de agendamiento
│   ├── (admin)/             # Panel administrativo
│   ├── (stylist)/           # Panel del estilista
│   └── (client)/            # Perfil de cliente
├── components/
│   ├── landing/             # Hero, Servicios, etc
│   ├── booking/             # Componentes de agendamiento
│   ├── admin/               # Componentes admin
│   ├── ui/                  # shadcn/ui components
│   └── common/              # Componentes reutilizables
├── lib/
│   ├── supabase/           # Cliente de Supabase
│   ├── actions/            # Server Actions
│   ├── schemas/            # Zod schemas
│   └── hooks/              # Custom hooks
├── types/                  # TypeScript types
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── seed.sql            # Datos iniciales
└── public/                 # Archivos estáticos y PWA
```

## 🔐 Seguridad

### RLS (Row Level Security)

- **Admin**: Ve todo, puede modificar todo
- **Stylist**: Ve citas del día, clientes, sus propias ventas
- **Client**: Ve solo sus citas y compras
- **Guest**: Solo lectura de servicios activos

### Validaciones

- Zod para validación de inputs
- Server-side validation en todas las acciones
- Sanitización de datos
- CSRF protection via Next.js

## 🚀 Deployment a Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# O vincular repositorio en vercel.com
```

**Pasos en Vercel Dashboard:**

1. Importar proyecto de GitHub
2. Agregar variables de entorno (SUPABASE_URL, SUPABASE_ANON_KEY, etc)
3. Deploy automático en cada push

## 📱 PWA

La app es instalable como PWA:

- **Android**: Chrome → Menu → "Instalar aplicación"
- **iOS**: Safari → Share → "Agregar a pantalla de inicio"
- **Desktop**: Chrome → Menu → "Instalar"

## 🔄 Workflows principales

### 1. Cliente agendando cita (Guest)

1. Home → "Agendar Cita Ahora"
2. Selecciona servicios (checkboxes)
3. Selecciona fecha en calendario
4. Selecciona horario disponible
5. Ingresa nombre + teléfono
6. Confirmación instantánea + SMS

### 2. Estilista procesando cita

1. Dashboard → "Citas Hoy"
2. Click en cita → "Iniciar Servicio"
3. Agregar productos durante el servicio
4. "Finalizar Servicio" → Caja de cobro
5. Seleccionar método de pago
6. Generar + Compartir ticket

### 3. Admin gestión

1. Dashboard → Ver métricas
2. Servicios → CRUD completo
3. Usuarios → Gestionar roles
4. Inventario → Stock
5. Historial → Reportes

## 🔌 Integraciones Futuras

### WhatsApp Business API

```javascript
// Ya preparado en: lib/actions/booking.ts
// TODO: Enviar notificación WhatsApp
```

Pasos:
1. Solicitar acceso a WhatsApp Business API
2. Configurar webhook en Vercel
3. Reemplazar console.log con llamada a API

### Pasarelas de Pago

- Stripe, MercadoPago, PayPal
- Agregar en `lib/actions/sales.ts`

## 📊 Base de Datos

### Tablas principales

- `users`: Clientes, estilistas, admin
- `services`: Servicios ofrecidos
- `appointments`: Citas agendadas
- `appointment_services`: Relación M2M
- `products`: Productos de venta
- `sales`: Transacciones
- `sale_items`: Items de venta
- `tickets`: Boletas

### Índices

Optimizados para búsquedas frecuentes:
- `appointments(client_id)`, `appointments(scheduled_at)`
- `sales(stylist_id)`, `sales(status)`
- Etc.

## 🐛 Troubleshooting

### "No tienes permiso para ver esto"

→ Verifica RLS policies en Supabase Dashboard

### Horarios no se cargan

→ Asegúrate que las citas en BD tengan `status = 'confirmed'`

### Errores de auth

→ Revisa NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en .env.local

## 📞 Soporte

Para reportar bugs o solicitar features, crear issue en el repositorio.

## 📄 Licencia

Privado - Todos los derechos reservados para Estética Unisex de Alejandra G
