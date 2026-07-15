'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, ChevronDown, Calendar } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#servicios', label: 'Servicios' },
  { href: '/agendar', label: 'Agendar' },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  stylist: 'Estilista',
  client: 'Cliente',
}

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  stylist: '/stylist',
  client: '/client',
}

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Solo la portada tiene un hero oscuro a pantalla completa;
  // ahí el header empieza transparente y se vuelve sólido al hacer scroll.
  const isHome = pathname === '/'
  const isTransparent = isHome && !scrolled && !mobileOpen

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isTransparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className={`font-playfair font-bold text-xl tracking-tight ${
              isTransparent ? 'text-white' : 'text-purple-900'
            }`}
          >
            Estética Alejandra
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition hover:opacity-70 ${
                  isTransparent ? 'text-white' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth desktop */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div
                className={`h-9 w-24 rounded-full animate-pulse ${
                  isTransparent ? 'bg-white/20' : 'bg-gray-200'
                }`}
              />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition ${
                    isTransparent
                      ? 'border-white/40 text-white hover:bg-white/10'
                      : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-gray-800">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold truncate">
                        {user.full_name || 'Mi cuenta'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ROLE_LABELS[user.role] || user.role}
                      </p>
                    </div>
                    <Link
                      href={ROLE_HOME[user.role] || '/'}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <User size={16} />
                      Mi cuenta
                    </Link>
                    <Link
                      href="/agendar"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Calendar size={16} />
                      Agendar cita
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`text-sm font-semibold px-4 py-2 rounded-full border transition ${
                  isTransparent
                    ? 'border-white text-white hover:bg-white/10'
                    : 'border-purple-600 text-purple-700 hover:bg-purple-50'
                }`}
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            className={`md:hidden ${isTransparent ? 'text-white' : 'text-gray-800'}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="flex flex-col px-6 py-4 gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-4">
              {loading ? null : user ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold">{user.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {ROLE_LABELS[user.role] || user.role}
                    </p>
                  </div>
                  <Link href={ROLE_HOME[user.role] || '/'} className="text-sm text-gray-700">
                    Mi cuenta
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-600 text-left flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-block text-sm font-semibold px-4 py-2 rounded-full border border-purple-600 text-purple-700"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
