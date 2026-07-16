import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalonEditForm from './SalonEditForm'

export default async function EditSalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'propietaria') {
    redirect('/admin')
  }

  const { data: salon } = await supabase
    .from('salones')
    .select('*')
    .eq('id', id)
    .single()

  if (!salon) {
    return <div className="p-8 text-center text-red-600">Salón no encontrado</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-salon-900)' }}>
        Editar Sucursal: {salon.nombre}
      </h1>
      <SalonEditForm salon={salon} />
    </div>
  )
}