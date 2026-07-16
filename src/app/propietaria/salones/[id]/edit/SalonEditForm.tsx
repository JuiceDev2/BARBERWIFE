'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  salon: {
    id: string
    nombre: string
    direccion?: string | null
    telefono?: string | null
    activo: boolean
  }
}

export default function SalonEditForm({ salon }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: salon.nombre,
    direccion: salon.direccion || '',
    telefono: salon.telefono || '',
    activo: salon.activo,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/salones/${salon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      toast.success('Sucursal actualizada correctamente')
      router.push('/propietaria/salones')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al actualizar la sucursal')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-8">
      <div>
        <label className="label">Nombre de la Sucursal *</label>
        <input
          type="text"
          className="input"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Dirección</label>
        <input
          type="text"
          className="input"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Teléfono</label>
        <input
          type="tel"
          className="input"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="activo"
          checked={form.activo}
          onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          className="w-5 h-5 accent-salon-600"
        />
        <label htmlFor="activo" className="font-medium cursor-pointer">
          Sucursal activa
        </label>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1 py-3"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 py-3"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}