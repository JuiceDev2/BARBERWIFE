import { createClient } from '@/lib/supabase/server'
import AgendarWizard from './AgendarWizard'
import type { Salon } from '@/types'
import Link from 'next/link'

export const metadata = { title: 'Agendar cita' }

// Fuerza renderizado dinámico: consulta Supabase en cada visita real,
// nunca sirve una versión cacheada/congelada generada durante el build.
export const dynamic = 'force-dynamic'

export default async function AgendarPage() {
  const supabase = await createClient()

  // Paso 1 del wizard: lista de salones activos (requiere la política
  // pública "public_read_salones_activos" — ver migración 003).
  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .eq('activo', true)
    .order('nombre') as { data: Salon[] | null }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-salon-50)' }}>
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-warm-300">
        <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-salon-700)' }}>
          ← Volver
        </Link>
        <span className="font-semibold" style={{ color: 'var(--color-salon-800)' }}>
          Agendar cita
        </span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-salon-900)' }}>
          Agenda tu cita
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-warm-600)' }}>
          Sin registro. Te guiamos paso a paso.
        </p>

        <AgendarWizard salonesIniciales={salones ?? []} />
      </main>
    </div>
  )
}
