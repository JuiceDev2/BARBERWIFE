import { requireRole } from '@/lib/auth/require-role'
import { getDashboardMetrics } from '@/lib/supabase/queries'

export default async function AdminPage() {
  const profile = await requireRole(['admin'])
  const metrics = await getDashboardMetrics()

  const cards = [
    { label: 'Citas de hoy', value: metrics.appointmentsCount },
    { label: 'Confirmadas', value: metrics.confirmedCount },
    { label: 'Completadas', value: metrics.completedCount },
    { label: 'Ingresos de hoy', value: `$${metrics.totalRevenue.toFixed(2)}` },
  ]

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-gray-600 mb-10">Bienvenida, {profile.full_name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border p-6">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-3xl font-bold mt-2">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
