import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (profile && profile.role !== 'admin') {
    redirect(profile.role === 'stylist' ? '/stylist' : '/client')
  }

  const [{ count: totalClientes }, { count: totalCitas }, { count: totalServicios }] =
    await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }),
    ])

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Hola, {profile?.full_name || 'administradora'}
      </h1>
      <p className="text-gray-500 mb-8">Este es tu panel de administración.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="text-3xl font-bold">{totalClientes ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500">Citas totales</p>
          <p className="text-3xl font-bold">{totalCitas ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500">Servicios activos</p>
          <p className="text-3xl font-bold">{totalServicios ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
