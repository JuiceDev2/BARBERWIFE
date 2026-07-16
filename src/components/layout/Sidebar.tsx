'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'
import type { Perfil } from '@/types'
import { cn } from '@/lib/utils'
import { useTurno } from '@/hooks/useTurno'

interface NavItem {
  label: string
  href: string
  icon: string
  /** Si es true, el ítem se muestra deshabilitado (no navega). */
  disabled?: boolean
  /** Texto del tooltip cuando está deshabilitado. */
  disabledHint?: string
}

const NAV_PROPIETARIA: NavItem[] = [
  { label: 'Resumen global',  href: '/propietaria',          icon: '◈' },
  { label: 'Salones',         href: '/propietaria/salones',   icon: '🏪' },
  { label: 'Administradores', href: '/propietaria/admins',    icon: '👤' },
  { label: 'Reportes',        href: '/propietaria/reportes',  icon: '📊' },
]

const NAV_ADMIN: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',             icon: '◈' },
  { label: 'Citas',        href: '/admin/citas',        icon: '📅' },
  { label: 'Especiales',   href: '/admin/especiales',   icon: '✨' },
  { label: 'Clientes',     href: '/admin/clientes',     icon: '👥' },
  { label: 'Servicios',    href: '/admin/servicios',    icon: '✂' },
  { label: 'Cobertura',    href: '/admin/cobertura',    icon: '🚚' },
  { label: 'Configuración', href: '/admin/configuracion', icon: '⚙️' },
  { label: 'Estilistas',   href: '/admin/estilistas',   icon: '💄' },
  { label: 'Actividad',    href: '/admin/actividad',    icon: '📋' },
]

/**
 * Nav del rol Estilista.
 *
 * "Cobrar" es dinámico: la caja real vive en /cobrar/[turnoId] (el mismo
 * flujo que ya usa el botón "💵 Cobrar" dentro de "Mis citas"), no en la
 * ruta estática /estilista/caja que no existe. El componente calcula el
 * href/estado con el turno activo del salón — ver getNavEstilista().
 */
function getNavEstilista(turnoId?: string | null): NavItem[] {
  return [
    { label: 'Mis citas', href: '/estilista', icon: '📅' },
    turnoId
      ? { label: 'Cobrar', href: `/cobrar/${turnoId}`, icon: '💵' }
      : {
          label: 'Cobrar',
          href: '/estilista',
          icon: '💵',
          disabled: true,
          disabledHint: 'El local está cerrado. Pide al administrador que lo abra para habilitar la caja.',
        },
  ]
}

function getNav(rol: string, turnoId?: string | null): NavItem[] {
  if (rol === 'propietaria') return NAV_PROPIETARIA
  if (rol === 'admin')       return NAV_ADMIN
  return getNavEstilista(turnoId)
}

function getRolLabel(rol: string): string {
  if (rol === 'propietaria') return 'Propietaria'
  if (rol === 'admin')       return 'Administrador'
  return 'Estilista'
}

export default function Sidebar({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()
  const router = useRouter()

  // El turno activo solo aplica a estilistas (define si "Cobrar" está disponible).
  const { turno } = useTurno(perfil.rol === 'estilista' ? (perfil.salon_id ?? '') : '')
  const nav = getNav(perfil.rol, turno?.id)
  const [abierto, setAbierto] = useState(false)

  // Cierra el menú móvil automáticamente al navegar a otra página
  useEffect(() => {
    setAbierto(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Barra superior (solo móvil) ──────────────────────── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-3 h-14 border-b"
        style={{ background: 'var(--color-salon-900)', borderColor: 'var(--color-salon-800)' }}
      >
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="p-2 -ml-1 text-white text-xl leading-none"
        >
          ☰
        </button>
        <span className="font-semibold text-sm truncate" style={{ color: 'white' }}>
          {perfil.salon?.nombre ?? getRolLabel(perfil.rol)}
        </span>
        <span className="w-8" />
      </header>

      {/* ── Fondo oscuro al abrir el menú en móvil ───────────── */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
        />
      )}

      {/* ── Menú lateral: fijo/oculto en móvil, estático en escritorio ── */}
      <aside
        className={cn(
          'w-64 md:w-56 flex flex-col shrink-0 border-r',
          'fixed md:static inset-y-0 left-0 z-50 md:z-auto',
          'transition-transform duration-200 ease-out',
          abierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ background: 'var(--color-salon-900)', borderColor: 'var(--color-salon-800)' }}
      >
        {/* Logo */}
        <div
          className="flex items-start justify-between px-5 py-5 border-b"
          style={{ borderColor: 'var(--color-salon-800)' }}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-widest uppercase mb-1"
               style={{ color: 'var(--color-salon-400)' }}>
              {getRolLabel(perfil.rol)}
            </p>
            <p className="font-semibold text-sm truncate" style={{ color: 'white' }}>
              {perfil.nombre}
            </p>
            {perfil.salon && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-salon-400)' }}>
                {perfil.salon.nombre}
              </p>
            )}
          </div>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="md:hidden p-1 -mr-1 -mt-1 text-lg leading-none"
            style={{ color: 'var(--color-salon-300)' }}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  title={item.disabledHint}
                  aria-disabled="true"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-not-allowed opacity-40"
                  style={{ color: 'var(--color-salon-200)' }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </span>
              )
            }

            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  active
                    ? 'font-medium'
                    : 'opacity-70 hover:opacity-100'
                )}
                style={active
                  ? { background: 'var(--color-salon-700)', color: 'white' }
                  : { color: 'var(--color-salon-200)' }
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--color-salon-800)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all opacity-70 hover:opacity-100"
            style={{ color: 'var(--color-salon-200)' }}
          >
            <span>⎋</span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
