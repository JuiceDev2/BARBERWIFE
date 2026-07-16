import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import ConfiguracionPanel from './ConfiguracionPanel'
import type { ConfiguracionNegocio, HorarioLaboral, HorarioEspecial, DiaFestivo } from '@/types'

export const metadata = { title: 'Configuración del negocio' }

export default async function ConfiguracionPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()
  const salonId = perfil.salon_id!

  const [
    { data: configuracion },
    { data: horariosLaborales },
    { data: horariosEspeciales },
    { data: diasFestivos },
  ] = await Promise.all([
    supabase.from('configuracion_negocio').select('*').eq('salon_id', salonId).maybeSingle(),
    supabase.from('horarios_laborales').select('*').eq('salon_id', salonId).order('dia_semana'),
    supabase.from('horarios_especiales').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }),
    supabase.from('dias_festivos').select('*').eq('salon_id', salonId).order('fecha'),
  ]) as [
    { data: ConfiguracionNegocio | null },
    { data: HorarioLaboral[] | null },
    { data: HorarioEspecial[] | null },
    { data: DiaFestivo[] | null },
  ]

  return (
    <div>
      <PageHeader
        title="Configuración del negocio"
        subtitle="Horarios, días festivos y anticipo mínimo — todo administrable, nada escrito en código"
      />
      <div className="p-4 sm:p-6 md:p-8">
        <ConfiguracionPanel
          salonId={salonId}
          configuracionInicial={configuracion}
          horariosLaboralesIniciales={horariosLaborales ?? []}
          horariosEspecialesIniciales={horariosEspeciales ?? []}
          diasFestivosIniciales={diasFestivos ?? []}
        />
      </div>
    </div>
  )
}