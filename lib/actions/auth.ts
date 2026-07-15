'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/schemas/auth'
import type { z } from 'zod'

type ActionResult = {
  error?: string
  fieldErrors?: Record<string, string>
}

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  stylist: '/stylist',
  client: '/client',
}

export async function signInAction(
  input: z.input<typeof loginSchema>,
  redirectTo?: string
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      fieldErrors[issue.path[0] as string] = issue.message
    })
    return { fieldErrors }
  }

  const supabase = await createServerSupabaseClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Debes confirmar tu email antes de iniciar sesión' }
    }
    return { error: 'No se pudo iniciar sesión. Intenta nuevamente.' }
  }

  let destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : undefined

  if (!destination && signInData.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    destination = (profile?.role && ROLE_HOME[profile.role]) || '/'
  }

  revalidatePath('/', 'layout')
  redirect(destination || '/')
}

export async function signUpAction(
  input: z.input<typeof registerSchema>
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      fieldErrors[issue.path[0] as string] = issue.message
    })
    return { fieldErrors }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con este email' }
    }
    return { error: 'No se pudo crear la cuenta. Intenta nuevamente.' }
  }

  // Si la confirmación de email está desactivada, Supabase ya crea la sesión.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/client')
  }

  // Si requiere confirmación por email, no hay sesión todavía.
  redirect('/login?registrado=1')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
