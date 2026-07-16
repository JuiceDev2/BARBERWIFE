import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'

export default async function SalonesPage() {
  const supabase = await createClient()

  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .order('nombre')

  return (
    <div>
      <PageHeader 
        title="Gestión de Sucursales" 
        action={
          <Link href="/propietaria/salones/nuevo" className="btn-primary">
            + Nueva Sucursal
          </Link>
        }
      />

      <div className="p-6">
        <div className="grid gap-4">
          {salones?.map((salon) => (
            <div
              key={salon.id}
              className="card flex justify-between items-center p-6"
            >
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-salon-900)' }}>
                  {salon.nombre}
                </h3>
                {salon.direccion && (
                  <p className="text-sm text-warm-600 mt-1">{salon.direccion}</p>
                )}
                {salon.telefono && (
                  <p className="text-sm text-warm-600">📞 {salon.telefono}</p>
                )}
                <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${salon.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {salon.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/propietaria/salones/${salon.id}/edit`}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  ✏️ Editar
                </Link>
              </div>
            </div>
          ))}

          {(!salones || salones.length === 0) && (
            <p className="text-center py-12 text-warm-500">
              No hay sucursales registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}