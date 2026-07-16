'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    toast.success('¡Bienvenido de vuelta!')

    switch (profile?.role) {
      case 'admin':
        router.push('/admin')
        break
      case 'stylist':
        router.push('/stylist')
        break
      default:
        router.push('/client')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2 font-playfair">Iniciar sesión</h1>
        <p className="text-gray-600 mb-8">Accede a tu cuenta de Estética Alejandra</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full focus:border-purple-600 outline-none"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full focus:border-purple-600 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/agendar" className="text-purple-600 hover:underline">
            Agenda como invitado
          </Link>
        </p>
      </div>
    </div>
  )
}
