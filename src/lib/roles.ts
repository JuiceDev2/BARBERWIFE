import type { Rol } from '@/types'

/**
 * Función pura, sin dependencias de servidor (no usa `next/headers` ni
 * Supabase). Vive en su propio módulo para que los Client Components
 * (como LoginForm.tsx) puedan importarla sin arrastrar el código de
 * `@/lib/auth`, que sí depende de `next/headers` y solo puede
 * ejecutarse en el servidor.
 */
export function getDashboardByRol(rol: Rol): string {
  switch (rol) {
    case 'propietaria':
      return '/propietaria'
    case 'admin':
      return '/admin'
    case 'estilista':
      return '/estilista'
    default:
      return '/login'
  }
}
