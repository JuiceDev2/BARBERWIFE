import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ⚠️ Cliente con permisos totales — bypassa RLS por completo.
// SOLO usar en código de servidor (API routes, Server Actions).
// NUNCA importar este archivo en un componente 'use client'
// ni exponer SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}