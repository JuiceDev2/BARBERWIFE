import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import EspecialesPanel from './EspecialesPanel'
import type { Cita } from '@/types'

export const metadata = { title: 'Servicios Especiales' }

export default async function EspecialesPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()

  // Solo columnas necesarias — sin select("*") — más los joins que muestra la tarjeta.
  const { data: citas } = await supabase
    .from('citas')
    .select(`
      id, fecha_hora, estado_cita, precio_total, anticipo, saldo_pendiente,
      calle, numero_exterior, numero_interior, referencias, notas, notas_admin,
      requiere_traslado,
      cliente:clientes(nombre, telefono),
      servicio:servicios(nombre, duracion_min),
      municipio:municipios(nombre, cargo_traslado)
    `)
    .eq('salon_id', perfil.salon_id!)
    .eq('tipo_cita', 'especial')
    .order('fecha_hora', { ascending: true }) as { data: Cita[] | null }

  return (
    <div>
      <PageHeader
        title="Servicios Especiales"
        subtitle="Solicitudes fuera de horario o marcadas como especiales, pendientes de revisión"
      />
      <div className="p-4 sm:p-6 md:p-8">
        <EspecialesPanel citasIniciales={citas ?? []} />
      </div>
    </div>
  )
}