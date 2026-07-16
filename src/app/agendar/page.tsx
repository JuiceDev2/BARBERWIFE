import { createClient } from '@/lib/supabase/server'
import AgendarWizard from './AgendarWizard'
import type { Salon } from '@/types'

export const metadata = { title: 'Agendar cita' }
export const dynamic = 'force-dynamic'

export default async function AgendarPage() {
  const supabase = await createClient()

  const { data: salones, error } = await supabase
    .from('salones')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  // Debug
  console.log('🔍 Salones cargados:', salones)
  if (error) console.error('❌ Error al cargar salones:', error)
  if (!salones || salones.length === 0) {
    console.warn('⚠️ No hay salones activos o la policy no permite lectura')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-salon-50)' }}>
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-warm-300">
        <a 
          href="/" 
          className="flex items-center gap-2 text-sm" 
          style={{ color: 'var(--color-salon-700)' }}
        >
          ← Volver
        </a>
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar salones: {error.message}
          </div>
        )}

        <AgendarWizard salonesIniciales={salones ?? []} />
      </main>
    </div>
  )
}