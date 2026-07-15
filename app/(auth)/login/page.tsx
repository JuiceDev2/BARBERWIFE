'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { signInAction } from '@/lib/actions/auth'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || undefined
  const justRegistered = searchParams.get('registrado') === '1'

  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (values: LoginInput) => {
    setFormError(null)
    startTransition(async () => {
      const result = await signInAction(values, next)
      if (result?.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof LoginInput, { message })
        })
      }
      if (result?.error) {
        setFormError(result.error)
      }
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bienvenida de nuevo a Estética Alejandra
      </p>

      {justRegistered && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.
        </div>
      )}

      {formError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-purple-700 transition disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Iniciar sesión
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-purple-700 font-semibold hover:underline">
          Regístrate
        </Link>
      </p>
      <p className="text-sm text-gray-500 text-center mt-2">
        <Link href="/agendar" className="hover:underline">
          Continuar como invitada sin cuenta
        </Link>
      </p>
    </div>
  )
}
