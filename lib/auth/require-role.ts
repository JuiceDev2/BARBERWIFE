import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { User, UserRole } from '@/types'

/**
 * Ensures the current request has an authenticated user whose role is
 * included in `allowedRoles`. Redirects to /login otherwise.
 * Use only in Server Components, Server Actions, or Route Handlers.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/login')
  }

  return profile as User
}
