import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ClientDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/client')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (profile && profile.role !== 'client') {
    redirect(profile.role === 'admin' ? '/admin' : '/stylist')
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', user!.id)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Hola, {profile?.full_name || 'cliente'}
      </h1>
      <p className="text-gray-500 mb-8">Este es tu panel de cliente.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Tus próximas citas</h2>
        {appointments && appointments.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {appointments.map((a) => (
              <li key={a.id} className="py-3 flex justify-between text-sm">
                <span>{new Date(a.scheduled_at).toLocaleString('es-MX')}</span>
                <span className="capitalize text-gray-500">{a.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Todavía no tienes citas agendadas.</p>
        )}
      </div>
    </div>
  )
}
