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

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos' }
    }
    return { error: 'No se pudo iniciar sesión. Intenta nuevamente.' }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
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
    redirect('/')
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
