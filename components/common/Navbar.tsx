'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-semibold text-xl font-playfair">
          Estética Alejandra
        </Link>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                Hola, {user.full_name?.split(' ')[0]}
              </span>
              <button
                onClick={signOut}
                className="border-2 border-purple-600 text-purple-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-50 transition"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="border-2 border-purple-600 text-purple-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-50 transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
