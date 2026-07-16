import { requireRole } from '@/lib/auth/require-role'
import { getTodayAppointments } from '@/lib/supabase/queries'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default async function StylistPage() {
  const profile = await requireRole(['stylist'])
  const appointments = await getTodayAppointments()

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Mis Citas de Hoy</h1>
      <p className="text-gray-600 mb-10">Hola, {profile.full_name}</p>

      {appointments.length === 0 ? (
        <p className="text-gray-500">No tienes citas programadas por ahora.</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt: any) => (
            <div key={appt.id} className="bg-white rounded-2xl border p-6 flex justify-between items-center">
              <div>
                <div className="font-semibold text-lg">
                  {appt.client?.full_name || appt.guest_name || 'Cliente'}
                </div>
                <div className="text-gray-500 text-sm">{appt.start_time}</div>
              </div>
              <span className="text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                {statusLabels[appt.status] || appt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
