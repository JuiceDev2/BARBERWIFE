import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import CoberturaTable from './CoberturaTable'
import type { Municipio } from '@/types'

export const metadata = { title: 'Cobertura y Traslados' }

export default async function CoberturaPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()

  const { data: municipios } = await supabase
    .from('municipios')
    .select('*')
    .eq('salon_id', perfil.salon_id!)
    .order('orden') as { data: Municipio[] | null }

  return (
    <div>
      <PageHeader
        title="Cobertura y Traslados"
        subtitle="Municipios donde se ofrece Servicio Especial y su cargo de traslado"
      />
      <div className="p-4 sm:p-6 md:p-8">
        <CoberturaTable municipios={municipios ?? []} salonId={perfil.salon_id!} />
      </div>
    </div>
  )
}