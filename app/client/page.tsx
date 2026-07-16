import { requireRole } from '@/lib/auth/require-role'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClientPurchaseHistory } from '@/lib/supabase/queries'

export default async function ClientPage() {
  const profile = await requireRole(['client'])
  const supabase = await createServerSupabaseClient()

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', profile.id)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at')

  const purchaseHistory = await getClientPurchaseHistory(profile.id)

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
      <p className="text-gray-600 mb-10">Hola, {profile.full_name}</p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Próximas Citas</h2>
        {!upcomingAppointments || upcomingAppointments.length === 0 ? (
          <p className="text-gray-500">No tienes citas próximas.</p>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="bg-white rounded-2xl border p-6 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{appt.scheduled_at}</div>
                  <div className="text-gray-500 text-sm">{appt.start_time}</div>
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Historial de Compras</h2>
        {!purchaseHistory || purchaseHistory.length === 0 ? (
          <p className="text-gray-500">Aún no tienes compras registradas.</p>
        ) : (
          <div className="space-y-3">
            {purchaseHistory.map((sale: any) => (
              <div key={sale.id} className="bg-white rounded-2xl border p-6 flex justify-between items-center">
                <div className="text-gray-500 text-sm">
                  {new Date(sale.created_at).toLocaleDateString('es-MX')}
                </div>
                <div className="font-semibold">${sale.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
